'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Skeleton({ 
  className, 
  width, 
  height,
  rounded = 'md' 
}: SkeletonProps) {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <motion.div
      className={cn(
        'bg-bg-tertiary overflow-hidden',
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
    >
      <motion.div
        className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: 'linear'
        }}
      />
    </motion.div>
  );
}

// Skeleton card for loading states
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-xl border border-border-subtle bg-surface', className)}>
      <div className="flex items-start gap-3">
        <Skeleton width={40} height={40} rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="40%" />
        </div>
      </div>
    </div>
  );
}

// Skeleton list item
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('px-3 py-2.5 rounded-lg', className)}>
      <div className="flex items-center justify-between gap-2">
        <Skeleton height={18} width="70%" />
        <Skeleton height={18} width={32} rounded="full" />
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <Skeleton height={14} width="40%" />
        <Skeleton height={14} width="30%" />
      </div>
    </div>
  );
}

// Skeleton text lines
export function SkeletonText({ 
  lines = 3,
  className 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height={16} 
          width={i === lines - 1 ? '60%' : '100%'} 
        />
      ))}
    </div>
  );
}
