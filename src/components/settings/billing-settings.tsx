'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, Check, AlertCircle, ExternalLink, 
  Users, Calendar, Sparkles, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getSubscriptionStatus, 
  createCheckoutSession, 
  createBillingPortalSession,
  SubscriptionStatusResponse,
  TIER_CONFIG 
} from '@/services/subscription-service';

export function BillingSettings() {
  const { organization } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization?.id) {
      loadSubscription();
    }
  }, [organization?.id]);

  async function loadSubscription() {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const status = await getSubscriptionStatus(organization.id);
      setSubscription(status);
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(tier: 'starter' | 'pro') {
    if (!organization?.id) return;
    setActionLoading(tier);
    setError(null);

    try {
      const result = await createCheckoutSession(
        organization.id,
        tier,
        `${window.location.origin}/settings?billing=success`,
        `${window.location.origin}/settings?billing=cancelled`
      );

      if ('error' in result) {
        setError(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Failed to create checkout:', err);
      setError('Failed to start checkout process');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleManageBilling() {
    if (!organization?.id) return;
    setActionLoading('portal');
    setError(null);

    try {
      const result = await createBillingPortalSession(
        organization.id,
        window.location.href
      );

      if ('error' in result) {
        setError(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err);
      setError('Failed to open billing portal');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  const isTrialActive = subscription?.is_trial && !subscription?.is_expired;
  const isTrialExpired = subscription?.is_trial && subscription?.is_expired;
  const isPaid = subscription?.tier === 'starter' || subscription?.tier === 'pro';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-text-primary mb-1">Billing & Subscription</h3>
        <p className="text-sm text-text-secondary">
          Manage your subscription plan and billing details.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Current Plan Status */}
      <div className="p-4 rounded-xl border border-border bg-bg-secondary">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium uppercase',
                subscription?.tier === 'pro' && 'bg-brand-purple/20 text-brand-purple',
                subscription?.tier === 'starter' && 'bg-brand-cyan/20 text-brand-cyan',
                subscription?.tier === 'trial' && !subscription?.is_expired && 'bg-warning-bg text-warning',
                (subscription?.tier === 'expired' || subscription?.is_expired) && 'bg-error-bg text-error',
                subscription?.tier === 'cancelled' && 'bg-bg-tertiary text-text-tertiary'
              )}>
                {subscription?.tier || 'Free'}
              </span>
              {subscription?.status === 'past_due' && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-error-bg text-error">
                  Payment Past Due
                </span>
              )}
            </div>
            
            {isTrialActive && (
              <p className="text-sm text-text-secondary">
                {subscription.days_remaining} days remaining in your free trial
              </p>
            )}
            
            {isTrialExpired && (
              <p className="text-sm text-error">
                Your trial has expired. Upgrade to continue using Booth.
              </p>
            )}
            
            {isPaid && (
              <p className="text-sm text-text-secondary">
                {subscription?.tier === 'starter' ? 'Up to 5 team members' : 'Unlimited team members'}
              </p>
            )}
          </div>

          {isPaid && subscription?.stripe_customer_id && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManageBilling}
              disabled={actionLoading === 'portal'}
            >
              {actionLoading === 'portal' ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <ExternalLink size={14} className="mr-1" />
              )}
              Manage Billing
            </Button>
          )}
        </div>

        {/* Usage */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
              <Users size={14} />
              Team Members
            </div>
            <p className="text-lg font-semibold text-text-primary">
              {subscription?.current_users || 0}
              <span className="text-sm font-normal text-text-tertiary">
                {subscription?.user_limit ? ` / ${subscription.user_limit}` : ' (unlimited)'}
              </span>
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
              <Calendar size={14} />
              Trade Shows
            </div>
            <p className="text-lg font-semibold text-text-primary">
              {subscription?.current_shows || 0}
              <span className="text-sm font-normal text-text-tertiary">
                {subscription?.show_limit ? ` / ${subscription.show_limit}` : ' (unlimited)'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      {(!isPaid || subscription?.status === 'cancelled') && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Starter Plan */}
          <div className={cn(
            'p-4 rounded-xl border-2 transition-colors',
            subscription?.tier === 'starter' 
              ? 'border-brand-cyan bg-brand-cyan/5' 
              : 'border-border hover:border-brand-cyan/50'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-text-primary">Starter</h4>
              <span className="text-2xl font-bold text-text-primary">
                $49<span className="text-sm font-normal text-text-secondary">/mo</span>
              </span>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-success" />
                Up to 5 team members
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-success" />
                Unlimited trade shows
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-success" />
                AI document extraction
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-success" />
                Calendar sync
              </li>
            </ul>

            <Button
              variant={subscription?.tier === 'starter' ? 'secondary' : 'primary'}
              className="w-full"
              onClick={() => handleUpgrade('starter')}
              disabled={actionLoading === 'starter' || subscription?.tier === 'starter'}
            >
              {actionLoading === 'starter' ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : subscription?.tier === 'starter' ? (
                'Current Plan'
              ) : (
                'Upgrade to Starter'
              )}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className={cn(
            'p-4 rounded-xl border-2 transition-colors relative',
            subscription?.tier === 'pro' 
              ? 'border-brand-purple bg-brand-purple/5' 
              : 'border-border hover:border-brand-purple/50'
          )}>
            <div className="absolute -top-3 left-4">
              <span className="px-2 py-0.5 bg-brand-purple text-white text-xs font-medium rounded">
                Popular
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-text-primary">Pro</h4>
              <span className="text-2xl font-bold text-text-primary">
                $99<span className="text-sm font-normal text-text-secondary">/mo</span>
              </span>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-success" />
                Unlimited team members
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-success" />
                Unlimited trade shows
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-success" />
                AI document extraction
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-success" />
                Priority support
              </li>
            </ul>

            <Button
              variant={subscription?.tier === 'pro' ? 'secondary' : 'primary'}
              className="w-full"
              onClick={() => handleUpgrade('pro')}
              disabled={actionLoading === 'pro' || subscription?.tier === 'pro'}
            >
              {actionLoading === 'pro' ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : subscription?.tier === 'pro' ? (
                'Current Plan'
              ) : (
                'Upgrade to Pro'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Payment Methods Info */}
      <div className="p-4 rounded-xl border border-border bg-bg-secondary">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard size={16} className="text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary">Secure Payments</span>
        </div>
        <p className="text-sm text-text-secondary">
          All payments are processed securely through Stripe. We never store your card details.
        </p>
      </div>
    </div>
  );
}
