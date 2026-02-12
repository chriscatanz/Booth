-- Fix tradeshows PII encryption trigger
-- The column was renamed from show_contact_email_encrypted to show_contact_email
-- in migration 013, but the trigger still references the old column name

CREATE OR REPLACE FUNCTION public.encrypt_tradeshows_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- show_contact_email: encrypt if it looks like plaintext (contains @ and is short)
  IF NEW.show_contact_email IS NOT NULL 
     AND NEW.show_contact_email LIKE '%@%' 
     AND LENGTH(NEW.show_contact_email) < 100 THEN
    NEW.show_contact_email := encrypt_pii(NEW.show_contact_email);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS encrypt_tradeshows_pii_trigger ON public.tradeshows;

CREATE TRIGGER encrypt_tradeshows_pii_trigger
  BEFORE INSERT OR UPDATE ON public.tradeshows
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_tradeshows_pii();
