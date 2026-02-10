-- Migration: Brand Documents & AI Context
-- Adds dedicated storage for brand documents and AI context fields

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: Organization AI Context Fields (in settings JSONB)
-- ═══════════════════════════════════════════════════════════════════════════
-- These are stored in organizations.settings JSONB:
--   - companyDescription (text)
--   - productDescription (text)
-- No schema change needed, just documenting the structure.

COMMENT ON COLUMN public.organizations.settings IS 
  'Organization settings JSON. Known keys: shippingBufferDays (int), companyDescription (text), productDescription (text), brandDocuments (deprecated - use org_brand_documents table)';

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: Brand Documents Table
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.org_brand_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('document', 'image')),
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast org lookups
CREATE INDEX IF NOT EXISTS idx_org_brand_documents_org 
  ON public.org_brand_documents(organization_id);

-- RLS
ALTER TABLE public.org_brand_documents ENABLE ROW LEVEL SECURITY;

-- Members can view their org's documents
CREATE POLICY "Members can view org brand documents"
  ON public.org_brand_documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can insert documents
CREATE POLICY "Admins can insert brand documents"
  ON public.org_brand_documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete documents
CREATE POLICY "Admins can delete brand documents"
  ON public.org_brand_documents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: Storage Bucket for Brand Assets
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-assets',
  'org-assets',
  true,
  10485760, -- 10MB limit per file
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for org assets
CREATE POLICY "Public asset access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-assets');

CREATE POLICY "Org admins can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-assets'
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-assets'
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
