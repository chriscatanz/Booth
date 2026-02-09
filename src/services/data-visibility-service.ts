// Data Visibility Service - Manage role-based data permissions

import { supabase } from '@/lib/supabase';
import { 
  RoleDataPermissions, 
  DataCategory, 
  DEFAULT_ROLE_PERMISSIONS,
  ALL_DATA_CATEGORIES 
} from '@/types/data-visibility';
import { UserRole } from '@/types/auth';

// Fetch all role permissions for an organization
export async function fetchRolePermissions(organizationId: string): Promise<RoleDataPermissions[]> {
  const { data, error } = await supabase
    .from('role_data_permissions')
    .select('*')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching role permissions:', error);
    throw error;
  }

  return (data || []).map(row => ({
    id: row.id,
    organizationId: row.organization_id,
    role: row.role as UserRole,
    visibleCategories: row.visible_categories as DataCategory[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// Get permissions for a specific role (with defaults if not configured)
export async function getRolePermissions(
  organizationId: string, 
  role: UserRole
): Promise<DataCategory[]> {
  // Owner and admin always see everything
  if (role === 'owner' || role === 'admin') {
    return ALL_DATA_CATEGORIES;
  }

  const { data, error } = await supabase
    .from('role_data_permissions')
    .select('visible_categories')
    .eq('organization_id', organizationId)
    .eq('role', role)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching role permissions:', error);
  }

  // Return custom config or defaults
  return data?.visible_categories as DataCategory[] ?? DEFAULT_ROLE_PERMISSIONS[role];
}

// Update permissions for a role (upsert)
export async function updateRolePermissions(
  organizationId: string,
  role: UserRole,
  visibleCategories: DataCategory[]
): Promise<void> {
  // Can't modify owner/admin permissions (they always see everything)
  if (role === 'owner' || role === 'admin') {
    throw new Error('Cannot modify owner or admin permissions');
  }

  const { error } = await supabase
    .from('role_data_permissions')
    .upsert({
      organization_id: organizationId,
      role,
      visible_categories: visibleCategories,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'organization_id,role',
    });

  if (error) {
    console.error('Error updating role permissions:', error);
    throw error;
  }
}

// Reset permissions for a role to defaults
export async function resetRolePermissions(
  organizationId: string,
  role: UserRole
): Promise<void> {
  if (role === 'owner' || role === 'admin') {
    throw new Error('Cannot modify owner or admin permissions');
  }

  const { error } = await supabase
    .from('role_data_permissions')
    .delete()
    .eq('organization_id', organizationId)
    .eq('role', role);

  if (error) {
    console.error('Error resetting role permissions:', error);
    throw error;
  }
}

// Delete all custom permissions for an organization
export async function deleteAllRolePermissions(organizationId: string): Promise<void> {
  const { error } = await supabase
    .from('role_data_permissions')
    .delete()
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting role permissions:', error);
    throw error;
  }
}
