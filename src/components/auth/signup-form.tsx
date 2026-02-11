'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { PasswordStrength, validatePassword } from '@/components/ui/password-strength';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export function SignUpForm({ onSwitchToLogin, onSuccess }: SignUpFormProps) {
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const { valid, errors } = validatePassword(password);
    if (!valid) {
      useAuthStore.getState().setError(`Password requirements not met: ${errors[0]}`);
      return;
    }

    try {
      const result = await signUp(email, password, fullName);
      if (result) {
        // Store success flag for display even if component unmounts
        // Use sessionStorage (cleared on tab close) instead of localStorage for security
        sessionStorage.setItem('signup_success_email', email);
        setSuccess(true);
      }
    } catch (err) {
      console.error('[SignUp] Error:', err);
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
          We've sent a confirmation link to:
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
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Create an account</h1>
        <p className="text-text-secondary mt-2">Start managing your trade shows</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            <a href="/terms" target="_blank" className="text-brand-purple hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-brand-purple hover:underline">
              Privacy Policy
            </a>
          </span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
          disabled={!agreedToTerms}
        >
          Create Account
        </Button>

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
