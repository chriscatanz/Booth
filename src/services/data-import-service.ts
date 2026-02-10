/**
 * Data Import Service
 * 
 * Parses CSV files and maps columns to TradeShow/Attendee fields.
 * Supports flexible header matching and embedded attendee data.
 */

import { TradeShow, Attendee } from '@/types';

// Column name aliases for flexible matching
const SHOW_FIELD_ALIASES: Record<string, keyof TradeShow> = {
  // Basic Info
  'name': 'name',
  'show name': 'name',
  'trade show': 'name',
  'event': 'name',
  'event name': 'name',
  'location': 'location',
  'city': 'location',
  'venue': 'location',
  'start date': 'startDate',
  'start': 'startDate',
  'startdate': 'startDate',
  'begin date': 'startDate',
  'end date': 'endDate',
  'end': 'endDate',
  'enddate': 'endDate',
  'booth number': 'boothNumber',
  'booth #': 'boothNumber',
  'booth': 'boothNumber',
  'boothnumber': 'boothNumber',
  'booth size': 'boothSize',
  'boothsize': 'boothSize',
  'cost': 'cost',
  'booth cost': 'cost',
  'registration cost': 'cost',
  'price': 'cost',
  
  // Status
  'status': 'showStatus',
  'show status': 'showStatus',
  'showstatus': 'showStatus',
  
  // Registration
  'registration confirmed': 'registrationConfirmed',
  'registered': 'registrationConfirmed',
  'registration': 'registrationConfirmed',
  
  // Shipping
  'shipping cost': 'shippingCost',
  'shippingcost': 'shippingCost',
  'shipping cutoff': 'shippingCutoff',
  'ship by': 'shippingCutoff',
  'shipping deadline': 'shippingCutoff',
  'tracking number': 'trackingNumber',
  'tracking': 'trackingNumber',
  'tracking #': 'trackingNumber',
  'management company': 'managementCompany',
  'managementcompany': 'managementCompany',
  'show management': 'managementCompany',
  
  // Hotel
  'hotel': 'hotelName',
  'hotel name': 'hotelName',
  'hotelname': 'hotelName',
  'hotel confirmed': 'hotelConfirmed',
  'hotelconfirmed': 'hotelConfirmed',
  'hotel cost': 'hotelCostPerNight',
  'hotel cost/night': 'hotelCostPerNight',
  'hotel rate': 'hotelCostPerNight',
  'nightly rate': 'hotelCostPerNight',
  
  // Costs
  'electrical cost': 'electricalCost',
  'electrical': 'electricalCost',
  'labor cost': 'laborCost',
  'labor': 'laborCost',
  'internet cost': 'internetCost',
  'internet': 'internetCost',
  'wifi cost': 'internetCost',
  'services cost': 'standardServicesCost',
  'standard services': 'standardServicesCost',
  
  // Contact
  'contact name': 'showContactName',
  'contact': 'showContactName',
  'show contact': 'showContactName',
  'contact email': 'showContactEmail',
  'show contact email': 'showContactEmail',
  
  // Post-Show
  'total leads': 'totalLeads',
  'leads': 'totalLeads',
  'totalleads': 'totalLeads',
  'total attending': 'totalAttending',
  'attendees': 'totalAttending',
  'attendance': 'totalAttending',
  'qualified leads': 'qualifiedLeads',
  'qualifiedleads': 'qualifiedLeads',
  'meetings booked': 'meetingsBooked',
  'meetings': 'meetingsBooked',
  'meetingsbooked': 'meetingsBooked',
  'deals won': 'dealsWon',
  'deals': 'dealsWon',
  'dealswon': 'dealsWon',
  'revenue attributed': 'revenueAttributed',
  'revenue': 'revenueAttributed',
  'revenueattributed': 'revenueAttributed',
  
  // Notes
  'notes': 'generalNotes',
  'general notes': 'generalNotes',
  'generalnotes': 'generalNotes',
  'comments': 'generalNotes',
  
  // Event Type
  'event type': 'eventType',
  'eventtype': 'eventType',
  'type': 'eventType',
};

// Attendee field aliases
const ATTENDEE_FIELD_ALIASES: Record<string, keyof Attendee> = {
  'attendee name': 'name',
  'attendee': 'name',
  'staff name': 'name',
  'staff': 'name',
  'rep name': 'name',
  'representative': 'name',
  'attendee email': 'email',
  'staff email': 'email',
  'rep email': 'email',
  'arrival date': 'arrivalDate',
  'arrival': 'arrivalDate',
  'check in': 'arrivalDate',
  'checkin': 'arrivalDate',
  'departure date': 'departureDate',
  'departure': 'departureDate',
  'check out': 'departureDate',
  'checkout': 'departureDate',
  'flight cost': 'flightCost',
  'airfare': 'flightCost',
  'flight confirmation': 'flightConfirmation',
  'flight confirm': 'flightConfirmation',
  'confirmation #': 'flightConfirmation',
};

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export interface ColumnMapping {
  csvColumn: string;
  targetField: string | null;
  fieldType: 'show' | 'attendee' | 'skip';
}

export interface ImportPreview {
  shows: Partial<TradeShow>[];
  attendees: { showIndex: number; attendee: Partial<Attendee> }[];
  warnings: string[];
  errors: string[];
}

export interface ImportResult {
  showsImported: number;
  attendeesImported: number;
  errors: string[];
}

/**
 * Parse CSV content into headers and rows
 */
export function parseCSV(content: string): ParsedCSV {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse CSV properly handling quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);

  return { headers, rows };
}

/**
 * Auto-detect column mappings based on header names
 */
export function autoDetectMappings(headers: string[]): ColumnMapping[] {
  return headers.map(header => {
    const normalized = header.toLowerCase().trim();
    
    // Check show field aliases
    if (SHOW_FIELD_ALIASES[normalized]) {
      return {
        csvColumn: header,
        targetField: SHOW_FIELD_ALIASES[normalized],
        fieldType: 'show' as const,
      };
    }
    
    // Check attendee field aliases
    if (ATTENDEE_FIELD_ALIASES[normalized]) {
      return {
        csvColumn: header,
        targetField: ATTENDEE_FIELD_ALIASES[normalized],
        fieldType: 'attendee' as const,
      };
    }
    
    // Try partial matching for show fields
    for (const [alias, field] of Object.entries(SHOW_FIELD_ALIASES)) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return {
          csvColumn: header,
          targetField: field,
          fieldType: 'show' as const,
        };
      }
    }
    
    // Skip unknown columns
    return {
      csvColumn: header,
      targetField: null,
      fieldType: 'skip' as const,
    };
  });
}

/**
 * Parse value based on expected type
 */
function parseValue(value: string, field: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return null;
  
  // Boolean fields
  const boolFields = ['registrationConfirmed', 'hotelConfirmed', 'utilitiesBooked', 'laborBooked', 
                      'shipToSite', 'shipToWarehouse', 'hasSpeakingEngagement', 'hasEventApp',
                      'swagItemsEnabled', 'giveawayItemEnabled', 'isTemplate', 'attendeeListReceived'];
  if (boolFields.includes(field)) {
    const lower = trimmed.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y';
  }
  
  // Numeric fields
  const numericFields = ['cost', 'shippingCost', 'electricalCost', 'laborCost', 'internetCost',
                         'standardServicesCost', 'hotelCostPerNight', 'totalLeads', 'totalAttending',
                         'qualifiedLeads', 'meetingsBooked', 'dealsWon', 'revenueAttributed',
                         'attendeesIncluded', 'powerStripCount', 'flightCost'];
  if (numericFields.includes(field)) {
    // Remove currency symbols and commas
    const cleaned = trimmed.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  // Date fields - normalize to YYYY-MM-DD
  const dateFields = ['startDate', 'endDate', 'shippingCutoff', 'arrivalDate', 'departureDate'];
  if (dateFields.includes(field)) {
    // Try parsing various date formats
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    // Return as-is if can't parse
    return trimmed;
  }
  
  // Event type normalization
  if (field === 'eventType') {
    const lower = trimmed.toLowerCase();
    if (lower.includes('virtual')) return 'virtual';
    if (lower.includes('hybrid')) return 'hybrid';
    return 'in_person';
  }
  
  return trimmed;
}

/**
 * Generate import preview from parsed CSV and mappings
 */
export function generatePreview(
  parsed: ParsedCSV,
  mappings: ColumnMapping[]
): ImportPreview {
  const shows: Partial<TradeShow>[] = [];
  const attendees: { showIndex: number; attendee: Partial<Attendee> }[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Get field indices
  const showFieldIndices: { index: number; field: string }[] = [];
  const attendeeFieldIndices: { index: number; field: string }[] = [];
  
  mappings.forEach((mapping, index) => {
    if (mapping.fieldType === 'show' && mapping.targetField) {
      showFieldIndices.push({ index, field: mapping.targetField });
    } else if (mapping.fieldType === 'attendee' && mapping.targetField) {
      attendeeFieldIndices.push({ index, field: mapping.targetField });
    }
  });
  
  // Check if we have required fields
  const hasName = showFieldIndices.some(f => f.field === 'name');
  if (!hasName) {
    errors.push('No "Name" column mapped. A show name is required.');
    return { shows, attendees, warnings, errors };
  }
  
  // Process each row
  parsed.rows.forEach((row, rowIndex) => {
    const show: Partial<TradeShow> = {};
    const attendee: Partial<Attendee> = {};
    
    // Extract show fields
    showFieldIndices.forEach(({ index, field }) => {
      if (row[index]) {
        (show as Record<string, unknown>)[field] = parseValue(row[index], field);
      }
    });
    
    // Extract attendee fields
    attendeeFieldIndices.forEach(({ index, field }) => {
      if (row[index]) {
        (attendee as Record<string, unknown>)[field] = parseValue(row[index], field);
      }
    });
    
    // Validate show has a name
    if (!show.name) {
      warnings.push(`Row ${rowIndex + 2}: Skipped - no show name`);
      return;
    }
    
    // Check for duplicate shows (same name)
    const existingIndex = shows.findIndex(s => s.name === show.name);
    if (existingIndex >= 0) {
      // Same show, might have additional attendee
      if (attendee.name || attendee.email) {
        attendees.push({ showIndex: existingIndex, attendee });
      }
    } else {
      // New show
      shows.push(show);
      const showIndex = shows.length - 1;
      
      // Add attendee if present
      if (attendee.name || attendee.email) {
        attendees.push({ showIndex, attendee });
      }
    }
  });
  
  if (shows.length === 0) {
    errors.push('No valid shows found in CSV');
  }
  
  if (attendeeFieldIndices.length > 0 && attendees.length === 0) {
    warnings.push('Attendee columns detected but no attendee data found');
  }
  
  return { shows, attendees, warnings, errors };
}

/**
 * Available show fields for manual mapping
 */
export const MAPPABLE_SHOW_FIELDS = [
  { value: 'name', label: 'Show Name *' },
  { value: 'location', label: 'Location' },
  { value: 'startDate', label: 'Start Date' },
  { value: 'endDate', label: 'End Date' },
  { value: 'boothNumber', label: 'Booth Number' },
  { value: 'boothSize', label: 'Booth Size' },
  { value: 'cost', label: 'Booth Cost' },
  { value: 'showStatus', label: 'Status' },
  { value: 'registrationConfirmed', label: 'Registration Confirmed' },
  { value: 'shippingCost', label: 'Shipping Cost' },
  { value: 'shippingCutoff', label: 'Shipping Cutoff' },
  { value: 'trackingNumber', label: 'Tracking Number' },
  { value: 'managementCompany', label: 'Management Company' },
  { value: 'hotelName', label: 'Hotel Name' },
  { value: 'hotelConfirmed', label: 'Hotel Confirmed' },
  { value: 'hotelCostPerNight', label: 'Hotel Cost/Night' },
  { value: 'electricalCost', label: 'Electrical Cost' },
  { value: 'laborCost', label: 'Labor Cost' },
  { value: 'internetCost', label: 'Internet Cost' },
  { value: 'standardServicesCost', label: 'Services Cost' },
  { value: 'showContactName', label: 'Contact Name' },
  { value: 'showContactEmail', label: 'Contact Email' },
  { value: 'totalLeads', label: 'Total Leads' },
  { value: 'totalAttending', label: 'Total Attending' },
  { value: 'qualifiedLeads', label: 'Qualified Leads' },
  { value: 'meetingsBooked', label: 'Meetings Booked' },
  { value: 'dealsWon', label: 'Deals Won' },
  { value: 'revenueAttributed', label: 'Revenue Attributed' },
  { value: 'generalNotes', label: 'Notes' },
  { value: 'eventType', label: 'Event Type' },
];

/**
 * Available attendee fields for manual mapping
 */
export const MAPPABLE_ATTENDEE_FIELDS = [
  { value: 'name', label: 'Attendee Name' },
  { value: 'email', label: 'Attendee Email' },
  { value: 'arrivalDate', label: 'Arrival Date' },
  { value: 'departureDate', label: 'Departure Date' },
  { value: 'flightCost', label: 'Flight Cost' },
  { value: 'flightConfirmation', label: 'Flight Confirmation' },
];
