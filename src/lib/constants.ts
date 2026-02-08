// ─── Default List Options ───────────────────────────────────────────────────
// These are used as defaults when creating a new organization
// Organizations can customize these in Settings > Custom Lists

export const DEFAULT_BOOTH_OPTIONS = [
  '10ft Backlit (DisplayIt Grafitti)',
  '10ft Backlit (DisplayIt Ensemble)',
  '10ft Stretch',
  '6ft Stretch',
  '36" Backlit Banner Stand',
  '36" Directlink Banner Stand (Compass)',
  '36" Directlink Banner Stand 2 (Directlink)',
];

export const DEFAULT_GRAPHICS_OPTIONS = [
  'Grafitti Directlink Only',
  'Grafitti Combined',
  'Ensemble IMS',
  'Ensemble Directlink',
  'Ensemble Combined',
  '36" Backlit Directlink',
  '36" Backlit IMS',
  '36" Backlit Combined',
  '6ft Stretch Combined',
  '10ft Directlink Stretch',
  '10ft IMS Stretch',
  '10ft Combined',
];

export const DEFAULT_PACKING_LIST_OPTIONS = [
  'Business Card Holders',
  'IMS Collateral',
  'Directlink Collateral',
  'Collateral Stand',
  'Desktop Computer',
  'iPad',
  'Fish Bowl',
  'iPad Stand',
  'iPad Charger',
  'Power Bank',
];

export const DEFAULT_TABLECLOTH_OPTIONS = ['Directlink', 'IMS'];

// Legacy exports for backward compatibility
export const BOOTH_OPTIONS = DEFAULT_BOOTH_OPTIONS as readonly string[];
export const GRAPHICS_OPTIONS = DEFAULT_GRAPHICS_OPTIONS as readonly string[];
export const PACKING_LIST_OPTIONS = DEFAULT_PACKING_LIST_OPTIONS as readonly string[];
export const TABLECLOTH_OPTIONS = DEFAULT_TABLECLOTH_OPTIONS as readonly string[];

// Type for custom lists stored in organization settings
export interface CustomLists {
  boothOptions: string[];
  graphicsOptions: string[];
  packingListOptions: string[];
  tableclothOptions: string[];
}

// Default custom lists for new organizations
export const DEFAULT_CUSTOM_LISTS: CustomLists = {
  boothOptions: DEFAULT_BOOTH_OPTIONS,
  graphicsOptions: DEFAULT_GRAPHICS_OPTIONS,
  packingListOptions: DEFAULT_PACKING_LIST_OPTIONS,
  tableclothOptions: DEFAULT_TABLECLOTH_OPTIONS,
};

// Show status values
export const SHOW_STATUSES = [
  'Planning',
  'Logistics',
  'Ready',
  'Active',
  'Post-Show',
  'Closed',
] as const;
