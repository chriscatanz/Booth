'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  RefreshCw, Calendar, Smartphone, Globe,
  CheckCircle, Bell, Users, Zap
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
        {
          icon: Calendar,
          title: 'Works With Your Calendar',
          description: 'One-click subscribe from Google Calendar, Outlook, or Apple Calendar. Shows appear automatically.',
        },
        {
          icon: RefreshCw,
          title: 'Always Up to Date',
          description: 'Changes sync automatically. Add a show in Booth, see it in your calendar within minutes.',
        },
        {
          icon: Smartphone,
          title: 'Mobile Ready',
          description: 'Your trade show schedule on your phone, tablet, and desktop — wherever you check your calendar.',
        },
        {
          icon: Users,
          title: 'Share With Your Team',
          description: 'Team members can subscribe to the same feed. Everyone stays on the same page.',
        },
        {
          icon: Bell,
          title: 'Native Reminders',
          description: 'Use your calendar app&apos;s built-in reminders. Get notified the way you&apos;re used to.',
        },
        {
          icon: Globe,
          title: 'Standard ICS Format',
          description: 'Works with any calendar app that supports ICS feeds. No proprietary lock-in.',
        },
      ]}
      ctaText="Start Syncing"
      onCtaClick={() => router.push('/')}
    />
  );
}
