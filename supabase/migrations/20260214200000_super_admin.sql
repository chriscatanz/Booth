-- Super Admin flag for platform-wide access
-- This is separate from organization roles (owner/admin/editor/viewer)

-- Add super_admin flag to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_super_admin 
ON user_profiles(is_super_admin) WHERE is_super_admin = TRUE;

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Super admins can view all organizations
CREATE POLICY "Super admins can view all organizations"
ON organizations FOR SELECT
USING (is_super_admin());

-- Super admins can view all organization members
CREATE POLICY "Super admins can view all members"
ON organization_members FOR SELECT
USING (is_super_admin());

-- Super admins can view all subscriptions
CREATE POLICY "Super admins can view all subscriptions"
ON subscriptions FOR SELECT
USING (is_super_admin());

-- Super admins can view all user profiles
CREATE POLICY "Super admins can view all profiles"
ON user_profiles FOR SELECT
USING (is_super_admin());

-- Super admins can view all tradeshows
CREATE POLICY "Super admins can view all tradeshows"
ON tradeshows FOR SELECT
USING (is_super_admin());

-- Super admins can view consent log for all users
CREATE POLICY "Super admins can view all consent"
ON consent_log FOR SELECT
USING (is_super_admin());

COMMENT ON COLUMN user_profiles.is_super_admin IS 'Platform-wide admin access. Can view all orgs, users, and data.';
