'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Save, Upload, Send, Plus, Trash2, Edit3, Users, Calendar } from 'lucide-react';

interface SuccessFeedbackProps {
  show: boolean;
  message?: string;
  type?: 'save' | 'upload' | 'send' | 'create' | 'delete' | 'edit' | 'invite' | 'schedule' | 'generic';
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

const FEEDBACK_CONFIG = {
  save: { icon: Save, defaultMessage: 'Saved!', color: 'text-success' },
  upload: { icon: Upload, defaultMessage: 'Uploaded!', color: 'text-success' },
  send: { icon: Send, defaultMessage: 'Sent!', color: 'text-success' },
  create: { icon: Plus, defaultMessage: 'Created!', color: 'text-success' },
  delete: { icon: Trash2, defaultMessage: 'Deleted!', color: 'text-warning' },
  edit: { icon: Edit3, defaultMessage: 'Updated!', color: 'text-success' },
  invite: { icon: Users, defaultMessage: 'Invite sent!', color: 'text-success' },
  schedule: { icon: Calendar, defaultMessage: 'Scheduled!', color: 'text-success' },
  generic: { icon: Check, defaultMessage: 'Success!', color: 'text-success' },
};

export function SuccessFeedback({
  show,
  message,
  type = 'generic',
  duration = 2000,
  onComplete,
  className = ''
}: SuccessFeedbackProps) {
  const config = FEEDBACK_CONFIG[type];
  const IconComponent = config.icon;
  const displayMessage = message || config.defaultMessage;

  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 25,
        duration: 0.3 
      }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-success-bg text-success text-sm font-medium ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 600 }}
      >
        <IconComponent size={16} className={config.color} />
      </motion.div>
      <span>{displayMessage}</span>
    </motion.div>
  );
}

// Hook for managing success feedback state
export function useSuccessFeedback() {
  const [feedback, setFeedback] = React.useState<{
    show: boolean;
    message?: string;
    type?: SuccessFeedbackProps['type'];
  }>({ show: false });

  const showSuccess = (
    type: SuccessFeedbackProps['type'] = 'generic',
    message?: string,
    duration = 2000
  ) => {
    setFeedback({ show: true, message, type });
    
    setTimeout(() => {
      setFeedback({ show: false });
    }, duration);
  };

  const hideSuccess = () => {
    setFeedback({ show: false });
  };

  return {
    showSuccess,
    hideSuccess,
    isShowing: feedback.show,
    SuccessFeedback: (props: Omit<SuccessFeedbackProps, 'show' | 'type' | 'message'>) => (
      <SuccessFeedback
        show={feedback.show}
        type={feedback.type}
        message={feedback.message}
        {...props}
      />
    ),
  };
}

// Inline success feedback for buttons
interface ButtonSuccessFeedbackProps {
  isSuccess: boolean;
  successMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function ButtonSuccessFeedback({
  isSuccess,
  successMessage = 'Success!',
  children,
  className = ''
}: ButtonSuccessFeedbackProps) {
  return (
    <motion.div
      animate={isSuccess ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      <motion.div
        animate={{ 
          opacity: isSuccess ? [1, 0.8, 1] : 1,
          backgroundColor: isSuccess ? ['var(--success)', 'var(--success-bg)', 'var(--success)'] : undefined
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Check size={16} />
            {successMessage}
          </motion.div>
        ) : (
          children
        )}
      </motion.div>
    </motion.div>
  );
}

// Toast-style success notification
interface SuccessToastProps {
  show: boolean;
  message: string;
  type?: SuccessFeedbackProps['type'];
  onClose?: () => void;
  duration?: number;
}

export function SuccessToast({
  show,
  message,
  type = 'generic',
  onClose,
  duration = 4000
}: SuccessToastProps) {
  const config = FEEDBACK_CONFIG[type];
  const IconComponent = config.icon;

  React.useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={show ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`fixed top-4 right-4 z-50 ${show ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div className="bg-bg-secondary border border-border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center">
            <IconComponent size={16} className={config.color} />
          </div>
          <div className="flex-1">
            <p className="text-text-primary font-medium text-sm">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Hook for toast notifications
export function useSuccessToast() {
  const [toast, setToast] = React.useState<{
    show: boolean;
    message: string;
    type: SuccessFeedbackProps['type'];
  }>({ show: false, message: '', type: 'generic' });

  const showToast = (
    message: string,
    type: SuccessFeedbackProps['type'] = 'generic',
    duration = 4000
  ) => {
    setToast({ show: true, message, type });
    
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  return {
    showToast,
    hideToast,
    SuccessToast: () => (
      <SuccessToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    ),
  };
}