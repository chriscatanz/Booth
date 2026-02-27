'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { PasswordStrength, validatePassword } from '@/components/ui/password-strength';
import { recordConsent } from '@/services/auth-service';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
  onBack?: () => void;
}

export function SignUpForm({ onSwitchToLogin, onBack }: SignUpFormProps) {
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const { valid, errors } = validatePassword(password);
    if (!valid) {
      useAuthStore.getState().setError(`Password requirements not met: ${errors[0]}`);
      return;
    }

    try {
      setIsProcessing(true);
      const result = await signUp(email, password, fullName);
      if (result?.user) {
        // Record ToS and Privacy consent with timestamp, version, and IP
        await recordConsent(result.user.id);
        
        // Show verification screen immediately — no timeout so it can't be lost
        // if the parent re-renders before the timer fires
        sessionStorage.setItem('signup_success_email', email);
        setIsProcessing(false);
        setSuccess(true);
      }
    } catch (err) {
      console.error('[SignUp] Error:', err);
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
          <Mail size={32} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Verify your email</h1>
        <p className="text-text-secondary mt-2 mb-2">
          We&apos;ve sent a confirmation link to:
        </p>
        <p className="text-text-primary font-medium mb-4">{email}</p>
        <div className="bg-bg-tertiary rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Next steps:</strong>
          </p>
          <ol className="text-sm text-text-secondary mt-2 space-y-1 list-decimal list-inside">
            <li>Check your inbox (and spam folder)</li>
            <li>Click the confirmation link in the email</li>
            <li>Sign in with your new account</li>
          </ol>
        </div>
        <Button variant="outline" onClick={onSwitchToLogin}>
          Go to Sign In
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to home
        </button>
      )}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Create an account</h1>
        <p className="text-text-secondary mt-2">Start managing your trade shows</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-error-bg border border-error/20 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-error mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-error text-sm font-medium">{error}</p>
                <div className="mt-2 text-xs text-error/80">
                  {error.toLowerCase().includes('password') ? (
                    <>
                      <p>• Use at least 8 characters with mixed case</p>
                      <p>• Include numbers and special characters</p>
                    </>
                  ) : error.toLowerCase().includes('email') ? (
                    <>
                      <p>• Make sure the email format is correct</p>
                      <p>• This email might already be registered</p>
                    </>
                  ) : error.toLowerCase().includes('network') || error.toLowerCase().includes('connection') ? (
                    <>
                      <p>• Check your internet connection</p>
                      <p>• Try refreshing the page</p>
                    </>
                  ) : (
                    <>
                      <p>• Check all fields are filled correctly</p>
                      <p>• Make sure you&apos;ve agreed to the terms</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  clearError();
                  // Focus on the first input that might have an issue
                  if (error.toLowerCase().includes('email')) {
                    (document.querySelector('input[type="email"]') as HTMLInputElement)?.focus();
                  } else if (error.toLowerCase().includes('password')) {
                    (document.querySelector('input[type="password"]') as HTMLInputElement)?.focus();
                  }
                }}
                className="text-xs border-error/30 text-error hover:bg-error/10"
              >
                Try Again
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearError}
                className="text-xs border-error/30 text-error hover:bg-error/10"
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-secondary">Full Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-secondary">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-secondary">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
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
          <PasswordStrength password={password} />
        </div>

        {/* Terms & Privacy Consent */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border bg-bg-tertiary accent-brand-purple"
          />
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="text-brand-purple hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="text-brand-purple hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <motion.div
          animate={isProcessing ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className={`w-full transition-colors ${isProcessing ? 'bg-success hover:bg-success' : ''}`}
            loading={isLoading}
            disabled={!agreedToTerms}
          >
            {isProcessing ? '✓ Account Created!' : 'Create Account'}
          </Button>
        </motion.div>

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-brand-purple hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </form>
    </motion.div>
  );
}
