'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/toast-store';
import type { Toast } from '@/store/toast-store';
import { ToastType } from '@/types/enums';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notification } from '@/lib/animations';

const iconMap = {
  [ToastType.Success]: CheckCircle,
  [ToastType.Error]: AlertCircle,
  [ToastType.Warning]: AlertTriangle,
  [ToastType.Info]: Info,
};

const colorMap = {
  [ToastType.Success]: 'border-l-success bg-success-bg',
  [ToastType.Error]: 'border-l-error bg-error-bg',
  [ToastType.Warning]: 'border-l-warning bg-warning-bg',
  [ToastType.Info]: 'border-l-info bg-info-bg',
};

const iconColorMap = {
  [ToastType.Success]: 'text-success',
  [ToastType.Error]: 'text-error',
  [ToastType.Warning]: 'text-warning',
  [ToastType.Info]: 'text-info',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore(s => s.removeToast);
  const Icon = iconMap[toast.type];

  return (
    <motion.div
      layout
      variants={notification}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ scale: 1.02, x: -4 }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg min-w-[320px] max-w-[420px] backdrop-blur-sm',
        colorMap[toast.type]
      )}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
      >
        <Icon size={18} className={cn('mt-0.5 shrink-0', iconColorMap[toast.type])} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm font-medium text-text-primary"
        >
          {toast.title}
        </motion.p>
        {toast.message && (
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-text-secondary mt-0.5"
          >
            {toast.message}
          </motion.p>
        )}
      </div>
      <motion.button 
        onClick={() => removeToast(toast.id)} 
        aria-label="Dismiss notification"
        whileHover={{ scale: 1.2, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
      >
        <X size={14} className="text-text-tertiary" />
      </motion.button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);

  return (
    <div 
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
