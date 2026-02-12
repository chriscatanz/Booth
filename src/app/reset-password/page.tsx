'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { PasswordStrength } from '@/components/ui/password-strength';
import { Lock, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'ready' | 'success' | 'error' | 'invalid'>('ready');
  const [error, setError] = useState<string | null>(null);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there's an error in the URL params, show error state
      const urlError = searchParams.get('error_description') || searchParams.get('error');
      if (urlError) {
        setStatus('invalid');
        setError(urlError);
        return;
      }
      
      // For password reset, Supabase creates a temporary session
      // If no session and no error, the link might be expired
      if (!session) {
        // Give it a moment for the session to be established
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession) {
            setStatus('invalid');
            setError('This password reset link has expired or is invalid. Please request a new one.');
          }
        }, 1000);
      }
    };
    
    checkSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (updateError) {
        throw updateError;
      }
      
      setStatus('success');
      
      // Redirect to app after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid/expired link state
  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-error" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Invalid or Expired Link
          </h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Success state
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
            className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle size={40} className="text-success" />
          </motion.div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Password Updated!
          </h1>
          <p className="text-text-secondary mb-4">
            Your password has been successfully changed. Redirecting you to the app...
          </p>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-purple/20 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-brand-purple" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Set New Password</h1>
          <p className="text-text-secondary mt-2">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple"
                placeholder="Enter new password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && <PasswordStrength password={password} />}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple"
              placeholder="Confirm new password"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-error mt-1">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
