import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock must be defined before imports due to hoisting
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Import after mock
import { supabase } from '@/lib/supabase';
import * as subscriptionService from '@/services/subscription-service';

describe('Subscription Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TIER_CONFIG', () => {
    it('exports tier configurations', () => {
      expect(subscriptionService.TIER_CONFIG).toBeDefined();
      expect(subscriptionService.TIER_CONFIG.trial).toBeDefined();
      expect(subscriptionService.TIER_CONFIG.starter).toBeDefined();
      expect(subscriptionService.TIER_CONFIG.pro).toBeDefined();
    });

    it('each tier has required properties', () => {
      const tiers = ['trial', 'starter', 'pro'] as const;
      tiers.forEach(tier => {
        const config = subscriptionService.TIER_CONFIG[tier];
        expect(config).toHaveProperty('userLimit');
        expect(config).toHaveProperty('showLimit');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('price');
      });
    });
  });

  describe('getSubscriptionStatus', () => {
    it('returns null when no subscription found', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      } as any);

      const result = await subscriptionService.getSubscriptionStatus('org-123');
      expect(result).toBeNull();
    });

    it('returns status object when subscription exists', async () => {
      const mockData = {
        tier: 'pro',
        status: 'active',
        user_limit: null,
        show_limit: null,
        current_users: 3,
        current_shows: 10,
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_trial: false,
        is_expired: false,
        days_remaining: 30,
        stripe_customer_id: 'cus_123',
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await subscriptionService.getSubscriptionStatus('org-123');
      expect(result).toBeDefined();
      if (result) {
        expect(result.tier).toBe('pro');
      }
    });
  });

  describe('Type exports', () => {
    it('exports SubscriptionTier type values', () => {
      // Verify the tier config keys match expected tiers
      const expectedTiers = ['trial', 'starter', 'pro', 'cancelled', 'expired'];
      const configKeys = Object.keys(subscriptionService.TIER_CONFIG);
      expectedTiers.forEach(tier => {
        expect(configKeys).toContain(tier);
      });
    });
  });
});
