/**
 * Subscription Service
 * Handles subscription status, tier checking, and Stripe integration
 */

import { supabase } from '@/lib/supabase';

// Subscription tiers
export type SubscriptionTier = 'trial' | 'starter' | 'pro' | 'cancelled' | 'expired';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'incomplete';

export interface Subscription {
  id: string;
  org_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  user_limit: number | null;
  show_limit: number | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatusResponse {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  user_limit: number | null;
  show_limit: number | null;
  current_users: number;
  current_shows: number;
  is_trial: boolean;
  is_expired: boolean;
  days_remaining: number | null;
  stripe_customer_id: string | null;
}

// Tier configuration
export interface TierConfig {
  name: string;
  price: number; // monthly in cents
  userLimit: number | null;
  showLimit: number | null;
  features: {
    aiDocExtraction: boolean;
    csvImportFull: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    unlimitedTemplates: boolean;
  };
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  trial: {
    name: 'Trial',
    price: 0,
    userLimit: null,
    showLimit: null,
    features: {
      aiDocExtraction: true,
      csvImportFull: true,
      customBranding: true,
      prioritySupport: false,
      unlimitedTemplates: true,
    },
  },
  starter: {
    name: 'Starter',
    price: 4900, // $49
    userLimit: 5,
    showLimit: null, // Keep shows unlimited for now
    features: {
      aiDocExtraction: true,
      csvImportFull: true,
      customBranding: true,
      prioritySupport: false,
      unlimitedTemplates: true,
    },
  },
  pro: {
    name: 'Pro',
    price: 9900, // $99
    userLimit: null,
    showLimit: null,
    features: {
      aiDocExtraction: true,
      csvImportFull: true,
      customBranding: true,
      prioritySupport: true,
      unlimitedTemplates: true,
    },
  },
  cancelled: {
    name: 'Cancelled',
    price: 0,
    userLimit: 0,
    showLimit: 0,
    features: {
      aiDocExtraction: false,
      csvImportFull: false,
      customBranding: false,
      prioritySupport: false,
      unlimitedTemplates: false,
    },
  },
  expired: {
    name: 'Expired',
    price: 0,
    userLimit: 0,
    showLimit: 0,
    features: {
      aiDocExtraction: false,
      csvImportFull: false,
      customBranding: false,
      prioritySupport: false,
      unlimitedTemplates: false,
    },
  },
};

// Stripe price IDs (configure in .env)
export const STRIPE_PRICES = {
  starter_monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
};

/**
 * Get subscription status for an organization
 */
export async function getSubscriptionStatus(orgId: string): Promise<SubscriptionStatusResponse | null> {
  const { data, error } = await supabase.rpc('get_subscription_status', { p_org_id: orgId });
  
  if (error) {
    console.error('Error fetching subscription status:', error);
    return null;
  }
  
  return data as SubscriptionStatusResponse;
}

/**
 * Get raw subscription record
 */
export async function getSubscription(orgId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .single();
  
  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
  
  return data as Subscription;
}

/**
 * Check if org can add a new user
 */
export async function canAddUser(orgId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_add_user', { p_org_id: orgId });
  
  if (error) {
    console.error('Error checking user limit:', error);
    return false;
  }
  
  return data === true;
}

/**
 * Check if org can add a new show
 */
export async function canAddShow(orgId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_add_show', { p_org_id: orgId });
  
  if (error) {
    console.error('Error checking show limit:', error);
    return false;
  }
  
  return data === true;
}

/**
 * Check if a feature is available for the given tier
 */
export function hasFeature(tier: SubscriptionTier, feature: keyof TierConfig['features']): boolean {
  return TIER_CONFIG[tier]?.features[feature] ?? false;
}

/**
 * Check if subscription is in a valid active state
 */
export function isSubscriptionActive(status: SubscriptionStatusResponse): boolean {
  if (status.is_expired) return false;
  if (status.tier === 'cancelled' || status.tier === 'expired') return false;
  if (status.status === 'cancelled') return false;
  return true;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const now = new Date();
  const ends = new Date(trialEndsAt);
  const diff = ends.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Create Stripe checkout session (calls API route)
 */
export async function createCheckoutSession(
  orgId: string,
  tier: 'starter' | 'pro',
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string } | { error: string }> {
  const response = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      tier,
      successUrl,
      cancelUrl,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return { error: data.error || 'Failed to create checkout session' };
  }
  
  return { url: data.url };
}

/**
 * Create Stripe billing portal session (calls API route)
 */
export async function createBillingPortalSession(
  orgId: string,
  returnUrl: string
): Promise<{ url: string } | { error: string }> {
  const response = await fetch('/api/stripe/billing-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      returnUrl,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return { error: data.error || 'Failed to create billing portal session' };
  }
  
  return { url: data.url };
}
