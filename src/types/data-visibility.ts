// Data Visibility Types - Role-based data point visibility

import { UserRole } from './auth';

// Data categories that can be controlled per role
export type DataCategory =
  | 'basic'        // Name, dates, location, booth info
  | 'budget'       // All cost/financial data
  | 'logistics'    // Shipping info, tracking
  | 'travel'       // Hotel, travel details
  | 'contacts'     // Show contacts
  | 'leads'        // Lead counts, ROI metrics, qualified leads
  | 'notes'        // General notes
  | 'tasks'        // Tasks associated with shows
  | 'documents'    // Attached documents/files
  | 'attendees';   // Attendee information

// Human-readable labels and descriptions for each category
export const DATA_CATEGORY_INFO: Record<DataCategory, { 
  label: string; 
  description: string;
  icon: string;
  fields: string[];
}> = {
  basic: {
    label: 'Basic Info',
    description: 'Show name, dates, location, booth details',
    icon: 'info',
    fields: ['name', 'location', 'start_date', 'end_date', 'booth_number', 'booth_size', 'show_status'],
  },
  budget: {
    label: 'Budget & Costs',
    description: 'All financial data including costs and expenses',
    icon: 'dollar-sign',
    fields: ['cost', 'shipping_cost', 'electrical_cost', 'labor_cost', 'internet_cost', 'standard_services_cost', 'hotel_cost_per_night'],
  },
  logistics: {
    label: 'Shipping & Logistics',
    description: 'Shipping info, tracking numbers, cutoff dates',
    icon: 'truck',
    fields: ['shipping_info', 'tracking_number', 'shipping_cutoff', 'ship_to_site', 'ship_to_warehouse', 'booth_to_ship', 'graphics_to_ship'],
  },
  travel: {
    label: 'Travel & Hotel',
    description: 'Hotel reservations and travel arrangements',
    icon: 'plane',
    fields: ['hotel_name', 'hotel_address', 'hotel_confirmed', 'hotel_confirmation_number'],
  },
  contacts: {
    label: 'Show Contacts',
    description: 'Event organizer contact information',
    icon: 'users',
    fields: ['show_contact_name', 'show_contact_email', 'management_company'],
  },
  leads: {
    label: 'Leads & ROI',
    description: 'Lead counts, qualified leads, revenue attribution',
    icon: 'bar-chart',
    fields: ['total_leads', 'qualified_leads', 'meetings_booked', 'deals_won', 'revenue_attributed'],
  },
  notes: {
    label: 'Notes',
    description: 'General notes and post-show notes',
    icon: 'file-text',
    fields: ['general_notes', 'post_show_notes', 'speaking_details', 'sponsorship_details'],
  },
  tasks: {
    label: 'Tasks',
    description: 'Tasks and checklist items',
    icon: 'check-square',
    fields: [],
  },
  documents: {
    label: 'Documents',
    description: 'Attached files and documents',
    icon: 'folder',
    fields: ['vendor_packet_path', 'show_agenda_pdf_path', 'hotel_confirmation_path', 'shipping_label_path'],
  },
  attendees: {
    label: 'Attendees',
    description: 'Team member assignments and attendee list',
    icon: 'user-check',
    fields: ['attendees_included', 'total_attending', 'attendee_list_received'],
  },
};

export const ALL_DATA_CATEGORIES: DataCategory[] = [
  'basic', 'budget', 'logistics', 'travel', 'contacts', 'leads', 'notes', 'tasks', 'documents', 'attendees'
];

// Permission configuration per role
export interface RoleDataPermissions {
  id?: string;
  organizationId: string;
  role: UserRole;
  visibleCategories: DataCategory[];
  createdAt?: string;
  updatedAt?: string;
}

// Default permissions for each role (used when no custom config exists)
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, DataCategory[]> = {
  owner: ALL_DATA_CATEGORIES,
  admin: ALL_DATA_CATEGORIES,
  editor: ['basic', 'logistics', 'travel', 'contacts', 'notes', 'tasks', 'documents', 'attendees'],
  viewer: ['basic', 'logistics', 'travel', 'notes'],
};

// Helper to check if a category is visible for a role
export function isCategoryVisible(
  permissions: RoleDataPermissions[] | null | undefined,
  role: UserRole | undefined,
  category: DataCategory
): boolean {
  if (!role) return false;
  
  // Owner and admin always see everything
  if (role === 'owner' || role === 'admin') return true;
  
  // If no custom permissions exist, use defaults
  if (!permissions || permissions.length === 0) {
    return DEFAULT_ROLE_PERMISSIONS[role]?.includes(category) ?? false;
  }
  
  // Find permissions for this role
  const rolePermission = permissions.find(p => p.role === role);
  if (!rolePermission) {
    return DEFAULT_ROLE_PERMISSIONS[role]?.includes(category) ?? false;
  }
  
  return rolePermission.visibleCategories.includes(category);
}

// Helper to check if a field is visible
export function isFieldVisible(
  permissions: RoleDataPermissions[] | null | undefined,
  role: UserRole | undefined,
  fieldName: string
): boolean {
  if (!role) return false;
  if (role === 'owner' || role === 'admin') return true;
  
  // Find which category this field belongs to
  for (const [category, info] of Object.entries(DATA_CATEGORY_INFO)) {
    if (info.fields.includes(fieldName)) {
      return isCategoryVisible(permissions, role, category as DataCategory);
    }
  }
  
  // If field not in any category, default to visible (basic info)
  return true;
}
