'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Box, Package, Truck, Calendar,
  CheckCircle, AlertTriangle, Zap, BarChart3
} from 'lucide-react';

export default function KitsFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Track Every Piece of Booth Equipment"
      subtitle="Booth Kit Management"
      description="Know exactly what you have, where it is, and when it needs to ship. Never show up to a booth missing critical equipment again."
      icon={Box}
      iconColor="#CF222E"
      benefits={[
        {
          icon: Package,
          title: 'Complete Kit Inventory',
          description: 'Track all your booth equipment — displays, banners, tablecloths, and accessories — in one organized system.',
        },
        {
          icon: Calendar,
          title: 'Smart Assignment',
          description: 'Assign kits to shows and see availability at a glance. AI helps suggest the best kit for each event.',
        },
        {
          icon: Truck,
          title: 'Shipping Coordination',
          description: 'Track ship dates, return dates, and logistics for each kit. Get alerts before deadlines.',
        },
        {
          icon: AlertTriangle,
          title: 'Conflict Detection',
          description: 'Instantly see when kits are double-booked or when shows overlap. Resolve conflicts before they become problems.',
        },
        {
          icon: CheckCircle,
          title: 'Condition Tracking',
          description: 'Log maintenance, repairs, and condition notes. Know when equipment needs replacing.',
        },
        {
          icon: BarChart3,
          title: 'Utilization Reports',
          description: 'See which kits get used most, identify underutilized equipment, and optimize your inventory.',
        },
      ]}
      ctaText="Start Managing Kits"
      onCtaClick={() => router.push('/')}
    />
  );
}
