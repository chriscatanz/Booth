'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-warning-bg border-b border-warning/20 overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2">
            <WifiOff size={14} className="text-warning" />
            <span className="text-sm font-medium text-warning">
              You&apos;re offline. Some features may be unavailable.
            </span>
          </div>
        </motion.div>
      )}
      
      {isOnline && wasOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-success-bg border-b border-success/20 overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2">
            <Wifi size={14} className="text-success" />
            <span className="text-sm font-medium text-success">
              Back online
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
