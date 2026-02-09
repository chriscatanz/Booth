import { supabase } from '@/lib/supabase';
import { Asset, AssetReservation, CreateAssetInput, UpdateAssetInput, ReservationStatus } from '@/types/assets';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    description: row.description as string | null,
    type: row.type as Asset['type'],
    category: row.category as string | null,
    quantity: row.quantity as number,
    lowStockThreshold: row.low_stock_threshold as number | null,
    purchaseCost: row.purchase_cost as number | null,
    purchaseDate: row.purchase_date as string | null,
    isActive: row.is_active as boolean,
    imageUrl: row.image_url as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapReservation(row: Record<string, unknown>): AssetReservation {
  const tradeShow = row.tradeshows as Record<string, unknown> | null;
  
  return {
    id: row.id as string,
    assetId: row.asset_id as string,
    tradeShowId: row.tradeshow_id as number,
    quantityReserved: row.quantity_reserved as number,
    status: row.status as ReservationStatus,
    notes: row.notes as string | null,
    reservedBy: row.reserved_by as string | null,
    reservedAt: row.reserved_at as string,
    tradeShow: tradeShow ? {
      id: tradeShow.id as number,
      name: tradeShow.name as string,
      startDate: tradeShow.start_date as string,
      endDate: tradeShow.end_date as string,
    } : undefined,
  };
}

// ─── Asset CRUD ──────────────────────────────────────────────────────────────

export async function fetchAssets(orgId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('type')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []).map(mapAsset);
}

export async function fetchAssetWithReservations(assetId: string): Promise<Asset & { reservations: AssetReservation[] }> {
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (assetError) throw new Error(assetError.message);

  const { data: reservations, error: resError } = await supabase
    .from('asset_reservations')
    .select(`
      *,
      tradeshows (id, name, start_date, end_date)
    `)
    .eq('asset_id', assetId)
    .order('reserved_at', { ascending: false });

  if (resError) throw new Error(resError.message);

  const mappedAsset = mapAsset(asset);
  const mappedReservations = (reservations || []).map(mapReservation);
  
  // Calculate available quantity
  const reservedQty = mappedReservations
    .filter(r => r.status === 'reserved' || r.status === 'shipped')
    .reduce((sum, r) => sum + r.quantityReserved, 0);
  
  return {
    ...mappedAsset,
    availableQuantity: mappedAsset.quantity - reservedQty,
    reservations: mappedReservations,
  };
}

export async function createAsset(orgId: string, input: CreateAssetInput): Promise<Asset> {
  const { data, error } = await supabase
    .from('assets')
    .insert({
      organization_id: orgId,
      name: input.name,
      description: input.description || null,
      type: input.type,
      category: input.category || null,
      quantity: input.quantity ?? 1,
      low_stock_threshold: input.lowStockThreshold || null,
      purchase_cost: input.purchaseCost || null,
      purchase_date: input.purchaseDate || null,
      image_url: input.imageUrl || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAsset(data);
}

export async function updateAsset(assetId: string, input: UpdateAssetInput): Promise<Asset> {
  const updates: Record<string, unknown> = {};
  
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.type !== undefined) updates.type = input.type;
  if (input.category !== undefined) updates.category = input.category;
  if (input.quantity !== undefined) updates.quantity = input.quantity;
  if (input.lowStockThreshold !== undefined) updates.low_stock_threshold = input.lowStockThreshold;
  if (input.purchaseCost !== undefined) updates.purchase_cost = input.purchaseCost;
  if (input.purchaseDate !== undefined) updates.purchase_date = input.purchaseDate;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  if (input.imageUrl !== undefined) updates.image_url = input.imageUrl;
  if (input.notes !== undefined) updates.notes = input.notes;

  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', assetId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAsset(data);
}

export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);

  if (error) throw new Error(error.message);
}

// ─── Reservations ────────────────────────────────────────────────────────────

export async function fetchShowReservations(showId: string): Promise<AssetReservation[]> {
  const { data, error } = await supabase
    .from('asset_reservations')
    .select(`
      *,
      assets (*)
    `)
    .eq('tradeshow_id', showId);

  if (error) throw new Error(error.message);
  
  return (data || []).map(row => ({
    ...mapReservation(row),
    asset: row.assets ? mapAsset(row.assets as Record<string, unknown>) : undefined,
  }));
}

export async function createReservation(
  assetId: string,
  showId: string,
  userId: string,
  quantity: number = 1,
  notes?: string
): Promise<AssetReservation> {
  const { data, error } = await supabase
    .from('asset_reservations')
    .insert({
      asset_id: assetId,
      tradeshow_id: showId,
      quantity_reserved: quantity,
      reserved_by: userId,
      notes: notes || null,
    })
    .select(`
      *,
      tradeshows (id, name, start_date, end_date)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapReservation(data);
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus
): Promise<AssetReservation> {
  const { data, error } = await supabase
    .from('asset_reservations')
    .update({ status })
    .eq('id', reservationId)
    .select(`
      *,
      tradeshows (id, name, start_date, end_date)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapReservation(data);
}

export async function deleteReservation(reservationId: string): Promise<void> {
  const { error } = await supabase
    .from('asset_reservations')
    .delete()
    .eq('id', reservationId);

  if (error) throw new Error(error.message);
}

// ─── Low Stock Alerts ────────────────────────────────────────────────────────

export async function fetchLowStockAssets(orgId: string): Promise<Asset[]> {
  const assets = await fetchAssets(orgId);
  
  return assets.filter(asset => {
    if (!asset.lowStockThreshold) return false;
    return asset.quantity <= asset.lowStockThreshold;
  });
}
