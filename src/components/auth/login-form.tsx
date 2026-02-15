'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
  onBack?: () => void;
}

export function LoginForm({ onSwitchToSignUp, onForgotPassword, onBack }: LoginFormProps) {
  const { signIn, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const result = await signIn(email, password);
    
    // Show success animation briefly before redirect
    if (result && !useAuthStore.getState().error) {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    }
  };

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
        <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
        <p className="text-text-secondary mt-2">Sign in to your account</p>
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
                      <p>• Check your password and try again</p>
                      <p>• Use "Forgot password?" if you can't remember it</p>
                    </>
                  ) : error.toLowerCase().includes('email') ? (
                    <>
                      <p>• Verify your email address is correct</p>
                      <p>• Make sure your account exists</p>
                    </>
                  ) : error.toLowerCase().includes('network') || error.toLowerCase().includes('connection') ? (
                    <>
                      <p>• Check your internet connection</p>
                      <p>• Try refreshing the page</p>
                    </>
                  ) : (
                    <>
                      <p>• Double-check your email and password</p>
                      <p>• Try refreshing the page if the issue persists</p>
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
                  // Retry the last login attempt
                  if (email && password) {
                    handleSubmit(new Event('submit') as any);
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

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-brand-purple hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <motion.div
          animate={isSuccess ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className={`w-full transition-colors ${isSuccess ? 'bg-success hover:bg-success' : ''}`}
            loading={isLoading}
          >
            {isSuccess ? '✓ Signed In!' : 'Sign In'}
          </Button>
        </motion.div>

        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-brand-purple hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </form>
    </motion.div>
  );
}
