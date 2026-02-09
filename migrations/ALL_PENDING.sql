-- ============================================================================
-- ALL PENDING MIGRATIONS (002-007)
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 001: Helper Functions (if missing)
-- ============================================================================

-- Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 002: Fix RLS Recursion
-- ============================================================================

CREATE OR REPLACE FUNCTION public.users_share_org(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members m1
    JOIN public.organization_members m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = auth.uid()
    AND m2.user_id = target_user_id
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Users can view org member profiles" ON public.user_profiles;

CREATE POLICY "Users can view org member profiles" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid() OR public.users_share_org(id)
  );

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_has_role(org_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND role = ANY(allowed_roles)
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================================
-- 003: Organization Branding
-- ============================================================================

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#9333ea';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public logo access" ON storage.objects;
CREATE POLICY "Public logo access"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

DROP POLICY IF EXISTS "Org admins can upload logos" ON storage.objects;
CREATE POLICY "Org admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'org-logos'
  AND EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = (storage.foldername(name))[1]::uuid
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Org admins can update logos" ON storage.objects;
CREATE POLICY "Org admins can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'org-logos'
  AND EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = (storage.foldername(name))[1]::uuid
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Org admins can delete logos" ON storage.objects;
CREATE POLICY "Org admins can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'org-logos'
  AND EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = (storage.foldername(name))[1]::uuid
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- 004: Task Management
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tradeshow_id INTEGER REFERENCES public.tradeshows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  position INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_show ON public.tasks(tradeshow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org tasks" ON public.tasks;
CREATE POLICY "Users can view org tasks" ON public.tasks
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Editors can create tasks" ON public.tasks;
CREATE POLICY "Editors can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update tasks" ON public.tasks;
CREATE POLICY "Editors can update tasks" ON public.tasks
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
CREATE POLICY "Admins can delete tasks" ON public.tasks
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view task comments" ON public.task_comments;
CREATE POLICY "Users can view task comments" ON public.task_comments
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create comments" ON public.task_comments;
CREATE POLICY "Users can create comments" ON public.task_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    task_id IN (
      SELECT id FROM public.tasks WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own comments" ON public.task_comments;
CREATE POLICY "Users can update own comments" ON public.task_comments
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comments" ON public.task_comments;
CREATE POLICY "Users can delete own comments" ON public.task_comments
  FOR DELETE USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS task_comments_updated_at ON public.task_comments;
CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 005: Asset Management
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM ('capital', 'collateral');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type asset_type NOT NULL DEFAULT 'capital',
  category TEXT,
  quantity INTEGER DEFAULT 1,
  low_stock_threshold INTEGER,
  purchase_cost DECIMAL(10,2),
  purchase_date DATE,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.asset_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  tradeshow_id INTEGER NOT NULL REFERENCES public.tradeshows(id) ON DELETE CASCADE,
  quantity_reserved INTEGER DEFAULT 1,
  status TEXT DEFAULT 'reserved' CHECK (status IN ('reserved', 'shipped', 'returned', 'consumed')),
  notes TEXT,
  reserved_by UUID REFERENCES public.user_profiles(id),
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, tradeshow_id)
);

CREATE INDEX IF NOT EXISTS idx_assets_org ON public.assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);
CREATE INDEX IF NOT EXISTS idx_asset_reservations_asset ON public.asset_reservations(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_reservations_show ON public.asset_reservations(tradeshow_id);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org assets" ON public.assets;
CREATE POLICY "Users can view org assets" ON public.assets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Editors can create assets" ON public.assets;
CREATE POLICY "Editors can create assets" ON public.assets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update assets" ON public.assets;
CREATE POLICY "Editors can update assets" ON public.assets
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete assets" ON public.assets;
CREATE POLICY "Admins can delete assets" ON public.assets
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can view asset reservations" ON public.asset_reservations;
CREATE POLICY "Users can view asset reservations" ON public.asset_reservations
  FOR SELECT USING (
    asset_id IN (
      SELECT id FROM public.assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Editors can create reservations" ON public.asset_reservations;
CREATE POLICY "Editors can create reservations" ON public.asset_reservations
  FOR INSERT WITH CHECK (
    asset_id IN (
      SELECT id FROM public.assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "Editors can update reservations" ON public.asset_reservations;
CREATE POLICY "Editors can update reservations" ON public.asset_reservations
  FOR UPDATE USING (
    asset_id IN (
      SELECT id FROM public.assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "Editors can delete reservations" ON public.asset_reservations;
CREATE POLICY "Editors can delete reservations" ON public.asset_reservations
  FOR DELETE USING (
    asset_id IN (
      SELECT id FROM public.assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

DROP TRIGGER IF EXISTS assets_updated_at ON public.assets;
CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 006: Activity Feed
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'show_created', 'show_updated', 'show_deleted',
    'task_created', 'task_completed', 'task_assigned',
    'member_joined', 'member_invited',
    'asset_reserved', 'asset_returned',
    'comment_added', 'file_uploaded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  tradeshow_id INTEGER REFERENCES public.tradeshows(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '👍',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_org ON public.activity_feed(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_show ON public.activity_feed(tradeshow_id);
CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity ON public.activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON public.activity_comments(activity_id);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org activity" ON public.activity_feed;
CREATE POLICY "Users can view org activity" ON public.activity_feed
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create activity" ON public.activity_feed;
CREATE POLICY "System can create activity" ON public.activity_feed
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view reactions" ON public.activity_reactions;
CREATE POLICY "Users can view reactions" ON public.activity_reactions
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM public.activity_feed WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can add reactions" ON public.activity_reactions;
CREATE POLICY "Users can add reactions" ON public.activity_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove own reactions" ON public.activity_reactions;
CREATE POLICY "Users can remove own reactions" ON public.activity_reactions
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view activity comments" ON public.activity_comments;
CREATE POLICY "Users can view activity comments" ON public.activity_comments
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM public.activity_feed WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can add comments" ON public.activity_comments;
CREATE POLICY "Users can add comments" ON public.activity_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    activity_id IN (
      SELECT id FROM public.activity_feed WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can edit own comments" ON public.activity_comments;
CREATE POLICY "Users can edit own comments" ON public.activity_comments
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comments" ON public.activity_comments;
CREATE POLICY "Users can delete own comments" ON public.activity_comments
  FOR DELETE USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS activity_comments_updated_at ON public.activity_comments;
CREATE TRIGGER activity_comments_updated_at
  BEFORE UPDATE ON public.activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION public.create_activity(
  p_org_id UUID,
  p_type activity_type,
  p_actor_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_show_id UUID DEFAULT NULL,
  p_task_id UUID DEFAULT NULL,
  p_asset_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.activity_feed (
    organization_id, type, actor_id, title, description,
    tradeshow_id, task_id, asset_id, metadata
  ) VALUES (
    p_org_id, p_type, p_actor_id, p_title, p_description,
    p_show_id, p_task_id, p_asset_id, p_metadata
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 007: Custom Fields
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE custom_field_type AS ENUM (
    'text', 'number', 'date', 'checkbox', 'select', 'url', 'email', 'phone', 'textarea'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type custom_field_type NOT NULL DEFAULT 'text',
  description TEXT,
  options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  section TEXT DEFAULT 'custom',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, field_key)
);

CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  tradeshow_id INTEGER NOT NULL REFERENCES public.tradeshows(id) ON DELETE CASCADE,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, tradeshow_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_org ON public.custom_field_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON public.custom_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_show ON public.custom_field_values(tradeshow_id);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org custom fields" ON public.custom_field_definitions;
CREATE POLICY "Users can view org custom fields" ON public.custom_field_definitions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create custom fields" ON public.custom_field_definitions;
CREATE POLICY "Admins can create custom fields" ON public.custom_field_definitions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update custom fields" ON public.custom_field_definitions;
CREATE POLICY "Admins can update custom fields" ON public.custom_field_definitions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can delete custom fields" ON public.custom_field_definitions;
CREATE POLICY "Admins can delete custom fields" ON public.custom_field_definitions
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can view custom field values" ON public.custom_field_values;
CREATE POLICY "Users can view custom field values" ON public.custom_field_values
  FOR SELECT USING (
    tradeshow_id IN (
      SELECT id FROM public.tradeshows WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Editors can set custom field values" ON public.custom_field_values;
CREATE POLICY "Editors can set custom field values" ON public.custom_field_values
  FOR INSERT WITH CHECK (
    tradeshow_id IN (
      SELECT id FROM public.tradeshows WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "Editors can update custom field values" ON public.custom_field_values;
CREATE POLICY "Editors can update custom field values" ON public.custom_field_values
  FOR UPDATE USING (
    tradeshow_id IN (
      SELECT id FROM public.tradeshows WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "Editors can delete custom field values" ON public.custom_field_values;
CREATE POLICY "Editors can delete custom field values" ON public.custom_field_values
  FOR DELETE USING (
    tradeshow_id IN (
      SELECT id FROM public.tradeshows WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

DROP TRIGGER IF EXISTS custom_field_definitions_updated_at ON public.custom_field_definitions;
CREATE TRIGGER custom_field_definitions_updated_at
  BEFORE UPDATE ON public.custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS custom_field_values_updated_at ON public.custom_field_values;
CREATE TRIGGER custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- DONE! All migrations applied.
-- ============================================================================
