-- Migration: 016_venue_location.sql
-- Add venue/event location fields separate from hotel
-- The venue is where the conference happens; hotel is where attendees stay

-- Add venue columns to tradeshows
ALTER TABLE tradeshows 
ADD COLUMN IF NOT EXISTS venue_name TEXT,
ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- Add comment for clarity
COMMENT ON COLUMN tradeshows.venue_name IS 'Name of the conference venue (may differ from hotel)';
COMMENT ON COLUMN tradeshows.venue_address IS 'Full address of the conference venue for mapping';
