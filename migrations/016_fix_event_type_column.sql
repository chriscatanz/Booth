-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Add missing event_type and virtual event columns
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Migration 008 incorrectly targeted 'trade_shows' instead of 'tradeshows'
-- This adds the missing columns to the correct table.
--
-- Run this in Supabase SQL Editor to fix the production database.
-- ═══════════════════════════════════════════════════════════════════════════

-- Create the event_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('in_person', 'virtual', 'hybrid');
  END IF;
END $$;

-- Add missing columns to tradeshows table
ALTER TABLE public.tradeshows
  ADD COLUMN IF NOT EXISTS event_type event_type DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS virtual_platform TEXT,
  ADD COLUMN IF NOT EXISTS virtual_platform_url TEXT,
  ADD COLUMN IF NOT EXISTS virtual_booth_url TEXT;

-- Create index for event_type
CREATE INDEX IF NOT EXISTS idx_tradeshows_event_type ON public.tradeshows(event_type);

-- Update the v_tradeshows view to include new columns
DROP VIEW IF EXISTS public.v_tradeshows;

CREATE OR REPLACE VIEW public.v_tradeshows AS
SELECT 
  id, name, location, start_date, end_date, booth_number, booth_size, cost,
  management_company, attendees_included, total_attending, total_leads,
  event_type, virtual_platform, virtual_platform_url, virtual_booth_url,
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

-- Grant permissions
GRANT SELECT ON public.v_tradeshows TO authenticated;
