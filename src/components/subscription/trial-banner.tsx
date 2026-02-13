'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSubscriptionStatus, SubscriptionStatusResponse } from '@/services/subscription-service';

interface TrialBannerProps {
  onUpgrade: () => void;
}

export function TrialBanner({ onUpgrade }: TrialBannerProps) {
  const { organization } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionStatusResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadSubscription();
    }
  }, [organization?.id]);

  async function loadSubscription() {
    if (!organization?.id) return;
    try {
      const status = await getSubscriptionStatus(organization.id);
      setSubscription(status);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    }
  }

  // Don't show if dismissed, loading, or not on trial
  if (dismissed || !subscription) return null;
  
  // Don't show for paid plans
  if (subscription.tier === 'starter' || subscription.tier === 'pro') return null;

  const isExpired = subscription.is_expired;
  const daysRemaining = subscription.days_remaining ?? 0;

  // Don't show if plenty of trial days left
  if (!isExpired && daysRemaining > 3) return null;

  return (
    <div className={cn(
      'px-4 py-2 flex items-center justify-between gap-4',
      isExpired 
        ? 'bg-error/10 border-b border-error/20' 
        : 'bg-warning/10 border-b border-warning/20'
    )}>
      <div className="flex items-center gap-2 min-w-0">
        {isExpired ? (
          <AlertTriangle size={16} className="text-error shrink-0" />
        ) : (
          <Clock size={16} className="text-warning shrink-0" />
        )}
        <span className={cn(
          'text-sm font-medium truncate',
          isExpired ? 'text-error' : 'text-warning'
        )}>
          {isExpired 
            ? 'Your trial has expired' 
            : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in your trial`
          }
        </span>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="primary"
          size="sm"
          onClick={onUpgrade}
          className="text-xs"
        >
          Upgrade Now
        </Button>
        {!isExpired && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-black/10 text-text-secondary"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
