-- Fix v_kit_availability to use SECURITY INVOKER (doesn't need DEFINER)
-- This view doesn't decrypt any PII, so it should run with caller's permissions

-- Recreate the view with explicit SECURITY INVOKER
CREATE OR REPLACE VIEW public.v_kit_availability
WITH (security_invoker = true)
AS
SELECT 
  bk.id,
  bk.organization_id,
  bk.name,
  bk.code,
  bk.kit_type,
  bk.status,
  bk.current_location,
  bk.default_ship_days,
  bk.default_return_days,
  -- Next assignment info
  (
    SELECT ka.tradeshow_id 
    FROM public.kit_assignments ka
    JOIN public.tradeshows t ON t.id = ka.tradeshow_id
    WHERE ka.kit_id = bk.id 
      AND ka.status NOT IN ('returned', 'cancelled')
      AND t.start_date >= CURRENT_DATE
    ORDER BY t.start_date ASC
    LIMIT 1
  ) AS next_assignment_show_id,
  (
    SELECT t.name 
    FROM public.kit_assignments ka
    JOIN public.tradeshows t ON t.id = ka.tradeshow_id
    WHERE ka.kit_id = bk.id 
      AND ka.status NOT IN ('returned', 'cancelled')
      AND t.start_date >= CURRENT_DATE
    ORDER BY t.start_date ASC
    LIMIT 1
  ) AS next_assignment_show_name,
  (
    SELECT t.start_date 
    FROM public.kit_assignments ka
    JOIN public.tradeshows t ON t.id = ka.tradeshow_id
    WHERE ka.kit_id = bk.id 
      AND ka.status NOT IN ('returned', 'cancelled')
      AND t.start_date >= CURRENT_DATE
    ORDER BY t.start_date ASC
    LIMIT 1
  ) AS next_assignment_date,
  -- Calculate next available date (after all current assignments return)
  COALESCE(
    (
      SELECT MAX(ka.return_arrival_date)
      FROM public.kit_assignments ka
      WHERE ka.kit_id = bk.id 
        AND ka.status NOT IN ('returned', 'cancelled')
        AND ka.return_arrival_date >= CURRENT_DATE
    ),
    CURRENT_DATE
  ) AS available_from
FROM public.booth_kits bk;

COMMENT ON VIEW public.v_kit_availability IS 'Kit availability with next assignment and available-from dates (SECURITY INVOKER - no PII)';
