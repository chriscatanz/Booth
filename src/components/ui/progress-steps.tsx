'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  className?: string;
  showStepLabels?: boolean;
}

export function ProgressSteps({
  currentStep,
  totalSteps,
  steps,
  className,
  showStepLabels = true,
}: ProgressStepsProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Step indicator and progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-text-primary">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="text-xs text-text-secondary">
          {Math.round(progressPercentage)}% complete
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-border-subtle rounded-full overflow-hidden mb-4">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-brand-purple to-brand-purple-dark rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(progressPercentage, 8)}%` }} // Minimum 8% for visual feedback
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 20,
            duration: 0.8,
          }}
        />
      </div>

      {/* Step dots/indicators */}
      {showStepLabels && (
        <div className="flex justify-between items-center">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const stepLabel = steps?.[index] || `Step ${stepNumber}`;

            return (
              <div key={stepNumber} className="flex flex-col items-center flex-1">
                {/* Step circle */}
                <motion.div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center mb-2 text-xs font-semibold',
                    isCurrent && 'bg-brand-purple text-white',
                    isCompleted && 'bg-success text-white',
                    !isCurrent && !isCompleted && 'bg-border-subtle text-text-tertiary'
                  )}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle size={16} />
                  ) : (
                    stepNumber
                  )}
                </motion.div>

                {/* Step label */}
                <div className="text-center max-w-[100px]">
                  <motion.span
                    className={cn(
                      'text-xs font-medium',
                      isCurrent && 'text-brand-purple',
                      isCompleted && 'text-success',
                      !isCurrent && !isCompleted && 'text-text-tertiary'
                    )}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: isCurrent || isCompleted ? 1 : 0.6 }}
                  >
                    {stepLabel}
                  </motion.span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactProgressSteps({
  currentStep,
  totalSteps,
  className,
}: Omit<ProgressStepsProps, 'steps' | 'showStepLabels'>) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="text-xs font-medium text-text-secondary min-w-0">
        {currentStep}/{totalSteps}
      </div>
      <div className="flex-1 h-1.5 bg-border-subtle rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-purple to-brand-purple-dark rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(progressPercentage, 5)}%` }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 20,
          }}
        />
      </div>
      <div className="text-xs text-text-tertiary min-w-0">
        {Math.round(progressPercentage)}%
      </div>
    </div>
  );
}