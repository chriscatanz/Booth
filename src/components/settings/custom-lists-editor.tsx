'use client';

import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as authService from '@/services/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CustomLists, 
  DEFAULT_CUSTOM_LISTS,
} from '@/lib/constants';
import { 
  Plus, X, GripVertical, Save, Check, RotateCcw,
  Package, Image as ImageIcon, CheckSquare, Shirt
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ListKey = keyof CustomLists;

interface ListConfig {
  key: ListKey;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const LIST_CONFIGS: ListConfig[] = [
  { 
    key: 'boothOptions', 
    label: 'Booth Options', 
    icon: <Package size={16} />,
    description: 'Items available in the "Booth to Ship" checklist'
  },
  { 
    key: 'graphicsOptions', 
    label: 'Graphics Options', 
    icon: <ImageIcon size={16} />,
    description: 'Items available in the "Graphics to Ship" checklist'
  },
  { 
    key: 'packingListOptions', 
    label: 'Packing List', 
    icon: <CheckSquare size={16} />,
    description: 'Items available in the packing list checklist'
  },
  { 
    key: 'tableclothOptions', 
    label: 'Tablecloth Options', 
    icon: <Shirt size={16} />,
    description: 'Options for tablecloth selection'
  },
];

export function CustomListsEditor() {
  const { organization, refreshOrganizations } = useAuthStore();
  const [lists, setLists] = useState<CustomLists>(DEFAULT_CUSTOM_LISTS);
  const [activeList, setActiveList] = useState<ListKey>('boothOptions');
  const [newItem, setNewItem] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load lists from org settings on mount
  useEffect(() => {
    if (organization?.settings) {
      const settings = organization.settings as { customLists?: Partial<CustomLists> };
      if (settings.customLists) {
        setLists({
          boothOptions: settings.customLists.boothOptions || DEFAULT_CUSTOM_LISTS.boothOptions,
          graphicsOptions: settings.customLists.graphicsOptions || DEFAULT_CUSTOM_LISTS.graphicsOptions,
          packingListOptions: settings.customLists.packingListOptions || DEFAULT_CUSTOM_LISTS.packingListOptions,
          tableclothOptions: settings.customLists.tableclothOptions || DEFAULT_CUSTOM_LISTS.tableclothOptions,
        });
      }
    }
  }, [organization]);

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    setLists(prev => ({
      ...prev,
      [activeList]: [...prev[activeList], newItem.trim()],
    }));
    setNewItem('');
    setHasChanges(true);
  };

  const handleRemoveItem = (index: number) => {
    setLists(prev => ({
      ...prev,
      [activeList]: prev[activeList].filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleReorder = (newOrder: string[]) => {
    setLists(prev => ({
      ...prev,
      [activeList]: newOrder,
    }));
    setHasChanges(true);
  };

  const handleResetToDefaults = () => {
    if (!confirm('Reset this list to defaults? Your custom items will be lost.')) return;
    setLists(prev => ({
      ...prev,
      [activeList]: DEFAULT_CUSTOM_LISTS[activeList],
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!organization) return;
    
    setIsSaving(true);
    try {
      const currentSettings = (organization.settings || {}) as Record<string, unknown>;
      await authService.updateOrganization(organization.id, {
        settings: {
          ...currentSettings,
          customLists: lists,
        },
      });
      await refreshOrganizations();
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save custom lists:', err);
    }
    setIsSaving(false);
  };

  const currentListConfig = LIST_CONFIGS.find(c => c.key === activeList)!;
  const currentItems = lists[activeList];

  return (
    <div className="space-y-4">
      {/* List Selector */}
      <div className="flex flex-wrap gap-2">
        {LIST_CONFIGS.map((config) => (
          <button
            key={config.key}
            onClick={() => setActiveList(config.key)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeList === config.key
                ? 'bg-brand-purple text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/80'
            )}
          >
            {config.icon}
            {config.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary">
        {currentListConfig.description}
      </p>

      {/* Add Item */}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item..."
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          className="flex-1"
        />
        <Button variant="outline" onClick={handleAddItem} disabled={!newItem.trim()}>
          <Plus size={16} /> Add
        </Button>
      </div>

      {/* Items List */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Reorder.Group 
          axis="y" 
          values={currentItems} 
          onReorder={handleReorder}
          className="divide-y divide-border"
        >
          {currentItems.map((item, index) => (
            <Reorder.Item
              key={item}
              value={item}
              className="flex items-center gap-3 px-4 py-3 bg-surface hover:bg-bg-tertiary cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={14} className="text-text-tertiary shrink-0" />
              <span className="flex-1 text-sm text-text-primary">{item}</span>
              <button
                onClick={() => handleRemoveItem(index)}
                className="p-1 rounded hover:bg-error/10 text-text-tertiary hover:text-error transition-colors"
              >
                <X size={14} />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        
        {currentItems.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-text-tertiary">
            No items yet. Add some above!
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="ghost" size="sm" onClick={handleResetToDefaults}>
          <RotateCcw size={14} /> Reset to Defaults
        </Button>
        
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <motion.span 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-sm text-success"
            >
              <Check size={14} /> Saved
            </motion.span>
          )}
          <Button 
            variant="primary" 
            onClick={handleSave} 
            loading={isSaving}
            disabled={!hasChanges}
          >
            <Save size={14} /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
