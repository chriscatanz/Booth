'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { AuthPage } from './auth-page';
import { OrganizationSetup } from './organization-setup';
import { LoadingOverlay } from '@/components/ui/loading-spinner';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    organization,
    organizations,
    initialize 
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // After auth, check for pending invite token
  useEffect(() => {
    if (isAuthenticated && user && typeof window !== 'undefined') {
      const pendingToken = sessionStorage.getItem('pending_invite_token');
      if (pendingToken) {
        sessionStorage.removeItem('pending_invite_token');
        router.push(`/invite?token=${pendingToken}`);
      }
    }
  }, [isAuthenticated, user, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay message="Loading..." />
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  // Authenticated but no organization - show setup
  // Skip this if user has a pending invite (they'll join via invite)
  if (organizations.length === 0) {
    const hasPendingInvite = typeof window !== 'undefined' && 
      sessionStorage.getItem('pending_invite_token');
    if (!hasPendingInvite) {
      return <OrganizationSetup />;
    }
  }

  // Fully authenticated with org - show app
  return <>{children}</>;
}
