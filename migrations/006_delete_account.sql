-- Migration 006: Delete Account Function (GDPR Compliance)
-- Allows users to permanently delete their account and all associated data

CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  org_record RECORD;
  member_count INTEGER;
BEGIN
  -- Verify the user is deleting their own account
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Loop through organizations where user is a member
  FOR org_record IN 
    SELECT organization_id, role 
    FROM organization_members 
    WHERE organization_members.user_id = delete_user_account.user_id
  LOOP
    -- Count other members in this org
    SELECT COUNT(*) INTO member_count 
    FROM organization_members 
    WHERE organization_id = org_record.organization_id 
    AND organization_members.user_id != delete_user_account.user_id;

    IF org_record.role = 'owner' AND member_count = 0 THEN
      -- User is only owner and no other members - delete the whole org
      -- This will cascade delete: tradeshows, attendees, files, invitations, audit_log
      DELETE FROM organizations WHERE id = org_record.organization_id;
    ELSIF org_record.role = 'owner' AND member_count > 0 THEN
      -- User is owner but there are other members - transfer ownership first
      -- Find the first admin, or first member if no admins
      UPDATE organization_members 
      SET role = 'owner' 
      WHERE id = (
        SELECT id FROM organization_members 
        WHERE organization_id = org_record.organization_id 
        AND organization_members.user_id != delete_user_account.user_id
        ORDER BY 
          CASE role WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END,
          joined_at ASC
        LIMIT 1
      );
      
      -- Now remove the user from this org
      DELETE FROM organization_members 
      WHERE organization_id = org_record.organization_id 
      AND organization_members.user_id = delete_user_account.user_id;
    ELSE
      -- User is not owner - just remove from org
      DELETE FROM organization_members 
      WHERE organization_id = org_record.organization_id 
      AND organization_members.user_id = delete_user_account.user_id;
    END IF;
  END LOOP;

  -- Delete user profile (this should be the last step before auth deletion)
  DELETE FROM user_profiles WHERE id = delete_user_account.user_id;

  -- Note: The auth.users record needs to be deleted via Supabase Admin API
  -- or the user can be marked as deleted. For now, we've cleaned all app data.
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;
