'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Users, Shield, Activity, Bell, 
  UserPlus, Eye, Lock, FileText, BookOpen
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
        "Role-based permissions: owners, admins, editors, viewers",
        "Control document visibility: hide payment receipts from viewers",
        "Clean read view for stakeholders who just need info at a glance",
        "Activity feed shows who changed what and when",
        "Onboard new team members in minutes, not days",
      ]}
      capabilities={[
        {
          title: 'Easy Invitations',
          description: 'Invite teammates via email. They click a link and they\'re in. No complicated setup.',
          icon: UserPlus,
        },
        {
          title: 'Role-Based Access',
          description: 'Owners, admins, editors, and viewers. Give people exactly the access they need. Control who sees budget info, contacts, and documents.',
          icon: Shield,
        },
        {
          title: 'Document Visibility',
          description: 'Upload documents with visibility controls. Mark payment receipts as admin-only while keeping venue maps visible to everyone.',
          icon: FileText,
        },
        {
          title: 'Read View',
          description: 'A clean, card-based view for consuming show info. Perfect for stakeholders who need to check details without the complexity of edit mode.',
          icon: BookOpen,
        },
        {
          title: 'Activity Feed',
          description: 'See who updated what and when. Full audit trail for accountability.',
          icon: Activity,
        },
        {
          title: 'Secure by Default',
          description: 'Your data is encrypted and access is strictly controlled by your team settings. PII fields are encrypted at rest.',
          icon: Lock,
        },
      ]}
      ctaText="Start Free Trial"
      screenshot="/screenshots/team.png"
      onGetStarted={() => router.push('/')}
    />
  );
}
