-- ═══════════════════════════════════════════════════════════════════════════
-- PII ENCRYPTION - Column-level encryption for sensitive data
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- ⚠️  WARNING: This is a BREAKING CHANGE migration.
--     - Requires ENCRYPTION_KEY environment variable
--     - Must update application code to handle encrypted/decrypted values
--     - Existing data will need migration
--
-- Run this ONLY after:
--   1. Testing thoroughly in a staging environment
--   2. Backing up your database
--   3. Updating application code to handle encryption
--   4. Setting ENCRYPTION_KEY in Supabase secrets
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure function to get the encryption key from vault/secrets
-- This key should be stored in Supabase Vault or environment secrets
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS TEXT AS $$
BEGIN
  -- In production, retrieve from Supabase Vault:
  -- RETURN current_setting('app.encryption_key', true);
  -- 
  -- For now, return a placeholder (CHANGE THIS before using!)
  RETURN 'CHANGE_ME_TO_YOUR_32_CHAR_SECRET';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Encrypt a text value
CREATE OR REPLACE FUNCTION encrypt_pii(plaintext TEXT)
RETURNS TEXT AS $$
BEGIN
  IF plaintext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(
    pgp_sym_encrypt(plaintext, get_encryption_key()),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt a text value
CREATE OR REPLACE FUNCTION decrypt_pii(ciphertext TEXT)
RETURNS TEXT AS $$
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(
    decode(ciphertext, 'base64'),
    get_encryption_key()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION STEPS (run each section separately, with testing between)
-- ═══════════════════════════════════════════════════════════════════════════

-- STEP 1: Add encrypted columns (run this first, test the app still works)
/*
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS phone_encrypted TEXT;

ALTER TABLE public.attendees
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT;
*/

-- STEP 2: Migrate existing data to encrypted columns
/*
UPDATE public.user_profiles 
SET email_encrypted = encrypt_pii(email),
    phone_encrypted = encrypt_pii(phone)
WHERE email_encrypted IS NULL AND email IS NOT NULL;

UPDATE public.attendees 
SET email_encrypted = encrypt_pii(email)
WHERE email_encrypted IS NULL AND email IS NOT NULL;

UPDATE public.invitations
SET email_encrypted = encrypt_pii(email)
WHERE email_encrypted IS NULL AND email IS NOT NULL;
*/

-- STEP 3: Create views that auto-decrypt for the application
/*
CREATE OR REPLACE VIEW public.user_profiles_decrypted AS
SELECT 
  id,
  decrypt_pii(email_encrypted) as email,
  full_name,
  avatar_url,
  decrypt_pii(phone_encrypted) as phone,
  job_title,
  last_active_at,
  created_at,
  updated_at
FROM public.user_profiles;
*/

-- STEP 4: After confirming everything works, drop plaintext columns
-- ⚠️ ONLY RUN THIS AFTER THOROUGH TESTING
/*
ALTER TABLE public.user_profiles DROP COLUMN email;
ALTER TABLE public.user_profiles DROP COLUMN phone;
ALTER TABLE public.attendees DROP COLUMN email;
ALTER TABLE public.invitations DROP COLUMN email;

-- Rename encrypted columns
ALTER TABLE public.user_profiles RENAME COLUMN email_encrypted TO email;
ALTER TABLE public.user_profiles RENAME COLUMN phone_encrypted TO phone;
ALTER TABLE public.attendees RENAME COLUMN email_encrypted TO email;
ALTER TABLE public.invitations RENAME COLUMN email_encrypted TO email;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- ALTERNATIVE: Use Supabase Vault (recommended for production)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Supabase Vault provides a more secure key management solution:
-- https://supabase.com/docs/guides/database/vault
--
-- 1. Enable Vault in your Supabase project
-- 2. Store encryption key: SELECT vault.create_secret('encryption_key', 'your-key');
-- 3. Update get_encryption_key() to use:
--    RETURN (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'encryption_key');
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION encrypt_pii(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_pii(TEXT) TO authenticated;
