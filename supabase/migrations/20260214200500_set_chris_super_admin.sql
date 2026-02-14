-- Set chris@getbooth.io as super admin
-- This will work once the account is created through normal signup

-- Update if exists
UPDATE user_profiles 
SET is_super_admin = TRUE 
WHERE email = 'chris@getbooth.io';

-- Also create a trigger to auto-set super admin for this email on signup
CREATE OR REPLACE FUNCTION public.check_super_admin_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-grant super admin to specific emails
  IF NEW.email IN ('chris@getbooth.io', 'chris@directlink.ai', 'chris@dopaminedesignlabs.com') THEN
    NEW.is_super_admin := TRUE;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on insert
DROP TRIGGER IF EXISTS auto_super_admin ON user_profiles;
CREATE TRIGGER auto_super_admin
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_super_admin_email();

-- Also update on any existing rows
UPDATE user_profiles 
SET is_super_admin = TRUE 
WHERE email IN ('chris@getbooth.io', 'chris@directlink.ai', 'chris@dopaminedesignlabs.com');
