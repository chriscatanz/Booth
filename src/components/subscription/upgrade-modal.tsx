'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Users, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createCheckoutSession, TIER_CONFIG } from '@/services/subscription-service';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  currentTier?: string;
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    description: 'Perfect for small teams',
    features: [
      'Up to 5 team members',
      'Unlimited trade shows',
      'AI content generation',
      'CSV import & export',
      'Show templates',
      'Email support',
    ],
    icon: Zap,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    description: 'For growing organizations',
    features: [
      'Unlimited team members',
      'Unlimited trade shows',
      'AI content generation',
      'AI document extraction',
      'CSV import & export',
      'Custom branding',
      'Priority support',
    ],
    popular: true,
    icon: Sparkles,
  },
];

export function UpgradeModal({ isOpen, onClose, orgId, currentTier }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: 'starter' | 'pro') => {
    setIsLoading(planId);
    
    const result = await createCheckoutSession(
      orgId,
      planId,
      `${window.location.origin}/?subscription=success`,
      `${window.location.origin}/?subscription=cancelled`
    );

    if ('url' in result) {
      window.location.href = result.url;
    } else {
      console.error('Failed to create checkout:', 'error' in result ? result.error : 'Unknown error');
      setIsLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Upgrade Your Plan</h2>
                <p className="text-sm text-text-secondary">Choose the plan that's right for your team</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Plans */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border-2 p-6 transition-all ${
                      plan.popular
                        ? 'border-brand-purple bg-brand-purple/5'
                        : 'border-border hover:border-border-strong'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-purple text-white text-xs font-medium rounded-full">
                        Most Popular
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        plan.popular ? 'bg-brand-purple/20' : 'bg-bg-tertiary'
                      }`}>
                        <plan.icon size={20} className={plan.popular ? 'text-brand-purple' : 'text-text-secondary'} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{plan.name}</h3>
                        <p className="text-xs text-text-tertiary">{plan.description}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <span className="text-3xl font-bold text-text-primary">${plan.price}</span>
                      <span className="text-text-tertiary">/month</span>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                          <Check size={16} className="text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.id as 'starter' | 'pro')}
                      disabled={isLoading !== null || currentTier === plan.id}
                    >
                      {isLoading === plan.id ? (
                        'Redirecting...'
                      ) : currentTier === plan.id ? (
                        'Current Plan'
                      ) : (
                        `Get ${plan.name}`
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-border text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary">
                  <Shield size={14} />
                  <span>Secure payment via Stripe. Cancel anytime.</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
