-- Migration 002: Auth Foundation for SaaS
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: Organizations (Tenants)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  plan_seats INTEGER DEFAULT 3,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: User Profiles (extends Supabase Auth)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  job_title TEXT,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: Organization Membership
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES user_profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: Invitations
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES user_profiles(id),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token) WHERE accepted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email) WHERE accepted_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 5: Add organization_id to existing tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Add to tradeshows
ALTER TABLE tradeshows 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES user_profiles(id);

-- Add to activity_log (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
    ALTER TABLE activity_log 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);
  END IF;
END $$;

-- Add to additional_files
ALTER TABLE additional_files
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES user_profiles(id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 6: Row Level Security Policies
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeshows ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_files ENABLE ROW LEVEL SECURITY;

-- Helper function: Create org + add user as owner (bypasses RLS)
CREATE OR REPLACE FUNCTION create_organization_for_user(org_name TEXT)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  org_slug TEXT;
BEGIN
  org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 8);
  
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;
  
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (new_org_id, auth.uid(), 'owner', NOW());
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get user's org IDs
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: Check user role in org
CREATE OR REPLACE FUNCTION user_has_role(org_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND role = ANY(allowed_roles)
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: Users can see orgs they belong to
DROP POLICY IF EXISTS "Users can view their orgs" ON organizations;
CREATE POLICY "Users can view their orgs" ON organizations
  FOR SELECT USING (id IN (SELECT get_user_org_ids()));

-- Organizations: Any authenticated user can create an org
DROP POLICY IF EXISTS "Users can create orgs" ON organizations;
CREATE POLICY "Users can create orgs" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User Profiles: Users can see profiles in their orgs
DROP POLICY IF EXISTS "Users can view org member profiles" ON user_profiles;
CREATE POLICY "Users can view org member profiles" ON user_profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    id IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- User Profiles: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- Organization Members: View members in your orgs
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
CREATE POLICY "Users can view org members" ON organization_members
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

-- Organization Members: Admins can manage members
DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;
CREATE POLICY "Admins can manage members" ON organization_members
  FOR ALL USING (user_has_role(organization_id, ARRAY['owner', 'admin']));

-- Organization Members: Users can add themselves as owner of a new org (no existing members)
DROP POLICY IF EXISTS "Users can join as owner on create" ON organization_members;
CREATE POLICY "Users can join as owner on create" ON organization_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    role = 'owner' AND
    NOT EXISTS (
      SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id
    )
  );

-- Tradeshows: View shows in your orgs
DROP POLICY IF EXISTS "Users can view org shows" ON tradeshows;
CREATE POLICY "Users can view org shows" ON tradeshows
  FOR SELECT USING (
    organization_id IS NULL OR 
    organization_id IN (SELECT get_user_org_ids())
  );

-- Tradeshows: Editors can create/update
DROP POLICY IF EXISTS "Editors can manage shows" ON tradeshows;
CREATE POLICY "Editors can manage shows" ON tradeshows
  FOR INSERT WITH CHECK (
    organization_id IS NULL OR
    user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
  );

DROP POLICY IF EXISTS "Editors can update shows" ON tradeshows;
CREATE POLICY "Editors can update shows" ON tradeshows
  FOR UPDATE USING (
    organization_id IS NULL OR
    user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
  );

-- Tradeshows: Admins can delete
DROP POLICY IF EXISTS "Admins can delete shows" ON tradeshows;
CREATE POLICY "Admins can delete shows" ON tradeshows
  FOR DELETE USING (
    organization_id IS NULL OR
    user_has_role(organization_id, ARRAY['owner', 'admin'])
  );

-- Attendees: Same as parent tradeshow
DROP POLICY IF EXISTS "Users can view attendees" ON attendees;
CREATE POLICY "Users can view attendees" ON attendees
  FOR SELECT USING (
    tradeshow_id IN (SELECT id FROM tradeshows)
  );

DROP POLICY IF EXISTS "Editors can manage attendees" ON attendees;
CREATE POLICY "Editors can manage attendees" ON attendees
  FOR ALL USING (
    tradeshow_id IN (
      SELECT id FROM tradeshows WHERE 
      organization_id IS NULL OR
      user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

-- Additional Files: Same pattern
DROP POLICY IF EXISTS "Users can view files" ON additional_files;
CREATE POLICY "Users can view files" ON additional_files
  FOR SELECT USING (
    tradeshow_id IN (SELECT id FROM tradeshows)
  );

DROP POLICY IF EXISTS "Editors can manage files" ON additional_files;
CREATE POLICY "Editors can manage files" ON additional_files
  FOR ALL USING (
    tradeshow_id IN (
      SELECT id FROM tradeshows WHERE 
      organization_id IS NULL OR
      user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

-- Invitations: Admins can view/manage
DROP POLICY IF EXISTS "Admins can view invitations" ON invitations;
CREATE POLICY "Admins can view invitations" ON invitations
  FOR SELECT USING (user_has_role(organization_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (user_has_role(organization_id, ARRAY['owner', 'admin']));

-- Invitations: Anyone can read their own invite by token (for accepting)
DROP POLICY IF EXISTS "Users can view their invitations" ON invitations;
CREATE POLICY "Users can view their invitations" ON invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
