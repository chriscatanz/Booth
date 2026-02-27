// TradeShow interface - mirrors TradeShow.swift (51+ fields)
export interface TradeShow {
  id: number;

  // Basic Information
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  boothNumber: string | null;
  boothSizeId: string | null;        // FK to booth_sizes
  boothSize: string | null;
  cost: number | null;
  attendeesIncluded: number | null;
  totalAttending: number | null;
  totalLeads: number | null;
  managementCompanyId: string | null; // FK to management_companies
  managementCompany: string | null;

  // Event Type (in-person, virtual, hybrid)
  eventType: 'in_person' | 'virtual' | 'hybrid' | null;
  virtualPlatformId: string | null;  // FK to virtual_platforms
  virtualPlatform: string | null;
  virtualPlatformUrl: string | null;
  virtualBoothUrl: string | null;

  // Registration
  registrationConfirmed: boolean | null;
  attendeeListReceived: boolean | null;

  // Shipping & Logistics (Outbound)
  shippingInfo: string | null;
  trackingNumber: string | null;
  shippingCost: number | null;
  shipToSite: boolean | null;
  shipToWarehouse: boolean | null;
  shippingCutoff: string | null;
  shippingLabelPath: string | null;
  trackingStatus: string | null;
  trackingStatusDetails: string | null;
  trackingEta: string | null;
  trackingLastUpdated: string | null;
  shippingCarrierId: string | null;  // FK to shipping_carriers
  
  // Return Shipping
  returnCarrierId: string | null;    // FK to shipping_carriers
  returnTrackingNumber: string | null;
  returnShippingCost: number | null;
  returnShipDate: string | null;
  returnDeliveryDate: string | null;

  // Move-in/Move-out
  moveInDate: string | null;
  moveInTime: string | null;
  moveOutDate: string | null;
  moveOutTime: string | null;

  // Lead Capture
  leadCaptureSystemId: string | null; // FK to lead_capture_systems
  leadCaptureSystem: string | null;
  leadCaptureCredentials: string | null;
  leadCaptureAppUrl: string | null;
  leadCaptureNotRequired: boolean | null; // When true, no lead capture system needed — skips Lead Capture in setup checklist

  // Booth Equipment
  boothToShip: string | null;       // JSON array string
  graphicsToShip: string | null;    // JSON array string

  // Services
  utilitiesBooked: boolean | null;
  utilitiesDetails: string | null;
  laborBooked: boolean | null;
  laborNotRequired: boolean | null;  // When true, no I&D needed — skips Labor in setup checklist
  laborCompanyId: string | null;     // FK to labor_companies
  laborDetails: string | null;
  electricalCost: number | null;
  laborCost: number | null;
  internetCost: number | null;
  standardServicesCost: number | null;

  // Speaking & Sponsorship
  hasSpeakingEngagement: boolean | null;
  speakingDetails: string | null;
  sponsorshipDetails: string | null;

  // Hotel
  hotelId: string | null;            // FK to hotels
  hotelName: string | null;
  hotelAddress: string | null;
  hotelConfirmed: boolean | null;
  hotelCostPerNight: number | null;
  hotelConfirmationNumber: string | null;
  hotelConfirmationPath: string | null;

  // Event Information & Agenda
  showAgendaUrl: string | null;
  showAgendaPdfPath: string | null;
  agendaContent: string | null;
  eventPortalUrl: string | null;
  hasEventApp: boolean | null;
  eventAppNotes: string | null;

  // Show Contact
  showContactName: string | null;
  showContactEmail: string | null;
  showContactPhone: string | null;
  
  // Show Website
  showWebsite: string | null;

  // Venue Location (may differ from hotel)
  venueId: string | null;            // FK to venues
  venueName: string | null;
  venueAddress: string | null;

  // Packing List
  packingListItems: string | null;  // JSON array string
  swagItemsEnabled: boolean | null;
  swagItemsDescription: string | null;
  giveawayItemEnabled: boolean | null;
  giveawayItemDescription: string | null;
  powerStripCount: number | null;
  tableclothType: string | null;
  packingListMisc: string | null;

  // Documents & Notes
  vendorPacketPath: string | null;
  generalNotes: string | null;

  // Show Status Workflow
  showStatus: string | null;

  // Post-Show ROI Analysis
  qualifiedLeads: number | null;
  meetingsBooked: number | null;
  dealsWon: number | null;
  revenueAttributed: number | null;
  postShowNotes: string | null;

  // Template
  isTemplate: boolean | null;

  // Multi-tenant (SaaS)
  organizationId: string | null;
  createdBy: string | null;

  // Timestamps
  createdAt: string | null;
  updatedAt: string | null;
}

// Attendee interface - mirrors Attendee.swift
export interface Attendee {
  dbId: number | null;
  tradeshowId: number | null;
  name: string | null;
  email: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  flightCost: number | null;
  flightConfirmation: string | null;
  localId: string; // UUID for local tracking
}

// AdditionalFile interface - mirrors AdditionalFile.swift
export interface AdditionalFile {
  dbId: number | null;
  tradeshowId: number;
  fileName: string;
  filePath: string;
  fileType: string | null;
  uploadedAt: string | null;
  localId: string;
  visibility: 'all' | 'editors' | 'admins'; // Who can view this document
}

export type DocumentVisibility = 'all' | 'editors' | 'admins';

// New TradeShow defaults (mirrors createNewShow in ViewModel)
export function createNewTradeShow(): TradeShow {
  return {
    id: 0,
    name: '',
    location: null,
    startDate: null,
    endDate: null,
    eventType: 'in_person',
    virtualPlatformId: null,
    virtualPlatform: null,
    virtualPlatformUrl: null,
    virtualBoothUrl: null,
    boothNumber: null,
    boothSizeId: null,
    boothSize: null,
    cost: null,
    attendeesIncluded: 0,
    totalAttending: 0,
    totalLeads: null,
    managementCompanyId: null,
    managementCompany: null,
    registrationConfirmed: false,
    attendeeListReceived: false,
    shippingInfo: null,
    trackingNumber: null,
    shippingCost: null,
    shipToSite: false,
    shipToWarehouse: false,
    shippingCutoff: null,
    shippingLabelPath: null,
    trackingStatus: null,
    trackingStatusDetails: null,
    trackingEta: null,
    trackingLastUpdated: null,
    shippingCarrierId: null,
    returnCarrierId: null,
    returnTrackingNumber: null,
    returnShippingCost: null,
    returnShipDate: null,
    returnDeliveryDate: null,
    moveInDate: null,
    moveInTime: null,
    moveOutDate: null,
    moveOutTime: null,
    leadCaptureSystemId: null,
    leadCaptureSystem: null,
    leadCaptureCredentials: null,
    leadCaptureAppUrl: null,
    leadCaptureNotRequired: false,
    boothToShip: '[]',
    graphicsToShip: '[]',
    utilitiesBooked: false,
    utilitiesDetails: null,
    laborBooked: false,
    laborNotRequired: false,
    laborCompanyId: null,
    laborDetails: null,
    electricalCost: null,
    laborCost: null,
    internetCost: null,
    standardServicesCost: null,
    hasSpeakingEngagement: false,
    speakingDetails: null,
    sponsorshipDetails: null,
    hotelId: null,
    hotelName: null,
    hotelAddress: null,
    hotelConfirmed: false,
    hotelCostPerNight: null,
    hotelConfirmationNumber: null,
    hotelConfirmationPath: null,
    showAgendaUrl: null,
    showAgendaPdfPath: null,
    agendaContent: null,
    eventPortalUrl: null,
    hasEventApp: false,
    eventAppNotes: null,
    showContactName: null,
    showContactEmail: null,
    showContactPhone: null,
    showWebsite: null,
    venueId: null,
    venueName: null,
    venueAddress: null,
    packingListItems: '[]',
    swagItemsEnabled: false,
    swagItemsDescription: null,
    giveawayItemEnabled: false,
    giveawayItemDescription: null,
    powerStripCount: null,
    tableclothType: null,
    packingListMisc: null,
    vendorPacketPath: null,
    generalNotes: null,
    showStatus: 'Planning',
    qualifiedLeads: null,
    meetingsBooked: null,
    dealsWon: null,
    revenueAttributed: null,
    postShowNotes: null,
    isTemplate: false,
    organizationId: null,
    createdBy: null,
    createdAt: null,
    updatedAt: null,
  };
}

// Activity log entry for notes timeline
export interface ActivityEntry {
  id: number | null;
  tradeshowId: number;
  activityType: 'note' | 'status_change' | 'file_upload' | 'update' | 'created';
  description: string;
  metadata: string | null; // JSON for additional data
  createdAt: string | null;
  localId: string;
}

export function createNewActivityEntry(tradeshowId: number, type: ActivityEntry['activityType'], description: string): ActivityEntry {
  return {
    id: null,
    tradeshowId,
    activityType: type,
    description,
    metadata: null,
    createdAt: new Date().toISOString(),
    localId: crypto.randomUUID(),
  };
}

export function createNewAttendee(tradeshowId?: number): Attendee {
  return {
    dbId: null,
    tradeshowId: tradeshowId ?? null,
    name: null,
    email: null,
    arrivalDate: null,
    departureDate: null,
    flightCost: null,
    flightConfirmation: null,
    localId: crypto.randomUUID(),
  };
}

// Re-export lookup types
export * from './lookups';

// Re-export badge types
export * from './badges';
