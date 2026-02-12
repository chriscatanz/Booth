-- Encrypt leadCaptureCredentials field (contains login credentials for lead capture systems)
-- This is sensitive data that should be encrypted like other PII

-- Update the tradeshows PII trigger to also encrypt lead_capture_credentials
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
  
  -- lead_capture_credentials: encrypt if it looks like plaintext
  -- (not already encrypted - encrypted values are much longer base64 strings)
  IF NEW.lead_capture_credentials IS NOT NULL 
     AND LENGTH(NEW.lead_capture_credentials) < 200
     AND NEW.lead_capture_credentials NOT LIKE 'AAAAf%' THEN
    NEW.lead_capture_credentials := encrypt_pii(NEW.lead_capture_credentials);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate trigger
DROP TRIGGER IF EXISTS encrypt_tradeshows_pii_trigger ON public.tradeshows;

CREATE TRIGGER encrypt_tradeshows_pii_trigger
  BEFORE INSERT OR UPDATE ON public.tradeshows
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_tradeshows_pii();

-- Update the v_tradeshows view to decrypt lead_capture_credentials
DROP VIEW IF EXISTS public.v_tradeshows;

CREATE VIEW public.v_tradeshows AS
SELECT 
  id,
  name,
  location,
  start_date,
  end_date,
  booth_number,
  booth_size_id,
  booth_size,
  cost,
  management_company_id,
  management_company,
  attendees_included,
  total_attending,
  total_leads,
  event_type,
  virtual_platform_id,
  virtual_platform,
  virtual_platform_url,
  virtual_booth_url,
  registration_confirmed,
  attendee_list_received,
  shipping_info,
  tracking_number,
  shipping_cost,
  ship_to_site,
  ship_to_warehouse,
  shipping_cutoff,
  shipping_label_path,
  tracking_status,
  tracking_status_details,
  tracking_eta,
  tracking_last_updated,
  shipping_carrier_id,
  return_carrier_id,
  return_tracking_number,
  return_shipping_cost,
  return_ship_date,
  return_delivery_date,
  move_in_date,
  move_in_time,
  move_out_date,
  move_out_time,
  lead_capture_system_id,
  lead_capture_system,
  decrypt_pii(lead_capture_credentials) as lead_capture_credentials,
  booth_to_ship,
  graphics_to_ship,
  utilities_booked,
  utilities_details,
  labor_booked,
  labor_company_id,
  labor_details,
  electrical_cost,
  labor_cost,
  internet_cost,
  standard_services_cost,
  has_speaking_engagement,
  speaking_details,
  sponsorship_details,
  hotel_id,
  hotel_name,
  hotel_address,
  hotel_confirmed,
  hotel_cost_per_night,
  hotel_confirmation_number,
  hotel_confirmation_path,
  show_agenda_url,
  show_agenda_pdf_path,
  agenda_content,
  event_portal_url,
  has_event_app,
  event_app_notes,
  vendor_packet_path,
  show_contact_name,
  decrypt_pii(show_contact_email) as show_contact_email,
  show_contact_phone,
  show_website,
  venue_id,
  venue_name,
  venue_address,
  packing_list_items,
  swag_items_enabled,
  swag_items_description,
  giveaway_item_enabled,
  giveaway_item_description,
  power_strip_count,
  tablecloth_type,
  packing_list_misc,
  general_notes,
  show_status,
  qualified_leads,
  meetings_booked,
  deals_won,
  revenue_attributed,
  post_show_notes,
  is_template,
  organization_id,
  created_by,
  created_at,
  updated_at
FROM public.tradeshows;

GRANT SELECT ON public.v_tradeshows TO authenticated;

-- Encrypt any existing plaintext credentials
UPDATE public.tradeshows
SET lead_capture_credentials = encrypt_pii(lead_capture_credentials)
WHERE lead_capture_credentials IS NOT NULL
  AND LENGTH(lead_capture_credentials) < 200
  AND lead_capture_credentials NOT LIKE 'AAAAf%';
