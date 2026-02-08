'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // For iOS, show the manual install instructions after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // For other browsers, listen for the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay to not be too aggressive
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 safe-bottom sm:left-auto sm:right-4 sm:max-w-sm"
      >
        <div className="bg-surface-elevated border border-border rounded-2xl shadow-xl p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center shrink-0">
              <Download size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary text-sm">Install Booth</h3>
              {isIOS ? (
                <p className="text-xs text-text-secondary mt-1">
                  Tap <span className="inline-flex items-center px-1.5 py-0.5 bg-bg-tertiary rounded text-text-primary font-medium">Share</span> then <span className="font-medium text-text-primary">&quot;Add to Home Screen&quot;</span>
                </p>
              ) : (
                <p className="text-xs text-text-secondary mt-1">
                  Install the app for quick access and offline support.
                </p>
              )}
            </div>
          </div>

          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-purple/25 transition-shadow"
            >
              Install App
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
