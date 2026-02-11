'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await resetPassword(email);
    if (result) {
      setSuccess(true);
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
          <CheckCircle size={32} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
        <p className="text-text-secondary mt-2 mb-6">
          We&apos;ve sent password reset instructions to <strong>{email}</strong>.
        </p>
        <Button variant="outline" onClick={onBack}>
          Back to Sign In
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
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Reset password</h1>
        <p className="text-text-secondary mt-2">
          Enter your email and we'll send you instructions to reset your password.
        </p>
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
        >
          Send Reset Link
        </Button>
      </form>
    </motion.div>
  );
}
