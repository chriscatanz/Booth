-- Migration: 026_show_enhancements.sql
-- Add move-in/move-out times and lead capture fields

-- Move-in/Move-out times (specific time slots, not just dates)
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS move_in_date DATE;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS move_in_time TEXT; -- e.g., "2:00 PM - 4:00 PM"
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS move_out_date DATE;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS move_out_time TEXT;

-- Lead capture system
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS lead_capture_system TEXT; -- e.g., "iLeads", "Compusystems", "Custom App"
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS lead_capture_credentials TEXT; -- Login info (will be shown as password field in UI)

-- Shipment tracking - last known status from Shippo
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS tracking_status TEXT; -- e.g., "IN_TRANSIT", "DELIVERED"
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS tracking_status_details TEXT; -- Human readable status
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS tracking_eta TIMESTAMPTZ; -- Estimated delivery
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS tracking_last_updated TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN tradeshows.move_in_time IS 'Move-in time slot (e.g., "2:00 PM - 4:00 PM")';
COMMENT ON COLUMN tradeshows.move_out_time IS 'Move-out time slot';
COMMENT ON COLUMN tradeshows.lead_capture_system IS 'Lead capture/badge scanner system name';
COMMENT ON COLUMN tradeshows.lead_capture_credentials IS 'Login credentials for lead capture system';
COMMENT ON COLUMN tradeshows.tracking_status IS 'Shippo tracking status code';
COMMENT ON COLUMN tradeshows.tracking_status_details IS 'Human readable tracking status';
