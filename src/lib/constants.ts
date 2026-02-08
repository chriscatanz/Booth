// Booth options - mirrors DetailView.swift allBoothOptions
export const BOOTH_OPTIONS = [
  '10ft Backlit (DisplayIt Grafitti)',
  '10ft Backlit (DisplayIt Ensemble)',
  '10ft Stretch',
  '6ft Stretch',
  '36" Backlit Banner Stand',
  '36" Directlink Banner Stand (Compass)',
  '36" Directlink Banner Stand 2 (Directlink)',
] as const;

// Graphics options - mirrors DetailView.swift allGraphicsOptions
export const GRAPHICS_OPTIONS = [
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
] as const;

// Packing list options - mirrors DetailView.swift allPackingListOptions
export const PACKING_LIST_OPTIONS = [
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
] as const;

// Tablecloth options
export const TABLECLOTH_OPTIONS = ['Directlink', 'IMS'] as const;

// Show status values
export const SHOW_STATUSES = [
  'Planning',
  'Logistics',
  'Ready',
  'Active',
  'Post-Show',
  'Closed',
] as const;
