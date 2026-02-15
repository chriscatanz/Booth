'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <motion.svg
      role="status"
      aria-label="Loading"
      className={cn('text-brand-purple', sizeClasses[size], className)}
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </motion.svg>
  );
}

// Dots loading animation
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-brand-purple"
          aria-hidden="true"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Pulse loading
export function LoadingPulse({ className }: { className?: string }) {
  return (
    <motion.div
      role="status"
      aria-label="Loading"
      className={cn('w-4 h-4 rounded-full bg-brand-purple', className)}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <motion.div 
      role="status"
      aria-label={message}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center h-full min-h-[200px]"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo animation */}
        <motion.div
          className="relative w-16 h-16"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-brand-purple/20"
          />
          {/* Spinning arc */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-purple"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          {/* Center dot */}
          <motion.div
            className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-brand-purple"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        
        <motion.p 
          className="text-sm text-text-secondary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
}

// Skeleton pulse for loading states
export function LoadingCard() {
  return (
    <div className="p-4 rounded-xl border border-border-subtle bg-surface animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-bg-tertiary" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-bg-tertiary rounded w-3/4" />
          <div className="h-4 bg-bg-tertiary rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
