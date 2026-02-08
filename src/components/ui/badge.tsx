'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  animated?: boolean;
}

export function Badge({ children, color, className, animated = true }: BadgeProps) {
  if (!animated) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          className
        )}
        style={color ? { backgroundColor: `${color}1A`, color } : undefined}
      >
        {children}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        className
      )}
      style={color ? { backgroundColor: `${color}1A`, color } : undefined}
    >
      {children}
    </motion.span>
  );
}

// Status-specific badge with pulse animation for active
export function StatusBadge({ status }: { status: string | null }) {
  const colors: Record<string, string> = {
    Planning: '#8250DF',
    Logistics: '#BF8700',
    Ready: '#1A7F37',
    Active: '#0969DA',
    'Post-Show': '#CF222E',
    Closed: '#656D76',
  };
  const color = status ? colors[status] ?? '#656D76' : '#656D76';
  const isActive = status === 'Active';
  
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {isActive && (
        <motion.span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1] 
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
      {status || 'No Status'}
    </motion.span>
  );
}

// Countdown badge with urgency animation
export function CountdownBadge({ days }: { days: number }) {
  const isUrgent = days <= 7;
  const isImminent = days <= 3;
  
  let color = '#656D76';
  if (isImminent) color = '#CF222E';
  else if (isUrgent) color = '#BF8700';
  else if (days <= 14) color = '#0969DA';
  
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isImminent ? [1, 1.05, 1] : 1 
      }}
      transition={{
        opacity: { duration: 0.2 },
        scale: isImminent ? { 
          duration: 0.8, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        } : { duration: 0.2 }
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days} days`}
    </motion.span>
  );
}
