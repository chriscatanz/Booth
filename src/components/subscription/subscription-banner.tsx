'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubscriptionStatusResponse, createCheckoutSession } from '@/services/subscription-service';
import { useState } from 'react';

interface SubscriptionBannerProps {
  status: SubscriptionStatusResponse;
  orgId: string;
  onDismiss?: () => void;
}

export function SubscriptionBanner({ status, orgId, onDismiss }: SubscriptionBannerProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Don't show banner for active paid subscriptions
  if (!status.is_trial && !status.is_expired && status.status === 'active' && status.tier !== 'trial') {
    return null;
  }

  const handleUpgrade = async (tier: 'starter' | 'pro') => {
    setIsLoading(true);
    const result = await createCheckoutSession(
      orgId,
      tier,
      `${window.location.origin}/?subscription=success`,
      `${window.location.origin}/?subscription=cancelled`
    );

    if ('url' in result) {
      window.location.href = result.url;
    } else {
      console.error('Failed to create checkout:', 'error' in result ? result.error : 'Unknown error');
      setIsLoading(false);
    }
  };

  // Trial banner
  if (status.is_trial && !status.is_expired) {
    const daysLeft = status.days_remaining || 0;
    const isUrgent = daysLeft <= 2;

    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className={`border-b ${isUrgent ? 'bg-amber-500/10 border-amber-500/20' : 'bg-brand-purple/5 border-brand-purple/20'}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={16} className={isUrgent ? 'text-amber-500' : 'text-brand-purple'} />
            <span className="text-sm">
              <span className="font-medium">
                {daysLeft === 0 ? 'Trial ends today!' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your trial`}
              </span>
              {' '}— Subscribe to keep all your data and features.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleUpgrade('starter')}
              disabled={isLoading}
            >
              $49/mo
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => handleUpgrade('pro')}
              disabled={isLoading}
            >
              $99/mo Pro
            </Button>
            {onDismiss && (
              <button onClick={onDismiss} className="p-1 text-text-tertiary hover:text-text-secondary">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Expired trial banner
  if (status.is_expired || status.tier === 'expired') {
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="bg-red-500/10 border-b border-red-500/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-sm">
              <span className="font-semibold text-red-600">Your trial has expired.</span>
              {' '}Subscribe now to continue using Booth and access your data.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleUpgrade('starter')}
              disabled={isLoading}
            >
              Starter $49/mo
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => handleUpgrade('pro')}
              disabled={isLoading}
            >
              Pro $99/mo
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Past due banner
  if (status.status === 'past_due') {
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="bg-amber-500/10 border-b border-amber-500/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard size={16} className="text-amber-500" />
            <span className="text-sm">
              <span className="font-medium text-amber-600">Payment failed.</span>
              {' '}Please update your payment method to avoid service interruption.
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              const { createBillingPortalSession } = await import('@/services/subscription-service');
              const result = await createBillingPortalSession(orgId, window.location.href);
              if ('url' in result && result.url) {
                window.location.href = result.url;
              }
            }}
          >
            Update Payment
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}
