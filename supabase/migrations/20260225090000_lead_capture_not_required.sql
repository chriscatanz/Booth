-- Add lead_capture_not_required flag to tradeshows
-- Mirrors the laborNotRequired pattern: when true, no lead capture system is needed
-- and the Lead Capture checklist item is considered complete.

ALTER TABLE tradeshows
  ADD COLUMN IF NOT EXISTS lead_capture_not_required BOOLEAN DEFAULT FALSE;
