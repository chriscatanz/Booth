'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, Calendar, Users, BarChart3, 
  ArrowRight, Check, Rocket, Wand2, Upload,
  FileStack, ListTodo, Image
} from 'lucide-react';

interface WelcomeWizardProps {
  onComplete: () => void;
}

export function WelcomeWizard({ onComplete }: WelcomeWizardProps) {
  const [step, setStep] = useState(0);
  const { user, organization } = useAuthStore();
  const { createNewShow } = useTradeShowStore();

  const steps = [
    {
      icon: Sparkles,
      title: `Welcome, ${user?.fullName?.split(' ')[0] || 'there'}!`,
      subtitle: `You're all set up with ${organization?.name}`,
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>
            Booth helps you organize your entire trade show program in one place.
          </p>
          <p>
            Let's take a quick tour of what you can do.
          </p>
        </div>
      ),
    },
    {
      icon: Calendar,
      title: 'Track All Your Shows',
      subtitle: 'One calendar for everything',
      content: (
        <ul className="space-y-3">
          {[
            'Add shows with dates, venues, and booth details',
            'Track shipping deadlines and logistics',
            'Never miss a cutoff date again',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span className="text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: BarChart3,
      title: 'Know Your True Costs',
      subtitle: 'Budget tracking that actually works',
      content: (
        <ul className="space-y-3">
          {[
            'Track booth fees, travel, shipping, and services',
            'See total cost at a glance',
            'Calculate cost per lead and ROI',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span className="text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: Users,
      title: 'Collaborate with Your Team',
      subtitle: 'Everyone on the same page',
      content: (
        <ul className="space-y-3">
          {[
            'Invite team members to view or edit',
            'Track attendees and travel details',
            'Keep notes and documents in one place',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span className="text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: Wand2,
      title: 'AI-Powered Content',
      subtitle: 'Let AI do the heavy lifting',
      content: (
        <ul className="space-y-3">
          {[
            'Generate talking points and social posts',
            'Create follow-up email sequences',
            'Extract show details from vendor packets',
            'Chat with an AI assistant about your shows',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span className="text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: ListTodo,
      title: 'Tasks & Deadlines',
      subtitle: 'Never miss a deadline',
      content: (
        <ul className="space-y-3">
          {[
            'Create tasks with due dates and assignees',
            'Get notified before shipping deadlines',
            'Track progress across all shows',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span className="text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: Upload,
      title: 'Import & Export',
      subtitle: 'Your data, your way',
      content: (
        <ul className="space-y-3">
          {[
            'Import shows from CSV or spreadsheets',
            'Export data for reports and analysis',
            'Bulk import attendees and contacts',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span className="text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: FileStack,
      title: 'Templates & Assets',
      subtitle: 'Work smarter, not harder',
      content: (
        <ul className="space-y-3">
          {[
            'Save shows as templates for next year',
            'Store booth photos and marketing assets',
            'Quickly create shows from templates',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <span className="text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: Rocket,
      title: 'Ready to Go!',
      subtitle: 'Create your first trade show',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>
            You're all set. Click below to create your first show and start organizing.
          </p>
          <p>
            Need help? Check out the settings menu for tips and support options.
          </p>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      createNewShow();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-4"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-brand-purple' : i < step ? 'bg-brand-purple/50' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-8"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-6">
                <Icon size={28} className="text-brand-purple" />
              </div>

              {/* Text */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-1">
                  {currentStep.title}
                </h2>
                <p className="text-text-secondary">{currentStep.subtitle}</p>
              </div>

              {/* Content */}
              <div className="mb-8">
                {currentStep.content}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Skip tour
                </button>
                <Button variant="primary" onClick={handleNext}>
                  {isLastStep ? (
                    <>
                      Create First Show <Rocket size={16} className="ml-1" />
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={16} className="ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
