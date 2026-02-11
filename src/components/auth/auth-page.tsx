'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './login-form';
import { SignUpForm } from './signup-form';
import { ForgotPasswordForm } from './forgot-password-form';
import { LandingPage } from '@/components/marketing/landing-page';
import { useToastStore } from '@/store/toast-store';

type AuthView = 'landing' | 'login' | 'signup' | 'forgot-password';

export function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToastStore();
  const returnTo = searchParams.get('returnTo');
  const mode = searchParams.get('mode'); // 'signup' or 'login'
  const authConfirmed = searchParams.get('auth_confirmed');
  const authError = searchParams.get('auth_error');
  
  // Skip landing page if explicitly coming from invite flow
  // Don't check localStorage here - let OrganizationSetup handle pending invites after auth
  const getInitialView = (): AuthView => {
    if (typeof window !== 'undefined') {
      // Go directly to login if email was just confirmed
      if (authConfirmed === 'true') {
        return 'login';
      }
      // Respect explicit mode parameter from invite flow
      if (returnTo === 'invite') {
        return mode === 'login' ? 'login' : 'signup';
      }
    }
    return 'landing';
  };
  
  const [view, setView] = useState<AuthView>(getInitialView);
  
  // Handle auth confirmation/error messages
  useEffect(() => {
    if (authConfirmed === 'true') {
      toast.success('Email confirmed! You can now sign in.');
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_confirmed');
      router.replace(url.pathname + url.search, { scroll: false });
    }
    if (authError) {
      toast.error(`Authentication error: ${authError}`);
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_error');
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [authConfirmed, authError, toast, router]);

  // Show landing page first
  if (view === 'landing') {
    return (
      <LandingPage 
        onGetStarted={() => setView('signup')}
        onSignIn={() => setView('login')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-bg items-center justify-center p-12">
        <div className="max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-purple/30">
              <span className="text-4xl font-black text-white">B</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-4">
              Booth
            </h1>
            <p className="text-white/70 text-lg">
              Your trade show command center. Track shows, manage budgets, measure ROI.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid grid-cols-3 gap-4"
          >
            {[
              { icon: '📅', label: 'Calendar' },
              { icon: '💰', label: 'Budgets' },
              { icon: '📈', label: 'Analytics' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 text-center">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-white/60 text-sm mt-1">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {view === 'login' && (
            <LoginForm
              key="login"
              onSwitchToSignUp={() => setView('signup')}
              onForgotPassword={() => setView('forgot-password')}
            />
          )}
          {view === 'signup' && (
            <SignUpForm
              key="signup"
              onSwitchToLogin={() => setView('login')}
              onSuccess={() => setView('login')}
            />
          )}
          {view === 'forgot-password' && (
            <ForgotPasswordForm
              key="forgot"
              onBack={() => setView('login')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
