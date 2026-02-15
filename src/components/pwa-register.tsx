'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Download } from 'lucide-react';

export function PWARegister() {
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const handleUpdate = useCallback(() => {
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload the page to activate the new service worker
    window.location.reload();
  }, [registration]);

  const dismissUpdate = useCallback(() => {
    setShowUpdateToast(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW registered:', reg.scope);
          setRegistration(reg);
          
          // Check if there's already a waiting worker
          if (reg.waiting) {
            setShowUpdateToast(true);
            return;
          }

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, show update prompt
                  console.log('New content available, showing update toast');
                  setShowUpdateToast(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.log('SW registration failed:', err);
        });

      // Listen for controller changes (when another tab triggered the update)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  return (
    <AnimatePresence>
      {showUpdateToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
        >
          <div className="bg-surface border border-border rounded-xl shadow-lg p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="shrink-0 p-2 rounded-lg bg-brand-purple/10">
                <Download size={20} className="text-brand-purple" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-text-primary">
                  Update Available
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  A new version of Booth is ready. Refresh to get the latest features.
                </p>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white text-xs font-semibold hover:shadow-lg hover:shadow-brand-purple/25 transition-all"
                  >
                    <RefreshCw size={12} />
                    Refresh Now
                  </motion.button>
                  <button
                    onClick={dismissUpdate}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={dismissUpdate}
                className="shrink-0 p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
