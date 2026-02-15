-- Add is_super_admin to v_user_profiles view
-- The view was missing this column added in the super_admin migration

DROP VIEW IF EXISTS v_user_profiles;

-- Recreate view with all columns including is_super_admin
-- Note: This database doesn't have encrypted columns, using base columns
CREATE VIEW v_user_profiles AS
SELECT 
  id,
  email,
  full_name,
  avatar_url,
  phone,
  job_title,
  last_active_at,
  COALESCE(is_super_admin, false) as is_super_admin,
  tos_accepted_at,
  tos_version,
  privacy_accepted_at,
  privacy_version,
  created_at,
  updated_at
FROM user_profiles;

-- Grant access
GRANT SELECT ON v_user_profiles TO authenticated;
