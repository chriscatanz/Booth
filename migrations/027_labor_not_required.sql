-- Add labor_not_required flag to tradeshows
-- Allows users to mark that a show does not require labor/I&D setup
-- When true, "Labor Arranged" is considered complete in the setup checklist

ALTER TABLE tradeshows
  ADD COLUMN IF NOT EXISTS labor_not_required BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN tradeshows.labor_not_required IS
  'When true, no labor/I&D is needed for this show — skips Labor Arranged in the setup checklist';
