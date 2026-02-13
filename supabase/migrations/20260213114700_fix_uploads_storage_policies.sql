-- Ensure uploads bucket exists and has proper policies
-- The bucket should already exist, but we need proper RLS policies

-- Create bucket if it doesn't exist (will silently fail if exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any (use specific names to avoid conflicts)
DROP POLICY IF EXISTS "uploads_select" ON storage.objects;
DROP POLICY IF EXISTS "uploads_insert" ON storage.objects;
DROP POLICY IF EXISTS "uploads_update" ON storage.objects;
DROP POLICY IF EXISTS "uploads_delete" ON storage.objects;

-- Allow anyone to view files in uploads bucket (it's public)
CREATE POLICY "uploads_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

-- Allow authenticated users to upload to uploads bucket
CREATE POLICY "uploads_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update files in uploads bucket
CREATE POLICY "uploads_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'uploads' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete files in uploads bucket
CREATE POLICY "uploads_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads'
    AND auth.role() = 'authenticated'
  );
