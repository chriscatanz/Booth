'use client';

import React, { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { UserRole, hasMinRole } from '@/types/auth';

interface PermissionGateProps {
  /** Minimum role required to see this content */
  requires: UserRole;
  /** Content to show if user has permission */
  children: ReactNode;
  /** Optional fallback content if user lacks permission */
  fallback?: ReactNode;
  /** If true, shows nothing instead of fallback when no permission */
  hideOnly?: boolean;
}

/**
 * Conditionally renders content based on user's role.
 * 
 * Usage:
 * <PermissionGate requires="editor">
 *   <Button>Edit Show</Button>
 * </PermissionGate>
 * 
 * <PermissionGate requires="admin" fallback={<span>View only</span>}>
 *   <Button>Delete</Button>
 * </PermissionGate>
 */
export function PermissionGate({ 
  requires, 
  children, 
  fallback = null,
  hideOnly = false,
}: PermissionGateProps) {
  const { role, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !role) {
    return hideOnly ? null : <>{fallback}</>;
  }

  const hasPermission = hasMinRole(role, requires);
  
  if (hasPermission) {
    return <>{children}</>;
  }

  return hideOnly ? null : <>{fallback}</>;
}

/**
 * Hook to check permissions in logic
 */
export function usePermission(requires: UserRole): boolean {
  const { role, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !role) return false;
  return hasMinRole(role, requires);
}

/**
 * Higher-order component version
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requires: UserRole,
  FallbackComponent?: React.ComponentType
) {
  return function PermissionWrapper(props: P) {
    const hasPermission = usePermission(requires);
    
    if (!hasPermission) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }
    
    return <WrappedComponent {...props} />;
  };
}
