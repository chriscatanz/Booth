'use client';

import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  RefreshCw, 
  Calendar, 
  Bell, 
  Globe,
  Smartphone,
  Users,
  Clock,
  Layers,
  CheckCircle
} from 'lucide-react';

export default function CalendarSyncPage() {
  const router = useRouter();

  const benefits = [
    'See trade shows alongside your regular meetings',
    'Never double-book travel or show dates again',
    'Share show schedules with your team instantly',
    'Works with Google Calendar, Outlook, and Apple',
    'Automatically updates when show dates change',
    'Includes setup, show days, and teardown',
  ];

  const capabilities = [
    {
      title: 'One-Click Subscribe',
      description: 'Generate a personal ICS feed URL and add it to your calendar app in seconds.',
      icon: RefreshCw,
    },
    {
      title: 'Google Calendar',
      description: 'Native support for Google Calendar. Events sync automatically as your schedule changes.',
      icon: Globe,
    },
    {
      title: 'Outlook Integration',
      description: 'Works seamlessly with Microsoft Outlook, both web and desktop versions.',
      icon: Calendar,
    },
    {
      title: 'Apple Calendar',
      description: 'Subscribe from your Mac, iPhone, or iPad. Your shows follow you everywhere.',
      icon: Smartphone,
    },
    {
      title: 'Full Timeline View',
      description: 'Each event includes setup days, show dates, and teardown. See the complete picture.',
      icon: Clock,
    },
    {
      title: 'Team Sharing',
      description: 'Team members get their own feed URL. Everyone stays aligned without manual updates.',
      icon: Users,
    },
    {
      title: 'Smart Updates',
      description: 'When you change show dates in Booth, your calendar updates automatically.',
      icon: CheckCircle,
    },
    {
      title: 'Event Details',
      description: 'Events include venue, booth number, and quick links back to Booth for full details.',
      icon: Layers,
    },
    {
      title: 'Deadline Reminders',
      description: 'Key deadlines appear on your calendar so nothing slips through the cracks.',
      icon: Bell,
    },
  ];

  return (
    <FeaturePageLayout
      title="Your Shows, Your Calendar"
      subtitle="Calendar Sync"
      description="Subscribe to your trade show calendar from Google Calendar, Outlook, or Apple Calendar. Real-time sync means your shows are always where you need them."
      icon={RefreshCw}
      iconColor="#0969DA"
      benefits={benefits}
      capabilities={capabilities}
      ctaText="Start Free Trial"
      screenshot="/screenshots/calendar.svg"
      onGetStarted={() => router.push('/signup')}
    />
  );
}
