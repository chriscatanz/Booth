-- Migration: Organization Branding
-- Adds logo and brand color support for organizations

-- Add branding columns to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#9333ea';

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for org logos
-- Anyone can view logos (they're public)
CREATE POLICY "Public logo access"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

-- Only org admins can upload/update logos
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

COMMENT ON COLUMN public.organizations.logo_url IS 'URL to organization logo in storage';
COMMENT ON COLUMN public.organizations.brand_color IS 'Primary brand color as hex (e.g. #9333ea)';
