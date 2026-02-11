'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as assetService from '@/services/asset-service';
import { Asset, AssetReservation, ASSET_TYPE_CONFIG, ASSET_CATEGORIES, RESERVATION_STATUS_CONFIG } from '@/types/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Plus, Package, Box, AlertTriangle, Search,
  MoreHorizontal, Edit, Trash2, Calendar, X
} from 'lucide-react';
import { AssetModal } from '@/components/assets/asset-modal';
import { format, parseISO } from 'date-fns';

export default function AssetsView() {
  const { organization, isEditor } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'capital' | 'collateral'>('all');
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<(Asset & { reservations: AssetReservation[] }) | null>(null);

  const loadAssets = useCallback(async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await assetService.fetchAssets(organization.id);
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    }
    
    setIsLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  async function handleSelectAsset(asset: Asset) {
    try {
      const detailed = await assetService.fetchAssetWithReservations(asset.id);
      setSelectedAsset(detailed);
    } catch (err) {
      console.error('Failed to load asset details:', err);
    }
  }

  const handleAssetCreated = (asset: Asset) => {
    setAssets(prev => [...prev, asset]);
    setShowCreateModal(false);
  };

  const handleAssetUpdated = (asset: Asset) => {
    setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
    setEditingAsset(null);
    if (selectedAsset?.id === asset.id) {
      handleSelectAsset(asset);
    }
  };

  const handleAssetDeleted = async (assetId: string) => {
    try {
      await assetService.deleteAsset(assetId);
      setAssets(prev => prev.filter(a => a.id !== assetId));
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(null);
      }
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    if (filterType !== 'all' && asset.type !== filterType) return false;
    if (searchText && !asset.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // Group by type
  const capitalAssets = filteredAssets.filter(a => a.type === 'capital');
  const collateralAssets = filteredAssets.filter(a => a.type === 'collateral');

  // Low stock alerts
  const lowStockAssets = assets.filter(a => 
    a.lowStockThreshold && a.quantity <= a.lowStockThreshold
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Package className="text-brand-purple" />
                Assets
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                {assets.length} assets · {capitalAssets.length} capital · {collateralAssets.length} collateral
              </p>
            </div>
            
            {isEditor && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> Add Asset
              </Button>
            )}
          </div>

          {/* Low Stock Alert */}
          {lowStockAssets.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
              <AlertTriangle size={16} className="text-warning" />
              <span className="text-sm text-warning">
                {lowStockAssets.length} item{lowStockAssets.length > 1 ? 's' : ''} low on stock
              </span>
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
            >
              <option value="all">All Types</option>
              <option value="capital">Capital Assets</option>
              <option value="collateral">Collateral</option>
            </select>
          </div>
        </div>

        {/* Asset List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary">
              {assets.length === 0 ? 'No assets yet. Add your first asset!' : 'No assets match your filters.'}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Capital Assets */}
              {capitalAssets.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    <Box size={14} />
                    Capital Assets ({capitalAssets.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {capitalAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onClick={() => handleSelectAsset(asset)}
                        onEdit={() => setEditingAsset(asset)}
                        onDelete={() => handleAssetDeleted(asset.id)}
                        isEditor={isEditor}
                        isSelected={selectedAsset?.id === asset.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Collateral */}
              {collateralAssets.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    <Package size={14} />
                    Collateral ({collateralAssets.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collateralAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onClick={() => handleSelectAsset(asset)}
                        onEdit={() => setEditingAsset(asset)}
                        onDelete={() => handleAssetDeleted(asset.id)}
                        isEditor={isEditor}
                        isSelected={selectedAsset?.id === asset.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border bg-surface overflow-hidden"
          >
            <AssetDetailPanel
              asset={selectedAsset}
              onClose={() => setSelectedAsset(null)}
              onEdit={() => setEditingAsset(selectedAsset)}
              isEditor={isEditor}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingAsset) && (
          <AssetModal
            asset={editingAsset}
            onClose={() => { setShowCreateModal(false); setEditingAsset(null); }}
            onSave={editingAsset ? handleAssetUpdated : handleAssetCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Asset Card ──────────────────────────────────────────────────────────────

interface AssetCardProps {
  asset: Asset;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditor: boolean;
  isSelected: boolean;
}

function AssetCard({ asset, onClick, onEdit, onDelete, isEditor, isSelected }: AssetCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isLowStock = asset.lowStockThreshold && asset.quantity <= asset.lowStockThreshold;

  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border bg-surface cursor-pointer transition-all',
        isSelected ? 'border-brand-purple ring-1 ring-brand-purple' : 'border-border hover:border-brand-purple/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {asset.imageUrl ? (
            <img src={asset.imageUrl} alt={asset.name} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center">
              {asset.type === 'capital' ? <Box size={20} className="text-text-tertiary" /> : <Package size={20} className="text-text-tertiary" />}
            </div>
          )}
          <div>
            <h3 className="font-medium text-text-primary">{asset.name}</h3>
            {asset.category && (
              <p className="text-xs text-text-tertiary">{asset.category}</p>
            )}
          </div>
        </div>

        {isEditor && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary"
            >
              <MoreHorizontal size={16} />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <div className="absolute right-0 top-6 bg-surface border border-border rounded-lg shadow-lg py-1 z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2 text-error"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className={cn(
          'text-sm font-medium',
          isLowStock ? 'text-error' : 'text-text-primary'
        )}>
          Qty: {asset.quantity}
        </span>
        {isLowStock && (
          <span className="text-xs text-error flex items-center gap-1">
            <AlertTriangle size={12} /> Low stock
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Asset Detail Panel ──────────────────────────────────────────────────────

interface AssetDetailPanelProps {
  asset: Asset & { reservations: AssetReservation[] };
  onClose: () => void;
  onEdit: () => void;
  isEditor: boolean;
}

function AssetDetailPanel({ asset, onClose, onEdit, isEditor }: AssetDetailPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Asset Details</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            {asset.imageUrl ? (
              <img src={asset.imageUrl} alt={asset.name} className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-bg-tertiary flex items-center justify-center">
                {asset.type === 'capital' ? <Box size={24} className="text-text-tertiary" /> : <Package size={24} className="text-text-tertiary" />}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-text-primary text-lg">{asset.name}</h3>
              <p className="text-sm text-text-tertiary">{ASSET_TYPE_CONFIG[asset.type].label}</p>
            </div>
          </div>

          {asset.description && (
            <p className="text-sm text-text-secondary mb-4">{asset.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-tertiary">Quantity</p>
              <p className="font-medium text-text-primary">{asset.quantity}</p>
            </div>
            <div>
              <p className="text-text-tertiary">Available</p>
              <p className="font-medium text-text-primary">{asset.availableQuantity}</p>
            </div>
            {asset.category && (
              <div>
                <p className="text-text-tertiary">Category</p>
                <p className="font-medium text-text-primary">{asset.category}</p>
              </div>
            )}
            {asset.purchaseCost && (
              <div>
                <p className="text-text-tertiary">Value</p>
                <p className="font-medium text-text-primary">${asset.purchaseCost.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reservations */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Calendar size={14} />
            Reservations ({asset.reservations.length})
          </h4>
          
          {asset.reservations.length === 0 ? (
            <p className="text-sm text-text-tertiary">No reservations</p>
          ) : (
            <div className="space-y-2">
              {asset.reservations.map((res) => (
                <div key={res.id} className="p-3 rounded-lg bg-bg-tertiary">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text-primary text-sm">{res.tradeShow?.name}</p>
                    <span className={cn('text-xs', RESERVATION_STATUS_CONFIG[res.status].color)}>
                      {RESERVATION_STATUS_CONFIG[res.status].label}
                    </span>
                  </div>
                  {res.tradeShow && (
                    <p className="text-xs text-text-tertiary mt-1">
                      {format(parseISO(res.tradeShow.startDate), 'MMM d')} - {format(parseISO(res.tradeShow.endDate), 'MMM d, yyyy')}
                    </p>
                  )}
                  <p className="text-xs text-text-secondary mt-1">
                    Qty: {res.quantityReserved}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {isEditor && (
        <div className="px-4 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onEdit} className="w-full">
            <Edit size={14} /> Edit Asset
          </Button>
        </div>
      )}
    </div>
  );
}
