'use client';

import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Bell, 
  Mail, 
  Clock, 
  Calendar,
  Truck,
  AlertTriangle,
  Settings,
  Users,
  CheckCircle
} from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();

  const benefits = [
    'Never miss a shipping deadline or registration cutoff',
    'Get a heads-up before shows, not during them',
    'Configurable timing based on your workflow',
    'Email delivery means notifications reach you anywhere',
    'Team members get their own relevant notifications',
    'Test email feature lets you preview before going live',
  ];

  const capabilities = [
    {
      title: 'Deadline Alerts',
      description: 'Get notified when shipping cutoffs, registration deadlines, and payment due dates are approaching.',
      icon: AlertTriangle,
    },
    {
      title: 'Email Delivery',
      description: 'Notifications delivered via email so they reach you on any device, anywhere.',
      icon: Mail,
    },
    {
      title: 'Configurable Buffer',
      description: 'Set how many days in advance you want to be warned. Different teams need different lead times.',
      icon: Clock,
    },
    {
      title: 'Upcoming Show Reminders',
      description: 'Get reminded when shows are approaching so you have time to prepare and review details.',
      icon: Calendar,
    },
    {
      title: 'Shipping Timeline Alerts',
      description: 'Know when your shipping windows are opening and closing. No more missed advance warehouse cutoffs.',
      icon: Truck,
    },
    {
      title: 'Team Notifications',
      description: 'Team members receive notifications relevant to their role. Viewers see different alerts than admins.',
      icon: Users,
    },
    {
      title: 'Organization Settings',
      description: 'Configure notification preferences at the organization level. Turn off what you do not need.',
      icon: Settings,
    },
    {
      title: 'Test Email',
      description: 'Send yourself a test notification to make sure everything is working before relying on it.',
      icon: CheckCircle,
    },
    {
      title: 'Daily Digest',
      description: 'One consolidated email each morning with everything you need to know for the day.',
      icon: Bell,
    },
  ];

  return (
    <FeaturePageLayout
      title="Stay Ahead of Every Deadline"
      subtitle="Email Notifications"
      description="Get timely reminders about shipping deadlines, upcoming shows, and critical dates. Stop relying on your memory and let Booth keep you on track."
      icon={Bell}
      iconColor="#DC2626"
      benefits={benefits}
      capabilities={capabilities}
      ctaText="Start Free Trial"
      screenshot="/screenshots/dashboard.png"
      onGetStarted={() => router.push('/signup')}
    />
  );
}
