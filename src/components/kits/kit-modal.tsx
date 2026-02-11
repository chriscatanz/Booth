'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BoothKit,
  CreateKitInput,
  KitContentItem,
  KitType,
  KIT_TYPE_LABELS,
} from '@/types/booth-kits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { X, Plus, Trash2, Package } from 'lucide-react';

interface KitModalProps {
  kit?: BoothKit;
  onClose: () => void;
  onSave: (input: CreateKitInput) => void | Promise<void>;
}

export function KitModal({ kit, onClose, onSave }: KitModalProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(kit?.name || '');
  const [code, setCode] = useState(kit?.code || '');
  const [kitType, setKitType] = useState<KitType>(kit?.kitType || 'standard');
  const [description, setDescription] = useState(kit?.description || '');
  const [contents, setContents] = useState<KitContentItem[]>(kit?.contents || []);
  const [dimensions, setDimensions] = useState(kit?.dimensions || '');
  const [weightLbs, setWeightLbs] = useState(kit?.weightLbs?.toString() || '');
  const [homeLocation, setHomeLocation] = useState(kit?.homeLocation || 'Warehouse');
  const [defaultShipDays, setDefaultShipDays] = useState(kit?.defaultShipDays?.toString() || '3');
  const [defaultReturnDays, setDefaultReturnDays] = useState(kit?.defaultReturnDays?.toString() || '5');
  const [replacementValue, setReplacementValue] = useState(kit?.replacementValue?.toString() || '');
  const [notes, setNotes] = useState(kit?.notes || '');

  const isEditing = !!kit;

  const handleAddContent = () => {
    setContents([...contents, { item: '', qty: 1 }]);
  };

  const handleUpdateContent = (index: number, field: 'item' | 'qty', value: string | number) => {
    const updated = [...contents];
    if (field === 'item') {
      updated[index].item = value as string;
    } else {
      updated[index].qty = typeof value === 'string' ? parseInt(value) || 1 : value;
    }
    setContents(updated);
  };

  const handleRemoveContent = (index: number) => {
    setContents(contents.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        code: code.trim() || undefined,
        kitType,
        description: description.trim() || undefined,
        contents: contents.filter(c => c.item.trim()),
        dimensions: dimensions.trim() || undefined,
        weightLbs: weightLbs ? parseFloat(weightLbs) : undefined,
        homeLocation: homeLocation.trim() || 'Warehouse',
        defaultShipDays: parseInt(defaultShipDays) || 3,
        defaultReturnDays: parseInt(defaultReturnDays) || 5,
        replacementValue: replacementValue ? parseFloat(replacementValue) : undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <Package className="h-5 w-5 text-zinc-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {isEditing ? 'Edit Kit' : 'Add Booth Kit'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Kit Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kit A - Flagship"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Code (optional)
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., KIT-A"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>

          {/* Kit Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Kit Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(KIT_TYPE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setKitType(type as KitType)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-colors",
                    kitType === type
                      ? "bg-blue-500/20 border-blue-500 text-blue-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  {label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the kit configuration..."
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Contents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-400">
                Contents
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddContent}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </div>
            {contents.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4 bg-zinc-800/50 rounded-lg">
                No items added yet
              </p>
            ) : (
              <div className="space-y-2">
                {contents.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item.item}
                      onChange={(e) => handleUpdateContent(index, 'item', e.target.value)}
                      placeholder="Item name"
                      className="flex-1 bg-zinc-800 border-zinc-700"
                    />
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleUpdateContent(index, 'qty', e.target.value)}
                      min={1}
                      className="w-20 bg-zinc-800 border-zinc-700"
                    />
                    <button
                      onClick={() => handleRemoveContent(index)}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Physical Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Dimensions
              </label>
              <Input
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g., 10ft x 10ft"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Weight (lbs)
              </label>
              <Input
                type="number"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                placeholder="Total packed weight"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>

          {/* Shipping Defaults */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Home Location
              </label>
              <Input
                value={homeLocation}
                onChange={(e) => setHomeLocation(e.target.value)}
                placeholder="Warehouse"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Ship Days
              </label>
              <Input
                type="number"
                value={defaultShipDays}
                onChange={(e) => setDefaultShipDays(e.target.value)}
                min={1}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Return Days
              </label>
              <Input
                type="number"
                value={defaultReturnDays}
                onChange={(e) => setDefaultReturnDays(e.target.value)}
                min={1}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>

          {/* Value & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Replacement Value ($)
              </label>
              <Input
                type="number"
                value={replacementValue}
                onChange={(e) => setReplacementValue(e.target.value)}
                placeholder="Insurance value"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Update Kit' : 'Create Kit'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
