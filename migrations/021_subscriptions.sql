-- ============================================================================
-- Migration 021: Subscriptions & Billing
-- Adds subscription management for organizations with Stripe integration
-- ============================================================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Subscription tier
  tier TEXT NOT NULL DEFAULT 'trial' CHECK (tier IN ('trial', 'starter', 'pro', 'cancelled', 'expired')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'incomplete')),
  
  -- Limits (NULL = unlimited)
  user_limit INT DEFAULT NULL,
  show_limit INT DEFAULT NULL,
  
  -- Trial tracking
  trial_ends_at TIMESTAMPTZ,
  
  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One subscription per org
  UNIQUE(org_id)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends ON subscriptions(trial_ends_at) WHERE tier = 'trial';

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their org's subscription
CREATE POLICY "Users can view own org subscription"
  ON subscriptions FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Only owners can update subscription (for now - Stripe webhooks will use service role)
CREATE POLICY "Owners can update subscription"
  ON subscriptions FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Function to create subscription for new org (called on org creation)
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO subscriptions (org_id, tier, status, trial_ends_at, user_limit)
  VALUES (
    NEW.id,
    'trial',
    'active',
    now() + INTERVAL '7 days',
    NULL  -- Unlimited during trial
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create subscription when org is created
DROP TRIGGER IF EXISTS on_org_created_create_subscription ON organizations;
CREATE TRIGGER on_org_created_create_subscription
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_subscription();

-- Function to check if org can add more users
CREATE OR REPLACE FUNCTION can_add_user(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_limit INT;
  v_current_count INT;
  v_tier TEXT;
BEGIN
  -- Get subscription limits
  SELECT user_limit, tier INTO v_user_limit, v_tier
  FROM subscriptions
  WHERE org_id = p_org_id;
  
  -- Trial and expired orgs have special handling
  IF v_tier = 'expired' OR v_tier = 'cancelled' THEN
    RETURN FALSE;
  END IF;
  
  -- No limit set = unlimited
  IF v_user_limit IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Count current users
  SELECT COUNT(*) INTO v_current_count
  FROM user_profiles
  WHERE organization_id = p_org_id;
  
  RETURN v_current_count < v_user_limit;
END;
$$;

-- Function to check if org can add more shows
CREATE OR REPLACE FUNCTION can_add_show(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_show_limit INT;
  v_current_count INT;
  v_tier TEXT;
BEGIN
  -- Get subscription limits
  SELECT show_limit, tier INTO v_show_limit, v_tier
  FROM subscriptions
  WHERE org_id = p_org_id;
  
  -- Expired/cancelled orgs cannot add shows
  IF v_tier = 'expired' OR v_tier = 'cancelled' THEN
    RETURN FALSE;
  END IF;
  
  -- No limit set = unlimited
  IF v_show_limit IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Count current shows (this year)
  SELECT COUNT(*) INTO v_current_count
  FROM tradeshows
  WHERE organization_id = p_org_id
    AND is_template = FALSE
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now());
  
  RETURN v_current_count < v_show_limit;
END;
$$;

-- Function to get subscription status (for client)
CREATE OR REPLACE FUNCTION get_subscription_status(p_org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub subscriptions%ROWTYPE;
  v_user_count INT;
  v_show_count INT;
BEGIN
  SELECT * INTO v_sub FROM subscriptions WHERE org_id = p_org_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No subscription found');
  END IF;
  
  -- Get current counts
  SELECT COUNT(*) INTO v_user_count FROM user_profiles WHERE organization_id = p_org_id;
  SELECT COUNT(*) INTO v_show_count FROM tradeshows WHERE organization_id = p_org_id AND is_template = FALSE;
  
  RETURN json_build_object(
    'tier', v_sub.tier,
    'status', v_sub.status,
    'trial_ends_at', v_sub.trial_ends_at,
    'user_limit', v_sub.user_limit,
    'show_limit', v_sub.show_limit,
    'current_users', v_user_count,
    'current_shows', v_show_count,
    'is_trial', v_sub.tier = 'trial',
    'is_expired', v_sub.tier = 'expired' OR (v_sub.tier = 'trial' AND v_sub.trial_ends_at < now()),
    'days_remaining', CASE 
      WHEN v_sub.tier = 'trial' THEN GREATEST(0, EXTRACT(DAY FROM v_sub.trial_ends_at - now()))::INT
      ELSE NULL
    END,
    'stripe_customer_id', v_sub.stripe_customer_id
  );
END;
$$;

-- Create subscriptions for existing orgs (one-time migration)
INSERT INTO subscriptions (org_id, tier, status, trial_ends_at)
SELECT 
  id,
  'trial',
  'active',
  now() + INTERVAL '7 days'
FROM organizations
WHERE id NOT IN (SELECT org_id FROM subscriptions)
ON CONFLICT (org_id) DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_add_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_add_show(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_status(UUID) TO authenticated;
