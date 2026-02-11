'use client';

import React, { useEffect, useState, useRef, ReactNode } from 'react';
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
    user, 
    organizations,
    initialize 
  } = useAuthStore();
  
  const [isRedirectingToInvite, setIsRedirectingToInvite] = useState(false);
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(null);
  const hasCheckedInvite = useRef(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Check for pending invite token on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasCheckedInvite.current) {
      hasCheckedInvite.current = true;
      const token = localStorage.getItem('pending_invite_token');
      if (token) {
        setPendingInviteToken(token);
      }
    }
  }, []);

  // After auth, redirect to invite if we have a pending token
  useEffect(() => {
    if (isAuthenticated && user && pendingInviteToken && !isRedirectingToInvite) {
      setIsRedirectingToInvite(true);
      // Clear the token from storage now that we're redirecting
      localStorage.removeItem('pending_invite_token');
      router.push(`/invite?token=${pendingInviteToken}`);
    }
  }, [isAuthenticated, user, pendingInviteToken, router, isRedirectingToInvite]);

  // Show loading only when redirecting to invite
  // Don't show loading spinner for initial auth check - just show AuthPage
  // This prevents interrupting signup success screen
  if (isRedirectingToInvite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay message="Redirecting to invitation..." />
      </div>
    );
  }

  // Not authenticated (or still loading initial auth) - show auth page
  // AuthPage handles its own loading states for login/signup flows
  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  // Authenticated but no organization - show setup
  // Skip this if user has a pending invite (they'll join via invite)
  if (organizations.length === 0) {
    // Check both state and sessionStorage for pending invite
    if (!pendingInviteToken) {
      return <OrganizationSetup />;
    }
    // Has pending invite - show loading until redirect happens
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay message="Processing invitation..." />
      </div>
    );
  }

  // Fully authenticated with org - show app
  return <>{children}</>;
}
