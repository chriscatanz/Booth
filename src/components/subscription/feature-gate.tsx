'use client';

import React, { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { SubscriptionTier, TierConfig, TIER_CONFIG } from '@/services/subscription-service';

interface FeatureGateProps {
  tier: SubscriptionTier;
  feature: keyof TierConfig['features'];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on subscription tier features.
 * Shows fallback (or default lock message) if feature is not available.
 */
export function FeatureGate({ tier, feature, children, fallback }: FeatureGateProps) {
  const hasFeature = TIER_CONFIG[tier]?.features[feature] ?? false;

  if (hasFeature) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center mb-3">
        <Lock size={20} className="text-text-tertiary" />
      </div>
      <p className="text-sm text-text-secondary">
        This feature requires an upgraded plan.
      </p>
    </div>
  );
}

/**
 * Hook to check if a feature is available
 */
export function useFeatureAccess(tier: SubscriptionTier) {
  return {
    hasFeature: (feature: keyof TierConfig['features']) => 
      TIER_CONFIG[tier]?.features[feature] ?? false,
    tierConfig: TIER_CONFIG[tier],
  };
}
