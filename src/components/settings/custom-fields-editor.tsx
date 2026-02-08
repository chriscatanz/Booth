'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as customFieldsService from '@/services/custom-fields-service';
import { CustomFieldDefinition, CustomFieldType, FIELD_TYPE_CONFIG, generateFieldKey } from '@/types/custom-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, GripVertical, AlertCircle, Save, X,
  Type, Hash, Calendar, CheckSquare, ChevronDown, Link, Mail, Phone, AlignLeft
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Type, Hash, Calendar, CheckSquare, ChevronDown, Link, Mail, Phone, AlignLeft,
};

export function CustomFieldsEditor() {
  const { organization, isAdmin } = useAuthStore();
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New field form
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFields();
  }, [organization?.id]);

  async function loadFields() {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      const data = await customFieldsService.fetchFieldDefinitions(organization.id);
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fields');
    }
    setIsLoading(false);
  }

  const handleCreateField = async () => {
    if (!organization?.id || !newFieldName.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const newField = await customFieldsService.createFieldDefinition(organization.id, {
        name: newFieldName.trim(),
        fieldKey: generateFieldKey(newFieldName.trim()),
        fieldType: newFieldType,
        isRequired: newFieldRequired,
      });
      
      setFields(prev => [...prev, newField]);
      setNewFieldName('');
      setNewFieldType('text');
      setNewFieldRequired(false);
      setShowNewField(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create field');
    }

    setIsSaving(false);
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await customFieldsService.deleteFieldDefinition(fieldId);
      setFields(prev => prev.filter(f => f.id !== fieldId));
    } catch (err) {
      console.error('Failed to delete field:', err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8 text-text-secondary">
        Only admins can manage custom fields.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1">Custom Fields</h3>
        <p className="text-xs text-text-secondary">
          Define additional fields to track for each trade show. These will appear in the show detail view.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Existing Fields */}
      {fields.length > 0 ? (
        <div className="space-y-2">
          {fields.map((field) => {
            const Icon = ICON_MAP[FIELD_TYPE_CONFIG[field.fieldType].icon] || Type;
            
            return (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary group"
              >
                <GripVertical size={16} className="text-text-tertiary cursor-grab" />
                
                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                  <Icon size={16} className="text-text-secondary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm">{field.name}</p>
                  <p className="text-xs text-text-tertiary">
                    {FIELD_TYPE_CONFIG[field.fieldType].label}
                    {field.isRequired && ' · Required'}
                  </p>
                </div>
                
                <button
                  onClick={() => handleDeleteField(field.id)}
                  className="p-1.5 rounded hover:bg-surface text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-text-tertiary text-sm border-2 border-dashed border-border rounded-lg">
          No custom fields yet
        </div>
      )}

      {/* New Field Form */}
      <AnimatePresence>
        {showNewField && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-lg bg-bg-tertiary border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-text-primary text-sm">New Field</h4>
                <button
                  onClick={() => setShowNewField(false)}
                  className="p-1 rounded hover:bg-surface text-text-tertiary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Field Name
                  </label>
                  <Input
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="e.g., Lead Source"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Field Type
                  </label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm"
                  >
                    {Object.entries(FIELD_TYPE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-text-secondary">Required field</span>
              </label>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowNewField(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateField}
                  loading={isSaving}
                  disabled={!newFieldName.trim()}
                >
                  <Save size={14} /> Create Field
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Button */}
      {!showNewField && (
        <Button variant="outline" onClick={() => setShowNewField(true)}>
          <Plus size={14} /> Add Custom Field
        </Button>
      )}
    </div>
  );
}
