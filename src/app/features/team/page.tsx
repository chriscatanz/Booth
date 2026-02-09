'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Users, Shield, Activity, Bell, 
  UserPlus, Eye, Lock, MessageSquare
} from 'lucide-react';

export default function TeamFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Get Your Whole Team on the Same Page"
      subtitle="Team Collaboration"
      description="Share access with your team, control who sees what, and finally end the 'where's that spreadsheet?' conversations."
      icon={Users}
      iconColor="#8250DF"
      benefits={[
        "Invite team members with a simple email link",
        "Role-based permissions — owners, admins, editors, viewers",
        "Everyone sees the same data, always up to date",
        "Activity feed shows who changed what and when",
        "No more emailing spreadsheets back and forth",
        "Onboard new team members in minutes, not days",
      ]}
      capabilities={[
        {
          title: 'Easy Invitations',
          description: 'Invite teammates via email. They click a link and they\'re in — no complicated setup.',
          icon: UserPlus,
        },
        {
          title: 'Role-Based Access',
          description: 'Owners, admins, editors, and viewers. Give people exactly the access they need.',
          icon: Shield,
        },
        {
          title: 'Activity Feed',
          description: 'See who updated what and when. Full audit trail for accountability.',
          icon: Activity,
        },
        {
          title: 'Real-Time Updates',
          description: 'Changes sync instantly. Everyone always sees the latest information.',
          icon: Bell,
        },
        {
          title: 'Viewer Mode',
          description: 'Give stakeholders read-only access to check status without risking edits.',
          icon: Eye,
        },
        {
          title: 'Secure by Default',
          description: 'Your data is encrypted and access is strictly controlled by your team settings.',
          icon: Lock,
        },
      ]}
      onGetStarted={() => router.push('/')}
    />
  );
}
