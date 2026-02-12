-- Fix v_attendees view: add missing created_at column to attendees table
-- The view references created_at but the column doesn't exist

-- Add created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendees' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.attendees ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Recreate view to ensure it works
DROP VIEW IF EXISTS public.v_attendees;

CREATE VIEW public.v_attendees AS
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

GRANT SELECT ON public.v_attendees TO authenticated;
