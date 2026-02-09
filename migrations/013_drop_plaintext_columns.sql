-- ═══════════════════════════════════════════════════════════════════════════
-- DROP PLAINTEXT COLUMNS - Complete encryption migration
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Run AFTER 012_pii_encryption.sql has been applied and verified.
-- This removes plaintext PII columns and renames encrypted columns.
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 1: Drop existing views (they reference old columns)
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.v_user_profiles;
DROP VIEW IF EXISTS public.v_attendees;
DROP VIEW IF EXISTS public.v_invitations;
DROP VIEW IF EXISTS public.v_tradeshows;

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 2: Drop old triggers (they reference old column names)
-- ═══════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS encrypt_user_profiles_trigger ON public.user_profiles;
DROP TRIGGER IF EXISTS encrypt_attendees_trigger ON public.attendees;
DROP TRIGGER IF EXISTS encrypt_invitations_trigger ON public.invitations;
DROP TRIGGER IF EXISTS encrypt_tradeshows_trigger ON public.tradeshows;

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 3: Drop plaintext columns and rename encrypted columns
-- ═══════════════════════════════════════════════════════════════════════════

-- user_profiles
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE public.user_profiles RENAME COLUMN email_encrypted TO email;
ALTER TABLE public.user_profiles RENAME COLUMN phone_encrypted TO phone;

-- attendees
ALTER TABLE public.attendees DROP COLUMN IF EXISTS email;
ALTER TABLE public.attendees RENAME COLUMN email_encrypted TO email;

-- invitations
ALTER TABLE public.invitations DROP COLUMN IF EXISTS email;
ALTER TABLE public.invitations RENAME COLUMN email_encrypted TO email;

-- tradeshows
ALTER TABLE public.tradeshows DROP COLUMN IF EXISTS show_contact_email;
ALTER TABLE public.tradeshows RENAME COLUMN show_contact_email_encrypted TO show_contact_email;

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 4: Create new triggers that encrypt on insert/update
-- ═══════════════════════════════════════════════════════════════════════════

-- user_profiles: encrypt email and phone
CREATE OR REPLACE FUNCTION encrypt_user_profiles_pii()
RETURNS TRIGGER AS $$
BEGIN
  -- Only encrypt if value looks like plaintext (not already base64 encrypted)
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%==%' AND LENGTH(NEW.email) < 100 THEN
    NEW.email := encrypt_pii(NEW.email);
  END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone NOT LIKE '%==%' AND LENGTH(NEW.phone) < 100 THEN
    NEW.phone := encrypt_pii(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER encrypt_user_profiles_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION encrypt_user_profiles_pii();

-- attendees: encrypt email
CREATE OR REPLACE FUNCTION encrypt_attendees_pii()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%==%' AND LENGTH(NEW.email) < 100 THEN
    NEW.email := encrypt_pii(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER encrypt_attendees_trigger
  BEFORE INSERT OR UPDATE ON public.attendees
  FOR EACH ROW EXECUTE FUNCTION encrypt_attendees_pii();

-- invitations: encrypt email
CREATE OR REPLACE FUNCTION encrypt_invitations_pii()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%==%' AND LENGTH(NEW.email) < 100 THEN
    NEW.email := encrypt_pii(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER encrypt_invitations_trigger
  BEFORE INSERT OR UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION encrypt_invitations_pii();

-- tradeshows: encrypt show_contact_email
CREATE OR REPLACE FUNCTION encrypt_tradeshows_pii()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.show_contact_email IS NOT NULL AND NEW.show_contact_email NOT LIKE '%==%' AND LENGTH(NEW.show_contact_email) < 100 THEN
    NEW.show_contact_email := encrypt_pii(NEW.show_contact_email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER encrypt_tradeshows_trigger
  BEFORE INSERT OR UPDATE ON public.tradeshows
  FOR EACH ROW EXECUTE FUNCTION encrypt_tradeshows_pii();

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 5: Create clean decrypting views
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_user_profiles AS
SELECT 
  id,
  decrypt_pii(email) as email,
  full_name,
  avatar_url,
  decrypt_pii(phone) as phone,
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
  decrypt_pii(email) as email,
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
  decrypt_pii(email) as email,
  role,
  token,
  invited_by,
  expires_at,
  accepted_at,
  created_at
FROM public.invitations;

-- For tradeshows, include all columns plus decrypted contact email
CREATE OR REPLACE VIEW public.v_tradeshows AS
SELECT 
  id, name, location, start_date, end_date, booth_number, booth_size, cost,
  management_company, attendees_included, total_attending, total_leads,
  registration_confirmed, attendee_list_received, shipping_info, tracking_number,
  shipping_cost, ship_to_site, ship_to_warehouse, shipping_cutoff, shipping_label_path,
  booth_to_ship, graphics_to_ship, utilities_booked, utilities_details, labor_booked,
  labor_details, electrical_cost, labor_cost, internet_cost, standard_services_cost,
  has_speaking_engagement, speaking_details, sponsorship_details, hotel_name,
  hotel_address, hotel_confirmed, hotel_cost_per_night, hotel_confirmation_number,
  hotel_confirmation_path, show_agenda_url, show_agenda_pdf_path, event_portal_url,
  has_event_app, event_app_notes, vendor_packet_path, show_contact_name,
  decrypt_pii(show_contact_email) as show_contact_email,
  packing_list_items, swag_items_enabled, swag_items_description, giveaway_item_enabled,
  giveaway_item_description, power_strip_count, tablecloth_type, packing_list_misc,
  general_notes, show_status, qualified_leads, meetings_booked, deals_won,
  revenue_attributed, post_show_notes, is_template, organization_id, created_by,
  created_at, updated_at
FROM public.tradeshows;

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 6: Grant permissions on views
-- ═══════════════════════════════════════════════════════════════════════════

GRANT SELECT ON public.v_user_profiles TO authenticated;
GRANT SELECT ON public.v_attendees TO authenticated;
GRANT SELECT ON public.v_invitations TO authenticated;
GRANT SELECT ON public.v_tradeshows TO authenticated;
