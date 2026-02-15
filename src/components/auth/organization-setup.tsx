'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Building2, AlertCircle, LogOut, Mail, CheckCircle } from 'lucide-react';
import * as authService from '@/services/auth-service';
import { Invitation } from '@/types/auth';

export function OrganizationSetup() {
  const { user, createOrganization, isLoading, error, clearError, signOut, initialize } = useAuthStore();
  const [orgName, setOrgName] = useState('');
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [, setLoadingInvites] = useState(true);
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);
  const [signupSuccessEmail, setSignupSuccessEmail] = useState<string | null>(null);

  // Check for signup success message (use sessionStorage for security)
  useEffect(() => {
    const email = sessionStorage.getItem('signup_success_email');
    if (email) {
      setSignupSuccessEmail(email);
      sessionStorage.removeItem('signup_success_email');
    }
  }, []);

  // Check for pending invitations
  useEffect(() => {
    async function checkInvites() {
      if (!user?.email) return;
      
      setLoadingInvites(true);
      try {
        // Check URL params first
        const params = new URLSearchParams(window.location.search);
        let token = params.get('invite');
        
        // Also check localStorage (set by invite page before auth redirect)
        if (!token) {
          token = localStorage.getItem('pending_invite_token');
        }
        
        if (token) {
          const invite = await authService.fetchInvitationByToken(token);
          if (invite) {
            setPendingInvites([invite]);
          }
          // Clean up localStorage after reading
          localStorage.removeItem('pending_invite_token');
        }
      } catch (err) {
        console.error('Failed to check invites:', err);
      }
      setLoadingInvites(false);
    }
    
    checkInvites();
  }, [user?.email]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!orgName.trim()) return;
    await createOrganization(orgName.trim());
  };

  const handleAcceptInvite = async (invite: Invitation) => {
    if (!user) return;
    
    setAcceptingInvite(invite.id);
    try {
      await authService.acceptInvitation(invite.token, user.id);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh auth state
      await initialize();
    } catch (err) {
      console.error('Failed to accept invite:', err);
    }
    setAcceptingInvite(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-purple/20 flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-brand-purple" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome, {user?.fullName || 'there'}!</h1>
          <p className="text-text-secondary mt-2">
            Create an organization to get started, or accept an invitation.
          </p>
        </div>

        {/* Onboarding Progress */}
        <div className="mb-8">
          <ProgressSteps
            currentStep={2}
            totalSteps={3}
            steps={['Account Created', 'Organization Setup', 'Complete Setup']}
            showStepLabels={true}
          />
        </div>

        {/* Signup Success Message */}
        {signupSuccessEmail && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-success-bg border border-success/20"
          >
            <div className="flex items-center gap-2 text-success">
              <CheckCircle size={16} />
              <span className="font-medium">Account created!</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Your email <strong>{signupSuccessEmail}</strong> has been verified.
            </p>
          </motion.div>
        )}

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Mail size={14} />
              Pending Invitations
            </h2>
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="p-4 rounded-lg bg-brand-purple/10 border border-brand-purple/20">
                <p className="text-sm font-medium text-text-primary">
                  {invite.organization?.name || 'Organization'}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Invited as <span className="capitalize">{invite.role}</span>
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => handleAcceptInvite(invite)}
                  loading={acceptingInvite === invite.id}
                >
                  Accept Invitation
                </Button>
              </div>
            ))}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background text-text-tertiary">or</span>
              </div>
            </div>
          </div>
        )}

        {/* Create Organization Form */}
        <form onSubmit={handleCreateOrg} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-secondary">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Corporation"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
            />
            <p className="text-xs text-text-tertiary">
              This is usually your company name
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading}
          >
            Create Organization
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 w-full text-sm text-text-secondary hover:text-text-primary"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
