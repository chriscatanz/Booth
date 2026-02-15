'use client';

import { useState, useEffect, useCallback } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
}

/**
 * Hook to track online/offline status of the browser.
 * Also tracks if the user was recently offline (to show reconnection messages).
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineAt: null,
  }));

  const handleOnline = useCallback(() => {
    setStatus(prev => ({
      isOnline: true,
      wasOffline: !prev.isOnline, // Mark as was offline if we were offline before
      lastOnlineAt: new Date(),
    }));

    // Clear the wasOffline flag after 5 seconds
    setTimeout(() => {
      setStatus(prev => ({
        ...prev,
        wasOffline: false,
      }));
    }, 5000);
  }, []);

  const handleOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: false,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial state
    setStatus(prev => ({
      ...prev,
      isOnline: navigator.onLine,
    }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}
