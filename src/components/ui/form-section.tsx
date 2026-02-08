'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface FormSectionProps {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

export function FormSection({ title, icon: Icon, defaultOpen = false, children, className, badge }: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('border border-border-subtle rounded-2xl bg-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200', className)}
    >
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ backgroundColor: 'rgba(166, 43, 159, 0.03)' }}
        whileTap={{ scale: 0.995 }}
        className="w-full flex items-center gap-3 px-5 py-4 transition-colors"
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <ChevronDown size={16} className="text-text-secondary" />
        </motion.div>
        {Icon && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="p-2 rounded-lg bg-brand-purple/10"
          >
            <Icon size={16} className="text-brand-purple" />
          </motion.div>
        )}
        <span className="text-sm font-bold text-text-primary flex-1 text-left">{title}</span>
        {badge}
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: 'auto', 
              opacity: 1,
              transition: {
                height: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2, delay: 0.1 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.15 }
              }
            }}
            className="overflow-hidden"
          >
            <motion.div 
              className="px-5 pb-5 pt-2 space-y-4 border-t border-border-subtle bg-gradient-to-b from-bg-secondary/50 to-transparent"
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
