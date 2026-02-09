'use client';

import React, { useState, useEffect } from 'react';
import { useNotificationPreferences } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { 
  Bell, Mail, Truck, Calendar, CheckSquare, 
  AlertCircle, Check, Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/notifications';

export function NotificationPreferences() {
  const { preferences, isLoading, error, updatePreferences } = useNotificationPreferences();
  
  const [localPrefs, setLocalPrefs] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state from fetched preferences
  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        taskReminderDays: preferences.taskReminderDays,
        shippingReminderDays: preferences.shippingReminderDays,
        showReminderDays: preferences.showReminderDays,
        inAppEnabled: preferences.inAppEnabled,
        emailEnabled: preferences.emailEnabled,
        taskNotifications: preferences.taskNotifications,
        shippingNotifications: preferences.shippingNotifications,
        showNotifications: preferences.showNotifications,
      });
    }
  }, [preferences]);

  // Track changes
  useEffect(() => {
    if (!preferences) {
      setHasChanges(true); // New preferences
      return;
    }
    
    const changed = 
      localPrefs.taskReminderDays !== preferences.taskReminderDays ||
      localPrefs.shippingReminderDays !== preferences.shippingReminderDays ||
      localPrefs.showReminderDays !== preferences.showReminderDays ||
      localPrefs.inAppEnabled !== preferences.inAppEnabled ||
      localPrefs.emailEnabled !== preferences.emailEnabled ||
      localPrefs.taskNotifications !== preferences.taskNotifications ||
      localPrefs.shippingNotifications !== preferences.shippingNotifications ||
      localPrefs.showNotifications !== preferences.showNotifications;
    
    setHasChanges(changed);
  }, [localPrefs, preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await updatePreferences(localPrefs);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-text-tertiary">
        <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success-bg text-success text-sm">
          <Check size={16} />
          Preferences saved successfully
        </div>
      )}

      {/* Notification Types */}
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1 flex items-center gap-2">
          <Bell size={16} className="text-text-tertiary" />
          Notification Types
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Choose which notifications you want to receive.
        </p>

        <div className="space-y-3">
          <ToggleOption
            icon={CheckSquare}
            label="Task Reminders"
            description="Get notified when tasks are due"
            enabled={localPrefs.taskNotifications}
            onChange={(v) => setLocalPrefs(p => ({ ...p, taskNotifications: v }))}
          />
          <ToggleOption
            icon={Truck}
            label="Shipping Deadlines"
            description="Alerts for upcoming shipping cutoff dates"
            enabled={localPrefs.shippingNotifications}
            onChange={(v) => setLocalPrefs(p => ({ ...p, shippingNotifications: v }))}
          />
          <ToggleOption
            icon={Calendar}
            label="Upcoming Shows"
            description="Reminders for shows that are coming up"
            enabled={localPrefs.showNotifications}
            onChange={(v) => setLocalPrefs(p => ({ ...p, showNotifications: v }))}
          />
        </div>
      </div>

      {/* Reminder Timing */}
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1">Reminder Timing</h3>
        <p className="text-xs text-text-secondary mb-4">
          How far in advance should we remind you?
        </p>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Task reminders</span>
            <select
              value={localPrefs.taskReminderDays}
              onChange={(e) => setLocalPrefs(p => ({ ...p, taskReminderDays: parseInt(e.target.value) }))}
              className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm"
              disabled={!localPrefs.taskNotifications}
            >
              <option value={1}>1 day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before</option>
              <option value={7}>1 week before</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Shipping deadlines</span>
            <select
              value={localPrefs.shippingReminderDays}
              onChange={(e) => setLocalPrefs(p => ({ ...p, shippingReminderDays: parseInt(e.target.value) }))}
              className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm"
              disabled={!localPrefs.shippingNotifications}
            >
              <option value={1}>1 day before</option>
              <option value={3}>3 days before</option>
              <option value={5}>5 days before</option>
              <option value={7}>1 week before</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Show reminders</span>
            <select
              value={localPrefs.showReminderDays}
              onChange={(e) => setLocalPrefs(p => ({ ...p, showReminderDays: parseInt(e.target.value) }))}
              className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm"
              disabled={!localPrefs.showNotifications}
            >
              <option value={3}>3 days before</option>
              <option value={7}>1 week before</option>
              <option value={14}>2 weeks before</option>
              <option value={30}>1 month before</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delivery Channels */}
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1">Delivery Channels</h3>
        <p className="text-xs text-text-secondary mb-4">
          How should we notify you?
        </p>

        <div className="space-y-3">
          <ToggleOption
            icon={Bell}
            label="In-App Notifications"
            description="Show notifications in the app"
            enabled={localPrefs.inAppEnabled}
            onChange={(v) => setLocalPrefs(p => ({ ...p, inAppEnabled: v }))}
          />
          <ToggleOption
            icon={Mail}
            label="Email Notifications"
            description="Send notifications to your email"
            enabled={localPrefs.emailEnabled}
            onChange={(v) => setLocalPrefs(p => ({ ...p, emailEnabled: v }))}
            badge="Coming Soon"
            disabled
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={isSaving}
          disabled={!hasChanges}
        >
          <Save size={14} /> Save Preferences
        </Button>
      </div>
    </div>
  );
}

interface ToggleOptionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  badge?: string;
  disabled?: boolean;
}

function ToggleOption({ 
  icon: Icon, 
  label, 
  description, 
  enabled, 
  onChange, 
  badge,
  disabled 
}: ToggleOptionProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      enabled && !disabled ? 'bg-brand-purple/5 border-brand-purple/20' : 'bg-bg-tertiary border-border',
      disabled && 'opacity-60'
    )}>
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
        enabled && !disabled ? 'bg-brand-purple/20' : 'bg-surface'
      )}>
        <Icon size={18} className={enabled && !disabled ? 'text-brand-purple' : 'text-text-tertiary'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-tertiary">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          enabled ? 'bg-brand-purple' : 'bg-border',
          disabled && 'cursor-not-allowed'
        )}
      >
        <div className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )} />
      </button>
    </div>
  );
}
