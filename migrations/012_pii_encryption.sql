-- ═══════════════════════════════════════════════════════════════════════════
-- PII ENCRYPTION - Column-level encryption using Supabase Vault
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- PREREQUISITES:
--   1. Create encryption key in Vault (run ONCE):
--      SELECT vault.create_secret(
--        encode(gen_random_bytes(32), 'hex'),
--        'pii_encryption_key',
--        'PII encryption key'
--      );
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;
  
  RETURN key_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Encrypt function
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
    RETURN ciphertext;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- Add encrypted columns
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS phone_encrypted TEXT;

ALTER TABLE public.attendees
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

ALTER TABLE public.tradeshows
  ADD COLUMN IF NOT EXISTS show_contact_email_encrypted TEXT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Encryption triggers
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION encrypt_user_profiles_pii()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email OR NEW.email_encrypted IS NULL THEN
    NEW.email_encrypted := encrypt_pii(NEW.email);
  END IF;
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
-- Migrate existing data (trigger encryption)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE public.user_profiles SET updated_at = NOW() WHERE email IS NOT NULL;
UPDATE public.attendees SET name = name WHERE email IS NOT NULL;
UPDATE public.invitations SET created_at = created_at WHERE email IS NOT NULL;
UPDATE public.tradeshows SET updated_at = NOW() WHERE show_contact_email IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Auto-decrypting views
-- ═══════════════════════════════════════════════════════════════════════════

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

CREATE OR REPLACE VIEW public.v_attendees AS
SELECT 
  id,
  tradeshow_id,
  name,
  COALESCE(decrypt_pii(email_encrypted), email) as email,
  arrival_date,
  departure_date,
  flight_cost,
  flight_confirmation,
  created_at
FROM public.attendees;

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

CREATE OR REPLACE VIEW public.v_tradeshows AS
SELECT 
  *,
  COALESCE(decrypt_pii(show_contact_email_encrypted), show_contact_email) as contact_email_decrypted
FROM public.tradeshows;

-- ═══════════════════════════════════════════════════════════════════════════
-- Permissions
-- ═══════════════════════════════════════════════════════════════════════════

REVOKE ALL ON FUNCTION get_encryption_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION encrypt_pii(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_pii(TEXT) TO authenticated;
GRANT SELECT ON public.v_user_profiles TO authenticated;
GRANT SELECT ON public.v_attendees TO authenticated;
GRANT SELECT ON public.v_invitations TO authenticated;
GRANT SELECT ON public.v_tradeshows TO authenticated;
