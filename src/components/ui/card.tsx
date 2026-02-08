'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHover, scaleIn } from '@/lib/animations';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  animated?: boolean;
}

export function Card({ 
  children, 
  className, 
  onClick, 
  hoverable,
  animated = true,
  ...props 
}: CardProps) {
  if (!animated) {
    return (
      <div
        className={cn(
          'rounded-xl bg-surface border border-border-subtle shadow-sm',
          hoverable && 'hover:shadow-md hover:border-border transition-all cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={hoverable ? cardHover.hover : undefined}
      whileTap={hoverable ? cardHover.tap : undefined}
      className={cn(
        'rounded-xl bg-surface border border-border-subtle shadow-sm',
        hoverable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated stat card for dashboard
export function StatCard({ 
  icon: Icon,
  value,
  label,
  sublabel,
  trend,
  className,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'rounded-xl bg-surface border border-border-subtle p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-brand-purple/10">
          <Icon size={20} className="text-brand-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <motion.p 
            className="text-2xl font-bold text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
          >
            {value}
          </motion.p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{sublabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
