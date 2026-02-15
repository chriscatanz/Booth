'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="text-center max-w-md space-y-6"
      >
        {/* Error Icon */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error-bg"
        >
          <AlertCircle size={32} className="text-error" />
        </motion.div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">
            Something went wrong
          </h1>
          <p className="text-text-secondary">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          {error.digest && (
            <p className="text-xs text-text-tertiary mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white font-semibold shadow-sm hover:shadow-lg hover:shadow-brand-purple/25 transition-all min-h-[44px]"
          >
            <RefreshCw size={16} />
            Try Again
          </motion.button>
          
          <Link href="/">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-tertiary text-text-primary font-semibold hover:bg-border-subtle transition-colors min-h-[44px]"
            >
              <Home size={16} />
              Go Home
            </motion.span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
