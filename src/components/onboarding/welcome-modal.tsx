'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Package, Users, DollarSign, Sparkles, 
  CheckCircle, ArrowRight, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeModalProps {
  userName?: string;
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    icon: Calendar,
    title: 'Track Your Shows',
    description: 'Add trade shows with dates, venues, and booth details. Keep everything organized in one place.',
    color: 'text-brand-purple',
    bgColor: 'bg-brand-purple/10',
  },
  {
    icon: Package,
    title: 'Manage Booth Kits',
    description: 'Create reusable booth kit inventories and auto-assign them to shows based on availability.',
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/10',
  },
  {
    icon: Users,
    title: 'Coordinate Your Team',
    description: 'Assign team members to shows, track travel arrangements, and share access with your team.',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: DollarSign,
    title: 'Track Budgets & ROI',
    description: 'Monitor costs, compare shows, and measure ROI with leads and revenue attribution.',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Assistance',
    description: 'Extract show details from documents, generate talking points, and create follow-up emails.',
    color: 'text-brand-purple',
    bgColor: 'bg-brand-purple/10',
  },
];

export function WelcomeModal({ userName, onComplete, onSkip }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const isLastStep = currentStep === STEPS.length - 1;
  const step = STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onSkip}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Welcome header (first step only) */}
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <h1 className="text-2xl font-bold text-text-primary">
                Welcome{userName ? `, ${userName}` : ''}! 👋
              </h1>
              <p className="text-text-secondary mt-2">
                Let&apos;s take a quick tour of what Booth can do for you.
              </p>
            </motion.div>
          )}

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              {/* Icon */}
              <div className={cn(
                'w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center',
                step.bgColor
              )}>
                <Icon size={40} className={step.color} />
              </div>

              {/* Title & Description */}
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                {step.title}
              </h2>
              <p className="text-text-secondary leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-8 mb-6">
            {STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentStep 
                    ? 'w-6 bg-brand-purple' 
                    : index < currentStep
                      ? 'bg-brand-purple/50'
                      : 'bg-bg-tertiary'
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={cn(currentStep === 0 && 'invisible')}
            >
              Back
            </Button>
            
            <Button variant="primary" onClick={handleNext}>
              {isLastStep ? (
                <>
                  <CheckCircle size={16} />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
