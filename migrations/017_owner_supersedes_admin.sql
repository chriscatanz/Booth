-- Migration: Ensure Owner Always Supersedes Admin
-- Fixes any places where admin is checked without owner

-- ═══════════════════════════════════════════════════════════════════════════
-- FIX 1: set_ai_api_key function - allow owner OR admin
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.set_ai_api_key(p_org_id uuid, p_api_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_is_admin_or_owner boolean;
BEGIN
  -- Get current user email from JWT
  v_user_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  -- Check if user is owner OR admin of this org
  SELECT (role IN ('owner', 'admin')) INTO v_is_admin_or_owner
  FROM public.v_user_profiles
  WHERE organization_id = p_org_id
    AND email = v_user_email;
  
  IF NOT COALESCE(v_is_admin_or_owner, false) THEN
    RAISE EXCEPTION 'Only owners and admins can update AI settings';
  END IF;
  
  -- Update the API key (encrypt if provided, null if empty)
  IF p_api_key IS NOT NULL AND p_api_key != '' THEN
    UPDATE public.organizations
    SET ai_api_key_encrypted = encrypt_pii(p_api_key)
    WHERE id = p_org_id;
  ELSE
    UPDATE public.organizations
    SET ai_api_key_encrypted = NULL
    WHERE id = p_org_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.set_ai_api_key IS 'Securely stores Claude API key encrypted - owner/admin only';

-- ═══════════════════════════════════════════════════════════════════════════
-- FIX 2: Audit any remaining policies that check only admin
-- These should already be correct, but let's ensure consistency
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: The following policies already use 'owner' or ('owner', 'admin'):
-- - org_brand_documents policies (migration 016)
-- - org-assets storage policies (migration 016)
-- - org-logos storage policies (migration 003)
-- - Most RLS policies in 000_complete_schema.sql

-- Verify with: 
-- SELECT policyname, qual FROM pg_policies WHERE qual::text LIKE '%admin%' AND qual::text NOT LIKE '%owner%';
