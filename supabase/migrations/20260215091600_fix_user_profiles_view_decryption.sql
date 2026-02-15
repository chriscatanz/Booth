-- Fix v_user_profiles view - restore PII decryption
-- The previous migration broke decryption by using raw columns

DROP VIEW IF EXISTS v_user_profiles;

-- Recreate view with proper PII decryption
CREATE VIEW v_user_profiles 
WITH (security_invoker = false)
AS
SELECT 
  id,
  decrypt_pii(email) as email,
  full_name,
  avatar_url,
  decrypt_pii(phone) as phone,
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

-- Grant access to authenticated users
GRANT SELECT ON v_user_profiles TO authenticated;
