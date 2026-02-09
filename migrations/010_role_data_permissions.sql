-- ═══════════════════════════════════════════════════════════════════════════
-- ROLE DATA PERMISSIONS - Control which data points each role can see
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.role_data_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  visible_categories TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, role)
);

CREATE INDEX idx_role_data_permissions_org ON public.role_data_permissions(organization_id);

-- RLS Policies
ALTER TABLE public.role_data_permissions ENABLE ROW LEVEL SECURITY;

-- Only organization members can view permissions
CREATE POLICY "Organization members can view role permissions"
  ON public.role_data_permissions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only admins/owners can manage permissions
CREATE POLICY "Admins can manage role permissions"
  ON public.role_data_permissions FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_role_data_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS role_data_permissions_updated ON public.role_data_permissions;
CREATE TRIGGER role_data_permissions_updated
  BEFORE UPDATE ON public.role_data_permissions
  FOR EACH ROW EXECUTE FUNCTION update_role_data_permissions_timestamp();
