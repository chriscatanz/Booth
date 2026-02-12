-- Migration: Add fields for comprehensive AI extraction
-- Adds: show_website, show_contact_phone

-- Add show website URL
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS show_website TEXT;

-- Add show contact phone
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS show_contact_phone TEXT;

COMMENT ON COLUMN tradeshows.show_website IS 'Official show website URL';
COMMENT ON COLUMN tradeshows.show_contact_phone IS 'Show contact phone number';
