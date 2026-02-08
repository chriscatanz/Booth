-- Migration: Custom Fields
-- Allow organizations to define custom fields for trade shows

-- Field types
CREATE TYPE custom_field_type AS ENUM (
  'text', 'number', 'date', 'checkbox', 'select', 'url', 'email', 'phone', 'textarea'
);

-- Custom field definitions (org-level)
CREATE TABLE public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Field config
  name TEXT NOT NULL,
  field_key TEXT NOT NULL, -- Unique key for the field (snake_case)
  field_type custom_field_type NOT NULL DEFAULT 'text',
  description TEXT,
  
  -- For select fields: options as JSON array
  options JSONB DEFAULT '[]', -- e.g., ["Option 1", "Option 2"]
  
  -- Validation
  is_required BOOLEAN DEFAULT false,
  
  -- Display
  position INTEGER DEFAULT 0, -- For ordering fields
  section TEXT DEFAULT 'custom', -- Which section to show in (custom, basic, logistics, etc.)
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, field_key)
);

-- Custom field values (per trade show)
CREATE TABLE public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  trade_show_id UUID NOT NULL REFERENCES public.trade_shows(id) ON DELETE CASCADE,
  
  -- Value storage (all stored as text, parsed based on field_type)
  value TEXT,
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(field_id, trade_show_id)
);

-- Indexes
CREATE INDEX idx_custom_fields_org ON public.custom_field_definitions(organization_id);
CREATE INDEX idx_custom_field_values_field ON public.custom_field_values(field_id);
CREATE INDEX idx_custom_field_values_show ON public.custom_field_values(trade_show_id);

-- RLS
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- Field definitions: Users can view their org's custom fields
CREATE POLICY "Users can view org custom fields" ON public.custom_field_definitions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Admins can manage field definitions
CREATE POLICY "Admins can create custom fields" ON public.custom_field_definitions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update custom fields" ON public.custom_field_definitions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete custom fields" ON public.custom_field_definitions
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Field values: Users can view values for shows they can access
CREATE POLICY "Users can view custom field values" ON public.custom_field_values
  FOR SELECT USING (
    trade_show_id IN (
      SELECT id FROM public.trade_shows WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Editors can set field values
CREATE POLICY "Editors can set custom field values" ON public.custom_field_values
  FOR INSERT WITH CHECK (
    trade_show_id IN (
      SELECT id FROM public.trade_shows WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "Editors can update custom field values" ON public.custom_field_values
  FOR UPDATE USING (
    trade_show_id IN (
      SELECT id FROM public.trade_shows WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "Editors can delete custom field values" ON public.custom_field_values
  FOR DELETE USING (
    trade_show_id IN (
      SELECT id FROM public.trade_shows WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Updated_at triggers
CREATE TRIGGER custom_field_definitions_updated_at
  BEFORE UPDATE ON public.custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE public.custom_field_definitions IS 'Organization-defined custom fields for trade shows';
COMMENT ON TABLE public.custom_field_values IS 'Values for custom fields per trade show';
