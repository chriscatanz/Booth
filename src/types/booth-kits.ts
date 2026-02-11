// Booth Kit Management Types

// ─── Enums ───────────────────────────────────────────────────────────────────

export type KitType = 'flagship' | 'standard' | 'compact' | 'tabletop';
export type KitStatus = 'available' | 'assigned' | 'in_transit' | 'at_show' | 'maintenance';
export type AssignmentStatus = 'planned' | 'confirmed' | 'shipped' | 'at_venue' | 'returned' | 'cancelled';

export const KIT_TYPE_LABELS: Record<KitType, string> = {
  flagship: 'Flagship (10ft+)',
  standard: 'Standard (6-8ft)',
  compact: 'Compact (Pull-ups)',
  tabletop: 'Tabletop',
};

export const KIT_STATUS_LABELS: Record<KitStatus, string> = {
  available: 'Available',
  assigned: 'Assigned',
  in_transit: 'In Transit',
  at_show: 'At Show',
  maintenance: 'Maintenance',
};

export const KIT_STATUS_COLORS: Record<KitStatus, string> = {
  available: '#1A7F37',    // Green
  assigned: '#0969DA',     // Blue
  in_transit: '#BF8700',   // Amber
  at_show: '#8250DF',      // Purple
  maintenance: '#CF222E',  // Red
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  planned: 'Planned',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  at_venue: 'At Venue',
  returned: 'Returned',
  cancelled: 'Cancelled',
};

export const ASSIGNMENT_STATUS_COLORS: Record<AssignmentStatus, string> = {
  planned: '#656D76',      // Gray
  confirmed: '#0969DA',    // Blue
  shipped: '#BF8700',      // Amber
  at_venue: '#8250DF',     // Purple
  returned: '#1A7F37',     // Green
  cancelled: '#CF222E',    // Red
};

// ─── Booth Kit ───────────────────────────────────────────────────────────────

export interface KitContentItem {
  item: string;
  qty: number;
  notes?: string;
}

export interface BoothKit {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  kitType: KitType;
  description: string | null;
  contents: KitContentItem[];
  dimensions: string | null;
  weightLbs: number | null;
  status: KitStatus;
  currentLocation: string | null;
  homeLocation: string;
  defaultShipDays: number;
  defaultReturnDays: number;
  replacementValue: number | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKitInput {
  name: string;
  code?: string;
  kitType?: KitType;
  description?: string;
  contents?: KitContentItem[];
  dimensions?: string;
  weightLbs?: number;
  homeLocation?: string;
  defaultShipDays?: number;
  defaultReturnDays?: number;
  replacementValue?: number;
  notes?: string;
}

export interface UpdateKitInput {
  name?: string;
  code?: string;
  kitType?: KitType;
  description?: string;
  contents?: KitContentItem[];
  dimensions?: string;
  weightLbs?: number;
  status?: KitStatus;
  currentLocation?: string;
  homeLocation?: string;
  defaultShipDays?: number;
  defaultReturnDays?: number;
  replacementValue?: number;
  notes?: string;
}

// ─── Kit Assignment ──────────────────────────────────────────────────────────

export interface KitAssignment {
  id: string;
  organizationId: string;
  kitId: string;
  tradeshowId: number;
  status: AssignmentStatus;
  assignedBy: string | null;
  assignedAt: string;
  shipDate: string | null;
  arrivalDate: string | null;
  returnShipDate: string | null;
  returnArrivalDate: string | null;
  outboundTracking: string | null;
  outboundCarrier: string | null;
  returnTracking: string | null;
  returnCarrier: string | null;
  aiRecommended: boolean;
  aiRecommendationReason: string | null;
  aiConfidence: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  kit?: Pick<BoothKit, 'id' | 'name' | 'code' | 'kitType' | 'status'>;
  tradeshow?: {
    id: number;
    name: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
  };
}

export interface CreateAssignmentInput {
  kitId: string;
  tradeshowId: number;
  shipDate?: string;
  arrivalDate?: string;
  returnShipDate?: string;
  returnArrivalDate?: string;
  notes?: string;
  // AI fields (set by auto-assign)
  aiRecommended?: boolean;
  aiRecommendationReason?: string;
  aiConfidence?: number;
}

export interface UpdateAssignmentInput {
  status?: AssignmentStatus;
  shipDate?: string;
  arrivalDate?: string;
  returnShipDate?: string;
  returnArrivalDate?: string;
  outboundTracking?: string;
  outboundCarrier?: string;
  returnTracking?: string;
  returnCarrier?: string;
  notes?: string;
}

// ─── Kit Availability ────────────────────────────────────────────────────────

export interface KitAvailability {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  kitType: KitType;
  status: KitStatus;
  currentLocation: string | null;
  defaultShipDays: number;
  defaultReturnDays: number;
  nextAssignmentShowId: number | null;
  nextAssignmentShowName: string | null;
  nextAssignmentDate: string | null;
  availableFrom: string;
}

// ─── AI Auto-Assignment ──────────────────────────────────────────────────────

export interface AutoAssignRequest {
  tradeshowIds?: number[];         // Specific shows to assign, or all unassigned
  preferredKitTypes?: KitType[];   // Prefer certain kit types
  bufferDays?: number;             // Override default buffer
  allowConflicts?: boolean;        // Allow AI to suggest reassignments
}

export interface AutoAssignSuggestion {
  tradeshowId: number;
  tradeshowName: string;
  startDate: string;
  endDate: string;
  suggestedKitId: string;
  suggestedKitName: string;
  suggestedKitType: KitType;
  confidence: number;
  reason: string;
  conflicts: KitConflict[];
  alternativeKits: {
    kitId: string;
    kitName: string;
    reason: string;
  }[];
}

export interface KitConflict {
  assignmentId: string;
  tradeshowId: number;
  tradeshowName: string;
  startDate: string;
  endDate: string;
  shipDate: string | null;
  returnArrivalDate: string | null;
  overlapDays: number;
}

export interface AutoAssignResult {
  suggestions: AutoAssignSuggestion[];
  unassignable: {
    tradeshowId: number;
    tradeshowName: string;
    reason: string;
  }[];
  warnings: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function createNewKit(): Partial<CreateKitInput> {
  return {
    name: '',
    kitType: 'standard',
    contents: [],
    homeLocation: 'Warehouse',
    defaultShipDays: 3,
    defaultReturnDays: 5,
  };
}

export function getKitStatusBadge(status: KitStatus): { label: string; color: string } {
  return {
    label: KIT_STATUS_LABELS[status],
    color: KIT_STATUS_COLORS[status],
  };
}

export function getAssignmentStatusBadge(status: AssignmentStatus): { label: string; color: string } {
  return {
    label: ASSIGNMENT_STATUS_LABELS[status],
    color: ASSIGNMENT_STATUS_COLORS[status],
  };
}
