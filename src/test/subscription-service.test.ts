import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock must be defined before imports due to hoisting
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
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
        expect(config).toHaveProperty('maxSeats');
        expect(config).toHaveProperty('maxShows');
      });
    });
  });

  describe('getSubscriptionStatus', () => {
    it('returns null when no subscription found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      } as any);

      const result = await subscriptionService.getSubscriptionStatus('org-123');
      expect(result).toBeNull();
    });

    it('returns status object when subscription exists', async () => {
      const mockData = {
        tier: 'pro',
        status: 'active',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any);

      const result = await subscriptionService.getSubscriptionStatus('org-123');
      expect(result).toBeDefined();
      if (result) {
        expect(result.tier).toBe('pro');
        expect(result.isActive).toBe(true);
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
