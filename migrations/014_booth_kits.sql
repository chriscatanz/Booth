-- Migration: Booth Kit Management & Auto-Assignment
-- Tracks booth kit inventory and assignments to trade shows

-- ═══════════════════════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════════════════════

-- Kit type/tier classification
CREATE TYPE kit_type AS ENUM ('flagship', 'standard', 'compact', 'tabletop');

-- Kit status (current state)
CREATE TYPE kit_status AS ENUM ('available', 'assigned', 'in_transit', 'at_show', 'maintenance');

-- Assignment status
CREATE TYPE assignment_status AS ENUM ('planned', 'confirmed', 'shipped', 'at_venue', 'returned', 'cancelled');

-- ═══════════════════════════════════════════════════════════════════════════
-- BOOTH KITS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.booth_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Kit identification
  name TEXT NOT NULL,                    -- e.g., "Kit A", "Primary 10ft"
  code TEXT,                             -- Short code for quick reference
  kit_type kit_type NOT NULL DEFAULT 'standard',
  
  -- Kit details
  description TEXT,                      -- What's in the kit
  contents JSONB DEFAULT '[]',           -- Itemized list: [{"item": "10ft backlit display", "qty": 1}, ...]
  dimensions TEXT,                       -- e.g., "10ft x 10ft"
  weight_lbs NUMERIC,                    -- Total packed weight
  
  -- Location tracking
  status kit_status NOT NULL DEFAULT 'available',
  current_location TEXT,                 -- "Warehouse", "At ICBA Live", etc.
  home_location TEXT DEFAULT 'Warehouse', -- Where it returns to
  
  -- Shipping estimates
  default_ship_days INTEGER DEFAULT 3,   -- Typical outbound shipping time
  default_return_days INTEGER DEFAULT 5, -- Typical return shipping time
  
  -- Cost tracking
  replacement_value NUMERIC,             -- Insurance value
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, name),
  UNIQUE(organization_id, code)
);

CREATE INDEX idx_booth_kits_org ON public.booth_kits(organization_id);
CREATE INDEX idx_booth_kits_status ON public.booth_kits(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- KIT ASSIGNMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.kit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kit_id UUID NOT NULL REFERENCES public.booth_kits(id) ON DELETE CASCADE,
  tradeshow_id INTEGER NOT NULL REFERENCES public.tradeshows(id) ON DELETE CASCADE,
  
  -- Assignment details
  status assignment_status NOT NULL DEFAULT 'planned',
  assigned_by UUID REFERENCES public.user_profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Shipping dates (calculated or manual)
  ship_date DATE,                        -- When kit should ship out
  arrival_date DATE,                     -- Expected arrival at venue
  return_ship_date DATE,                 -- When kit ships back
  return_arrival_date DATE,              -- Expected return to warehouse
  
  -- Actual tracking
  outbound_tracking TEXT,
  outbound_carrier TEXT,
  return_tracking TEXT,
  return_carrier TEXT,
  
  -- AI recommendation metadata
  ai_recommended BOOLEAN DEFAULT false,
  ai_recommendation_reason TEXT,
  ai_confidence NUMERIC,                 -- 0-1 confidence score
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent double-booking: one kit per show
  UNIQUE(kit_id, tradeshow_id)
);

CREATE INDEX idx_kit_assignments_org ON public.kit_assignments(organization_id);
CREATE INDEX idx_kit_assignments_kit ON public.kit_assignments(kit_id);
CREATE INDEX idx_kit_assignments_show ON public.kit_assignments(tradeshow_id);
CREATE INDEX idx_kit_assignments_dates ON public.kit_assignments(ship_date, return_arrival_date);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- Kit availability view with next available date
CREATE OR REPLACE VIEW public.v_kit_availability AS
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

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.booth_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_assignments ENABLE ROW LEVEL SECURITY;

-- Booth kits: Users can view kits in their org
CREATE POLICY "Users can view org kits" ON public.booth_kits
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Editors+ can create kits
CREATE POLICY "Editors can create kits" ON public.booth_kits
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Editors+ can update kits
CREATE POLICY "Editors can update kits" ON public.booth_kits
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Admins+ can delete kits
CREATE POLICY "Admins can delete kits" ON public.booth_kits
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Kit assignments: Users can view assignments in their org
CREATE POLICY "Users can view org assignments" ON public.kit_assignments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Editors+ can create assignments
CREATE POLICY "Editors can create assignments" ON public.kit_assignments
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Editors+ can update assignments
CREATE POLICY "Editors can update assignments" ON public.kit_assignments
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Admins+ can delete assignments
CREATE POLICY "Admins can delete assignments" ON public.kit_assignments
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Updated_at triggers
CREATE TRIGGER booth_kits_updated_at
  BEFORE UPDATE ON public.booth_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER kit_assignments_updated_at
  BEFORE UPDATE ON public.kit_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-update kit status when assignment status changes
CREATE OR REPLACE FUNCTION update_kit_status_from_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update kit status based on assignment status
  UPDATE public.booth_kits
  SET 
    status = CASE 
      WHEN NEW.status = 'shipped' THEN 'in_transit'::kit_status
      WHEN NEW.status = 'at_venue' THEN 'at_show'::kit_status
      WHEN NEW.status = 'returned' THEN 'available'::kit_status
      WHEN NEW.status = 'cancelled' THEN 'available'::kit_status
      WHEN NEW.status IN ('planned', 'confirmed') THEN 'assigned'::kit_status
      ELSE status
    END,
    current_location = CASE
      WHEN NEW.status = 'at_venue' THEN (SELECT name FROM public.tradeshows WHERE id = NEW.tradeshow_id)
      WHEN NEW.status = 'returned' THEN home_location
      ELSE current_location
    END
  WHERE id = NEW.kit_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER kit_assignment_status_change
  AFTER INSERT OR UPDATE OF status ON public.kit_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_kit_status_from_assignment();

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Check if a kit is available for a date range
CREATE OR REPLACE FUNCTION is_kit_available(
  p_kit_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_assignment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM public.kit_assignments ka
  JOIN public.tradeshows t ON t.id = ka.tradeshow_id
  WHERE ka.kit_id = p_kit_id
    AND ka.status NOT IN ('returned', 'cancelled')
    AND (p_exclude_assignment_id IS NULL OR ka.id != p_exclude_assignment_id)
    AND (
      -- Check for date overlap including shipping buffer
      (COALESCE(ka.ship_date, t.start_date - 7) <= p_end_date + 7)
      AND 
      (COALESCE(ka.return_arrival_date, t.end_date + 7) >= p_start_date - 7)
    );
    
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all conflicts for a potential assignment
CREATE OR REPLACE FUNCTION get_kit_conflicts(
  p_kit_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_buffer_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  assignment_id UUID,
  tradeshow_id INTEGER,
  tradeshow_name TEXT,
  start_date DATE,
  end_date DATE,
  ship_date DATE,
  return_arrival_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ka.id,
    t.id,
    t.name,
    t.start_date,
    t.end_date,
    ka.ship_date,
    ka.return_arrival_date
  FROM public.kit_assignments ka
  JOIN public.tradeshows t ON t.id = ka.tradeshow_id
  WHERE ka.kit_id = p_kit_id
    AND ka.status NOT IN ('returned', 'cancelled')
    AND (
      (COALESCE(ka.ship_date, t.start_date - p_buffer_days) <= p_end_date + p_buffer_days)
      AND 
      (COALESCE(ka.return_arrival_date, t.end_date + p_buffer_days) >= p_start_date - p_buffer_days)
    )
  ORDER BY t.start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.booth_kits IS 'Booth kit inventory with type classification and location tracking';
COMMENT ON TABLE public.kit_assignments IS 'Kit assignments to trade shows with shipping logistics';
COMMENT ON VIEW public.v_kit_availability IS 'Kit availability with next assignment and available-from dates';
COMMENT ON FUNCTION is_kit_available IS 'Check if a kit is available for a given date range';
COMMENT ON FUNCTION get_kit_conflicts IS 'Get all conflicting assignments for a kit and date range';
