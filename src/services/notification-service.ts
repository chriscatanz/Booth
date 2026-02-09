// Notification Service

import { supabase } from '@/lib/supabase';
import { 
  Notification, 
  NotificationPreferences, 
  DEFAULT_NOTIFICATION_PREFERENCES 
} from '@/types/notifications';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    userId: row.user_id as string | null,
    type: row.type as Notification['type'],
    title: row.title as string,
    message: row.message as string | null,
    priority: row.priority as Notification['priority'],
    tradeshowId: row.tradeshow_id as number | null,
    taskId: row.task_id as string | null,
    readAt: row.read_at as string | null,
    dismissedAt: row.dismissed_at as string | null,
    actionUrl: row.action_url as string | null,
    scheduledFor: row.scheduled_for as string | null,
    sentAt: row.sent_at as string | null,
    createdAt: row.created_at as string,
  };
}

function mapPreferences(row: Record<string, unknown>): NotificationPreferences {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    organizationId: row.organization_id as string,
    taskReminderDays: row.task_reminder_days as number,
    shippingReminderDays: row.shipping_reminder_days as number,
    showReminderDays: row.show_reminder_days as number,
    inAppEnabled: row.in_app_enabled as boolean,
    emailEnabled: row.email_enabled as boolean,
    taskNotifications: row.task_notifications as boolean,
    shippingNotifications: row.shipping_notifications as boolean,
    showNotifications: row.show_notifications as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function fetchNotifications(
  organizationId: string,
  options?: { 
    unreadOnly?: boolean; 
    limit?: number;
    includesDismissed?: boolean;
  }
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.unreadOnly) {
    query = query.is('read_at', null);
  }
  
  if (!options?.includesDismissed) {
    query = query.is('dismissed_at', null);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  
  return (data || []).map(mapNotification);
}

export async function getUnreadCount(organizationId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('read_at', null)
    .is('dismissed_at', null);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw new Error(error.message);
}

export async function markAllAsRead(organizationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
}

export async function dismissNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw new Error(error.message);
}

export async function createNotification(
  notification: Omit<Notification, 'id' | 'createdAt' | 'readAt' | 'dismissedAt' | 'sentAt'>
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      organization_id: notification.organizationId,
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      tradeshow_id: notification.tradeshowId,
      task_id: notification.taskId,
      action_url: notification.actionUrl,
      scheduled_for: notification.scheduledFor,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapNotification(data);
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function fetchPreferences(
  userId: string,
  organizationId: string
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return data ? mapPreferences(data) : null;
}

export async function upsertPreferences(
  userId: string,
  organizationId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      organization_id: organizationId,
      task_reminder_days: preferences.taskReminderDays ?? DEFAULT_NOTIFICATION_PREFERENCES.taskReminderDays,
      shipping_reminder_days: preferences.shippingReminderDays ?? DEFAULT_NOTIFICATION_PREFERENCES.shippingReminderDays,
      show_reminder_days: preferences.showReminderDays ?? DEFAULT_NOTIFICATION_PREFERENCES.showReminderDays,
      in_app_enabled: preferences.inAppEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.inAppEnabled,
      email_enabled: preferences.emailEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled,
      task_notifications: preferences.taskNotifications ?? DEFAULT_NOTIFICATION_PREFERENCES.taskNotifications,
      shipping_notifications: preferences.shippingNotifications ?? DEFAULT_NOTIFICATION_PREFERENCES.shippingNotifications,
      show_notifications: preferences.showNotifications ?? DEFAULT_NOTIFICATION_PREFERENCES.showNotifications,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,organization_id',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPreferences(data);
}

// ─── Deadline Check (can be called from API route or cron) ───────────────────

export async function triggerDeadlineCheck(): Promise<void> {
  const { error } = await supabase.rpc('check_upcoming_deadlines');
  if (error) throw new Error(error.message);
}
