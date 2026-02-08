import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Organization, 
  UserProfile, 
  OrganizationMember, 
  UserRole,
  hasMinRole,
} from '@/types/auth';
import * as authService from '@/services/auth-service';

interface AuthState {
  // State
  user: UserProfile | null;
  organization: Organization | null;
  membership: OrganizationMember | null;
  organizations: OrganizationMember[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Computed
  role: UserRole | undefined;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  
  // Profile
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Organization
  switchOrganization: (orgId: string) => void;
  createOrganization: (name: string) => Promise<Organization | null>;
  refreshOrganizations: () => Promise<void>;
  
  // Helpers
  setError: (error: string | null) => void;
  clearError: () => void;
}

const STORAGE_KEY = 'trade-show-auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      organization: null,
      membership: null,
      organizations: [],
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Computed (will be updated when state changes)
      role: undefined,
      isOwner: false,
      isAdmin: false,
      isEditor: false,
      isViewer: false,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          const authUser = await authService.getCurrentUser();
          if (!authUser) {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              organization: null,
              membership: null,
              organizations: [],
            });
            return;
          }

          // Fetch profile
          const profile = await authService.fetchUserProfile(authUser.id);
          if (!profile) {
            set({ isLoading: false });
            return;
          }

          // Fetch organizations
          const orgs = await authService.fetchUserOrganizations(authUser.id);
          
          // Get previously selected org from persisted state or pick first
          const currentOrgId = get().organization?.id;
          let selectedMembership = orgs.find(m => m.organizationId === currentOrgId) || orgs[0];
          
          const role = selectedMembership?.role;

          set({
            user: profile,
            isAuthenticated: true,
            organizations: orgs,
            organization: selectedMembership?.organization || null,
            membership: selectedMembership || null,
            role,
            isOwner: role === 'owner',
            isAdmin: hasMinRole(role, 'admin'),
            isEditor: hasMinRole(role, 'editor'),
            isViewer: role === 'viewer',
            isLoading: false,
          });
        } catch (err) {
          console.error('Auth init failed:', err);
          set({ isLoading: false, error: 'Failed to initialize auth' });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          await authService.signIn(email, password);
          await get().initialize();
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sign in failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      signUp: async (email: string, password: string, fullName?: string) => {
        try {
          set({ isLoading: true, error: null });
          await authService.signUp(email, password, fullName);
          // Note: User may need to verify email depending on Supabase settings
          set({ isLoading: false });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sign up failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      signOut: async () => {
        try {
          await authService.signOut();
          set({
            user: null,
            organization: null,
            membership: null,
            organizations: [],
            isAuthenticated: false,
            role: undefined,
            isOwner: false,
            isAdmin: false,
            isEditor: false,
            isViewer: false,
          });
        } catch (err) {
          console.error('Sign out failed:', err);
        }
      },

      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          await authService.resetPassword(email);
          set({ isLoading: false });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Password reset failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) return;

        try {
          await authService.updateUserProfile(user.id, updates);
          set({ user: { ...user, ...updates } });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Profile update failed';
          set({ error: message });
        }
      },

      switchOrganization: (orgId: string) => {
        const { organizations } = get();
        const membership = organizations.find(m => m.organizationId === orgId);
        if (!membership) return;

        const role = membership.role;
        set({
          organization: membership.organization || null,
          membership,
          role,
          isOwner: role === 'owner',
          isAdmin: hasMinRole(role, 'admin'),
          isEditor: hasMinRole(role, 'editor'),
          isViewer: role === 'viewer',
        });
      },

      createOrganization: async (name: string) => {
        const { user } = get();
        if (!user) return null;

        try {
          set({ isLoading: true, error: null });
          const org = await authService.createOrganization(name, user.id);
          await get().refreshOrganizations();
          get().switchOrganization(org.id);
          set({ isLoading: false });
          return org;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to create organization';
          set({ error: message, isLoading: false });
          return null;
        }
      },

      refreshOrganizations: async () => {
        const { user } = get();
        if (!user) return;

        const orgs = await authService.fetchUserOrganizations(user.id);
        set({ organizations: orgs });
      },

      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        // Only persist organization selection
        organization: state.organization ? { id: state.organization.id } : null,
      }),
    }
  )
);
