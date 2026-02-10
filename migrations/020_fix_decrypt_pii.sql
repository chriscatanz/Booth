-- ═══════════════════════════════════════════════════════════════════════════
-- FIX DECRYPT_PII - More robust decryption that handles plaintext gracefully
-- ═══════════════════════════════════════════════════════════════════════════
--
-- The previous decrypt_pii function would throw an error when trying to 
-- decode a plaintext email (containing @) as base64. This fix checks if the
-- input looks like base64-encoded ciphertext before attempting decode.
--
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION decrypt_pii(ciphertext TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Return NULL for NULL/empty input
  IF ciphertext IS NULL OR ciphertext = '' THEN
    RETURN NULL;
  END IF;
  
  -- Check if this looks like encrypted data (base64 encoded PGP)
  -- PGP encrypted data starts with specific bytes that encode to 'w' when base64'd
  -- Also check for common plaintext indicators like @ (emails) or + with digits (phone)
  IF ciphertext LIKE '%@%' 
     OR ciphertext ~ '^\+?[0-9\-\(\) ]+$'
     OR ciphertext !~ '^[A-Za-z0-9+/]+=*$'
     OR LENGTH(ciphertext) < 50 THEN
    -- Looks like plaintext, return as-is
    RETURN ciphertext;
  END IF;
  
  -- Attempt decryption
  BEGIN
    RETURN pgp_sym_decrypt(
      decode(ciphertext, 'base64'),
      get_encryption_key()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If decryption fails, return original (might be plaintext)
    RETURN ciphertext;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- Also update encrypt_pii to be idempotent (don't double-encrypt)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION encrypt_pii(plaintext TEXT)
RETURNS TEXT AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  
  -- Check if already encrypted (base64 encoded, long, no plaintext indicators)
  IF LENGTH(plaintext) > 50 
     AND plaintext ~ '^[A-Za-z0-9+/]+=*$'
     AND plaintext NOT LIKE '%@%' THEN
    -- Looks already encrypted, return as-is
    RETURN plaintext;
  END IF;
  
  RETURN encode(
    pgp_sym_encrypt(plaintext, get_encryption_key()),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- Test the fix (optional - uncomment to verify)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT decrypt_pii('test@example.com');  -- Should return: test@example.com
-- SELECT decrypt_pii(encrypt_pii('test@example.com'));  -- Should return: test@example.com
