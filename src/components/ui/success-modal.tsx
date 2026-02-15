'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Users, Calendar, Crown, Check, ArrowRight } from 'lucide-react';
import { Button } from './button';
import { Confetti, ConfettiPresets } from './confetti';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: keyof typeof MILESTONE_CONFIG;
  title?: string;
  description?: string;
  customActions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'outline';
  }>;
}

const MILESTONE_CONFIG = {
  'first-show': {
    icon: Calendar,
    title: 'Your First Show is Created! 🎉',
    description: 'Welcome to the world of trade show management! You\'re on your way to organizing amazing events.',
    confetti: ConfettiPresets.celebration,
    primaryAction: { label: 'Start Planning', variant: 'primary' as const },
    secondaryAction: { label: 'View Show', variant: 'outline' as const },
    tips: [
      'Add your first booth layout to visualize your space',
      'Invite team members to collaborate',
      'Set up your essential timeline milestones'
    ]
  },
  'show-complete': {
    icon: Trophy,
    title: 'Show Completed Successfully! 🏆',
    description: 'Another successful event in the books! Your hard work has paid off.',
    confetti: ConfettiPresets.success,
    primaryAction: { label: 'View Results', variant: 'primary' as const },
    secondaryAction: { label: 'Plan Next Show', variant: 'outline' as const },
    tips: [
      'Review analytics and attendee feedback',
      'Archive important documents and assets',
      'Share success metrics with your team'
    ]
  },
  'first-invite': {
    icon: Users,
    title: 'First Team Member Invited! 👥',
    description: 'Collaboration makes everything better. Your team is growing!',
    confetti: ConfettiPresets.milestone,
    primaryAction: { label: 'Manage Team', variant: 'primary' as const },
    secondaryAction: { label: 'Invite More', variant: 'outline' as const },
    tips: [
      'Set appropriate permissions for each team member',
      'Create shared workspaces for collaboration',
      'Use comments and mentions to communicate effectively'
    ]
  },
  'subscription-upgrade': {
    icon: Crown,
    title: 'Welcome to Pro! ✨',
    description: 'You\'ve unlocked premium features to take your trade shows to the next level.',
    confetti: ConfettiPresets.celebration,
    primaryAction: { label: 'Explore Features', variant: 'primary' as const },
    secondaryAction: { label: 'Continue', variant: 'outline' as const },
    tips: [
      'Access advanced analytics and reporting',
      'Create unlimited shows and team members',
      'Priority support is now available'
    ]
  }
};

export function SuccessModal({ 
  isOpen, 
  onClose, 
  milestone, 
  title: customTitle,
  description: customDescription,
  customActions 
}: SuccessModalProps) {
  const config = MILESTONE_CONFIG[milestone];
  const IconComponent = config.icon;

  // Auto-close after 10 seconds if user doesn't interact
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti */}
          <Confetti
            show={isOpen}
            {...config.confetti}
            onComplete={() => {}} // Don't auto-close modal when confetti ends
          />
          
          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative bg-bg-secondary border border-border rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <X size={20} />
              </button>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4"
              >
                <IconComponent size={32} className="text-success" />
              </motion.div>

              {/* Title & Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-6"
              >
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  {customTitle || config.title}
                </h2>
                <p className="text-text-secondary">
                  {customDescription || config.description}
                </p>
              </motion.div>

              {/* Tips */}
              {config.tips && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-bg-tertiary rounded-lg p-4 mb-6"
                >
                  <h3 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <Check size={16} className="text-success" />
                    Quick Tips
                  </h3>
                  <ul className="text-sm text-text-secondary space-y-1">
                    {config.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-text-tertiary mt-2 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3"
              >
                {customActions ? (
                  customActions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'primary'}
                      className="flex-1"
                      onClick={() => {
                        action.action();
                        onClose();
                      }}
                    >
                      {action.label}
                    </Button>
                  ))
                ) : (
                  <>
                    <Button
                      variant={config.primaryAction.variant}
                      className="flex-1"
                      onClick={onClose}
                    >
                      {config.primaryAction.label}
                      <ArrowRight size={16} className="ml-1" />
                    </Button>
                    <Button
                      variant={config.secondaryAction.variant}
                      className="flex-1"
                      onClick={onClose}
                    >
                      {config.secondaryAction.label}
                    </Button>
                  </>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to manage success modals
export function useSuccessModal() {
  const [currentMilestone, setCurrentMilestone] = React.useState<{
    milestone: keyof typeof MILESTONE_CONFIG;
    customProps?: {
      title?: string;
      description?: string;
      customActions?: Array<{
        label: string;
        action: () => void;
        variant?: 'primary' | 'outline';
      }>;
    };
  } | null>(null);

  const showMilestone = (
    milestone: keyof typeof MILESTONE_CONFIG, 
    customProps?: {
      title?: string;
      description?: string;
      customActions?: Array<{
        label: string;
        action: () => void;
        variant?: 'primary' | 'outline';
      }>;
    }
  ) => {
    setCurrentMilestone({ milestone, customProps });
  };

  const hideMilestone = () => {
    setCurrentMilestone(null);
  };

  const SuccessModalComponent = () => (
    <SuccessModal
      isOpen={!!currentMilestone}
      onClose={hideMilestone}
      milestone={currentMilestone?.milestone || 'first-show'}
      title={currentMilestone?.customProps?.title}
      description={currentMilestone?.customProps?.description}
      customActions={currentMilestone?.customProps?.customActions}
    />
  );

  return {
    showMilestone,
    hideMilestone,
    SuccessModal: SuccessModalComponent,
  };
}