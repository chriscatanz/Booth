-- Seed lookup data for Dopamine Design Labs org
-- Run as SECURITY DEFINER to bypass RLS
-- Org ID: afe84815-1a07-4dea-8988-33a1ab25c033

-- Temporarily disable RLS for seeding
ALTER TABLE booth_sizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_carriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE hotels DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_capture_systems DISABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_platforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE management_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE labor_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE swag_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE booth_kits DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- ============================================
-- BOOTH SIZES
-- ============================================
INSERT INTO booth_sizes (organization_id, name, width_ft, depth_ft, sq_footage, booth_type) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', '10x10 Standard', 10, 10, 100, 'inline'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', '10x20 Inline', 10, 20, 200, 'inline'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', '10x10 Corner', 10, 10, 100, 'corner'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', '20x20 Island', 20, 20, 400, 'island'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', '20x30 Peninsula', 20, 30, 600, 'peninsula'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', '30x30 Island', 30, 30, 900, 'island'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', '10x30 Inline', 10, 30, 300, 'inline'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', '6x6 Tabletop', 6, 6, 36, 'tabletop')
ON CONFLICT DO NOTHING;

-- ============================================
-- SHIPPING CARRIERS
-- ============================================
INSERT INTO shipping_carriers (organization_id, name, carrier_type) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'FedEx', 'parcel'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'UPS', 'parcel'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'DHL', 'parcel'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'USPS', 'parcel'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'FedEx Freight', 'freight'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'XPO Logistics', 'freight'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Estes Express', 'freight'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'R+L Carriers', 'freight'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Old Dominion', 'freight'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'ABF Freight', 'freight')
ON CONFLICT DO NOTHING;

-- ============================================
-- HOTELS
-- ============================================
INSERT INTO hotels (organization_id, name, brand) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Marriott', 'Marriott International'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Hilton', 'Hilton Hotels'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Hyatt', 'Hyatt Hotels'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Holiday Inn', 'IHG'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Westin', 'Marriott International'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Sheraton', 'Marriott International'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'DoubleTree', 'Hilton Hotels'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Hampton Inn', 'Hilton Hotels'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Courtyard by Marriott', 'Marriott International'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Embassy Suites', 'Hilton Hotels'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Omni Hotels', 'Omni'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'JW Marriott', 'Marriott International'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Renaissance', 'Marriott International'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Hyatt Regency', 'Hyatt Hotels'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Ritz-Carlton', 'Marriott International')
ON CONFLICT DO NOTHING;

-- ============================================
-- VENUES
-- ============================================
INSERT INTO venues (organization_id, name, city, state) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Las Vegas Convention Center', 'Las Vegas', 'NV'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'McCormick Place', 'Chicago', 'IL'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Orange County Convention Center', 'Orlando', 'FL'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Georgia World Congress Center', 'Atlanta', 'GA'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Moscone Center', 'San Francisco', 'CA'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Javits Center', 'New York', 'NY'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Mandalay Bay Convention Center', 'Las Vegas', 'NV'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'San Diego Convention Center', 'San Diego', 'CA'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Boston Convention Center', 'Boston', 'MA'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Colorado Convention Center', 'Denver', 'CO'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Walter E. Washington Convention Center', 'Washington', 'DC'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Phoenix Convention Center', 'Phoenix', 'AZ'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Music City Center', 'Nashville', 'TN'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Austin Convention Center', 'Austin', 'TX'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Anaheim Convention Center', 'Anaheim', 'CA'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Ernest N. Morial Convention Center', 'New Orleans', 'LA'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Miami Beach Convention Center', 'Miami Beach', 'FL'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Gaylord Opryland Resort', 'Nashville', 'TN'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Gaylord Texan Resort', 'Grapevine', 'TX'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Gaylord National Resort', 'National Harbor', 'MD'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Wynn Las Vegas', 'Las Vegas', 'NV'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'The Venetian Expo', 'Las Vegas', 'NV'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Caesars Forum', 'Las Vegas', 'NV')
ON CONFLICT DO NOTHING;

-- ============================================
-- LEAD CAPTURE SYSTEMS
-- ============================================
INSERT INTO lead_capture_systems (organization_id, name, website) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'iCapture', 'https://www.icapture.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Compusystems', 'https://www.compusystems.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Cvent LeadCapture', 'https://www.cvent.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Attendify', 'https://www.attendify.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'atEvent', 'https://www.atevent.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Expo Logic', 'https://www.expologic.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Badge Scanner (Generic)', NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- VIRTUAL PLATFORMS
-- ============================================
INSERT INTO virtual_platforms (organization_id, name, website) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Zoom Events', 'https://zoom.us'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Microsoft Teams Live', 'https://teams.microsoft.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Hopin', 'https://hopin.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'ON24', 'https://www.on24.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Webex Events', 'https://www.webex.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Bizzabo', 'https://www.bizzabo.com'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'vFairs', 'https://www.vfairs.com')
ON CONFLICT DO NOTHING;

-- ============================================
-- MANAGEMENT COMPANIES
-- ============================================
INSERT INTO management_companies (organization_id, name, company_type) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Freeman', 'decorator'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'GES (Global Experience Specialists)', 'decorator'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Shepard Exposition Services', 'decorator'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Fern Expo', 'decorator'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Hargrove', 'decorator'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'PSAV (Encore)', 'av_provider'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'SmartSource Rentals', 'av_provider')
ON CONFLICT DO NOTHING;

-- ============================================
-- LABOR COMPANIES
-- ============================================
INSERT INTO labor_companies (organization_id, name, service_regions) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Freeman I&D', 'Nationwide'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'GES Installation', 'Nationwide'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Union Labor (IATSE)', 'Major Cities'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Exhibitor Appointed Contractor (EAC)', 'Nationwide')
ON CONFLICT DO NOTHING;

-- ============================================
-- SWAG ITEMS
-- ============================================
INSERT INTO swag_items (organization_id, name, description) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'T-Shirts', 'Branded t-shirts'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Polo Shirts', 'Branded polo shirts'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Hats/Caps', 'Branded baseball caps'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Pens', 'Branded pens'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Notebooks', 'Branded notebooks'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'USB Drives', 'Branded USB flash drives'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Phone Chargers', 'Portable phone chargers'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Water Bottles', 'Branded water bottles'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Coffee Mugs', 'Branded coffee mugs'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Tumblers', 'Insulated tumblers'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Tote Bags', 'Canvas tote bags'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Backpacks', 'Branded backpacks'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Stickers', 'Branded stickers/decals'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Lanyards', 'Branded lanyards'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Stress Balls', 'Branded stress balls')
ON CONFLICT DO NOTHING;

-- ============================================
-- BOOTH KITS
-- ============================================
INSERT INTO booth_kits (organization_id, name, description, contents, status) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Kit A', '10ft backlit display (flagship)', 
   '[{"item": "10ft backlit display", "qty": 1}, {"item": "counter", "qty": 1}, {"item": "literature stand", "qty": 1}, {"item": "iPad stand", "qty": 1}, {"item": "carpet", "qty": 1}, {"item": "lighting kit", "qty": 1}]'::jsonb, 'available'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Kit B', '2x pull-up banner stands (compact)', 
   '[{"item": "Pull-up banner", "qty": 2}, {"item": "tablecloth", "qty": 1}, {"item": "literature holder", "qty": 1}]'::jsonb, 'available'),
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Kit C', '1x pull-up + 1x backlit banner stand (mid-tier)', 
   '[{"item": "Pull-up banner", "qty": 1}, {"item": "Backlit banner stand", "qty": 1}, {"item": "counter", "qty": 1}, {"item": "tablecloth", "qty": 1}]'::jsonb, 'available')
ON CONFLICT DO NOTHING;

-- ============================================
-- TEAM MEMBERS
-- ============================================
INSERT INTO team_members (organization_id, name, title) VALUES
  ('afe84815-1a07-4dea-8988-33a1ab25c033', 'Chris', 'Trade Show Manager')
ON CONFLICT DO NOTHING;

-- Re-enable RLS on all tables
ALTER TABLE booth_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_capture_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE management_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE swag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
