-- Migration: Fix Function Search Paths
-- Adds SET search_path = public to all functions to prevent search_path hijacking
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ═══════════════════════════════════════════════════════════════════════════
-- Helper function to set search_path on existing functions
-- We'll use ALTER FUNCTION where possible
-- ═══════════════════════════════════════════════════════════════════════════

-- current_user_email
ALTER FUNCTION public.current_user_email() SET search_path = public;

-- create_activity
ALTER FUNCTION public.create_activity(uuid, text, text, text, jsonb) SET search_path = public;

-- check_upcoming_deadlines
ALTER FUNCTION public.check_upcoming_deadlines() SET search_path = public;

-- update_updated_at
ALTER FUNCTION public.update_updated_at() SET search_path = public;

-- encrypt_tradeshows_pii
ALTER FUNCTION public.encrypt_tradeshows_pii() SET search_path = public;

-- get_encryption_key
ALTER FUNCTION public.get_encryption_key() SET search_path = public;

-- encrypt_pii
ALTER FUNCTION public.encrypt_pii(text) SET search_path = public;

-- decrypt_pii
ALTER FUNCTION public.decrypt_pii(text) SET search_path = public;

-- users_share_org
ALTER FUNCTION public.users_share_org(uuid, uuid) SET search_path = public;

-- encrypt_user_profiles_pii
ALTER FUNCTION public.encrypt_user_profiles_pii() SET search_path = public;

-- encrypt_attendees_pii
ALTER FUNCTION public.encrypt_attendees_pii() SET search_path = public;

-- update_role_data_permissions_timestamp
ALTER FUNCTION public.update_role_data_permissions_timestamp() SET search_path = public;

-- cleanup_rate_limits
ALTER FUNCTION public.cleanup_rate_limits() SET search_path = public;

-- count_user_organizations
ALTER FUNCTION public.count_user_organizations(uuid) SET search_path = public;

-- can_create_organization
ALTER FUNCTION public.can_create_organization() SET search_path = public;

-- handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- log_tradeshow_changes
ALTER FUNCTION public.log_tradeshow_changes() SET search_path = public;

-- log_member_changes
ALTER FUNCTION public.log_member_changes() SET search_path = public;

-- cleanup_old_audit_logs
ALTER FUNCTION public.cleanup_old_audit_logs() SET search_path = public;

-- create_organization_for_user
ALTER FUNCTION public.create_organization_for_user(uuid, text, text) SET search_path = public;

-- encrypt_invitations_pii (if exists)
DO $$ BEGIN
  ALTER FUNCTION public.encrypt_invitations_pii() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Note: Also enable "Leaked Password Protection" in Supabase Dashboard:
-- Authentication → Settings → Password Protection
-- ═══════════════════════════════════════════════════════════════════════════
