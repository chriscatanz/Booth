'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white shadow-sm hover:shadow-lg hover:shadow-brand-purple/25',
  secondary: 'bg-bg-tertiary text-text-primary hover:bg-border-subtle shadow-sm',
  destructive: 'bg-gradient-to-r from-error to-red-700 text-white hover:shadow-lg hover:shadow-error/25 shadow-sm',
  ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
  outline: 'border-2 border-border bg-transparent text-text-primary hover:bg-bg-tertiary hover:border-brand-purple/50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-2.5 text-xs min-h-[44px]', // 44px min for mobile touch
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <motion.svg 
          className="h-4 w-4" 
          viewBox="0 0 24 24"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </motion.svg>
      )}
      {children}
    </motion.button>
  );
}

// Icon button variant - min 44px for mobile touch targets
interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'size' | 'loading'> {
  'aria-label': string; // Required for accessibility
}

export function IconButton({
  children,
  className,
  disabled,
  'aria-label': ariaLabel,
  ...props
}: IconButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center',
        className
      )}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </motion.button>
  );
}
