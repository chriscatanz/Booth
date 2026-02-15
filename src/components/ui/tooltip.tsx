'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).slice(2, 9)}`).current;

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(true), 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className={cn('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-describedby={isOpen ? tooltipId : undefined}
    >
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg max-w-xs whitespace-normal',
              positions[side]
            )}
          >
            {content}
            {/* Arrow */}
            <div className={cn(
              'absolute w-2 h-2 bg-gray-900 rotate-45',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1',
            )} aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface HelpTooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * A small help icon with tooltip - use next to form labels
 */
export function HelpTooltip({ content, side = 'top', className }: HelpTooltipProps) {
  return (
    <Tooltip content={content} side={side} className={className}>
      <HelpCircle 
        size={14} 
        className="text-text-tertiary hover:text-text-secondary cursor-help transition-colors" 
      />
    </Tooltip>
  );
}

interface LabelWithHelpProps {
  label: string;
  help: string;
  required?: boolean;
  className?: string;
}

/**
 * A form label with integrated help tooltip
 */
export function LabelWithHelp({ label, help, required, className }: LabelWithHelpProps) {
  return (
    <label className={cn('flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-1', className)}>
      {label}
      {required && <span className="text-error">*</span>}
      <HelpTooltip content={help} />
    </label>
  );
}
