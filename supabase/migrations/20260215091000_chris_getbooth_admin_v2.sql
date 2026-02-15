-- Set chris@getbooth.io as super admin and permanent Pro subscription
-- Note: Using auth.users since user_profiles.email is PII encrypted

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get user ID from auth.users (email is not encrypted there)
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'chris@getbooth.io';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User chris@getbooth.io not found in auth.users';
  END IF;
  
  RAISE NOTICE 'Found user ID: %', v_user_id;
  
  -- Set super admin flag
  UPDATE user_profiles 
  SET is_super_admin = TRUE 
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Set super admin flag';
  
  -- Get their org ID
  SELECT organization_id INTO v_org_id 
  FROM organization_members 
  WHERE user_id = v_user_id 
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    -- Upsert subscription to Pro with no expiration
    INSERT INTO subscriptions (org_id, tier, status, user_limit, show_limit, trial_ends_at, current_period_end)
    VALUES (v_org_id, 'pro', 'active', NULL, NULL, NULL, '2099-12-31'::timestamptz)
    ON CONFLICT (org_id) DO UPDATE SET
      tier = 'pro',
      status = 'active',
      user_limit = NULL,
      show_limit = NULL,
      trial_ends_at = NULL,
      current_period_end = '2099-12-31'::timestamptz,
      updated_at = NOW();
      
    RAISE NOTICE 'Set Pro subscription for org %', v_org_id;
  ELSE
    RAISE NOTICE 'No organization found for user - they may need to create one first';
  END IF;
END $$;
