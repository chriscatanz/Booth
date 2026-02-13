'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Box, Package, Truck, Calendar,
  CheckCircle, AlertTriangle, BarChart3, Wrench
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
        "Complete inventory of all your booth equipment in one place",
        "Assign kits to shows and see availability at a glance",
        "AI suggests the best kit for each event based on booth size and type",
        "Track ship dates, return dates, and current location",
        "Get alerts when kits are double-booked or deadlines approach",
        "Log maintenance and condition notes for each kit",
      ]}
      capabilities={[
        {
          title: 'Kit Inventory',
          description: 'Track displays, banners, tablecloths, and accessories in organized kit groups.',
          icon: Package,
        },
        {
          title: 'Smart Assignment',
          description: 'Assign kits to shows with conflict detection. AI helps pick the right kit.',
          icon: Calendar,
        },
        {
          title: 'Shipping Coordination',
          description: 'Track ship-to and return dates for each kit assignment.',
          icon: Truck,
        },
        {
          title: 'Conflict Detection',
          description: 'Instantly see when kits are double-booked or shows overlap.',
          icon: AlertTriangle,
        },
        {
          title: 'Condition Tracking',
          description: 'Log maintenance, repairs, and condition notes. Know when to replace equipment.',
          icon: Wrench,
        },
        {
          title: 'Utilization Reports',
          description: 'See which kits get used most and optimize your inventory.',
          icon: BarChart3,
        },
      ]}
      ctaText="Start Managing Kits"
      screenshot="/screenshots/kits.svg"
      onGetStarted={() => router.push('/')}
    />
  );
}
