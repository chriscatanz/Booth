'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  RefreshCw, Calendar, Smartphone, Globe,
  CheckCircle, Bell, Users, Link
} from 'lucide-react';

export default function CalendarSyncFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Your Trade Shows, Everywhere"
      subtitle="Calendar Sync"
      description="Subscribe to your trade show calendar from Google Calendar, Outlook, Apple Calendar, or any app that supports ICS feeds. Always stay in sync."
      icon={RefreshCw}
      iconColor="#06B6D4"
      benefits={[
        "One-click subscribe from Google, Outlook, or Apple Calendar",
        "Shows appear in your calendar automatically",
        "Changes sync within minutes",
        "Works on phone, tablet, and desktop",
        "Team members can all subscribe to the same feed",
        "Use your calendar app&apos;s native reminders",
      ]}
      capabilities={[
        {
          title: 'Universal Compatibility',
          description: 'Works with Google Calendar, Outlook, Apple Calendar, and any ICS-compatible app.',
          icon: Calendar,
        },
        {
          title: 'Auto-Sync',
          description: 'Add a show in Booth, see it in your calendar automatically.',
          icon: RefreshCw,
        },
        {
          title: 'Mobile Ready',
          description: 'Your trade show schedule syncs to all your devices.',
          icon: Smartphone,
        },
        {
          title: 'Team Sharing',
          description: 'Everyone subscribes to the same feed and stays in sync.',
          icon: Users,
        },
        {
          title: 'Native Reminders',
          description: 'Use your calendar app&apos;s built-in reminder system.',
          icon: Bell,
        },
        {
          title: 'Standard Format',
          description: 'Uses standard ICS format. No proprietary lock-in.',
          icon: Globe,
        },
      ]}
      ctaText="Start Syncing"
      onGetStarted={() => router.push('/')}
    />
  );
}
