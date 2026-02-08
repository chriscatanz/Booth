'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as authService from '@/services/auth-service';
import { Invitation } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { 
  CheckCircle, XCircle, Building2, UserPlus, 
  LogIn, AlertCircle, Mail
} from 'lucide-react';

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'error';

// Wrap in Suspense to handle useSearchParams during static generation
export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay message="Loading..." />
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const { user, isAuthenticated, initialize } = useAuthStore();
  
  const [status, setStatus] = useState<InviteStatus>('loading');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Check invitation validity
  useEffect(() => {
    async function checkInvite() {
      if (!token) {
        setStatus('invalid');
        setError('No invitation token provided');
        return;
      }

      try {
        const invite = await authService.fetchInvitationByToken(token);
        
        if (!invite) {
          setStatus('invalid');
          setError('This invitation link is invalid or has already been used');
          return;
        }

        if (new Date(invite.expiresAt) < new Date()) {
          setStatus('expired');
          setError('This invitation has expired');
          return;
        }

        setInvitation(invite);
        setStatus('valid');
      } catch (err) {
        setStatus('error');
        setError('Failed to verify invitation');
      }
    }

    checkInvite();
  }, [token]);

  // Initialize auth state
  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleAccept = async () => {
    if (!invitation || !user || !token) return;

    setIsAccepting(true);
    setError(null);

    try {
      await authService.acceptInvitation(token, user.id);
      setStatus('accepted');
      
      // Refresh auth state to include new org
      await initialize();
      
      // Redirect to app after short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      setIsAccepting(false);
    }
  };

  const handleSignIn = () => {
    // Store token in session storage so we can use it after login
    if (token) {
      sessionStorage.setItem('pending_invite_token', token);
    }
    router.push('/?returnTo=invite');
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay message="Verifying invitation..." />
      </div>
    );
  }

  // Invalid/Expired state
  if (status === 'invalid' || status === 'expired' || status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-error" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {status === 'expired' ? 'Invitation Expired' : 'Invalid Invitation'}
          </h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // Accepted state
  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle size={40} className="text-success" />
          </motion.div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Welcome to {invitation?.organization?.name}!
          </h1>
          <p className="text-text-secondary mb-4">
            You've joined as {invitation?.role}. Redirecting to the app...
          </p>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  // Valid invitation - show accept UI
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-purple/20 flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-brand-purple" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">You're Invited!</h1>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center">
              <Building2 size={24} className="text-brand-purple" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-lg">
                {invitation?.organization?.name}
              </p>
              <p className="text-sm text-text-secondary">
                Join as <span className="capitalize font-medium">{invitation?.role}</span>
              </p>
            </div>
          </div>

          <div className="text-sm text-text-secondary space-y-2">
            <p>As {invitation?.role === 'admin' ? 'an' : 'a'} <strong>{invitation?.role}</strong>, you'll be able to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              {invitation?.role === 'viewer' && (
                <>
                  <li>View all trade shows and reports</li>
                  <li>Export data and calendars</li>
                </>
              )}
              {invitation?.role === 'editor' && (
                <>
                  <li>Create and edit trade shows</li>
                  <li>Manage attendees and files</li>
                  <li>View all reports</li>
                </>
              )}
              {invitation?.role === 'admin' && (
                <>
                  <li>Full access to all features</li>
                  <li>Invite and manage team members</li>
                  <li>Delete trade shows</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-tertiary text-sm">
              <Mail size={16} className="text-text-tertiary" />
              <span className="text-text-secondary">Signed in as</span>
              <span className="text-text-primary font-medium">{user.email}</span>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleAccept}
              loading={isAccepting}
            >
              Accept Invitation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary text-center">
              Sign in or create an account to accept this invitation
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSignIn}
            >
              <LogIn size={16} /> Sign In to Accept
            </Button>
          </div>
        )}

        <p className="text-xs text-text-tertiary text-center mt-6">
          This invitation expires on {invitation && new Date(invitation.expiresAt).toLocaleDateString()}
        </p>
      </motion.div>
    </div>
  );
}
