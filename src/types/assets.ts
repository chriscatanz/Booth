// Asset Management Types

export type AssetType = 'capital' | 'collateral';
export type ReservationStatus = 'reserved' | 'shipped' | 'returned' | 'consumed';

export interface Asset {
  id: string;
  organizationId: string;
  
  // Details
  name: string;
  description: string | null;
  type: AssetType;
  category: string | null;
  
  // Inventory (for collateral)
  quantity: number;
  lowStockThreshold: number | null;
  
  // Value (for capital)
  purchaseCost: number | null;
  purchaseDate: string | null;
  
  // Status
  isActive: boolean;
  
  // Media
  imageUrl: string | null;
  
  // Notes
  notes: string | null;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  
  // Computed
  availableQuantity?: number;
  reservations?: AssetReservation[];
}

export interface AssetReservation {
  id: string;
  assetId: string;
  tradeShowId: number;
  
  quantityReserved: number;
  status: ReservationStatus;
  notes: string | null;
  
  reservedBy: string | null;
  reservedAt: string;
  
  // Joined data
  asset?: Asset;
  tradeShow?: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface CreateAssetInput {
  name: string;
  description?: string;
  type: AssetType;
  category?: string;
  quantity?: number;
  lowStockThreshold?: number;
  purchaseCost?: number;
  purchaseDate?: string;
  imageUrl?: string;
  notes?: string;
}

export interface UpdateAssetInput {
  name?: string;
  description?: string | null;
  type?: AssetType;
  category?: string | null;
  quantity?: number;
  lowStockThreshold?: number | null;
  purchaseCost?: number | null;
  purchaseDate?: string | null;
  isActive?: boolean;
  imageUrl?: string | null;
  notes?: string | null;
}

// Asset categories presets
export const ASSET_CATEGORIES = {
  capital: [
    'Booth Kit',
    'Display',
    'Banner Stand',
    'Furniture',
    'Lighting',
    'AV Equipment',
    'Flooring',
    'Storage/Cases',
  ],
  collateral: [
    'Brochures',
    'Business Cards',
    'Swag',
    'Giveaways',
    'Literature',
    'Promotional Items',
    'Signage',
  ],
};

export const ASSET_TYPE_CONFIG: Record<AssetType, { label: string; description: string }> = {
  capital: { 
    label: 'Capital Asset', 
    description: 'Reusable items like booth kits, displays, furniture' 
  },
  collateral: { 
    label: 'Collateral', 
    description: 'Consumable items like swag, brochures, giveaways' 
  },
};

export const RESERVATION_STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string }> = {
  reserved: { label: 'Reserved', color: 'text-brand-purple' },
  shipped: { label: 'Shipped', color: 'text-warning' },
  returned: { label: 'Returned', color: 'text-success' },
  consumed: { label: 'Consumed', color: 'text-text-tertiary' },
};
