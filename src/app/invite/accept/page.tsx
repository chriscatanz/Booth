'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import * as authService from '@/services/auth-service';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { AlertCircle, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

type PageStatus = 'loading' | 'set-password' | 'success' | 'error';

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingOverlay message="Loading..." />
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { initialize } = useAuthStore();

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The org invite token (from our redirectTo URL)
  const orgToken = searchParams.get('token');

  // Supabase client — will auto-detect the #access_token hash on mount
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function handleHash() {
      // Supabase JS client parses the URL hash automatically when detectSessionInUrl is true (default).
      // We just need to wait for the session to be established.
      const hash = window.location.hash;

      // Check if this looks like a Supabase invite callback
      if (!hash.includes('access_token') || !hash.includes('type=invite')) {
        setErrorMessage('Invalid or missing invitation link. Please request a new invitation.');
        setStatus('error');
        return;
      }

      if (!orgToken) {
        setErrorMessage('Missing organization invite token. Please request a new invitation.');
        setStatus('error');
        return;
      }

      // Give Supabase a moment to parse the hash and set the session
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setErrorMessage('Could not establish session from invite link. The link may be expired or already used.');
        setStatus('error');
        return;
      }

      setStatus('set-password');
    }

    handleHash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgToken]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Set the user's password (they're already authenticated via the invite token in the hash)
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw new Error(updateError.message);
      }

      // Accept the org invitation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Could not retrieve user after password update.');

      if (orgToken) {
        await authService.acceptInvitation(orgToken, user.id);
      }

      // Refresh auth store so the new org is loaded
      await initialize();

      setStatus('success');

      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay message="Verifying your invitation..." />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-error" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Invitation Error</h1>
          <p className="text-text-secondary mb-6">{errorMessage}</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (status === 'success') {
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">You&apos;re in!</h1>
          <p className="text-text-secondary mb-4">
            Your account is ready. Redirecting to the app...
          </p>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  // set-password state
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Set Your Password</h1>
          <p className="text-text-secondary mt-2">
            Choose a password to complete your account setup.
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-error-bg border border-error/20 rounded-lg p-4 flex items-start gap-2"
            >
              <AlertCircle size={16} className="text-error mt-0.5 flex-shrink-0" />
              <p className="text-error text-sm">{errorMessage}</p>
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-secondary">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-secondary">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
          >
            Set Password &amp; Join
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
