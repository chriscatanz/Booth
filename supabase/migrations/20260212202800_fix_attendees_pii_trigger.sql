-- Fix ALL PII encryption triggers
-- Columns were renamed from *_encrypted to plain names in migration 013
-- Triggers still referenced old column names causing "no field" errors

-- ═══════════════════════════════════════════════════════════════════════════
-- User Profiles
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.encrypt_user_profiles_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- email: encrypt if it looks like plaintext
  IF NEW.email IS NOT NULL 
     AND NEW.email LIKE '%@%' 
     AND LENGTH(NEW.email) < 100 THEN
    NEW.email := encrypt_pii(NEW.email);
  END IF;
  
  -- phone: encrypt if it looks like plaintext (digits, spaces, dashes, parens)
  IF NEW.phone IS NOT NULL 
     AND NEW.phone ~ '^[\d\s\-\(\)\+\.]+$'
     AND LENGTH(NEW.phone) < 50 THEN
    NEW.phone := encrypt_pii(NEW.phone);
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS encrypt_user_profiles_trigger ON public.user_profiles;

CREATE TRIGGER encrypt_user_profiles_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_user_profiles_pii();

-- ═══════════════════════════════════════════════════════════════════════════
-- Attendees
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.encrypt_attendees_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- email: encrypt if it looks like plaintext
  IF NEW.email IS NOT NULL 
     AND NEW.email LIKE '%@%' 
     AND LENGTH(NEW.email) < 100 THEN
    NEW.email := encrypt_pii(NEW.email);
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS encrypt_attendees_trigger ON public.attendees;

CREATE TRIGGER encrypt_attendees_trigger
  BEFORE INSERT OR UPDATE ON public.attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_attendees_pii();

-- ═══════════════════════════════════════════════════════════════════════════
-- Invitations
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.encrypt_invitations_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- email: encrypt if it looks like plaintext
  IF NEW.email IS NOT NULL 
     AND NEW.email LIKE '%@%' 
     AND LENGTH(NEW.email) < 100 THEN
    NEW.email := encrypt_pii(NEW.email);
  END IF;
  
  RETURN NEW;
END;
$function$;


DROP TRIGGER IF EXISTS encrypt_invitations_trigger ON public.invitations;

CREATE TRIGGER encrypt_invitations_trigger
  BEFORE INSERT OR UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_invitations_pii();
