// Custom Fields Types

export type CustomFieldType = 
  | 'text' | 'number' | 'date' | 'checkbox' 
  | 'select' | 'url' | 'email' | 'phone' | 'textarea';

export interface CustomFieldDefinition {
  id: string;
  organizationId: string;
  
  // Config
  name: string;
  fieldKey: string;
  fieldType: CustomFieldType;
  description: string | null;
  
  // For select fields
  options: string[];
  
  // Validation
  isRequired: boolean;
  
  // Display
  position: number;
  section: string;
  isActive: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldValue {
  id: string;
  fieldId: string;
  tradeShowId: string;
  value: string | null;
  updatedAt: string;
  
  // Joined
  field?: CustomFieldDefinition;
}

export interface CreateFieldInput {
  name: string;
  fieldKey: string;
  fieldType: CustomFieldType;
  description?: string;
  options?: string[];
  isRequired?: boolean;
  section?: string;
}

export interface UpdateFieldInput {
  name?: string;
  fieldType?: CustomFieldType;
  description?: string | null;
  options?: string[];
  isRequired?: boolean;
  position?: number;
  section?: string;
  isActive?: boolean;
}

// Field type configuration
export const FIELD_TYPE_CONFIG: Record<CustomFieldType, {
  label: string;
  icon: string;
  placeholder: string;
}> = {
  text: { label: 'Text', icon: 'Type', placeholder: 'Enter text...' },
  number: { label: 'Number', icon: 'Hash', placeholder: '0' },
  date: { label: 'Date', icon: 'Calendar', placeholder: 'Select date' },
  checkbox: { label: 'Checkbox', icon: 'CheckSquare', placeholder: '' },
  select: { label: 'Dropdown', icon: 'ChevronDown', placeholder: 'Select...' },
  url: { label: 'URL', icon: 'Link', placeholder: 'https://...' },
  email: { label: 'Email', icon: 'Mail', placeholder: 'email@example.com' },
  phone: { label: 'Phone', icon: 'Phone', placeholder: '+1 (555) 000-0000' },
  textarea: { label: 'Long Text', icon: 'AlignLeft', placeholder: 'Enter details...' },
};

// Default sections for organizing fields
export const FIELD_SECTIONS = [
  { id: 'custom', label: 'Custom Fields' },
  { id: 'basic', label: 'Basic Information' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'metrics', label: 'Metrics' },
];

// Helper to generate field key from name
export function generateFieldKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// Helper to parse field value based on type
export function parseFieldValue(value: string | null, fieldType: CustomFieldType): unknown {
  if (value === null || value === '') return null;
  
  switch (fieldType) {
    case 'number':
      return parseFloat(value);
    case 'checkbox':
      return value === 'true';
    case 'date':
      return value; // Keep as ISO string
    default:
      return value;
  }
}

// Helper to serialize field value
export function serializeFieldValue(value: unknown, fieldType: CustomFieldType): string | null {
  if (value === null || value === undefined || value === '') return null;
  
  switch (fieldType) {
    case 'checkbox':
      return value ? 'true' : 'false';
    default:
      return String(value);
  }
}
