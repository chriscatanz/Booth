'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const CONSENT_KEY = 'booth_cookie_consent';

interface ConsentState {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    essential: true, // Always required
    functional: true,
    analytics: false,
  } as ConsentState);

  useEffect(() => {
    // Check if user has already consented
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay to avoid layout shift on load
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const saveConsent = (consentState: Partial<ConsentState>) => {
    const fullConsent: ConsentState = {
      essential: true,
      functional: consentState.functional ?? true,
      analytics: consentState.analytics ?? false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent));
    setShowBanner(false);
  };

  const acceptAll = () => {
    saveConsent({ functional: true, analytics: true });
  };

  const acceptEssential = () => {
    saveConsent({ functional: false, analytics: false });
  };

  const savePreferences = () => {
    saveConsent(consent);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="max-w-4xl mx-auto bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Main Banner */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0">
                <Cookie size={20} className="text-brand-purple" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">We value your privacy</h3>
                <p className="text-sm text-text-secondary">
                  We use cookies to enhance your experience, maintain your session, and understand how you use our app. 
                  You can customize your preferences or accept all cookies.{' '}
                  <Link href="/privacy" className="text-brand-purple hover:underline">
                    Learn more
                  </Link>
                </p>
              </div>
            </div>

            {/* Cookie Details (expandable) */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-border overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Essential */}
                    <label className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Essential Cookies</p>
                        <p className="text-xs text-text-tertiary">Required for the app to function (authentication, security)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-4 h-4 accent-brand-purple"
                      />
                    </label>

                    {/* Functional */}
                    <label className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary cursor-pointer hover:bg-bg-secondary transition-colors">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Functional Cookies</p>
                        <p className="text-xs text-text-tertiary">Remember your preferences and settings</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={consent.functional}
                        onChange={(e) => setConsent({ ...consent, functional: e.target.checked })}
                        className="w-4 h-4 accent-brand-purple"
                      />
                    </label>

                    {/* Analytics */}
                    <label className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary cursor-pointer hover:bg-bg-secondary transition-colors">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Analytics Cookies</p>
                        <p className="text-xs text-text-tertiary">Help us understand how you use the app (currently not in use)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={consent.analytics}
                        onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                        className="w-4 h-4 accent-brand-purple"
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" onClick={acceptAll}>
                Accept All
              </Button>
              <Button variant="outline" size="sm" onClick={acceptEssential}>
                Essential Only
              </Button>
              {showDetails ? (
                <Button variant="ghost" size="sm" onClick={savePreferences}>
                  Save Preferences
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(true)}>
                  Customize
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
