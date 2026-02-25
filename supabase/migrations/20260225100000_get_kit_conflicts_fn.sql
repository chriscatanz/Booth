-- get_kit_conflicts: find kit_assignments that overlap with a requested date window
-- Called from booth-kit-service.ts getKitConflicts()
--
-- Overlap logic (all dates buffered):
--   existing_start = COALESCE(ship_date, show_start - p_buffer_days)
--   existing_end   = COALESCE(return_arrival_date, show_end + p_buffer_days)
--   conflicts when existing_start <= (p_end_date + buffer) AND existing_end >= (p_start_date - buffer)

CREATE OR REPLACE FUNCTION public.get_kit_conflicts(
  p_kit_id       UUID,
  p_start_date   DATE,
  p_end_date     DATE,
  p_buffer_days  INT DEFAULT 7
)
RETURNS TABLE (
  assignment_id       UUID,
  tradeshow_id        INTEGER,
  tradeshow_name      TEXT,
  start_date          DATE,
  end_date            DATE,
  ship_date           DATE,
  return_arrival_date DATE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    ka.id                                                   AS assignment_id,
    t.id                                                    AS tradeshow_id,
    t.name                                                  AS tradeshow_name,
    t.start_date                                            AS start_date,
    t.end_date                                              AS end_date,
    ka.ship_date                                            AS ship_date,
    ka.return_arrival_date                                  AS return_arrival_date
  FROM public.kit_assignments ka
  JOIN public.tradeshows t ON t.id = ka.tradeshow_id
  WHERE
    ka.kit_id = p_kit_id
    AND ka.status NOT IN ('cancelled', 'returned')
    -- Effective window of the existing assignment (with buffer)
    AND COALESCE(ka.ship_date,           t.start_date - (p_buffer_days || ' days')::INTERVAL)::DATE
        <= (p_end_date   + (p_buffer_days || ' days')::INTERVAL)::DATE
    AND COALESCE(ka.return_arrival_date, t.end_date   + (p_buffer_days || ' days')::INTERVAL)::DATE
        >= (p_start_date - (p_buffer_days || ' days')::INTERVAL)::DATE
  ORDER BY t.start_date;
$$;

-- Grant execute to authenticated users (RLS on kit_assignments handles row-level access)
GRANT EXECUTE ON FUNCTION public.get_kit_conflicts(UUID, DATE, DATE, INT) TO authenticated;
