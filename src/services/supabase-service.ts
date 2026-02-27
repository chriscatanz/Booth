import { supabase } from '@/lib/supabase';
import { TradeShow, Attendee, AdditionalFile } from '@/types';
import { formatDateForDB } from '@/lib/date-utils';
import { parseISO, isValid } from 'date-fns';
import { useAuthStore } from '@/store/auth-store';
import { createActivity as logFeedActivity } from '@/services/activity-service';

// ─── Org Context Helper ─────────────────────────────────────────────────────

function getOrgId(): string | null {
  return useAuthStore.getState().organization?.id ?? null;
}

function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

// ─── Snake ↔ Camel mapping ──────────────────────────────────────────────────

function mapShowFromDB(row: Record<string, unknown>): TradeShow {
  return {
    id: row.id as number,
    name: row.name as string,
    location: row.location as string | null,
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    boothNumber: row.booth_number as string | null,
    boothSizeId: row.booth_size_id as string | null,
    boothSize: row.booth_size as string | null,
    cost: row.cost as number | null,
    attendeesIncluded: row.attendees_included as number | null,
    totalAttending: row.total_attending as number | null,
    totalLeads: row.total_leads as number | null,
    managementCompanyId: row.management_company_id as string | null,
    managementCompany: row.management_company as string | null,
    eventType: row.event_type as TradeShow['eventType'],
    virtualPlatformId: row.virtual_platform_id as string | null,
    virtualPlatform: row.virtual_platform as string | null,
    virtualPlatformUrl: row.virtual_platform_url as string | null,
    virtualBoothUrl: row.virtual_booth_url as string | null,
    registrationConfirmed: row.registration_confirmed as boolean | null,
    attendeeListReceived: row.attendee_list_received as boolean | null,
    shippingInfo: row.shipping_info as string | null,
    trackingNumber: row.tracking_number as string | null,
    shippingCost: row.shipping_cost as number | null,
    shipToSite: row.ship_to_site as boolean | null,
    shipToWarehouse: row.ship_to_warehouse as boolean | null,
    shippingCutoff: row.shipping_cutoff as string | null,
    shippingLabelPath: row.shipping_label_path as string | null,
    trackingStatus: row.tracking_status as string | null,
    trackingStatusDetails: row.tracking_status_details as string | null,
    trackingEta: row.tracking_eta as string | null,
    trackingLastUpdated: row.tracking_last_updated as string | null,
    shippingCarrierId: row.shipping_carrier_id as string | null,
    returnCarrierId: row.return_carrier_id as string | null,
    returnTrackingNumber: row.return_tracking_number as string | null,
    returnShippingCost: row.return_shipping_cost as number | null,
    returnShipDate: row.return_ship_date as string | null,
    returnDeliveryDate: row.return_delivery_date as string | null,
    moveInDate: row.move_in_date as string | null,
    moveInTime: row.move_in_time as string | null,
    moveOutDate: row.move_out_date as string | null,
    moveOutTime: row.move_out_time as string | null,
    leadCaptureSystemId: row.lead_capture_system_id as string | null,
    leadCaptureSystem: row.lead_capture_system as string | null,
    leadCaptureCredentials: row.lead_capture_credentials as string | null,
    leadCaptureAppUrl: (row.lead_capture_app_url as string | null) ?? null,
    leadCaptureNotRequired: row.lead_capture_not_required as boolean | null,
    boothToShip: row.booth_to_ship as string | null,
    graphicsToShip: row.graphics_to_ship as string | null,
    utilitiesBooked: row.utilities_booked as boolean | null,
    utilitiesDetails: row.utilities_details as string | null,
    laborBooked: row.labor_booked as boolean | null,
    laborNotRequired: row.labor_not_required as boolean | null,
    laborCompanyId: row.labor_company_id as string | null,
    laborDetails: row.labor_details as string | null,
    electricalCost: row.electrical_cost as number | null,
    laborCost: row.labor_cost as number | null,
    internetCost: row.internet_cost as number | null,
    standardServicesCost: row.standard_services_cost as number | null,
    hasSpeakingEngagement: row.has_speaking_engagement as boolean | null,
    speakingDetails: row.speaking_details as string | null,
    sponsorshipDetails: row.sponsorship_details as string | null,
    hotelId: row.hotel_id as string | null,
    hotelName: row.hotel_name as string | null,
    hotelAddress: row.hotel_address as string | null,
    hotelConfirmed: row.hotel_confirmed as boolean | null,
    hotelCostPerNight: row.hotel_cost_per_night as number | null,
    hotelConfirmationNumber: row.hotel_confirmation_number as string | null,
    hotelConfirmationPath: row.hotel_confirmation_path as string | null,
    showAgendaUrl: row.show_agenda_url as string | null,
    showAgendaPdfPath: row.show_agenda_pdf_path as string | null,
    agendaContent: row.agenda_content as string | null,
    eventPortalUrl: row.event_portal_url as string | null,
    hasEventApp: row.has_event_app as boolean | null,
    eventAppNotes: row.event_app_notes as string | null,
    showContactName: row.show_contact_name as string | null,
    showContactEmail: row.show_contact_email as string | null,
    showContactPhone: row.show_contact_phone as string | null,
    showWebsite: row.show_website as string | null,
    venueId: row.venue_id as string | null,
    venueName: row.venue_name as string | null,
    venueAddress: row.venue_address as string | null,
    packingListItems: row.packing_list_items as string | null,
    swagItemsEnabled: row.swag_items_enabled as boolean | null,
    swagItemsDescription: row.swag_items_description as string | null,
    giveawayItemEnabled: row.giveaway_item_enabled as boolean | null,
    giveawayItemDescription: row.giveaway_item_description as string | null,
    powerStripCount: row.power_strip_count as number | null,
    tableclothType: row.tablecloth_type as string | null,
    packingListMisc: row.packing_list_misc as string | null,
    vendorPacketPath: row.vendor_packet_path as string | null,
    generalNotes: row.general_notes as string | null,
    showStatus: row.show_status as string | null,
    qualifiedLeads: row.qualified_leads as number | null,
    meetingsBooked: row.meetings_booked as number | null,
    dealsWon: row.deals_won as number | null,
    revenueAttributed: row.revenue_attributed as number | null,
    postShowNotes: row.post_show_notes as string | null,
    isTemplate: row.is_template as boolean | null,
    organizationId: row.organization_id as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string | null,
    updatedAt: row.updated_at as string | null,
  };
}

function dateToDBString(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  if (!isValid(d)) return null;
  return formatDateForDB(d);
}

function mapShowToDB(show: TradeShow, includeOrgContext: boolean = false): Record<string, unknown> {
  const base: Record<string, unknown> = {
    name: show.name,
    location: show.location,
    start_date: dateToDBString(show.startDate),
    end_date: dateToDBString(show.endDate),
    booth_number: show.boothNumber,
    booth_size_id: show.boothSizeId,
    booth_size: show.boothSize,
    cost: show.cost,
    attendees_included: show.attendeesIncluded,
    total_attending: show.totalAttending,
    total_leads: show.totalLeads,
    management_company_id: show.managementCompanyId,
    management_company: show.managementCompany,
    event_type: show.eventType,
    virtual_platform_id: show.virtualPlatformId,
    virtual_platform: show.virtualPlatform,
    virtual_platform_url: show.virtualPlatformUrl,
    virtual_booth_url: show.virtualBoothUrl,
    registration_confirmed: show.registrationConfirmed,
    attendee_list_received: show.attendeeListReceived,
    shipping_info: show.shippingInfo,
    tracking_number: show.trackingNumber,
    shipping_cost: show.shippingCost,
    ship_to_site: show.shipToSite,
    ship_to_warehouse: show.shipToWarehouse,
    shipping_cutoff: dateToDBString(show.shippingCutoff),
    shipping_label_path: show.shippingLabelPath,
    tracking_status: show.trackingStatus,
    tracking_status_details: show.trackingStatusDetails,
    tracking_eta: show.trackingEta,
    tracking_last_updated: show.trackingLastUpdated,
    shipping_carrier_id: show.shippingCarrierId,
    return_carrier_id: show.returnCarrierId,
    return_tracking_number: show.returnTrackingNumber,
    return_shipping_cost: show.returnShippingCost,
    return_ship_date: dateToDBString(show.returnShipDate),
    return_delivery_date: dateToDBString(show.returnDeliveryDate),
    move_in_date: dateToDBString(show.moveInDate),
    move_in_time: show.moveInTime,
    move_out_date: dateToDBString(show.moveOutDate),
    move_out_time: show.moveOutTime,
    lead_capture_system_id: show.leadCaptureSystemId,
    lead_capture_system: show.leadCaptureSystem,
    lead_capture_credentials: show.leadCaptureCredentials,
    lead_capture_app_url: show.leadCaptureAppUrl ?? null,
    lead_capture_not_required: show.leadCaptureNotRequired,
    booth_to_ship: show.boothToShip,
    graphics_to_ship: show.graphicsToShip,
    utilities_booked: show.utilitiesBooked,
    utilities_details: show.utilitiesDetails,
    labor_booked: show.laborBooked,
    labor_not_required: show.laborNotRequired,
    labor_company_id: show.laborCompanyId,
    labor_details: show.laborDetails,
    electrical_cost: show.electricalCost,
    labor_cost: show.laborCost,
    internet_cost: show.internetCost,
    standard_services_cost: show.standardServicesCost,
    has_speaking_engagement: show.hasSpeakingEngagement,
    speaking_details: show.speakingDetails,
    sponsorship_details: show.sponsorshipDetails,
    hotel_id: show.hotelId,
    hotel_name: show.hotelName,
    hotel_address: show.hotelAddress,
    hotel_confirmed: show.hotelConfirmed,
    hotel_cost_per_night: show.hotelCostPerNight,
    hotel_confirmation_number: show.hotelConfirmationNumber,
    hotel_confirmation_path: show.hotelConfirmationPath,
    show_agenda_url: show.showAgendaUrl,
    show_agenda_pdf_path: show.showAgendaPdfPath,
    agenda_content: show.agendaContent,
    event_portal_url: show.eventPortalUrl,
    has_event_app: show.hasEventApp,
    event_app_notes: show.eventAppNotes,
    show_contact_name: show.showContactName,
    show_contact_email: show.showContactEmail,
    show_contact_phone: show.showContactPhone,
    show_website: show.showWebsite,
    venue_id: show.venueId,
    venue_name: show.venueName,
    venue_address: show.venueAddress,
    packing_list_items: show.packingListItems,
    swag_items_enabled: show.swagItemsEnabled,
    swag_items_description: show.swagItemsDescription,
    giveaway_item_enabled: show.giveawayItemEnabled,
    giveaway_item_description: show.giveawayItemDescription,
    power_strip_count: show.powerStripCount,
    tablecloth_type: show.tableclothType,
    packing_list_misc: show.packingListMisc,
    vendor_packet_path: show.vendorPacketPath,
    general_notes: show.generalNotes,
    show_status: show.showStatus,
    qualified_leads: show.qualifiedLeads,
    meetings_booked: show.meetingsBooked,
    deals_won: show.dealsWon,
    revenue_attributed: show.revenueAttributed,
    post_show_notes: show.postShowNotes,
    is_template: show.isTemplate,
  };

  // Add org context only for inserts
  if (includeOrgContext) {
    const orgId = getOrgId();
    const userId = getUserId();
    if (orgId) base.organization_id = orgId;
    if (userId) base.created_by = userId;
  }

  return base;
}

function mapAttendeeFromDB(row: Record<string, unknown>): Attendee {
  return {
    dbId: row.id as number | null,
    tradeshowId: row.tradeshow_id as number | null,
    name: row.name as string | null,
    email: row.email as string | null,
    arrivalDate: row.arrival_date as string | null,
    departureDate: row.departure_date as string | null,
    flightCost: row.flight_cost as number | null,
    flightConfirmation: row.flight_confirmation as string | null,
    localId: crypto.randomUUID(),
  };
}

function mapAdditionalFileFromDB(row: Record<string, unknown>): AdditionalFile {
  return {
    dbId: row.id as number | null,
    tradeshowId: row.tradeshow_id as number,
    fileName: row.file_name as string,
    filePath: row.file_path as string,
    fileType: row.file_type as string | null,
    uploadedAt: row.uploaded_at as string | null,
    localId: crypto.randomUUID(),
    visibility: (row.visibility as 'all' | 'editors' | 'admins') || 'all',
  };
}

// ─── Service Methods ─────────────────────────────────────────────────────────

export async function fetchTradeShows(historical: boolean = false): Promise<TradeShow[]> {
  const today = formatDateForDB(new Date())!;
  const orgId = getOrgId();

  // Use decrypting view for reads
  let query = supabase.from('v_tradeshows').select('*');

  // Filter by organization if available (multi-tenant mode)
  // If no org, show all (backwards compatibility / single-tenant mode)
  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  // Exclude templates from normal show lists
  query = query.or('is_template.is.null,is_template.eq.false');

  if (historical) {
    query = query.lt('end_date', today).order('start_date', { ascending: false });
  } else {
    query = query.or(`end_date.gte.${today},end_date.is.null`).order('start_date', { ascending: true });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapShowFromDB);
}

export async function fetchTemplates(): Promise<TradeShow[]> {
  const orgId = getOrgId();
  
  // Use decrypting view for reads
  let query = supabase
    .from('v_tradeshows')
    .select('*')
    .eq('is_template', true);

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(mapShowFromDB);
}

export async function fetchTradeShow(id: number): Promise<TradeShow> {
  // Use decrypting view for reads
  const { data, error } = await supabase
    .from('v_tradeshows')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return mapShowFromDB(data);
}

export async function createTradeShow(show: TradeShow): Promise<TradeShow> {
  // Include org context for new records
  const dbData = mapShowToDB(show, true);
  
  // Remove undefined values (Supabase doesn't like them)
  const cleanData = Object.fromEntries(
    Object.entries(dbData).filter(([, v]) => v !== undefined)
  );
  
  console.log('[createTradeShow] Inserting:', JSON.stringify(cleanData, null, 2));
  
  // Insert without .select() to avoid getting encrypted data back
  const { data: insertedData, error: insertError } = await supabase
    .from('tradeshows')
    .insert(cleanData)
    .select('id')  // Only get the ID back
    .single();
  
  if (insertError) {
    console.error('[createTradeShow] Insert error:', insertError);
    throw new Error(`Insert failed: ${insertError.message} (code: ${insertError.code}, details: ${insertError.details})`);
  }
  
  // Fetch the full record from the decrypting view
  const { data, error } = await supabase
    .from('v_tradeshows')
    .select('*')
    .eq('id', insertedData.id)
    .single();
  
  if (error) throw new Error(error.message);
  return mapShowFromDB(data);
}

export async function updateTradeShow(show: TradeShow): Promise<void> {
  const dbData = mapShowToDB(show);
  const { error } = await supabase
    .from('tradeshows')
    .update(dbData)
    .eq('id', show.id);
  if (error) throw new Error(error.message);
}

export async function deleteTradeShow(id: number): Promise<void> {
  const { error } = await supabase
    .from('tradeshows')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchAttendees(tradeshowId: number): Promise<Attendee[]> {
  // Use decrypting view for reads
  const { data, error } = await supabase
    .from('v_attendees')
    .select('*')
    .eq('tradeshow_id', tradeshowId);
  if (error) throw new Error(error.message);
  return (data || []).map(mapAttendeeFromDB);
}

export async function fetchAllAttendees(): Promise<Attendee[]> {
  const orgId = getOrgId();
  
  // If org context available, only fetch attendees for shows in this org
  if (orgId) {
    // First get tradeshow IDs for this org
    const { data: shows, error: showsError } = await supabase
      .from('tradeshows')
      .select('id')
      .eq('organization_id', orgId);
    if (showsError) throw new Error(showsError.message);
    
    const showIds = (shows || []).map(s => s.id);
    if (showIds.length === 0) return [];
    
    // Then fetch attendees using decrypting view
    const { data, error } = await supabase
      .from('v_attendees')
      .select('*')
      .in('tradeshow_id', showIds);
    if (error) throw new Error(error.message);
    return (data || []).map(mapAttendeeFromDB);
  }
  
  // Fallback: fetch all (single-tenant mode) using decrypting view
  const { data, error } = await supabase.from('v_attendees').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(mapAttendeeFromDB);
}

export async function saveAttendees(attendees: Attendee[], tradeshowId: number): Promise<void> {
  const existing = await fetchAttendees(tradeshowId);
  const existingIds = new Set(existing.map(a => a.dbId).filter(Boolean));

  const toInsert = attendees.filter(a => !a.dbId);
  const toUpdate = attendees.filter(a => a.dbId);
  const toKeepIds = new Set(toUpdate.map(a => a.dbId));
  const toDeleteIds = [...existingIds].filter(id => !toKeepIds.has(id)) as number[];

  // Batch delete removed attendees using .in()
  if (toDeleteIds.length > 0) {
    const { error } = await supabase.from('attendees').delete().in('id', toDeleteIds);
    if (error) throw new Error(`Delete failed: ${error.message}`);
  }

  // Batch upsert existing + new attendees
  const upsertData = [
    ...toUpdate.map(att => ({
      id: att.dbId!,
      tradeshow_id: att.tradeshowId ?? tradeshowId,
      name: att.name,
      email: att.email,
      arrival_date: dateToDBString(att.arrivalDate),
      departure_date: dateToDBString(att.departureDate),
      flight_cost: att.flightCost,
      flight_confirmation: att.flightConfirmation,
    })),
    ...toInsert.map(att => ({
      tradeshow_id: att.tradeshowId ?? tradeshowId,
      name: att.name,
      email: att.email,
      arrival_date: dateToDBString(att.arrivalDate),
      departure_date: dateToDBString(att.departureDate),
      flight_cost: att.flightCost,
      flight_confirmation: att.flightConfirmation,
    })),
  ];

  if (upsertData.length > 0) {
    const { error } = await supabase
      .from('attendees')
      .upsert(upsertData, { onConflict: 'id' });
    if (error) throw new Error(`Upsert failed: ${error.message}`);
  }
}

export async function fetchAdditionalFiles(tradeshowId: number): Promise<AdditionalFile[]> {
  const { data, error } = await supabase
    .from('additional_files')
    .select('*')
    .eq('tradeshow_id', tradeshowId);
  if (error) throw new Error(error.message);
  return (data || []).map(mapAdditionalFileFromDB);
}

export async function createAdditionalFile(file: AdditionalFile): Promise<AdditionalFile> {
  const orgId = getOrgId();
  const userId = getUserId();
  
  const insertData: Record<string, unknown> = {
    tradeshow_id: file.tradeshowId,
    file_name: file.fileName,
    file_path: file.filePath,
    file_type: file.fileType,
    visibility: file.visibility || 'all',
  };
  
  // Add org/user context if available
  if (orgId) insertData.organization_id = orgId;
  if (userId) insertData.uploaded_by = userId;
  
  const { data, error } = await supabase
    .from('additional_files')
    .insert(insertData)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const result = mapAdditionalFileFromDB(data);

  // Activity log — fire and forget
  if (orgId && userId) {
    logFeedActivity(orgId, userId, 'file_uploaded', `Uploaded ${file.fileName}`, {
      showId: file.tradeshowId?.toString(),
      metadata: { fileName: file.fileName, fileType: file.fileType },
    }).catch(() => {});
  }

  return result;
}

export async function deleteAdditionalFile(id: number): Promise<void> {
  const { error } = await supabase
    .from('additional_files')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadFile(fileData: File): Promise<string> {
  // Server-side validation first
  const validation = await validateFileUpload(fileData, 'document');
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const uniqueName = `${timestamp}-${fileData.name}`;
  const { error } = await supabase.storage
    .from('uploads')
    .upload(uniqueName, fileData);
  if (error) throw new Error(error.message);
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(uniqueName);
  return urlData.publicUrl;
}

/**
 * Validate a file server-side before uploading
 */
async function validateFileUpload(
  file: File, 
  context: 'logo' | 'document' | 'image'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', context);

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch('/api/upload/validate', {
      method: 'POST',
      body: formData,
      headers,
    });

    if (response.status === 413) {
      return { valid: false, error: 'File is too large to process. Please use a smaller file.' };
    }

    const contentType = response.headers.get('content-type') ?? '';
    const result = contentType.includes('application/json') ? await response.json() : {};

    if (!response.ok) {
      return { valid: false, error: result.error || 'Validation failed' };
    }

    return { valid: true };
  } catch (error) {
    console.error('File validation error:', error);
    // If validation service is unavailable, allow upload with warning
    return { valid: true };
  }
}

export async function deleteFile(publicURL: string): Promise<void> {
  const marker = '/storage/v1/object/public/uploads/';
  const idx = publicURL.indexOf(marker);
  if (idx === -1) return;
  const objectPath = publicURL.slice(idx + marker.length);
  const { error } = await supabase.storage.from('uploads').remove([objectPath]);
  if (error) throw new Error(error.message);
}

// ─── Activity Timeline ───────────────────────────────────────────────────────

import { ActivityEntry } from '@/types';

function mapActivityFromDB(row: Record<string, unknown>): ActivityEntry {
  return {
    id: row.id as number,
    tradeshowId: row.tradeshow_id as number,
    activityType: row.activity_type as ActivityEntry['activityType'],
    description: row.description as string,
    metadata: row.metadata as string | null,
    createdAt: row.created_at as string | null,
    localId: crypto.randomUUID(),
  };
}

export async function fetchActivities(tradeshowId: number): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('tradeshow_id', tradeshowId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    // Table might not exist yet, return empty
    console.warn('Activity log fetch failed:', error.message);
    return [];
  }
  return (data || []).map(mapActivityFromDB);
}

export async function createActivity(entry: ActivityEntry): Promise<ActivityEntry | null> {
  const orgId = getOrgId();
  const userId = getUserId();
  
  try {
    const insertData: Record<string, unknown> = {
      tradeshow_id: entry.tradeshowId,
      activity_type: entry.activityType,
      description: entry.description,
      metadata: entry.metadata,
    };
    
    // Add org/user context if available
    if (orgId) insertData.organization_id = orgId;
    if (userId) insertData.user_id = userId;
    
    const { data, error } = await supabase
      .from('activity_log')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return mapActivityFromDB(data);
  } catch (err) {
    // Table might not exist yet
    console.warn('Activity log create failed:', err);
    return null;
  }
}

export async function addNote(tradeshowId: number, note: string): Promise<ActivityEntry | null> {
  return createActivity({
    id: null,
    tradeshowId,
    activityType: 'note',
    description: note,
    metadata: null,
    createdAt: null,
    localId: crypto.randomUUID(),
  });
}
