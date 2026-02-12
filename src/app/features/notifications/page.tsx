'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Bell, Mail, Calendar, Clock,
  CheckSquare, AlertTriangle, Settings, Filter
} from 'lucide-react';

export default function NotificationsFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Never Miss a Deadline Again"
      subtitle="Smart Notifications"
      description="Get timely reminders for shipping deadlines, registration cutoffs, and upcoming shows. Customize what you receive and how."
      icon={Bell}
      iconColor="#F59E0B"
      benefits={[
        "Automatic reminders for all key deadlines",
        "Get notified before shows, not after",
        "Task due date alerts keep your team accountable",
        "Instant alerts when booth kits have conflicts",
        "Choose email, in-app, or both",
        "Daily digest option for less interruption",
      ]}
      capabilities={[
        {
          title: 'Show Reminders',
          description: 'Get notified before each show starts. Never be caught off-guard.',
          icon: Calendar,
        },
        {
          title: 'Deadline Alerts',
          description: 'Automatic reminders for early bird pricing, housing, and shipping cutoffs.',
          icon: Clock,
        },
        {
          title: 'Task Notifications',
          description: 'Get notified when tasks are due or overdue.',
          icon: CheckSquare,
        },
        {
          title: 'Conflict Warnings',
          description: 'Instant alerts when booth kit assignments overlap.',
          icon: AlertTriangle,
        },
        {
          title: 'Email Digests',
          description: 'Get a daily summary of what needs attention.',
          icon: Mail,
        },
        {
          title: 'Full Control',
          description: 'Customize exactly what notifications you receive and when.',
          icon: Settings,
        },
      ]}
      ctaText="Start Free Trial"
      onGetStarted={() => router.push('/')}
    />
  );
}
