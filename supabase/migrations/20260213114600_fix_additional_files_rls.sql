-- Fix additional_files RLS policies for INSERT operations
-- The FOR ALL USING policy wasn't working properly for inserts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view files" ON additional_files;
DROP POLICY IF EXISTS "Editors can manage files" ON additional_files;

-- SELECT: Users can view files for tradeshows in their org
CREATE POLICY "Users can view files" ON additional_files
  FOR SELECT USING (
    tradeshow_id IN (
      SELECT id FROM tradeshows WHERE 
      organization_id IS NULL OR
      user_has_role(organization_id, ARRAY['owner', 'admin', 'editor', 'viewer'])
    )
  );

-- INSERT: Editors can add files to tradeshows in their org
CREATE POLICY "Editors can insert files" ON additional_files
  FOR INSERT WITH CHECK (
    tradeshow_id IN (
      SELECT id FROM tradeshows WHERE 
      organization_id IS NULL OR
      user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

-- UPDATE: Editors can update files for tradeshows in their org
CREATE POLICY "Editors can update files" ON additional_files
  FOR UPDATE USING (
    tradeshow_id IN (
      SELECT id FROM tradeshows WHERE 
      organization_id IS NULL OR
      user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

-- DELETE: Editors can delete files for tradeshows in their org
CREATE POLICY "Editors can delete files" ON additional_files
  FOR DELETE USING (
    tradeshow_id IN (
      SELECT id FROM tradeshows WHERE 
      organization_id IS NULL OR
      user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
    )
  );
