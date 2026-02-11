'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  icon: React.ReactNode;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: 'Free',
    period: '7-day trial',
    description: 'Try Booth risk-free',
    icon: <Zap size={20} />,
    features: [
      'Up to 5 trade shows',
      '1 team member',
      'Basic budget tracking',
      'Packing lists',
      'Email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    description: 'For small marketing teams',
    icon: <Building2 size={20} />,
    highlighted: true,
    features: [
      'Unlimited trade shows',
      'Up to 5 team members',
      'Full budget & ROI tracking',
      'Document storage (5GB)',
      'Audit logging',
      'Priority email support',
      'Data export (CSV/JSON)',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Business',
    price: '$99',
    period: '/month',
    description: 'For growing organizations',
    icon: <Crown size={20} />,
    features: [
      'Everything in Team, plus:',
      'Unlimited team members',
      'Document storage (25GB)',
      'Advanced analytics',
      'Custom fields',
      'Phone support',
      'Dedicated success manager',
    ],
    cta: 'Contact Sales',
  },
];

interface PricingSectionProps {
  onGetStarted: () => void;
}

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-text-primary"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-text-secondary max-w-2xl mx-auto"
          >
            Start free, upgrade when you&apos;re ready. No credit card required.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative rounded-2xl border p-6 lg:p-8 flex flex-col',
                tier.highlighted
                  ? 'border-brand-purple bg-gradient-to-b from-brand-purple/5 to-transparent shadow-lg shadow-brand-purple/10'
                  : 'border-border bg-surface'
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-brand-purple text-white text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'p-2 rounded-xl',
                  tier.highlighted ? 'bg-brand-purple/20 text-brand-purple' : 'bg-bg-tertiary text-text-secondary'
                )}>
                  {tier.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                  <p className="text-xs text-text-tertiary">{tier.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-text-primary">{tier.price}</span>
                <span className="text-text-secondary">{tier.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={16} className={cn(
                      'shrink-0 mt-0.5',
                      tier.highlighted ? 'text-brand-purple' : 'text-success'
                    )} />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.highlighted ? 'primary' : 'outline'}
                size="lg"
                className="w-full"
                onClick={onGetStarted}
              >
                {tier.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-text-tertiary">
            All plans include a 7-day free trial. No credit card required to start.
          </p>
          <p className="text-sm text-text-tertiary mt-1">
            Need a custom plan? <a href="mailto:sales@getbooth.app" className="text-brand-purple hover:underline">Contact us</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
