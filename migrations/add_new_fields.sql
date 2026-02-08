-- Migration: Add confirmation numbers, template support, and activity log
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: New columns for existing tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Add hotel confirmation number to tradeshows
ALTER TABLE tradeshows 
ADD COLUMN IF NOT EXISTS hotel_confirmation_number TEXT;

-- Add template flag to tradeshows
ALTER TABLE tradeshows 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Add flight confirmation to attendees
ALTER TABLE attendees 
ADD COLUMN IF NOT EXISTS flight_confirmation TEXT;

-- Optional: Create index for faster template queries
CREATE INDEX IF NOT EXISTS idx_tradeshows_is_template 
ON tradeshows (is_template) 
WHERE is_template = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: Activity Log table for notes timeline
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  tradeshow_id INTEGER NOT NULL REFERENCES tradeshows(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('note', 'status_change', 'file_upload', 'update', 'created')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries by tradeshow
CREATE INDEX IF NOT EXISTS idx_activity_log_tradeshow 
ON activity_log (tradeshow_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: Storage bucket for file uploads (run in Supabase dashboard)
-- ═══════════════════════════════════════════════════════════════════════════
-- Go to Storage > Create new bucket named "uploads"
-- Set it to public if you want direct URL access
-- Or keep private and use signed URLs
