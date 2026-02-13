-- Add visibility column to additional_files
-- Controls which roles can view each document

ALTER TABLE additional_files 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'all';

-- Valid values: 'all', 'editors', 'admins'
-- 'all' = everyone including viewers
-- 'editors' = editors, admins, owners only
-- 'admins' = admins and owners only

COMMENT ON COLUMN additional_files.visibility IS 'Document visibility: all, editors, or admins';

-- Update RLS policies to respect visibility
DROP POLICY IF EXISTS "Users can view files" ON additional_files;

CREATE POLICY "Users can view files" ON additional_files
  FOR SELECT USING (
    tradeshow_id IN (
      SELECT id FROM tradeshows WHERE 
      organization_id IS NULL OR (
        -- Check role-based visibility
        CASE visibility
          WHEN 'admins' THEN user_has_role(organization_id, ARRAY['owner', 'admin'])
          WHEN 'editors' THEN user_has_role(organization_id, ARRAY['owner', 'admin', 'editor'])
          ELSE user_has_role(organization_id, ARRAY['owner', 'admin', 'editor', 'viewer'])
        END
      )
    )
  );
