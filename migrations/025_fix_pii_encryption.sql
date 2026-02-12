-- ═══════════════════════════════════════════════════════════════════════════
-- FIX PII ENCRYPTION LAYER - Security Hardening & Edge Case Handling
-- ═══════════════════════════════════════════════════════════════════════════
--
-- This migration addresses:
--   1. Missing SET search_path on decrypt_pii (security linter warning)
--   2. get_encryption_key needs search_path = public, vault
--   3. encrypt_pii/decrypt_pii need extensions in search_path for pgcrypto
--   4. Add whitespace trimming on encrypt (not just decrypt)
--   5. Improved plaintext detection to avoid false positives
--   6. Better handling of edge cases (empty strings, malformed input)
--
-- Security: SECURITY DEFINER functions MUST have explicit search_path to
-- prevent search_path hijacking attacks (Supabase linter 0011).
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. FIX get_encryption_key - Add proper search_path for vault access
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_encryption_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $function$
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
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. FIX encrypt_pii - Add search_path + whitespace trimming
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  cleaned TEXT;
BEGIN
  -- Handle NULL/empty input
  IF plaintext IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Trim whitespace BEFORE encryption to ensure consistent ciphertext
  cleaned := btrim(plaintext);
  
  IF cleaned = '' THEN
    RETURN NULL;
  END IF;
  
  -- Idempotency check: Don't double-encrypt
  -- Encrypted data is base64, long (>80 chars for PGP), no plaintext markers
  IF LENGTH(cleaned) > 80 
     AND cleaned ~ '^[A-Za-z0-9+/]+=*$'
     AND cleaned NOT LIKE '%@%'
     AND cleaned !~ '^\+?[0-9]' THEN
    -- Verify it actually decrypts before assuming it's already encrypted
    BEGIN
      PERFORM extensions.pgp_sym_decrypt(decode(cleaned, 'base64'), get_encryption_key());
      -- If we get here, it's valid ciphertext - return as-is
      RETURN cleaned;
    EXCEPTION WHEN OTHERS THEN
      -- Not valid ciphertext, proceed with encryption
      NULL;
    END;
  END IF;
  
  RETURN encode(
    extensions.pgp_sym_encrypt(cleaned, get_encryption_key()),
    'base64'
  );
END;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FIX decrypt_pii - Add search_path + robust plaintext detection
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  cleaned TEXT;
  decrypted TEXT;
BEGIN
  -- Handle NULL/empty input
  IF ciphertext IS NULL OR ciphertext = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remove all whitespace from potential base64 (fixes MIME line-wrap issues)
  cleaned := regexp_replace(ciphertext, '\s', '', 'g');
  
  -- ─────────────────────────────────────────────────────────────────────────
  -- PLAINTEXT DETECTION
  -- These checks identify common plaintext patterns to avoid decode errors
  -- ─────────────────────────────────────────────────────────────────────────
  
  -- 1. Email detection: Contains @ symbol
  IF cleaned LIKE '%@%' THEN
    RETURN btrim(ciphertext);  -- Return original with whitespace trimmed
  END IF;
  
  -- 2. Phone number detection: Starts with + or digits, contains only phone chars
  IF cleaned ~ '^[\+]?[0-9][0-9\-\(\)\s\.]+$' THEN
    RETURN btrim(ciphertext);
  END IF;
  
  -- 3. Not valid base64 characters
  IF cleaned !~ '^[A-Za-z0-9+/]+=*$' THEN
    RETURN btrim(ciphertext);
  END IF;
  
  -- 4. Too short to be PGP-encrypted data (PGP overhead is substantial)
  -- Minimum encrypted email "a@b.c" = 5 chars → ~100 chars base64 after PGP
  IF LENGTH(cleaned) < 80 THEN
    RETURN btrim(ciphertext);
  END IF;
  
  -- 5. Base64 padding check: Must be valid base64 length (multiple of 4)
  IF LENGTH(cleaned) % 4 != 0 THEN
    RETURN btrim(ciphertext);
  END IF;
  
  -- ─────────────────────────────────────────────────────────────────────────
  -- DECRYPTION ATTEMPT
  -- If all checks pass, try to decrypt
  -- ─────────────────────────────────────────────────────────────────────────
  
  BEGIN
    decrypted := extensions.pgp_sym_decrypt(
      decode(cleaned, 'base64'),
      get_encryption_key()
    );
    
    -- Trim whitespace from decrypted result for consistency
    RETURN btrim(decrypted);
    
  EXCEPTION 
    WHEN invalid_parameter_value THEN
      -- Invalid base64 or PGP format
      RETURN btrim(ciphertext);
    WHEN external_routine_invocation_exception THEN
      -- Wrong key or corrupted data
      RETURN btrim(ciphertext);
    WHEN OTHERS THEN
      -- Any other error: return original
      RETURN btrim(ciphertext);
  END;
END;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. UPDATE TRIGGER FUNCTIONS - Add search_path for consistency
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.encrypt_user_profiles_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email OR NEW.email_encrypted IS NULL THEN
    NEW.email_encrypted := encrypt_pii(NEW.email);
  END IF;
  IF NEW.phone IS DISTINCT FROM OLD.phone OR NEW.phone_encrypted IS NULL THEN
    NEW.phone_encrypted := encrypt_pii(NEW.phone);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_attendees_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email OR NEW.email_encrypted IS NULL THEN
    NEW.email_encrypted := encrypt_pii(NEW.email);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_invitations_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email OR NEW.email_encrypted IS NULL THEN
    NEW.email_encrypted := encrypt_pii(NEW.email);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_tradeshows_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.show_contact_email IS DISTINCT FROM OLD.show_contact_email OR NEW.show_contact_email_encrypted IS NULL THEN
    NEW.show_contact_email_encrypted := encrypt_pii(NEW.show_contact_email);
  END IF;
  RETURN NEW;
END;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. PERMISSIONS - Ensure proper access control
-- ═══════════════════════════════════════════════════════════════════════════

-- get_encryption_key should NEVER be directly callable
REVOKE ALL ON FUNCTION public.get_encryption_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_encryption_key() FROM authenticated;
REVOKE ALL ON FUNCTION public.get_encryption_key() FROM anon;

-- Encryption functions available to authenticated users only
GRANT EXECUTE ON FUNCTION public.encrypt_pii(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_pii(TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. VERIFICATION TESTS (run manually to verify)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  test_email TEXT := 'test@example.com';
  test_phone TEXT := '+1 (555) 123-4567';
  encrypted_email TEXT;
  decrypted_email TEXT;
  encrypted_phone TEXT;
  decrypted_phone TEXT;
BEGIN
  -- Test email encryption/decryption
  encrypted_email := encrypt_pii(test_email);
  decrypted_email := decrypt_pii(encrypted_email);
  
  IF decrypted_email != test_email THEN
    RAISE WARNING 'Email encryption test FAILED: expected %, got %', test_email, decrypted_email;
  ELSE
    RAISE NOTICE 'Email encryption test PASSED';
  END IF;
  
  -- Test phone encryption/decryption
  encrypted_phone := encrypt_pii(test_phone);
  decrypted_phone := decrypt_pii(encrypted_phone);
  
  -- Note: trimmed version
  IF btrim(decrypted_phone) != btrim(test_phone) THEN
    RAISE WARNING 'Phone encryption test FAILED: expected %, got %', test_phone, decrypted_phone;
  ELSE
    RAISE NOTICE 'Phone encryption test PASSED';
  END IF;
  
  -- Test plaintext passthrough
  IF decrypt_pii(test_email) != test_email THEN
    RAISE WARNING 'Plaintext passthrough test FAILED';
  ELSE
    RAISE NOTICE 'Plaintext passthrough test PASSED';
  END IF;
  
  -- Test NULL handling
  IF encrypt_pii(NULL) IS NOT NULL OR decrypt_pii(NULL) IS NOT NULL THEN
    RAISE WARNING 'NULL handling test FAILED';
  ELSE
    RAISE NOTICE 'NULL handling test PASSED';
  END IF;
  
  -- Test empty string handling
  IF encrypt_pii('') IS NOT NULL OR decrypt_pii('') IS NOT NULL THEN
    RAISE WARNING 'Empty string handling test FAILED';
  ELSE
    RAISE NOTICE 'Empty string handling test PASSED';
  END IF;
  
  -- Test whitespace-only handling
  IF encrypt_pii('   ') IS NOT NULL THEN
    RAISE WARNING 'Whitespace-only handling test FAILED';
  ELSE
    RAISE NOTICE 'Whitespace-only handling test PASSED';
  END IF;
  
  -- Test idempotency (double encryption prevention)
  IF encrypt_pii(encrypted_email) != encrypted_email THEN
    RAISE WARNING 'Idempotency test FAILED: double encryption occurred';
  ELSE
    RAISE NOTICE 'Idempotency test PASSED';
  END IF;
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'All PII encryption tests completed';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK COMMANDS (if needed)
-- ═══════════════════════════════════════════════════════════════════════════
/*
-- To rollback to previous versions (run in reverse order):

-- Restore get_encryption_key without search_path
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

-- Restore encrypt_pii from migration 020
CREATE OR REPLACE FUNCTION encrypt_pii(plaintext TEXT)
RETURNS TEXT AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  
  IF LENGTH(plaintext) > 50 
     AND plaintext ~ '^[A-Za-z0-9+/]+=*$'
     AND plaintext NOT LIKE '%@%' THEN
    RETURN plaintext;
  END IF;
  
  RETURN encode(
    pgp_sym_encrypt(plaintext, get_encryption_key()),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore decrypt_pii from migration 020
CREATE OR REPLACE FUNCTION decrypt_pii(ciphertext TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF ciphertext IS NULL OR ciphertext = '' THEN
    RETURN NULL;
  END IF;
  
  cleaned := regexp_replace(ciphertext, '\s', '', 'g');
  
  IF cleaned LIKE '%@%' 
     OR cleaned ~ '^\+?[0-9\-\(\) ]+$'
     OR cleaned !~ '^[A-Za-z0-9+/]+=*$'
     OR LENGTH(cleaned) < 50 THEN
    RETURN ciphertext;
  END IF;
  
  BEGIN
    RETURN pgp_sym_decrypt(
      decode(cleaned, 'base64'),
      get_encryption_key()
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN ciphertext;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
