-- Migration: Fix Function Search Paths
-- Adds SET search_path = public to all functions to prevent search_path hijacking
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ═══════════════════════════════════════════════════════════════════════════
-- Dynamic approach: Find and fix all public functions missing search_path
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  func RECORD;
  alter_stmt TEXT;
BEGIN
  FOR func IN 
    SELECT 
      p.proname AS name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'current_user_email',
        'create_activity', 
        'check_upcoming_deadlines',
        'update_updated_at',
        'encrypt_tradeshows_pii',
        'get_encryption_key',
        'encrypt_pii',
        'decrypt_pii',
        'users_share_org',
        'encrypt_user_profiles_pii',
        'encrypt_attendees_pii',
        'encrypt_invitations_pii',
        'update_role_data_permissions_timestamp',
        'cleanup_rate_limits',
        'count_user_organizations',
        'can_create_organization',
        'handle_new_user',
        'log_tradeshow_changes',
        'log_member_changes',
        'cleanup_old_audit_logs',
        'create_organization_for_user'
      )
  LOOP
    alter_stmt := format('ALTER FUNCTION public.%I(%s) SET search_path = public', func.name, func.args);
    EXECUTE alter_stmt;
    RAISE NOTICE 'Fixed: %', alter_stmt;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Note: Also enable "Leaked Password Protection" in Supabase Dashboard:
-- Authentication → Settings → Password Protection
-- ═══════════════════════════════════════════════════════════════════════════
