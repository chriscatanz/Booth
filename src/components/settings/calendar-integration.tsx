'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar, Copy, Check, RefreshCw, ExternalLink, AlertCircle, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

interface CalendarSettings {
  calendarEnabled?: boolean;
  calendarToken?: string;
}

export function CalendarIntegration() {
  const { organization, isAdmin, isOwner, refreshOrganizations } = useAuthStore();
  const canManage = isAdmin || isOwner;
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settings = organization?.settings as CalendarSettings | undefined;
  const isEnabled = settings?.calendarEnabled && settings?.calendarToken;

  useEffect(() => {
    if (isEnabled && settings?.calendarToken) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      setCalendarUrl(`${baseUrl}/api/calendar?token=${settings.calendarToken}`);
    } else {
      setCalendarUrl(null);
    }
  }, [isEnabled, settings?.calendarToken]);

  const handleEnable = async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/calendar', {
        method: 'POST',
        body: JSON.stringify({ organizationId: organization.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enable calendar');
      }

      const data = await response.json();
      setCalendarUrl(data.calendarUrl);
      await refreshOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable calendar sync');
    }

    setIsLoading(false);
  };

  const handleRegenerate = async () => {
    if (!organization?.id) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/calendar', {
        method: 'POST',
        body: JSON.stringify({ organizationId: organization.id, regenerate: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate URL');
      }

      const data = await response.json();
      setCalendarUrl(data.calendarUrl);
      await refreshOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate URL');
    }

    setIsRegenerating(false);
  };

  const handleDisable = async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`/api/calendar?organizationId=${organization.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable calendar');
      }

      setCalendarUrl(null);
      await refreshOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable calendar sync');
    }

    setIsLoading(false);
  };

  const handleCopy = async () => {
    if (!calendarUrl) return;
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = calendarUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1">Calendar Sync</h3>
        <p className="text-sm text-text-secondary">
          Subscribe to your trade shows from Google Calendar, Outlook, Apple Calendar, or any app that supports ICS feeds.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!isEnabled ? (
        <div className="p-6 rounded-lg border-2 border-dashed border-border bg-bg-tertiary/50 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-text-tertiary" />
          <h4 className="text-sm font-medium text-text-primary mb-1">Calendar sync not enabled</h4>
          <p className="text-xs text-text-secondary mb-4">
            Enable calendar sync to get a URL you can subscribe to in your favorite calendar app.
          </p>
          {canManage ? (
            <Button variant="primary" onClick={handleEnable} loading={isLoading}>
              <Calendar size={14} /> Enable Calendar Sync
            </Button>
          ) : (
            <p className="text-xs text-text-tertiary">
              Contact an admin to enable calendar sync.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Calendar URL */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Your Calendar URL
            </label>
            <div className="flex gap-2">
              <Input
                value={calendarUrl || ''}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Add this URL to your calendar app to subscribe to your trade shows.
            </p>
          </div>

          {/* Quick add links */}
          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarUrl?.replace('https://', 'webcal://') || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border border-border bg-surface',
                'hover:bg-bg-tertiary transition-colors text-sm'
              )}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H20C21.1046 4 22 4.89543 22 6Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-text-primary">Google Calendar</span>
              <ExternalLink size={12} className="ml-auto text-text-tertiary" />
            </a>

            <a
              href={`https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(calendarUrl || '')}&name=${encodeURIComponent(organization?.name + ' Trade Shows')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border border-border bg-surface',
                'hover:bg-bg-tertiary transition-colors text-sm'
              )}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-text-primary">Outlook</span>
              <ExternalLink size={12} className="ml-auto text-text-tertiary" />
            </a>

            <a
              href={calendarUrl?.replace('https://', 'webcal://') || '#'}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border border-border bg-surface',
                'hover:bg-bg-tertiary transition-colors text-sm'
              )}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-text-primary">Apple Calendar</span>
              <ExternalLink size={12} className="ml-auto text-text-tertiary" />
            </a>
          </div>

          {/* Info box */}
          <div className="p-4 rounded-lg bg-brand-purple/10 border border-brand-purple/20">
            <h4 className="text-sm font-medium text-brand-purple mb-1">How it works</h4>
            <ul className="text-xs text-text-secondary space-y-1">
              <li>• Your calendar app will check for updates automatically</li>
              <li>• New shows appear within a few hours of being added</li>
              <li>• Each show appears as an all-day event with booth info</li>
              <li>• The feed is read-only — changes sync one way from Booth</li>
            </ul>
          </div>

          {/* Admin actions */}
          {canManage && (
            <div className="pt-4 border-t border-border flex gap-3">
              <Button
                variant="outline"
                onClick={handleRegenerate}
                loading={isRegenerating}
              >
                <RefreshCw size={14} /> Regenerate URL
              </Button>
              <Button
                variant="ghost"
                onClick={handleDisable}
                loading={isLoading}
                className="text-error hover:bg-error/10"
              >
                <Trash2 size={14} /> Disable Sync
              </Button>
            </div>
          )}

          {canManage && (
            <p className="text-xs text-text-tertiary">
              ⚠️ Regenerating the URL will break existing subscriptions. Share the new URL with your team.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
