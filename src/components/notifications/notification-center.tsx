'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, CheckCheck, Truck, Calendar, 
  CheckSquare, AlertCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { Notification, NotificationType } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  task_due: CheckSquare,
  shipping_cutoff: Truck,
  show_upcoming: Calendar,
  general: Bell,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  task_due: 'bg-brand-purple/20 text-brand-purple',
  shipping_cutoff: 'bg-warning/20 text-warning',
  show_upcoming: 'bg-brand-cyan/20 text-brand-cyan',
  general: 'bg-text-tertiary/20 text-text-secondary',
};

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, dismiss } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    // If there's an action URL, navigate to it
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary">
              <h3 className="font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-brand-purple hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {isLoading ? (
                <div className="p-8 text-center text-text-tertiary">
                  <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="mx-auto text-text-tertiary mb-2" />
                  <p className="text-sm text-text-secondary">No notifications</p>
                  <p className="text-xs text-text-tertiary mt-1">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onDismiss={() => dismiss(notification.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDismiss: () => void;
}

function NotificationItem({ notification, onClick, onDismiss }: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type];
  const isUnread = !notification.readAt;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div
      className={cn(
        'relative flex gap-3 p-4 hover:bg-bg-tertiary/50 transition-colors cursor-pointer group',
        isUnread && 'bg-brand-purple/5'
      )}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-purple" />
      )}

      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', TYPE_COLORS[notification.type])}>
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm',
            isUnread ? 'font-medium text-text-primary' : 'text-text-secondary'
          )}>
            {notification.title}
          </p>
          {notification.priority === 'urgent' && (
            <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
          )}
        </div>
        {notification.message && (
          <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Clock size={12} className="text-text-tertiary" />
          <span className="text-[11px] text-text-tertiary">{timeAgo}</span>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-secondary transition-all"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
