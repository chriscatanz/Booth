-- Migration: Asset Management
-- Track booth kits, displays, swag inventory with reservations per show

-- Asset types
CREATE TYPE asset_type AS ENUM ('capital', 'collateral');

-- Assets table (booth kits, displays, swag, etc.)
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Asset details
  name TEXT NOT NULL,
  description TEXT,
  type asset_type NOT NULL DEFAULT 'capital',
  category TEXT, -- e.g., 'Booth Kit', 'Banner', 'Swag', 'Literature'
  
  -- For collateral: inventory tracking
  quantity INTEGER DEFAULT 1,
  low_stock_threshold INTEGER, -- Alert when quantity falls below this
  
  -- For capital: value tracking
  purchase_cost DECIMAL(10,2),
  purchase_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Media
  image_url TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset reservations (link assets to shows)
CREATE TABLE public.asset_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  trade_show_id UUID NOT NULL REFERENCES public.trade_shows(id) ON DELETE CASCADE,
  
  -- For collateral: quantity reserved
  quantity_reserved INTEGER DEFAULT 1,
  
  -- Status
  status TEXT DEFAULT 'reserved' CHECK (status IN ('reserved', 'shipped', 'returned', 'consumed')),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  reserved_by UUID REFERENCES public.user_profiles(id),
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(asset_id, trade_show_id)
);

-- Indexes
CREATE INDEX idx_assets_org ON public.assets(organization_id);
CREATE INDEX idx_assets_type ON public.assets(type);
CREATE INDEX idx_asset_reservations_asset ON public.asset_reservations(asset_id);
CREATE INDEX idx_asset_reservations_show ON public.asset_reservations(trade_show_id);

-- RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_reservations ENABLE ROW LEVEL SECURITY;

-- Assets: Users can view their org's assets
CREATE POLICY "Users can view org assets" ON public.assets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Editors can manage assets
CREATE POLICY "Editors can create assets" ON public.assets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Editors can update assets" ON public.assets
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Admins can delete assets" ON public.assets
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Reservations: Users can view reservations for assets they can see
CREATE POLICY "Users can view asset reservations" ON public.asset_reservations
  FOR SELECT USING (
    asset_id IN (
      SELECT id FROM public.assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Editors can create reservations" ON public.asset_reservations
  FOR INSERT WITH CHECK (
    asset_id IN (
      SELECT id FROM public.assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "Editors can update reservations" ON public.asset_reservations
  FOR UPDATE USING (
    asset_id IN (
      SELECT id FROM public.assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "Editors can delete reservations" ON public.asset_reservations
  FOR DELETE USING (
    asset_id IN (
      SELECT id FROM public.assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Updated_at trigger
CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE public.assets IS 'Organization assets: booth kits, displays, swag, literature';
COMMENT ON TABLE public.asset_reservations IS 'Asset reservations linked to trade shows';
