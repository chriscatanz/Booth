-- Migration 014: AI Settings (Claude API key storage)
-- Uses existing encrypt_pii/decrypt_pii functions from migration 012

-- 1. Add encrypted AI API key column to organizations (TEXT + base64, matching existing pattern)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS ai_api_key_encrypted TEXT;

-- 2. Create view that decrypts AI API key (reuses decrypt_pii function)
CREATE OR REPLACE VIEW public.v_organization_ai_settings AS
SELECT 
  o.id,
  o.name,
  decrypt_pii(o.ai_api_key_encrypted) as ai_api_key
FROM public.organizations o;

-- Grant access to authenticated users
GRANT SELECT ON public.v_organization_ai_settings TO authenticated;

-- 3. Create RPC function to save AI API key (encrypted)
CREATE OR REPLACE FUNCTION public.set_ai_api_key(p_org_id uuid, p_api_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_is_admin boolean;
BEGIN
  -- Get current user email from JWT
  v_user_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  -- Check if user is admin of this org (using decrypted view)
  SELECT (role = 'admin') INTO v_is_admin
  FROM public.v_user_profiles
  WHERE organization_id = p_org_id
    AND email = v_user_email;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can update AI settings';
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

-- Grant execute to authenticated users (function checks admin internally)
GRANT EXECUTE ON FUNCTION public.set_ai_api_key(uuid, text) TO authenticated;

-- 4. Enable RLS passthrough for the view
ALTER VIEW public.v_organization_ai_settings SET (security_invoker = true);

COMMENT ON VIEW public.v_organization_ai_settings IS 'Decrypted AI settings view';
COMMENT ON FUNCTION public.set_ai_api_key IS 'Securely stores Claude API key encrypted - admin only';
