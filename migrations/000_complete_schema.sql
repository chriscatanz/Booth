-- ═══════════════════════════════════════════════════════════════════════════
-- TRADE SHOW MANAGER - COMPLETE DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to set up a fresh database
-- Includes: Core tables + SaaS multi-tenancy + Auth + Audit logging
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: ORGANIZATIONS (Multi-tenancy)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.organizations (
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
-- PART 2: USER PROFILES (extends Supabase Auth)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.user_profiles (
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: ORGANIZATION MEMBERSHIP
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES public.user_profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: INVITATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES public.user_profiles(id),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON public.invitations(token) WHERE accepted_at IS NULL;
CREATE INDEX idx_invitations_email ON public.invitations(email) WHERE accepted_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 5: CORE TABLES - TRADESHOWS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.tradeshows (
  id SERIAL PRIMARY KEY,
  
  -- Multi-tenancy
  organization_id UUID REFERENCES public.organizations(id),
  created_by UUID REFERENCES public.user_profiles(id),
  
  -- Basic Information
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  booth_number TEXT,
  booth_size TEXT,
  cost NUMERIC,
  attendees_included INTEGER DEFAULT 0,
  total_attending INTEGER DEFAULT 0,
  total_leads INTEGER,
  management_company TEXT,
  
  -- Registration
  registration_confirmed BOOLEAN DEFAULT false,
  attendee_list_received BOOLEAN DEFAULT false,
  
  -- Shipping & Logistics
  shipping_info TEXT,
  tracking_number TEXT,
  shipping_cost NUMERIC,
  ship_to_site BOOLEAN DEFAULT false,
  ship_to_warehouse BOOLEAN DEFAULT false,
  shipping_cutoff DATE,
  shipping_label_path TEXT,
  booth_to_ship TEXT,
  graphics_to_ship TEXT,
  
  -- Services
  utilities_booked BOOLEAN DEFAULT false,
  utilities_details TEXT,
  labor_booked BOOLEAN DEFAULT false,
  labor_details TEXT,
  electrical_cost NUMERIC,
  labor_cost NUMERIC,
  internet_cost NUMERIC,
  standard_services_cost NUMERIC,
  
  -- Speaking & Sponsorship
  has_speaking_engagement BOOLEAN DEFAULT false,
  speaking_details TEXT,
  sponsorship_details TEXT,
  
  -- Hotel
  hotel_name TEXT,
  hotel_address TEXT,
  hotel_confirmed BOOLEAN DEFAULT false,
  hotel_cost_per_night NUMERIC,
  hotel_confirmation_number TEXT,
  hotel_confirmation_path TEXT,
  
  -- Event Information
  show_agenda_url TEXT,
  show_agenda_pdf_path TEXT,
  event_portal_url TEXT,
  has_event_app BOOLEAN DEFAULT false,
  event_app_notes TEXT,
  vendor_packet_path TEXT,
  
  -- Show Contact
  show_contact_name TEXT,
  show_contact_email TEXT,
  
  -- Packing List
  packing_list_items TEXT,
  swag_items_enabled BOOLEAN DEFAULT false,
  swag_items_description TEXT,
  giveaway_item_enabled BOOLEAN DEFAULT false,
  giveaway_item_description TEXT,
  power_strip_count INTEGER,
  tablecloth_type TEXT,
  packing_list_misc TEXT,
  
  -- Notes
  general_notes TEXT,
  
  -- Status & ROI
  show_status TEXT,
  qualified_leads INTEGER,
  meetings_booked INTEGER,
  deals_won INTEGER,
  revenue_attributed DOUBLE PRECISION,
  post_show_notes TEXT,
  
  -- Template flag
  is_template BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tradeshows_org ON public.tradeshows(organization_id);
CREATE INDEX idx_tradeshows_dates ON public.tradeshows(start_date, end_date);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 6: ATTENDEES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.attendees (
  id SERIAL PRIMARY KEY,
  tradeshow_id INTEGER REFERENCES public.tradeshows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  arrival_date DATE,
  departure_date DATE,
  flight_cost DOUBLE PRECISION,
  flight_confirmation TEXT
);

CREATE INDEX idx_attendees_show ON public.attendees(tradeshow_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 7: ADDITIONAL FILES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.additional_files (
  id SERIAL PRIMARY KEY,
  tradeshow_id INTEGER REFERENCES public.tradeshows(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  uploaded_by UUID REFERENCES public.user_profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_show ON public.additional_files(tradeshow_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 8: ACTIVITY LOG (per-show notes/timeline)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.activity_log (
  id SERIAL PRIMARY KEY,
  tradeshow_id INTEGER REFERENCES public.tradeshows(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.user_profiles(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_show ON public.activity_log(tradeshow_id);
CREATE INDEX idx_activity_created ON public.activity_log(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 9: AUDIT LOG (org-wide compliance tracking)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON public.audit_log(organization_id);
CREATE INDEX idx_audit_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_action ON public.audit_log(action);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_org_created ON public.audit_log(organization_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 10: ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradeshows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user's org IDs
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: Check user role in org
CREATE OR REPLACE FUNCTION public.user_has_role(org_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND role = ANY(allowed_roles)
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations policies
CREATE POLICY "Users can view their orgs" ON public.organizations
  FOR SELECT USING (id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Users can update their orgs" ON public.organizations
  FOR UPDATE USING (public.user_has_role(id, ARRAY['owner', 'admin']));

CREATE POLICY "Anyone can create orgs" ON public.organizations
  FOR INSERT WITH CHECK (true);

-- User Profiles policies
CREATE POLICY "Users can view org member profiles" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    id IN (
      SELECT user_id FROM public.organization_members 
      WHERE organization_id IN (SELECT public.get_user_org_ids())
    )
  );

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "System can create profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

-- Organization Members policies
CREATE POLICY "Users can view org members" ON public.organization_members
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Admins can manage members" ON public.organization_members
  FOR ALL USING (public.user_has_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "Users can join orgs" ON public.organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Invitations policies
CREATE POLICY "Admins can view invitations" ON public.invitations
  FOR SELECT USING (public.user_has_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "Admins can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (public.user_has_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "Admins can delete invitations" ON public.invitations
  FOR DELETE USING (public.user_has_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "Users can view their invitations by email" ON public.invitations
  FOR SELECT USING (
    lower(email) = lower(auth.email())
  );

CREATE POLICY "Anyone can view invite by token" ON public.invitations
  FOR SELECT USING (true);

CREATE POLICY "Users can accept invitations" ON public.invitations
  FOR UPDATE USING (
    lower(email) = lower(auth.email())
  );

-- Tradeshows policies
CREATE POLICY "Users can view org shows" ON public.tradeshows
  FOR SELECT USING (
    organization_id IS NULL OR 
    organization_id IN (SELECT public.get_user_org_ids())
  );

CREATE POLICY "Editors can create shows" ON public.tradeshows
  FOR INSERT WITH CHECK (
    organization_id IS NULL OR
    public.user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "Editors can update shows" ON public.tradeshows
  FOR UPDATE USING (
    organization_id IS NULL OR
    public.user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "Admins can delete shows" ON public.tradeshows
  FOR DELETE USING (
    organization_id IS NULL OR
    public.user_has_role(organization_id, ARRAY['owner', 'admin'])
  );

-- Attendees policies
CREATE POLICY "Users can view attendees" ON public.attendees
  FOR SELECT USING (tradeshow_id IN (SELECT id FROM public.tradeshows));

CREATE POLICY "Editors can manage attendees" ON public.attendees
  FOR ALL USING (
    tradeshow_id IN (
      SELECT id FROM public.tradeshows WHERE 
      organization_id IS NULL OR
      public.user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

-- Additional Files policies
CREATE POLICY "Users can view files" ON public.additional_files
  FOR SELECT USING (tradeshow_id IN (SELECT id FROM public.tradeshows));

CREATE POLICY "Editors can manage files" ON public.additional_files
  FOR ALL USING (
    tradeshow_id IN (
      SELECT id FROM public.tradeshows WHERE 
      organization_id IS NULL OR
      public.user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

-- Activity Log policies
CREATE POLICY "Users can view activity" ON public.activity_log
  FOR SELECT USING (tradeshow_id IN (SELECT id FROM public.tradeshows));

CREATE POLICY "Users can create activity" ON public.activity_log
  FOR INSERT WITH CHECK (
    tradeshow_id IN (SELECT id FROM public.tradeshows)
  );

-- Audit Log policies
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (public.user_has_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "Users can log actions" ON public.audit_log
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 11: AUDIT TRIGGERS (Auto-log changes)
-- ═══════════════════════════════════════════════════════════════════════════

-- Log trade show changes
CREATE OR REPLACE FUNCTION public.log_tradeshow_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name)
    VALUES (NEW.organization_id, NEW.created_by, 'create', 'tradeshow', NEW.id::TEXT, NEW.name);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name)
    VALUES (NEW.organization_id, auth.uid(), 'update', 'tradeshow', NEW.id::TEXT, NEW.name);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name)
    VALUES (OLD.organization_id, auth.uid(), 'delete', 'tradeshow', OLD.id::TEXT, OLD.name);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tradeshow_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tradeshows
  FOR EACH ROW EXECUTE FUNCTION public.log_tradeshow_changes();

-- Log member changes
CREATE OR REPLACE FUNCTION public.log_member_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM public.user_profiles WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name, metadata)
    VALUES (NEW.organization_id, NEW.invited_by, 'member_added', 'member', NEW.user_id::TEXT, user_email,
            jsonb_build_object('role', NEW.role));
  ELSIF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name, metadata)
    VALUES (NEW.organization_id, auth.uid(), 'role_changed', 'member', NEW.user_id::TEXT, user_email,
            jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name)
    VALUES (OLD.organization_id, auth.uid(), 'member_removed', 'member', OLD.user_id::TEXT, user_email);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER member_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.log_member_changes();

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 12: STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this separately OR create via Supabase Dashboard:
-- Storage → New bucket → Name: "uploads" → Public: ON

-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE! Your database is ready.
-- ═══════════════════════════════════════════════════════════════════════════
