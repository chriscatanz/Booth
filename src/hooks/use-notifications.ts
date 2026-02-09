'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import * as notificationService from '@/services/notification-service';
import { Notification, NotificationPreferences } from '@/types/notifications';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { organization } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!organization?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const [notifs, count] = await Promise.all([
        notificationService.fetchNotifications(organization.id, { limit: 50 }),
        notificationService.getUnreadCount(organization.id),
      ]);
      
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      await notificationService.markAllAsRead(organization.id);
      setNotifications(prev => 
        prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [organization?.id]);

  const dismiss = useCallback(async (id: string) => {
    try {
      await notificationService.dismissNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Update unread count if the dismissed notification was unread
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.readAt) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh: loadNotifications,
  };
}

// Hook for notification preferences
interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const { user, organization } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.id || !organization?.id) {
        setPreferences(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const prefs = await notificationService.fetchPreferences(user.id, organization.id);
        setPreferences(prefs);
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user?.id, organization?.id]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    if (!user?.id || !organization?.id) return;

    try {
      setError(null);
      const updated = await notificationService.upsertPreferences(user.id, organization.id, {
        ...preferences,
        ...prefs,
      });
      setPreferences(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(message);
      throw err;
    }
  }, [user?.id, organization?.id, preferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
  };
}
