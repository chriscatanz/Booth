'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Bell, Mail, Calendar, Clock,
  CheckSquare, AlertTriangle, Settings, Smartphone
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
        {
          icon: Calendar,
          title: 'Show Reminders',
          description: 'Get notified before each show starts. Never be caught off-guard by an event sneaking up on you.',
        },
        {
          icon: Clock,
          title: 'Deadline Alerts',
          description: 'Automatic reminders for early bird pricing, housing deadlines, service kit due dates, and shipping cutoffs.',
        },
        {
          icon: CheckSquare,
          title: 'Task Due Dates',
          description: 'Get notified when tasks are coming due or overdue. Keep your team accountable.',
        },
        {
          icon: AlertTriangle,
          title: 'Kit Conflicts',
          description: 'Instant alerts when booth kit assignments overlap. Catch problems before they happen.',
        },
        {
          icon: Mail,
          title: 'Email Digests',
          description: 'Choose in-app notifications, email alerts, or both. Get a daily digest of what needs attention.',
        },
        {
          icon: Settings,
          title: 'Fully Customizable',
          description: 'Control exactly what notifications you receive and when. Tune the system to your workflow.',
        },
      ]}
      ctaText="Start Free Trial"
      onCtaClick={() => router.push('/')}
    />
  );
}
