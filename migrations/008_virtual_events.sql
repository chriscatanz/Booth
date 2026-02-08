-- Migration: Virtual/Hybrid Event Support
-- Add event type and virtual-specific fields to trade shows

-- Event type enum
CREATE TYPE event_type AS ENUM ('in_person', 'virtual', 'hybrid');

-- Add columns to trade_shows
ALTER TABLE public.trade_shows
ADD COLUMN IF NOT EXISTS event_type event_type DEFAULT 'in_person',
ADD COLUMN IF NOT EXISTS virtual_platform TEXT, -- e.g., 'Zoom', 'Hopin', 'ON24', 'Teams'
ADD COLUMN IF NOT EXISTS virtual_platform_url TEXT, -- Main event/webinar URL
ADD COLUMN IF NOT EXISTS virtual_booth_url TEXT; -- Virtual booth/exhibitor page URL

-- Index for filtering by event type
CREATE INDEX IF NOT EXISTS idx_trade_shows_event_type ON public.trade_shows(event_type);

COMMENT ON COLUMN public.trade_shows.event_type IS 'Type of event: in_person, virtual, or hybrid';
COMMENT ON COLUMN public.trade_shows.virtual_platform IS 'Virtual event platform name';
COMMENT ON COLUMN public.trade_shows.virtual_platform_url IS 'URL to join/access the virtual event';
COMMENT ON COLUMN public.trade_shows.virtual_booth_url IS 'URL to the virtual booth or exhibitor page';
