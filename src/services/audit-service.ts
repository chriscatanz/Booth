import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export interface AuditEntry {
  id: string;
  organizationId: string;
  userId: string | null;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string | null;
  resourceName: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  // Joined
  user?: {
    email: string;
    fullName: string | null;
  };
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'login'
  | 'logout'
  | 'invite_sent'
  | 'invite_accepted'
  | 'member_added'
  | 'member_removed'
  | 'role_changed'
  | 'settings_changed';

export type ResourceType =
  | 'tradeshow'
  | 'attendee'
  | 'file'
  | 'template'
  | 'organization'
  | 'member'
  | 'invitation';

function getOrgId(): string | null {
  return useAuthStore.getState().organization?.id ?? null;
}

function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

// Log an audit event
export async function logAudit(
  action: AuditAction,
  resourceType: ResourceType,
  resourceId?: string | null,
  resourceName?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const orgId = getOrgId();
  const userId = getUserId();
  
  if (!orgId) return; // Skip if no org context

  try {
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      metadata: metadata ? JSON.stringify(metadata) : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
  } catch (err) {
    // Audit logging should never break the app
    console.warn('Audit log failed:', err);
  }
}

// Fetch audit log for organization
export async function fetchAuditLog(
  options: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    resourceType?: ResourceType;
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<{ entries: AuditEntry[]; total: number }> {
  const orgId = getOrgId();
  if (!orgId) return { entries: [], total: 0 };

  let query = supabase
    .from('audit_log')
    .select(`
      *,
      user_profiles!audit_log_user_id_fkey (email, full_name)
    `, { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (options.action) {
    query = query.eq('action', options.action);
  }
  if (options.resourceType) {
    query = query.eq('resource_type', options.resourceType);
  }
  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }
  if (options.startDate) {
    query = query.gte('created_at', options.startDate);
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  query = query.range(
    options.offset || 0,
    (options.offset || 0) + (options.limit || 50) - 1
  );

  const { data, error, count } = await query;

  if (error) {
    console.warn('Failed to fetch audit log:', error);
    return { entries: [], total: 0 };
  }

  const entries: AuditEntry[] = (data || []).map((row: any) => ({
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    user: row.user_profiles ? {
      email: row.user_profiles.email,
      fullName: row.user_profiles.full_name,
    } : undefined,
  }));

  return { entries, total: count || 0 };
}

// Helper: Format audit action for display
export function formatAuditAction(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    view: 'Viewed',
    export: 'Exported',
    login: 'Logged in',
    logout: 'Logged out',
    invite_sent: 'Sent invitation',
    invite_accepted: 'Accepted invitation',
    member_added: 'Added member',
    member_removed: 'Removed member',
    role_changed: 'Changed role',
    settings_changed: 'Changed settings',
  };
  return labels[action] || action;
}

// Helper: Get action icon color
export function getAuditActionColor(action: AuditAction): string {
  switch (action) {
    case 'create':
    case 'invite_sent':
    case 'member_added':
      return 'text-success';
    case 'delete':
    case 'member_removed':
      return 'text-error';
    case 'update':
    case 'role_changed':
    case 'settings_changed':
      return 'text-warning';
    case 'login':
    case 'logout':
      return 'text-brand-cyan';
    default:
      return 'text-text-secondary';
  }
}
