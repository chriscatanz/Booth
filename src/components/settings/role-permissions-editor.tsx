'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useDataVisibility } from '@/hooks/use-data-visibility';
import { Button } from '@/components/ui/button';
import {
  Shield, Users, Eye, Info, DollarSign, Truck, Plane,
  UserCheck, BarChart3, FileText, CheckSquare, Folder,
  AlertCircle, Check, RotateCcw, Save, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DataCategory,
  DATA_CATEGORY_INFO,
  ALL_DATA_CATEGORIES,
  DEFAULT_ROLE_PERMISSIONS,
  RoleDataPermissions,
} from '@/types/data-visibility';
import { UserRole } from '@/types/auth';

const CATEGORY_ICONS: Record<DataCategory, React.ElementType> = {
  basic: Info,
  budget: DollarSign,
  logistics: Truck,
  travel: Plane,
  contacts: Users,
  leads: BarChart3,
  notes: FileText,
  tasks: CheckSquare,
  documents: Folder,
  attendees: UserCheck,
};

interface RolePermissionsEditorProps {
  className?: string;
}

export function RolePermissionsEditor({ className }: RolePermissionsEditorProps) {
  const { organization } = useAuthStore();
  const { permissions, isLoading, error, updatePermissions, resetToDefaults, refresh } = useDataVisibility();
  
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('editor');
  const [localCategories, setLocalCategories] = useState<DataCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Get current permissions for selected role
  const currentRolePermissions = permissions.find(p => p.role === selectedRole);
  const currentCategories = currentRolePermissions?.visibleCategories ?? DEFAULT_ROLE_PERMISSIONS[selectedRole];

  // Initialize local state when role changes or permissions load
  useEffect(() => {
    setLocalCategories(currentCategories);
    setHasChanges(false);
  }, [selectedRole, currentCategories.join(',')]);

  // Check if local state differs from saved state
  useEffect(() => {
    const current = [...currentCategories].sort().join(',');
    const local = [...localCategories].sort().join(',');
    setHasChanges(current !== local);
  }, [localCategories, currentCategories]);

  const toggleCategory = (category: DataCategory) => {
    // Basic info is always required
    if (category === 'basic') return;
    
    setLocalCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setLocalError(null);
    setSaveSuccess(false);

    try {
      await updatePermissions(selectedRole, localCategories);
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to save');
    }

    setIsSaving(false);
  };

  const handleReset = async () => {
    setIsSaving(true);
    setLocalError(null);

    try {
      await resetToDefaults(selectedRole);
      setLocalCategories(DEFAULT_ROLE_PERMISSIONS[selectedRole]);
      setHasChanges(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to reset');
    }

    setIsSaving(false);
  };

  const isDefault = !currentRolePermissions;

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-bg-tertiary rounded-lg w-48" />
          <div className="h-32 bg-bg-tertiary rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1 flex items-center gap-2">
          <Eye size={16} className="text-brand-purple" />
          Data Visibility by Role
        </h3>
        <p className="text-xs text-text-secondary">
          Configure which data points each role can see. Owners and Admins always have full access.
        </p>
      </div>

      {(error || localError) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
          <AlertCircle size={16} />
          {error || localError}
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success-bg text-success text-sm">
          <Check size={16} />
          Permissions saved successfully
        </div>
      )}

      {/* Role Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedRole('editor')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            selectedRole === 'editor'
              ? 'bg-success/20 text-success border border-success/30'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
          )}
        >
          <Users size={16} />
          Editor
        </button>
        <button
          onClick={() => setSelectedRole('viewer')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            selectedRole === 'viewer'
              ? 'bg-text-tertiary/20 text-text-primary border border-border'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
          )}
        >
          <Eye size={16} />
          Viewer
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        {isDefault ? (
          <>
            <span className="w-2 h-2 rounded-full bg-text-tertiary" />
            Using default permissions
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-brand-purple" />
            Custom permissions configured
          </>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid gap-2">
        {ALL_DATA_CATEGORIES.map((category) => {
          const info = DATA_CATEGORY_INFO[category];
          const Icon = CATEGORY_ICONS[category];
          const isEnabled = localCategories.includes(category);
          const isRequired = category === 'basic';

          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              disabled={isRequired}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                isEnabled
                  ? 'bg-brand-purple/10 border-brand-purple/30'
                  : 'bg-bg-tertiary border-border hover:border-text-tertiary',
                isRequired && 'opacity-60 cursor-not-allowed'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                isEnabled ? 'bg-brand-purple/20' : 'bg-surface'
              )}>
                <Icon size={16} className={isEnabled ? 'text-brand-purple' : 'text-text-tertiary'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    isEnabled ? 'text-text-primary' : 'text-text-secondary'
                  )}>
                    {info.label}
                  </span>
                  {isRequired && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-tertiary">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-tertiary truncate">{info.description}</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                isEnabled
                  ? 'bg-brand-purple border-brand-purple'
                  : 'border-border'
              )}>
                {isEnabled && <Check size={12} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-3 rounded-lg bg-bg-tertiary text-xs text-text-secondary">
        <strong className="text-text-primary">{selectedRole === 'editor' ? 'Editors' : 'Viewers'}</strong> can see{' '}
        <span className="text-brand-purple font-medium">{localCategories.length}</span> of{' '}
        {ALL_DATA_CATEGORIES.length} data categories
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isSaving || isDefault}
        >
          <RotateCcw size={14} />
          Reset to Defaults
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          loading={isSaving}
          disabled={!hasChanges}
        >
          <Save size={14} />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
