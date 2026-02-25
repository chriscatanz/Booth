'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Building2, AlertCircle, LogOut, CheckCircle } from 'lucide-react';
import { LoadingOverlay } from '@/components/ui/loading-spinner';

export function OrganizationSetup() {
  const { user, createOrganization, isLoading, error, clearError, signOut } = useAuthStore();
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [signupSuccessEmail, setSignupSuccessEmail] = useState<string | null>(null);
  const [redirectingToInvite, setRedirectingToInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);

  // Check for signup success message
  useEffect(() => {
    const email = sessionStorage.getItem('signup_success_email');
    if (email) {
      setSignupSuccessEmail(email);
      sessionStorage.removeItem('signup_success_email');
    }
  }, []);

  // Auto-redirect to invite page if a pending token exists — don't let the user
  // get stranded here when they were invited to an existing org.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite') || localStorage.getItem('pending_invite_token');
    if (token) {
      setRedirectingToInvite(true);
      localStorage.removeItem('pending_invite_token');
      router.push(`/invite?token=${token}`);
    }
  }, [router]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!orgName.trim()) return;
    await createOrganization(orgName.trim());
  };

  const handleUseInviteCode = () => {
    let token = inviteCode.trim();
    if (!token) return;
    // Accept full invite URLs too — extract the token param
    try {
      const url = new URL(token);
      token = url.searchParams.get('token') || token;
    } catch { /* not a URL, use as-is */ }
    localStorage.removeItem('pending_invite_token');
    router.push(`/invite?token=${token}`);
  };

  if (redirectingToInvite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay message="Redirecting to your invitation..." />
      </div>
    );
  }

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

        {/* Invitation escape hatch — for users who were invited but lost their token */}
        <div className="mt-6 pt-4 border-t border-border">
          {!showInviteInput ? (
            <button
              onClick={() => setShowInviteInput(true)}
              className="w-full text-sm text-brand-purple hover:underline text-center"
            >
              Have an invitation link or code?
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">Paste your invitation link or token:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="Paste invite link or token..."
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                />
                <Button variant="primary" size="sm" onClick={handleUseInviteCode} disabled={!inviteCode.trim()}>
                  Go
                </Button>
              </div>
              <p className="text-xs text-text-tertiary">
                You can paste the full invite URL or just the token portion.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
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
