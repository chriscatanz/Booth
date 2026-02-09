-- ═══════════════════════════════════════════════════════════════════════════
-- PII ENCRYPTION - Column-level encryption using Supabase Vault
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- This migration:
--   1. Uses Supabase Vault for secure key storage
--   2. Creates encrypt/decrypt helper functions
--   3. Adds encrypted columns alongside plaintext (non-breaking)
--   4. Creates auto-decrypting views for application use
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Store encryption key in Supabase Vault
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- First, create the secret in Vault (run this ONCE manually in SQL Editor):
--
--   SELECT vault.create_secret(
--     encode(gen_random_bytes(32), 'hex'),
--     'pii_encryption_key',
--     'Encryption key for PII data'
--   );
--
-- To verify it was created:
--   SELECT * FROM vault.secrets WHERE name = 'pii_encryption_key';
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to retrieve encryption key from Vault
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS TEXT AS $$
DECLARE
  key_value TEXT;
BEGIN
  SELECT decrypted_secret INTO key_value 
  FROM vault.decrypted_secrets 
  WHERE name = 'pii_encryption_key'
  LIMIT 1;
  
  IF key_value IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault. Run: SELECT vault.create_secret(encode(gen_random_bytes(32), ''hex''), ''pii_encryption_key'', ''PII encryption key'');';
  END IF;
  
  RETURN key_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Encrypt function using pgcrypto symmetric encryption
CREATE OR REPLACE FUNCTION encrypt_pii(plaintext TEXT)
RETURNS TEXT AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(
    pgp_sym_encrypt(plaintext, get_encryption_key()),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt function
CREATE OR REPLACE FUNCTION decrypt_pii(ciphertext TEXT)
RETURNS TEXT AS $$
BEGIN
  IF ciphertext IS NULL OR ciphertext = '' THEN
    RETURN NULL;
  END IF;
  BEGIN
    RETURN pgp_sym_decrypt(
      decode(ciphertext, 'base64'),
      get_encryption_key()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Return original value if decryption fails (for migration period)
    RETURN ciphertext;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Add encrypted columns to PII tables
-- ═══════════════════════════════════════════════════════════════════════════

-- User profiles: email, phone
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS phone_encrypted TEXT;

-- Attendees: email
ALTER TABLE public.attendees
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

-- Invitations: email
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

-- Tradeshows: contact email
ALTER TABLE public.tradeshows
  ADD COLUMN IF NOT EXISTS show_contact_email_encrypted TEXT;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Create trigger functions to auto-encrypt on INSERT/UPDATE
-- ═══════════════════════════════════════════════════════════════════════════

-- User profiles encryption trigger
CREATE OR REPLACE FUNCTION encrypt_user_profiles_pii()
RETURNS TRIGGER AS $$
BEGIN
  -- Encrypt email if changed
  IF NEW.email IS DISTINCT FROM OLD.email OR NEW.email_encrypted IS NULL THEN
    NEW.email_encrypted := encrypt_pii(NEW.email);
  END IF;
  
  -- Encrypt phone if changed
  IF NEW.phone IS DISTINCT FROM OLD.phone OR NEW.phone_encrypted IS NULL THEN
    NEW.phone_encrypted := encrypt_pii(NEW.phone);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS encrypt_user_profiles_trigger ON public.user_profiles;
CREATE TRIGGER encrypt_user_profiles_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION encrypt_user_profiles_pii();

-- Attendees encryption trigger
CREATE OR REPLACE FUNCTION encrypt_attendees_pii()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email OR NEW.email_encrypted IS NULL THEN
    NEW.email_encrypted := encrypt_pii(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS encrypt_attendees_trigger ON public.attendees;
CREATE TRIGGER encrypt_attendees_trigger
  BEFORE INSERT OR UPDATE ON public.attendees
  FOR EACH ROW EXECUTE FUNCTION encrypt_attendees_pii();

-- Invitations encryption trigger
CREATE OR REPLACE FUNCTION encrypt_invitations_pii()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email OR NEW.email_encrypted IS NULL THEN
    NEW.email_encrypted := encrypt_pii(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS encrypt_invitations_trigger ON public.invitations;
CREATE TRIGGER encrypt_invitations_trigger
  BEFORE INSERT OR UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION encrypt_invitations_pii();

-- Tradeshows encryption trigger
CREATE OR REPLACE FUNCTION encrypt_tradeshows_pii()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.show_contact_email IS DISTINCT FROM OLD.show_contact_email OR NEW.show_contact_email_encrypted IS NULL THEN
    NEW.show_contact_email_encrypted := encrypt_pii(NEW.show_contact_email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS encrypt_tradeshows_trigger ON public.tradeshows;
CREATE TRIGGER encrypt_tradeshows_trigger
  BEFORE INSERT OR UPDATE ON public.tradeshows
  FOR EACH ROW EXECUTE FUNCTION encrypt_tradeshows_pii();

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: Migrate existing data (encrypt current plaintext values)
-- ═══════════════════════════════════════════════════════════════════════════

-- This will trigger the encryption triggers
UPDATE public.user_profiles SET updated_at = NOW() WHERE email_encrypted IS NULL AND email IS NOT NULL;
UPDATE public.attendees SET updated_at = NOW() WHERE email_encrypted IS NULL AND email IS NOT NULL;
UPDATE public.invitations SET created_at = created_at WHERE email_encrypted IS NULL AND email IS NOT NULL;
UPDATE public.tradeshows SET updated_at = NOW() WHERE show_contact_email_encrypted IS NULL AND show_contact_email IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: Create auto-decrypting views for application use
-- ═══════════════════════════════════════════════════════════════════════════

-- User profiles view (use this in queries that need decrypted email/phone)
CREATE OR REPLACE VIEW public.v_user_profiles AS
SELECT 
  id,
  COALESCE(decrypt_pii(email_encrypted), email) as email,
  full_name,
  avatar_url,
  COALESCE(decrypt_pii(phone_encrypted), phone) as phone,
  job_title,
  last_active_at,
  created_at,
  updated_at
FROM public.user_profiles;

-- Attendees view
CREATE OR REPLACE VIEW public.v_attendees AS
SELECT 
  id,
  tradeshow_id,
  organization_id,
  name,
  COALESCE(decrypt_pii(email_encrypted), email) as email,
  title,
  company,
  notes,
  is_lead,
  lead_status,
  lead_score,
  lead_source,
  created_at,
  updated_at
FROM public.attendees;

-- Invitations view
CREATE OR REPLACE VIEW public.v_invitations AS
SELECT 
  id,
  organization_id,
  COALESCE(decrypt_pii(email_encrypted), email) as email,
  role,
  token,
  invited_by,
  expires_at,
  accepted_at,
  created_at
FROM public.invitations;

-- Tradeshows view with decrypted contact email
CREATE OR REPLACE VIEW public.v_tradeshows AS
SELECT 
  t.*,
  COALESCE(decrypt_pii(show_contact_email_encrypted), show_contact_email) as decrypted_contact_email
FROM public.tradeshows t;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 6: Grant permissions
-- ═══════════════════════════════════════════════════════════════════════════

-- Only authenticated users can use encryption functions
REVOKE ALL ON FUNCTION get_encryption_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION encrypt_pii(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_pii(TEXT) TO authenticated;

-- Grant access to views
GRANT SELECT ON public.v_user_profiles TO authenticated;
GRANT SELECT ON public.v_attendees TO authenticated;
GRANT SELECT ON public.v_invitations TO authenticated;
GRANT SELECT ON public.v_tradeshows TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTES FOR FUTURE: Dropping plaintext columns
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- After confirming encryption works in production for 2+ weeks:
--
-- ALTER TABLE public.user_profiles DROP COLUMN email, DROP COLUMN phone;
-- ALTER TABLE public.user_profiles RENAME COLUMN email_encrypted TO email;
-- ALTER TABLE public.user_profiles RENAME COLUMN phone_encrypted TO phone;
--
-- ALTER TABLE public.attendees DROP COLUMN email;
-- ALTER TABLE public.attendees RENAME COLUMN email_encrypted TO email;
--
-- ALTER TABLE public.invitations DROP COLUMN email;
-- ALTER TABLE public.invitations RENAME COLUMN email_encrypted TO email;
--
-- ALTER TABLE public.tradeshows DROP COLUMN show_contact_email;
-- ALTER TABLE public.tradeshows RENAME COLUMN show_contact_email_encrypted TO show_contact_email;
--
-- Then update the views to no longer need COALESCE.
-- ═══════════════════════════════════════════════════════════════════════════
