-- Migration: AI Settings
-- Adds encrypted API key storage for AI features at org level
-- Requires: 012_pii_encryption.sql (for encrypt_pii/decrypt_pii functions)

-- Add AI settings column to organizations (encrypted as TEXT/base64)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS ai_api_key_encrypted TEXT;

-- Create view that decrypts the API key for authorized users
CREATE OR REPLACE VIEW public.v_organization_ai_settings AS
SELECT 
  o.id,
  o.name,
  o.slug,
  decrypt_pii(o.ai_api_key_encrypted) as ai_api_key
FROM public.organizations o
WHERE o.id IN (
  SELECT organization_id 
  FROM public.user_profiles 
  WHERE email = current_user_email()
);

-- Function to update AI API key (encrypts before storing)
CREATE OR REPLACE FUNCTION public.set_ai_api_key(
  p_org_id UUID,
  p_api_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user has access to this org
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE organization_id = p_org_id 
    AND email = current_user_email()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update AI settings';
  END IF;

  -- Update with encrypted key (or NULL to remove)
  IF p_api_key IS NULL OR p_api_key = '' THEN
    UPDATE public.organizations 
    SET ai_api_key_encrypted = NULL
    WHERE id = p_org_id;
  ELSE
    UPDATE public.organizations 
    SET ai_api_key_encrypted = encrypt_pii(p_api_key)
    WHERE id = p_org_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.set_ai_api_key TO authenticated;

-- Add comment
COMMENT ON COLUMN public.organizations.ai_api_key_encrypted IS 'Encrypted Claude API key for AI features';
