'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import * as dataVisibilityService from '@/services/data-visibility-service';
import {
  RoleDataPermissions,
  DataCategory,
  DEFAULT_ROLE_PERMISSIONS,
  isCategoryVisible,
  isFieldVisible,
  ALL_DATA_CATEGORIES,
} from '@/types/data-visibility';

interface UseDataVisibilityReturn {
  // State
  permissions: RoleDataPermissions[];
  isLoading: boolean;
  error: string | null;
  
  // Checks
  canSeeCategory: (category: DataCategory) => boolean;
  canSeeField: (fieldName: string) => boolean;
  getVisibleCategories: () => DataCategory[];
  
  // Admin actions
  updatePermissions: (role: 'editor' | 'viewer', categories: DataCategory[]) => Promise<void>;
  resetToDefaults: (role: 'editor' | 'viewer') => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDataVisibility(): UseDataVisibilityReturn {
  const { organization, role, isAdmin } = useAuthStore();
  const [permissions, setPermissions] = useState<RoleDataPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load permissions
  const loadPermissions = useCallback(async () => {
    if (!organization?.id) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const perms = await dataVisibilityService.fetchRolePermissions(organization.id);
      setPermissions(perms);
    } catch (err) {
      console.error('Failed to load data visibility permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Check if current user can see a category
  const canSeeCategory = useCallback((category: DataCategory): boolean => {
    return isCategoryVisible(permissions, role, category);
  }, [permissions, role]);

  // Check if current user can see a specific field
  const canSeeField = useCallback((fieldName: string): boolean => {
    return isFieldVisible(permissions, role, fieldName);
  }, [permissions, role]);

  // Get all visible categories for current user
  const getVisibleCategories = useCallback((): DataCategory[] => {
    if (!role) return [];
    if (role === 'owner' || role === 'admin') return ALL_DATA_CATEGORIES;
    
    const rolePermission = permissions.find(p => p.role === role);
    if (rolePermission) {
      return rolePermission.visibleCategories;
    }
    
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  }, [permissions, role]);

  // Update permissions (admin only)
  const updatePermissions = useCallback(async (
    targetRole: 'editor' | 'viewer',
    categories: DataCategory[]
  ): Promise<void> => {
    if (!organization?.id || !isAdmin) {
      throw new Error('Not authorized to update permissions');
    }

    try {
      setError(null);
      await dataVisibilityService.updateRolePermissions(
        organization.id,
        targetRole,
        categories
      );
      await loadPermissions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update permissions';
      setError(message);
      throw err;
    }
  }, [organization?.id, isAdmin, loadPermissions]);

  // Reset to defaults (admin only)
  const resetToDefaults = useCallback(async (targetRole: 'editor' | 'viewer'): Promise<void> => {
    if (!organization?.id || !isAdmin) {
      throw new Error('Not authorized to reset permissions');
    }

    try {
      setError(null);
      await dataVisibilityService.resetRolePermissions(organization.id, targetRole);
      await loadPermissions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset permissions';
      setError(message);
      throw err;
    }
  }, [organization?.id, isAdmin, loadPermissions]);

  return {
    permissions,
    isLoading,
    error,
    canSeeCategory,
    canSeeField,
    getVisibleCategories,
    updatePermissions,
    resetToDefaults,
    refresh: loadPermissions,
  };
}

// Simple hook for just checking visibility (lighter weight)
export function useCanSee() {
  const { canSeeCategory, canSeeField, isLoading } = useDataVisibility();
  
  return {
    category: canSeeCategory,
    field: canSeeField,
    isLoading,
  };
}
