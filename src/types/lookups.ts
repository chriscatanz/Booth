// Reusable Lookup Types for Trade Show Management
// These entities can be referenced across multiple trade shows

// ============================================================================
// TIER 1: HIGH IMPACT
// ============================================================================

// Shipping Carriers
export type CarrierType = 'parcel' | 'freight' | 'courier' | 'other';

export interface ShippingCarrier {
  id: string;
  organizationId: string;
  name: string;
  carrierType: CarrierType;
  accountNumber: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  notes: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CARRIER_TYPE_LABELS: Record<CarrierType, string> = {
  parcel: 'Parcel (FedEx, UPS)',
  freight: 'Freight / LTL',
  courier: 'Courier / Same-Day',
  other: 'Other',
};

// Team Members (your company's people)
export interface TeamMember {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  dietaryRestrictions: string | null;
  tshirtSize: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TeamMemberRole = 'lead' | 'support' | 'speaker' | 'executive' | 'other';

export const TEAM_MEMBER_ROLE_LABELS: Record<TeamMemberRole, string> = {
  lead: 'Team Lead',
  support: 'Support',
  speaker: 'Speaker',
  executive: 'Executive',
  other: 'Other',
};

// Hotels
export interface Hotel {
  id: string;
  organizationId: string;
  name: string;
  brand: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  phone: string | null;
  website: string | null;
  corporateRate: number | null;
  rewardsProgram: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Venues
export interface Venue {
  id: string;
  organizationId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  phone: string | null;
  website: string | null;
  loadingDockInfo: string | null;
  parkingInfo: string | null;
  wifiInfo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TIER 2: MEDIUM IMPACT
// ============================================================================

// Lead Capture Systems
export interface LeadCaptureSystem {
  id: string;
  organizationId: string;
  name: string;
  website: string | null;
  loginUrl: string | null;
  defaultUsername: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Virtual Platforms
export interface VirtualPlatform {
  id: string;
  organizationId: string;
  name: string;
  website: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Management Companies / Decorators
export type CompanyType = 'decorator' | 'organizer' | 'av_provider' | 'other';

export interface ManagementCompany {
  id: string;
  organizationId: string;
  name: string;
  companyType: CompanyType;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  decorator: 'Decorator / GC',
  organizer: 'Show Organizer',
  av_provider: 'AV Provider',
  other: 'Other',
};

// Labor / I&D Companies
export interface LaborCompany {
  id: string;
  organizationId: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  serviceRegions: string | null;
  hourlyRate: number | null;
  website: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TIER 3: NICE TO HAVE
// ============================================================================

// Booth Sizes
export type BoothType = 'inline' | 'corner' | 'peninsula' | 'island' | 'tabletop' | 'other';

export interface BoothSize {
  id: string;
  organizationId: string;
  name: string;
  widthFt: number | null;
  depthFt: number | null;
  sqFootage: number | null;
  boothType: BoothType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const BOOTH_TYPE_LABELS: Record<BoothType, string> = {
  inline: 'Inline',
  corner: 'Corner',
  peninsula: 'Peninsula',
  island: 'Island',
  tabletop: 'Tabletop',
  other: 'Other',
};

// Standard booth sizes to offer as quick-add options
export const STANDARD_BOOTH_SIZES: Array<{ name: string; width: number; depth: number; type: BoothType }> = [
  { name: '10x10 Inline', width: 10, depth: 10, type: 'inline' },
  { name: '10x10 Corner', width: 10, depth: 10, type: 'corner' },
  { name: '10x20 Inline', width: 10, depth: 20, type: 'inline' },
  { name: '20x20 Island', width: 20, depth: 20, type: 'island' },
  { name: '20x30 Island', width: 20, depth: 30, type: 'island' },
  { name: '30x30 Island', width: 30, depth: 30, type: 'island' },
  { name: '6ft Tabletop', width: 6, depth: 2.5, type: 'tabletop' },
  { name: '8ft Tabletop', width: 8, depth: 2.5, type: 'tabletop' },
];

// Swag Items
export interface SwagItem {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  sku: string | null;
  unitCost: number | null;
  supplier: string | null;
  reorderUrl: string | null;
  currentInventory: number;
  reorderThreshold: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// JUNCTION TABLES
// ============================================================================

// Team member assigned to a show
export interface TradeshowTeamMember {
  id: string;
  tradeshowId: number;
  teamMemberId: string;
  role: TeamMemberRole;
  notes: string | null;
  createdAt: string;
  // Joined data
  teamMember?: TeamMember;
}

// Swag allocated to a show
export interface TradeshowSwag {
  id: string;
  tradeshowId: number;
  swagItemId: string;
  quantityAllocated: number;
  quantityDistributed: number;
  notes: string | null;
  createdAt: string;
  // Joined data
  swagItem?: SwagItem;
}

// ============================================================================
// COMMON CARRIERS (for quick-add)
// ============================================================================

export const COMMON_CARRIERS: Array<{ name: string; type: CarrierType; website: string }> = [
  { name: 'FedEx', type: 'parcel', website: 'https://www.fedex.com' },
  { name: 'UPS', type: 'parcel', website: 'https://www.ups.com' },
  { name: 'DHL', type: 'parcel', website: 'https://www.dhl.com' },
  { name: 'USPS', type: 'parcel', website: 'https://www.usps.com' },
  { name: 'FedEx Freight', type: 'freight', website: 'https://www.fedex.com/en-us/shipping/freight.html' },
  { name: 'UPS Freight', type: 'freight', website: 'https://www.ups.com/us/en/supplychain/freight.page' },
  { name: 'XPO Logistics', type: 'freight', website: 'https://www.xpo.com' },
  { name: 'Old Dominion', type: 'freight', website: 'https://www.odfl.com' },
  { name: 'Estes Express', type: 'freight', website: 'https://www.estes-express.com' },
  { name: 'R+L Carriers', type: 'freight', website: 'https://www.rlcarriers.com' },
];

// ============================================================================
// COMMON LEAD CAPTURE SYSTEMS
// ============================================================================

export const COMMON_LEAD_SYSTEMS: Array<{ name: string; website: string }> = [
  { name: 'CompuSystems', website: 'https://www.compusystems.com' },
  { name: 'Validar', website: 'https://www.validar.com' },
  { name: 'Cvent LeadCapture', website: 'https://www.cvent.com' },
  { name: 'iCapture', website: 'https://www.icapture.com' },
  { name: 'Attendify', website: 'https://www.attendify.com' },
  { name: 'Bizzabo', website: 'https://www.bizzabo.com' },
];

// ============================================================================
// COMMON VIRTUAL PLATFORMS
// ============================================================================

export const COMMON_VIRTUAL_PLATFORMS: Array<{ name: string; website: string }> = [
  { name: 'Hopin', website: 'https://www.hopin.com' },
  { name: 'ON24', website: 'https://www.on24.com' },
  { name: 'vFairs', website: 'https://www.vfairs.com' },
  { name: '6Connex', website: 'https://www.6connex.com' },
  { name: 'Zoom Events', website: 'https://events.zoom.us' },
  { name: 'Webex Events', website: 'https://www.webex.com/events.html' },
  { name: 'Microsoft Teams Live Events', website: 'https://www.microsoft.com/en-us/microsoft-teams' },
];

// ============================================================================
// COMMON DECORATORS / MANAGEMENT COMPANIES
// ============================================================================

export const COMMON_DECORATORS: Array<{ name: string; type: CompanyType; website: string }> = [
  { name: 'Freeman', type: 'decorator', website: 'https://www.freeman.com' },
  { name: 'GES (Global Experience Specialists)', type: 'decorator', website: 'https://www.ges.com' },
  { name: 'Shepard Exposition Services', type: 'decorator', website: 'https://www.shepardes.com' },
  { name: 'Fern Exposition', type: 'decorator', website: 'https://www.fernexpo.com' },
  { name: 'Hargrove', type: 'decorator', website: 'https://www.hfrp.com' },
  { name: 'PSAV (Encore)', type: 'av_provider', website: 'https://www.encoreglobal.com' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getFullAddress(entity: { address?: string | null; city?: string | null; state?: string | null; zip?: string | null; country?: string | null }): string {
  const parts = [
    entity.address,
    entity.city,
    entity.state ? `${entity.state} ${entity.zip || ''}`.trim() : entity.zip,
    entity.country && entity.country !== 'USA' ? entity.country : null,
  ].filter(Boolean);
  return parts.join(', ');
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
