'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as assetService from '@/services/asset-service';
import { Asset, AssetType, ASSET_TYPE_CONFIG, ASSET_CATEGORIES } from '@/types/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save, AlertCircle, Package, Box } from 'lucide-react';

interface AssetModalProps {
  asset?: Asset | null;
  onClose: () => void;
  onSave: (asset: Asset) => void;
}

export function AssetModal({ asset, onClose, onSave }: AssetModalProps) {
  const { organization } = useAuthStore();
  
  const [name, setName] = useState(asset?.name || '');
  const [description, setDescription] = useState(asset?.description || '');
  const [type, setType] = useState<AssetType>(asset?.type || 'capital');
  const [category, setCategory] = useState(asset?.category || '');
  const [quantity, setQuantity] = useState(asset?.quantity?.toString() || '1');
  const [lowStockThreshold, setLowStockThreshold] = useState(asset?.lowStockThreshold?.toString() || '');
  const [purchaseCost, setPurchaseCost] = useState(asset?.purchaseCost?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate || '');
  const [notes, setNotes] = useState(asset?.notes || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = ASSET_CATEGORIES[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !organization?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      let savedAsset: Asset;
      
      if (asset) {
        savedAsset = await assetService.updateAsset(asset.id, {
          name: name.trim(),
          description: description.trim() || null,
          type,
          category: category || null,
          quantity: parseInt(quantity) || 1,
          lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : null,
          purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
          purchaseDate: purchaseDate || null,
          notes: notes.trim() || null,
        });
      } else {
        savedAsset = await assetService.createAsset(organization.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          category: category || undefined,
          quantity: parseInt(quantity) || 1,
          lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
          purchaseCost: purchaseCost ? parseFloat(purchaseCost) : undefined,
          purchaseDate: purchaseDate || undefined,
          notes: notes.trim() || undefined,
        });
      }
      
      onSave(savedAsset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save asset');
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-surface rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface">
          <h2 className="text-lg font-semibold text-text-primary">
            {asset ? 'Edit Asset' : 'New Asset'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(['capital', 'collateral'] as AssetType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setCategory(''); }}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    type === t 
                      ? 'border-brand-purple bg-brand-purple/5' 
                      : 'border-border hover:border-brand-purple/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {t === 'capital' ? <Box size={16} /> : <Package size={16} />}
                    <span className="font-medium text-text-primary">{ASSET_TYPE_CONFIG[t].label}</span>
                  </div>
                  <p className="text-xs text-text-tertiary">{ASSET_TYPE_CONFIG[t].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'capital' ? 'e.g., 10ft Backlit Display' : 'e.g., Company Pens'}
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Quantity & Low Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Low Stock Alert</label>
              <Input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Capital-specific: Cost & Date */}
          {type === 'capital' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Purchase Cost</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isLoading}>
              <Save size={14} /> {asset ? 'Save Changes' : 'Create Asset'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
