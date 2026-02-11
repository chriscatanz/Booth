import { supabase } from '@/lib/supabase';
import { 
  Organization, 
  UserProfile, 
  OrganizationMember, 
  Invitation,
  UserRole 
} from '@/types/auth';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    plan: row.plan as Organization['plan'],
    planSeats: row.plan_seats as number,
    logoUrl: row.logo_url as string | null,
    brandColor: row.brand_color as string | null,
    settings: (row.settings as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapUserProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    fullName: row.full_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    phone: row.phone as string | null,
    jobTitle: row.job_title as string | null,
    lastActiveAt: row.last_active_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapMembership(row: Record<string, unknown>): OrganizationMember {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    userId: row.user_id as string,
    role: row.role as UserRole,
    invitedBy: row.invited_by as string | null,
    invitedAt: row.invited_at as string,
    joinedAt: row.joined_at as string | null,
    organization: row.organizations ? mapOrganization(row.organizations as Record<string, unknown>) : undefined,
    user: row.user ? mapUserProfile(row.user as Record<string, unknown>) : undefined,
  };
}

function mapInvitation(row: Record<string, unknown>): Invitation {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    email: row.email as string,
    role: row.role as Invitation['role'],
    token: row.token as string,
    invitedBy: row.invited_by as string | null,
    expiresAt: row.expires_at as string,
    acceptedAt: row.accepted_at as string | null,
    createdAt: row.created_at as string,
    organization: row.organizations ? mapOrganization(row.organizations as Record<string, unknown>) : undefined,
  };
}

// ─── Auth Methods ────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, fullName?: string) {
  // Get the current origin for redirect
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

// ─── Profile Methods ─────────────────────────────────────────────────────────

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  // Use decrypting view for reads
  const { data, error } = await supabase
    .from('v_user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return mapUserProfile(data);
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      full_name: updates.fullName,
      phone: updates.phone,
      job_title: updates.jobTitle,
      avatar_url: updates.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

// ─── Organization Methods ────────────────────────────────────────────────────

export async function fetchUserOrganizations(userId: string): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      organizations (*)
    `)
    .eq('user_id', userId);
  if (error) {
    console.warn('Failed to fetch organizations:', error.message);
    return [];
  }
  return (data || []).map(mapMembership);
}

export async function createOrganization(name: string, userId: string): Promise<Organization> {
  void userId; // userId is passed but RPC handles ownership via auth
  // Use RPC function to bypass RLS for atomic org creation
  const { data: orgId, error: rpcError } = await supabase
    .rpc('create_organization_for_user', { org_name: name });
  
  if (rpcError) throw new Error(rpcError.message);
  
  // Fetch the created org
  const { data: org, error: fetchError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  
  if (fetchError) throw new Error(fetchError.message);
  
  return mapOrganization(org);
}

export async function updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
  // Build update object with only defined values
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
  if (updates.brandColor !== undefined) updateData.brand_color = updates.brandColor;
  if (updates.settings !== undefined) updateData.settings = updates.settings;

  const { error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', orgId);
  if (error) throw new Error(error.message);
}

// ─── Member Methods ──────────────────────────────────────────────────────────

export async function fetchOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  // Fetch members
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', orgId)
    .order('role', { ascending: true });
  if (membersError) throw new Error(membersError.message);
  
  if (!members || members.length === 0) return [];
  
  // Fetch user profiles from decrypting view
  const userIds = members.map(m => m.user_id);
  const { data: users, error: usersError } = await supabase
    .from('v_user_profiles')
    .select('*')
    .in('id', userIds);
  if (usersError) throw new Error(usersError.message);
  
  // Join client-side
  const userMap = new Map((users || []).map(u => [u.id, u]));
  const combined = members.map(m => ({
    ...m,
    user: userMap.get(m.user_id) || null,
  }));
  
  return combined.map(mapMembership);
}

export async function updateMemberRole(memberId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', memberId);
  if (error) throw new Error(error.message);
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);
  if (error) throw new Error(error.message);
}

// ─── Invitation Methods ──────────────────────────────────────────────────────

export async function fetchInvitations(orgId: string): Promise<Invitation[]> {
  // Use decrypting view for reads
  const { data, error } = await supabase
    .from('v_invitations')
    .select('*')
    .eq('organization_id', orgId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapInvitation);
}

export async function createInvitation(
  orgId: string, 
  email: string, 
  role: Invitation['role'],
  invitedBy: string
): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: orgId,
      email: email.toLowerCase(),
      role,
      invited_by: invitedBy,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapInvitation(data);
}

export async function fetchInvitationByToken(token: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      organizations (*)
    `)
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle(); // Use maybeSingle to avoid 406 error when no row found
  if (error || !data) return null;
  return mapInvitation(data);
}

interface AcceptInvitationResult {
  success: boolean;
  organization_id: string | null;
  role: string | null;
  error: string | null;
}

export async function acceptInvitation(token: string, userId: string): Promise<{ organizationId: string; role: string }> {
  // Use atomic database function to prevent race conditions
  const { data, error } = await supabase
    .rpc('accept_invitation', {
      p_token: token,
      p_user_id: userId
    })
    .single<AcceptInvitationResult>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !data.success) {
    throw new Error(data?.error || 'Failed to accept invitation');
  }

  return {
    organizationId: data.organization_id!,
    role: data.role!
  };
}

export async function deleteInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId);
  if (error) throw new Error(error.message);
}

// ─── Auth State Listener ─────────────────────────────────────────────────────

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
