// Notification Types

export type NotificationType = 'task_due' | 'shipping_cutoff' | 'show_upcoming' | 'general';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  organizationId: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  priority: NotificationPriority;
  tradeshowId: number | null;
  taskId: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  actionUrl: string | null;
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  organizationId: string;
  taskReminderDays: number;
  shippingReminderDays: number;
  showReminderDays: number;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  taskNotifications: boolean;
  shippingNotifications: boolean;
  showNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'id' | 'userId' | 'organizationId' | 'createdAt' | 'updatedAt'> = {
  taskReminderDays: 1,
  shippingReminderDays: 3,
  showReminderDays: 7,
  inAppEnabled: true,
  emailEnabled: false,
  taskNotifications: true,
  shippingNotifications: true,
  showNotifications: true,
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  task_due: 'Task Due',
  shipping_cutoff: 'Shipping Deadline',
  show_upcoming: 'Upcoming Show',
  general: 'General',
};

export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'text-text-tertiary',
  normal: 'text-text-secondary',
  high: 'text-warning',
  urgent: 'text-error',
};
