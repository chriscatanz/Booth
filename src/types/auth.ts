// Auth & Organization Types

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  planSeats: number;
  logoUrl: string | null;
  brandColor: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  jobTitle: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  invitedBy: string | null;
  invitedAt: string;
  joinedAt: string | null;
  // Joined data
  user?: UserProfile;
  organization?: Organization;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: Exclude<UserRole, 'owner'>;
  token: string;
  invitedBy: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  // Joined data
  organization?: Organization;
  inviter?: UserProfile;
}

export interface AuthSession {
  user: UserProfile | null;
  organization: Organization | null;
  membership: OrganizationMember | null;
  organizations: OrganizationMember[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export function hasMinRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageMembers(role: UserRole | undefined): boolean {
  return hasMinRole(role, 'admin');
}

export function canEditShows(role: UserRole | undefined): boolean {
  return hasMinRole(role, 'editor');
}

export function canDeleteShows(role: UserRole | undefined): boolean {
  return hasMinRole(role, 'admin');
}

export function canViewOnly(role: UserRole | undefined): boolean {
  return role === 'viewer';
}
