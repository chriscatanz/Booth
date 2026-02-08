// TradeShow interface - mirrors TradeShow.swift (51+ fields)
export interface TradeShow {
  id: number;

  // Basic Information
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  boothNumber: string | null;
  boothSize: string | null;
  cost: number | null;
  attendeesIncluded: number | null;
  totalAttending: number | null;
  totalLeads: number | null;
  managementCompany: string | null;

  // Registration
  registrationConfirmed: boolean | null;
  attendeeListReceived: boolean | null;

  // Shipping & Logistics
  shippingInfo: string | null;
  trackingNumber: string | null;
  shippingCost: number | null;
  shipToSite: boolean | null;
  shipToWarehouse: boolean | null;
  shippingCutoff: string | null;
  shippingLabelPath: string | null;

  // Booth Equipment
  boothToShip: string | null;       // JSON array string
  graphicsToShip: string | null;    // JSON array string

  // Services
  utilitiesBooked: boolean | null;
  utilitiesDetails: string | null;
  laborBooked: boolean | null;
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
  hotelName: string | null;
  hotelAddress: string | null;
  hotelConfirmed: boolean | null;
  hotelCostPerNight: number | null;
  hotelConfirmationNumber: string | null;
  hotelConfirmationPath: string | null;

  // Event Information
  showAgendaUrl: string | null;
  showAgendaPdfPath: string | null;
  eventPortalUrl: string | null;
  hasEventApp: boolean | null;
  eventAppNotes: string | null;

  // Show Contact
  showContactName: string | null;
  showContactEmail: string | null;

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
}

// New TradeShow defaults (mirrors createNewShow in ViewModel)
export function createNewTradeShow(): TradeShow {
  return {
    id: 0,
    name: '',
    location: null,
    startDate: null,
    endDate: null,
    boothNumber: null,
    boothSize: null,
    cost: null,
    attendeesIncluded: 0,
    totalAttending: 0,
    totalLeads: null,
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
    boothToShip: '[]',
    graphicsToShip: '[]',
    utilitiesBooked: false,
    utilitiesDetails: null,
    laborBooked: false,
    laborDetails: null,
    electricalCost: null,
    laborCost: null,
    internetCost: null,
    standardServicesCost: null,
    hasSpeakingEngagement: false,
    speakingDetails: null,
    sponsorshipDetails: null,
    hotelName: null,
    hotelAddress: null,
    hotelConfirmed: false,
    hotelCostPerNight: null,
    hotelConfirmationNumber: null,
    hotelConfirmationPath: null,
    showAgendaUrl: null,
    showAgendaPdfPath: null,
    eventPortalUrl: null,
    hasEventApp: false,
    eventAppNotes: null,
    showContactName: null,
    showContactEmail: null,
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
