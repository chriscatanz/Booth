-- Migration: Reusable Dropdown Entities
-- Creates lookup tables for commonly reused data across trade shows

-- ============================================================================
-- TIER 1: HIGH IMPACT
-- ============================================================================

-- Shipping Carriers (FedEx, UPS, DHL, freight forwarders)
CREATE TABLE IF NOT EXISTS shipping_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  carrier_type TEXT CHECK (carrier_type IN ('parcel', 'freight', 'courier', 'other')) DEFAULT 'parcel',
  account_number TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  notes TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipping_carriers_org ON shipping_carriers(organization_id);

-- Team Members (your company's people who attend shows)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,
  department TEXT,
  dietary_restrictions TEXT,
  tshirt_size TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_members_org ON team_members(organization_id);

-- Hotels (frequently used hotels)
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT, -- Marriott, Hilton, etc.
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',
  phone TEXT,
  website TEXT,
  corporate_rate DECIMAL(10,2),
  rewards_program TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotels_org ON hotels(organization_id);

-- Venues (convention centers, event spaces)
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',
  phone TEXT,
  website TEXT,
  loading_dock_info TEXT,
  parking_info TEXT,
  wifi_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_org ON venues(organization_id);

-- ============================================================================
-- TIER 2: MEDIUM IMPACT
-- ============================================================================

-- Lead Capture Systems (CompuSystems, Validar, Cvent)
CREATE TABLE IF NOT EXISTS lead_capture_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  login_url TEXT,
  default_username TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_capture_systems_org ON lead_capture_systems(organization_id);

-- Virtual Platforms (Hopin, ON24, vFairs)
CREATE TABLE IF NOT EXISTS virtual_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_virtual_platforms_org ON virtual_platforms(organization_id);

-- Management Companies / Decorators (Freeman, GES, Shepard)
CREATE TABLE IF NOT EXISTS management_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_type TEXT CHECK (company_type IN ('decorator', 'organizer', 'av_provider', 'other')) DEFAULT 'decorator',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_management_companies_org ON management_companies(organization_id);

-- Labor / I&D Companies
CREATE TABLE IF NOT EXISTS labor_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  service_regions TEXT, -- e.g., "Northeast, Midwest"
  hourly_rate DECIMAL(10,2),
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labor_companies_org ON labor_companies(organization_id);

-- ============================================================================
-- TIER 3: NICE TO HAVE
-- ============================================================================

-- Booth Sizes (standard configurations)
CREATE TABLE IF NOT EXISTS booth_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "10x10 Inline", "20x20 Island"
  width_ft DECIMAL(5,1),
  depth_ft DECIMAL(5,1),
  sq_footage DECIMAL(8,1),
  booth_type TEXT CHECK (booth_type IN ('inline', 'corner', 'peninsula', 'island', 'tabletop', 'other')) DEFAULT 'inline',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booth_sizes_org ON booth_sizes(organization_id);

-- Swag Items (inventory of giveaway items)
CREATE TABLE IF NOT EXISTS swag_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  unit_cost DECIMAL(10,2),
  supplier TEXT,
  reorder_url TEXT,
  current_inventory INTEGER DEFAULT 0,
  reorder_threshold INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_swag_items_org ON swag_items(organization_id);

-- ============================================================================
-- JUNCTION TABLES
-- ============================================================================

-- Team members assigned to shows
CREATE TABLE IF NOT EXISTS tradeshow_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tradeshow_id INTEGER NOT NULL REFERENCES tradeshows(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('lead', 'support', 'speaker', 'executive', 'other')) DEFAULT 'support',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tradeshow_id, team_member_id)
);

CREATE INDEX idx_tradeshow_team_members_show ON tradeshow_team_members(tradeshow_id);
CREATE INDEX idx_tradeshow_team_members_member ON tradeshow_team_members(team_member_id);

-- Swag items allocated to shows
CREATE TABLE IF NOT EXISTS tradeshow_swag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tradeshow_id INTEGER NOT NULL REFERENCES tradeshows(id) ON DELETE CASCADE,
  swag_item_id UUID NOT NULL REFERENCES swag_items(id) ON DELETE CASCADE,
  quantity_allocated INTEGER DEFAULT 0,
  quantity_distributed INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tradeshow_id, swag_item_id)
);

CREATE INDEX idx_tradeshow_swag_show ON tradeshow_swag(tradeshow_id);
CREATE INDEX idx_tradeshow_swag_item ON tradeshow_swag(swag_item_id);

-- ============================================================================
-- ADD FOREIGN KEYS TO TRADESHOWS
-- ============================================================================

-- Outbound shipping carrier
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS shipping_carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE SET NULL;

-- Return shipping fields
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS return_carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE SET NULL;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS return_tracking_number TEXT;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS return_shipping_cost DECIMAL(10,2);
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS return_ship_date DATE;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS return_delivery_date DATE;

-- Other lookups
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS lead_capture_system_id UUID REFERENCES lead_capture_systems(id) ON DELETE SET NULL;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS virtual_platform_id UUID REFERENCES virtual_platforms(id) ON DELETE SET NULL;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS management_company_id UUID REFERENCES management_companies(id) ON DELETE SET NULL;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS labor_company_id UUID REFERENCES labor_companies(id) ON DELETE SET NULL;
ALTER TABLE tradeshows ADD COLUMN IF NOT EXISTS booth_size_id UUID REFERENCES booth_sizes(id) ON DELETE SET NULL;

-- Create indexes for the new FKs
CREATE INDEX IF NOT EXISTS idx_tradeshows_shipping_carrier ON tradeshows(shipping_carrier_id);
CREATE INDEX IF NOT EXISTS idx_tradeshows_return_carrier ON tradeshows(return_carrier_id);
CREATE INDEX IF NOT EXISTS idx_tradeshows_hotel ON tradeshows(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tradeshows_venue ON tradeshows(venue_id);
CREATE INDEX IF NOT EXISTS idx_tradeshows_lead_capture ON tradeshows(lead_capture_system_id);
CREATE INDEX IF NOT EXISTS idx_tradeshows_virtual_platform ON tradeshows(virtual_platform_id);
CREATE INDEX IF NOT EXISTS idx_tradeshows_management_company ON tradeshows(management_company_id);
CREATE INDEX IF NOT EXISTS idx_tradeshows_labor_company ON tradeshows(labor_company_id);
CREATE INDEX IF NOT EXISTS idx_tradeshows_booth_size ON tradeshows(booth_size_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_capture_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE management_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE swag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeshow_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeshow_swag ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their organization's data

-- Shipping Carriers
CREATE POLICY shipping_carriers_select ON shipping_carriers FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY shipping_carriers_insert ON shipping_carriers FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY shipping_carriers_update ON shipping_carriers FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY shipping_carriers_delete ON shipping_carriers FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Team Members
CREATE POLICY team_members_select ON team_members FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY team_members_insert ON team_members FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY team_members_update ON team_members FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY team_members_delete ON team_members FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Hotels
CREATE POLICY hotels_select ON hotels FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY hotels_insert ON hotels FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY hotels_update ON hotels FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY hotels_delete ON hotels FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Venues
CREATE POLICY venues_select ON venues FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY venues_insert ON venues FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY venues_update ON venues FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY venues_delete ON venues FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Lead Capture Systems
CREATE POLICY lead_capture_systems_select ON lead_capture_systems FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY lead_capture_systems_insert ON lead_capture_systems FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY lead_capture_systems_update ON lead_capture_systems FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY lead_capture_systems_delete ON lead_capture_systems FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Virtual Platforms
CREATE POLICY virtual_platforms_select ON virtual_platforms FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY virtual_platforms_insert ON virtual_platforms FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY virtual_platforms_update ON virtual_platforms FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY virtual_platforms_delete ON virtual_platforms FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Management Companies
CREATE POLICY management_companies_select ON management_companies FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY management_companies_insert ON management_companies FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY management_companies_update ON management_companies FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY management_companies_delete ON management_companies FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Labor Companies
CREATE POLICY labor_companies_select ON labor_companies FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY labor_companies_insert ON labor_companies FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY labor_companies_update ON labor_companies FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY labor_companies_delete ON labor_companies FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Booth Sizes
CREATE POLICY booth_sizes_select ON booth_sizes FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY booth_sizes_insert ON booth_sizes FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY booth_sizes_update ON booth_sizes FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY booth_sizes_delete ON booth_sizes FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Swag Items
CREATE POLICY swag_items_select ON swag_items FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY swag_items_insert ON swag_items FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY swag_items_update ON swag_items FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY swag_items_delete ON swag_items FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Tradeshow Team Members (junction)
CREATE POLICY tradeshow_team_members_select ON tradeshow_team_members FOR SELECT USING (
  tradeshow_id IN (SELECT id FROM tradeshows WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
);
CREATE POLICY tradeshow_team_members_insert ON tradeshow_team_members FOR INSERT WITH CHECK (
  tradeshow_id IN (SELECT id FROM tradeshows WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
);
CREATE POLICY tradeshow_team_members_update ON tradeshow_team_members FOR UPDATE USING (
  tradeshow_id IN (SELECT id FROM tradeshows WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
);
CREATE POLICY tradeshow_team_members_delete ON tradeshow_team_members FOR DELETE USING (
  tradeshow_id IN (SELECT id FROM tradeshows WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
);

-- Tradeshow Swag (junction)
CREATE POLICY tradeshow_swag_select ON tradeshow_swag FOR SELECT USING (
  tradeshow_id IN (SELECT id FROM tradeshows WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
);
CREATE POLICY tradeshow_swag_insert ON tradeshow_swag FOR INSERT WITH CHECK (
  tradeshow_id IN (SELECT id FROM tradeshows WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
);
CREATE POLICY tradeshow_swag_update ON tradeshow_swag FOR UPDATE USING (
  tradeshow_id IN (SELECT id FROM tradeshows WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
);
CREATE POLICY tradeshow_swag_delete ON tradeshow_swag FOR DELETE USING (
  tradeshow_id IN (SELECT id FROM tradeshows WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
);

-- ============================================================================
-- SEED COMMON BOOTH SIZES (will be added per-org on first use)
-- ============================================================================

-- Note: We don't seed here since these are org-specific. 
-- The UI will offer "Add common sizes" button that creates standard options.

COMMENT ON TABLE shipping_carriers IS 'Reusable shipping carriers (FedEx, UPS, freight forwarders)';
COMMENT ON TABLE team_members IS 'Organization team members who attend trade shows';
COMMENT ON TABLE hotels IS 'Frequently used hotels for trade shows';
COMMENT ON TABLE venues IS 'Convention centers and event venues';
COMMENT ON TABLE lead_capture_systems IS 'Lead retrieval system providers';
COMMENT ON TABLE virtual_platforms IS 'Virtual event platform providers';
COMMENT ON TABLE management_companies IS 'Show decorators and management companies';
COMMENT ON TABLE labor_companies IS 'Installation & dismantle labor providers';
COMMENT ON TABLE booth_sizes IS 'Standard booth size configurations';
COMMENT ON TABLE swag_items IS 'Promotional item inventory';
COMMENT ON TABLE tradeshow_team_members IS 'Team members assigned to specific shows';
COMMENT ON TABLE tradeshow_swag IS 'Swag items allocated to specific shows';
