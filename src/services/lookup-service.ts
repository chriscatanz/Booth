/**
 * Lookup Service - CRUD operations for reusable dropdown entities
 */

import { supabase } from '@/lib/supabase';
import type {
  ShippingCarrier,
  TeamMember,
  Hotel,
  Venue,
  LeadCaptureSystem,
  VirtualPlatform,
  ManagementCompany,
  LaborCompany,
  BoothSize,
  SwagItem,
  TradeshowTeamMember,
  TradeshowSwag,
  TeamMemberRole,
} from '@/types/lookups';

// ============================================================================
// GENERIC HELPERS
// ============================================================================

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformKeys<T>(obj: any, transformer: (key: string) => string): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transformer)) as T;
  }
  if (typeof obj === 'object') {
    const transformed: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      transformed[transformer(key)] = transformKeys(obj[key], transformer);
    }
    return transformed as T;
  }
  return obj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDb<T>(obj: T): any {
  return transformKeys(obj, toSnakeCase);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDb<T>(obj: any): T {
  return transformKeys<T>(obj, toCamelCase);
}

// ============================================================================
// SHIPPING CARRIERS
// ============================================================================

export async function getShippingCarriers(orgId: string): Promise<ShippingCarrier[]> {
  const { data, error } = await supabase
    .from('shipping_carriers')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
  
  if (error) throw error;
  return fromDb<ShippingCarrier[]>(data || []);
}

export async function createShippingCarrier(orgId: string, carrier: Partial<ShippingCarrier>): Promise<ShippingCarrier> {
  const { data, error } = await supabase
    .from('shipping_carriers')
    .insert({ ...toDb(carrier), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<ShippingCarrier>(data);
}

export async function updateShippingCarrier(id: string, updates: Partial<ShippingCarrier>): Promise<ShippingCarrier> {
  const { data, error } = await supabase
    .from('shipping_carriers')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<ShippingCarrier>(data);
}

export async function deleteShippingCarrier(id: string): Promise<void> {
  const { error } = await supabase
    .from('shipping_carriers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export async function getTeamMembers(orgId: string, includeInactive = false): Promise<TeamMember[]> {
  let query = supabase
    .from('team_members')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
  
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return fromDb<TeamMember[]>(data || []);
}

export async function createTeamMember(orgId: string, member: Partial<TeamMember>): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({ ...toDb(member), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<TeamMember>(data);
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<TeamMember>(data);
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// HOTELS
// ============================================================================

export async function getHotels(orgId: string): Promise<Hotel[]> {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
  
  if (error) throw error;
  return fromDb<Hotel[]>(data || []);
}

export async function createHotel(orgId: string, hotel: Partial<Hotel>): Promise<Hotel> {
  const { data, error } = await supabase
    .from('hotels')
    .insert({ ...toDb(hotel), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<Hotel>(data);
}

export async function updateHotel(id: string, updates: Partial<Hotel>): Promise<Hotel> {
  const { data, error } = await supabase
    .from('hotels')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<Hotel>(data);
}

export async function deleteHotel(id: string): Promise<void> {
  const { error } = await supabase
    .from('hotels')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// VENUES
// ============================================================================

export async function getVenues(orgId: string): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
  
  if (error) throw error;
  return fromDb<Venue[]>(data || []);
}

export async function createVenue(orgId: string, venue: Partial<Venue>): Promise<Venue> {
  const { data, error } = await supabase
    .from('venues')
    .insert({ ...toDb(venue), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<Venue>(data);
}

export async function updateVenue(id: string, updates: Partial<Venue>): Promise<Venue> {
  const { data, error } = await supabase
    .from('venues')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<Venue>(data);
}

export async function deleteVenue(id: string): Promise<void> {
  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// LEAD CAPTURE SYSTEMS
// ============================================================================

export async function getLeadCaptureSystems(orgId: string): Promise<LeadCaptureSystem[]> {
  const { data, error } = await supabase
    .from('lead_capture_systems')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
  
  if (error) throw error;
  return fromDb<LeadCaptureSystem[]>(data || []);
}

export async function createLeadCaptureSystem(orgId: string, system: Partial<LeadCaptureSystem>): Promise<LeadCaptureSystem> {
  const { data, error } = await supabase
    .from('lead_capture_systems')
    .insert({ ...toDb(system), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<LeadCaptureSystem>(data);
}

export async function updateLeadCaptureSystem(id: string, updates: Partial<LeadCaptureSystem>): Promise<LeadCaptureSystem> {
  const { data, error } = await supabase
    .from('lead_capture_systems')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<LeadCaptureSystem>(data);
}

export async function deleteLeadCaptureSystem(id: string): Promise<void> {
  const { error } = await supabase
    .from('lead_capture_systems')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// VIRTUAL PLATFORMS
// ============================================================================

export async function getVirtualPlatforms(orgId: string): Promise<VirtualPlatform[]> {
  const { data, error } = await supabase
    .from('virtual_platforms')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
  
  if (error) throw error;
  return fromDb<VirtualPlatform[]>(data || []);
}

export async function createVirtualPlatform(orgId: string, platform: Partial<VirtualPlatform>): Promise<VirtualPlatform> {
  const { data, error } = await supabase
    .from('virtual_platforms')
    .insert({ ...toDb(platform), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<VirtualPlatform>(data);
}

export async function updateVirtualPlatform(id: string, updates: Partial<VirtualPlatform>): Promise<VirtualPlatform> {
  const { data, error } = await supabase
    .from('virtual_platforms')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<VirtualPlatform>(data);
}

export async function deleteVirtualPlatform(id: string): Promise<void> {
  const { error } = await supabase
    .from('virtual_platforms')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// MANAGEMENT COMPANIES
// ============================================================================

export async function getManagementCompanies(orgId: string): Promise<ManagementCompany[]> {
  const { data, error } = await supabase
    .from('management_companies')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
  
  if (error) throw error;
  return fromDb<ManagementCompany[]>(data || []);
}

export async function createManagementCompany(orgId: string, company: Partial<ManagementCompany>): Promise<ManagementCompany> {
  const { data, error } = await supabase
    .from('management_companies')
    .insert({ ...toDb(company), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<ManagementCompany>(data);
}

export async function updateManagementCompany(id: string, updates: Partial<ManagementCompany>): Promise<ManagementCompany> {
  const { data, error } = await supabase
    .from('management_companies')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<ManagementCompany>(data);
}

export async function deleteManagementCompany(id: string): Promise<void> {
  const { error } = await supabase
    .from('management_companies')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// LABOR COMPANIES
// ============================================================================

export async function getLaborCompanies(orgId: string): Promise<LaborCompany[]> {
  const { data, error } = await supabase
    .from('labor_companies')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
  
  if (error) throw error;
  return fromDb<LaborCompany[]>(data || []);
}

export async function createLaborCompany(orgId: string, company: Partial<LaborCompany>): Promise<LaborCompany> {
  const { data, error } = await supabase
    .from('labor_companies')
    .insert({ ...toDb(company), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<LaborCompany>(data);
}

export async function updateLaborCompany(id: string, updates: Partial<LaborCompany>): Promise<LaborCompany> {
  const { data, error } = await supabase
    .from('labor_companies')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<LaborCompany>(data);
}

export async function deleteLaborCompany(id: string): Promise<void> {
  const { error } = await supabase
    .from('labor_companies')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// BOOTH SIZES
// ============================================================================

export async function getBoothSizes(orgId: string): Promise<BoothSize[]> {
  const { data, error } = await supabase
    .from('booth_sizes')
    .select('*')
    .eq('organization_id', orgId)
    .order('sq_footage');
  
  if (error) throw error;
  return fromDb<BoothSize[]>(data || []);
}

export async function createBoothSize(orgId: string, size: Partial<BoothSize>): Promise<BoothSize> {
  const { data, error } = await supabase
    .from('booth_sizes')
    .insert({ ...toDb(size), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<BoothSize>(data);
}

export async function updateBoothSize(id: string, updates: Partial<BoothSize>): Promise<BoothSize> {
  const { data, error } = await supabase
    .from('booth_sizes')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<BoothSize>(data);
}

export async function deleteBoothSize(id: string): Promise<void> {
  const { error } = await supabase
    .from('booth_sizes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// SWAG ITEMS
// ============================================================================

export async function getSwagItems(orgId: string, includeInactive = false): Promise<SwagItem[]> {
  let query = supabase
    .from('swag_items')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
  
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return fromDb<SwagItem[]>(data || []);
}

export async function createSwagItem(orgId: string, item: Partial<SwagItem>): Promise<SwagItem> {
  const { data, error } = await supabase
    .from('swag_items')
    .insert({ ...toDb(item), organization_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<SwagItem>(data);
}

export async function updateSwagItem(id: string, updates: Partial<SwagItem>): Promise<SwagItem> {
  const { data, error } = await supabase
    .from('swag_items')
    .update({ ...toDb(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return fromDb<SwagItem>(data);
}

export async function deleteSwagItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('swag_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// TRADESHOW TEAM MEMBERS (Junction)
// ============================================================================

export async function getTradeshowTeamMembers(tradeshowId: number): Promise<TradeshowTeamMember[]> {
  const { data, error } = await supabase
    .from('tradeshow_team_members')
    .select(`
      *,
      team_member:team_members(*)
    `)
    .eq('tradeshow_id', tradeshowId);
  
  if (error) throw error;
  return fromDb<TradeshowTeamMember[]>(data || []);
}

export async function addTeamMemberToShow(
  tradeshowId: number,
  teamMemberId: string,
  role: TeamMemberRole = 'support',
  notes?: string
): Promise<TradeshowTeamMember> {
  const { data, error } = await supabase
    .from('tradeshow_team_members')
    .insert({
      tradeshow_id: tradeshowId,
      team_member_id: teamMemberId,
      role,
      notes,
    })
    .select(`
      *,
      team_member:team_members(*)
    `)
    .single();
  
  if (error) throw error;
  return fromDb<TradeshowTeamMember>(data);
}

export async function updateTradeshowTeamMember(
  id: string,
  updates: { role?: TeamMemberRole; notes?: string }
): Promise<TradeshowTeamMember> {
  const { data, error } = await supabase
    .from('tradeshow_team_members')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      team_member:team_members(*)
    `)
    .single();
  
  if (error) throw error;
  return fromDb<TradeshowTeamMember>(data);
}

export async function removeTeamMemberFromShow(id: string): Promise<void> {
  const { error } = await supabase
    .from('tradeshow_team_members')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// TRADESHOW SWAG (Junction)
// ============================================================================

export async function getTradeshowSwag(tradeshowId: number): Promise<TradeshowSwag[]> {
  const { data, error } = await supabase
    .from('tradeshow_swag')
    .select(`
      *,
      swag_item:swag_items(*)
    `)
    .eq('tradeshow_id', tradeshowId);
  
  if (error) throw error;
  return fromDb<TradeshowSwag[]>(data || []);
}

export async function addSwagToShow(
  tradeshowId: number,
  swagItemId: string,
  quantityAllocated: number,
  notes?: string
): Promise<TradeshowSwag> {
  const { data, error } = await supabase
    .from('tradeshow_swag')
    .insert({
      tradeshow_id: tradeshowId,
      swag_item_id: swagItemId,
      quantity_allocated: quantityAllocated,
      notes,
    })
    .select(`
      *,
      swag_item:swag_items(*)
    `)
    .single();
  
  if (error) throw error;
  return fromDb<TradeshowSwag>(data);
}

export async function updateTradeshowSwag(
  id: string,
  updates: { quantityAllocated?: number; quantityDistributed?: number; notes?: string }
): Promise<TradeshowSwag> {
  const { data, error } = await supabase
    .from('tradeshow_swag')
    .update(toDb(updates))
    .eq('id', id)
    .select(`
      *,
      swag_item:swag_items(*)
    `)
    .single();
  
  if (error) throw error;
  return fromDb<TradeshowSwag>(data);
}

export async function removeSwagFromShow(id: string): Promise<void> {
  const { error } = await supabase
    .from('tradeshow_swag')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// BULK SEED HELPERS
// ============================================================================

import {
  COMMON_CARRIERS,
  COMMON_LEAD_SYSTEMS,
  COMMON_VIRTUAL_PLATFORMS,
  COMMON_DECORATORS,
  STANDARD_BOOTH_SIZES,
} from '@/types/lookups';

export async function seedCommonCarriers(orgId: string): Promise<number> {
  let created = 0;
  for (const carrier of COMMON_CARRIERS) {
    try {
      await createShippingCarrier(orgId, {
        name: carrier.name,
        carrierType: carrier.type,
        website: carrier.website,
      });
      created++;
    } catch {
      // Ignore duplicates
    }
  }
  return created;
}

export async function seedCommonLeadSystems(orgId: string): Promise<number> {
  let created = 0;
  for (const system of COMMON_LEAD_SYSTEMS) {
    try {
      await createLeadCaptureSystem(orgId, {
        name: system.name,
        website: system.website,
      });
      created++;
    } catch {
      // Ignore duplicates
    }
  }
  return created;
}

export async function seedCommonVirtualPlatforms(orgId: string): Promise<number> {
  let created = 0;
  for (const platform of COMMON_VIRTUAL_PLATFORMS) {
    try {
      await createVirtualPlatform(orgId, {
        name: platform.name,
        website: platform.website,
      });
      created++;
    } catch {
      // Ignore duplicates
    }
  }
  return created;
}

export async function seedCommonDecorators(orgId: string): Promise<number> {
  let created = 0;
  for (const decorator of COMMON_DECORATORS) {
    try {
      await createManagementCompany(orgId, {
        name: decorator.name,
        companyType: decorator.type,
        website: decorator.website,
      });
      created++;
    } catch {
      // Ignore duplicates
    }
  }
  return created;
}

export async function seedStandardBoothSizes(orgId: string): Promise<number> {
  let created = 0;
  for (const size of STANDARD_BOOTH_SIZES) {
    try {
      await createBoothSize(orgId, {
        name: size.name,
        widthFt: size.width,
        depthFt: size.depth,
        sqFootage: size.width * size.depth,
        boothType: size.type,
      });
      created++;
    } catch {
      // Ignore duplicates
    }
  }
  return created;
}

export async function seedAllCommonData(orgId: string): Promise<{
  carriers: number;
  leadSystems: number;
  virtualPlatforms: number;
  decorators: number;
  boothSizes: number;
}> {
  const [carriers, leadSystems, virtualPlatforms, decorators, boothSizes] = await Promise.all([
    seedCommonCarriers(orgId),
    seedCommonLeadSystems(orgId),
    seedCommonVirtualPlatforms(orgId),
    seedCommonDecorators(orgId),
    seedStandardBoothSizes(orgId),
  ]);
  
  return { carriers, leadSystems, virtualPlatforms, decorators, boothSizes };
}
