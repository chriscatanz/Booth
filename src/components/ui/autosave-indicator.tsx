'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle, Cloud } from 'lucide-react';
import { AutosaveStatus } from '@/hooks/use-autosave';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  hasUnsavedChanges: boolean;
}

export function AutosaveIndicator({ status, hasUnsavedChanges }: AutosaveIndicatorProps) {
  const getContent = () => {
    switch (status) {
      case 'saving':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 text-text-secondary"
          >
            <Loader2 size={12} className="animate-spin" />
            <span className="text-xs">Saving...</span>
          </motion.div>
        );
      case 'saved':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: [0.9, 1.1, 1],
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              scale: { 
                duration: 0.4, 
                times: [0, 0.5, 1], 
                ease: 'easeOut' 
              } 
            }}
            className="flex items-center gap-1.5 text-success"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.1, 
                type: 'spring', 
                stiffness: 500, 
                damping: 25 
              }}
            >
              <Check size={12} />
            </motion.div>
            <span className="text-xs font-medium">Saved</span>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 text-error"
          >
            <AlertCircle size={12} />
            <span className="text-xs">Save failed</span>
          </motion.div>
        );
      case 'idle':
      default:
        if (hasUnsavedChanges) {
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 text-warning"
            >
              <Cloud size={12} />
              <span className="text-xs">Unsaved changes</span>
            </motion.div>
          );
        }
        return null;
    }
  };

  return (
    <div className="h-5 min-w-[80px]">
      <AnimatePresence mode="wait">
        {getContent()}
      </AnimatePresence>
    </div>
  );
}
