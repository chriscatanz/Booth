import { create } from 'zustand';
import { 
  SubscriptionStatusResponse, 
  SubscriptionTier,
  getSubscriptionStatus,
  isSubscriptionActive,
  TIER_CONFIG,
  TierConfig
} from '@/services/subscription-service';

interface SubscriptionState {
  // Data
  status: SubscriptionStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed helpers
  tier: SubscriptionTier;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  
  // Actions
  loadSubscription: (orgId: string) => Promise<void>;
  clearSubscription: () => void;
  
  // Feature checks
  hasFeature: (feature: keyof TierConfig['features']) => boolean;
  canAddUser: () => boolean;
  canAddShow: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial state
  status: null,
  isLoading: false,
  error: null,
  
  // Computed (defaults)
  tier: 'trial',
  isActive: true,
  isTrial: true,
  isExpired: false,
  daysRemaining: null,
  
  // Load subscription status
  loadSubscription: async (orgId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const status = await getSubscriptionStatus(orgId);
      
      if (status) {
        set({
          status,
          tier: status.tier,
          isActive: isSubscriptionActive(status),
          isTrial: status.is_trial,
          isExpired: status.is_expired,
          daysRemaining: status.days_remaining,
          isLoading: false,
        });
      } else {
        set({
          error: 'Failed to load subscription',
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
  
  // Clear subscription state
  clearSubscription: () => {
    set({
      status: null,
      tier: 'trial',
      isActive: true,
      isTrial: true,
      isExpired: false,
      daysRemaining: null,
      error: null,
    });
  },
  
  // Check if a feature is available for current tier
  hasFeature: (feature: keyof TierConfig['features']) => {
    const { tier, isActive } = get();
    if (!isActive) return false;
    return TIER_CONFIG[tier]?.features[feature] ?? false;
  },
  
  // Check if org can add more users
  canAddUser: () => {
    const { status, isActive } = get();
    if (!isActive || !status) return false;
    if (status.user_limit === null) return true;
    return status.current_users < status.user_limit;
  },
  
  // Check if org can add more shows
  canAddShow: () => {
    const { status, isActive } = get();
    if (!isActive || !status) return false;
    if (status.show_limit === null) return true;
    return status.current_shows < status.show_limit;
  },
}));
