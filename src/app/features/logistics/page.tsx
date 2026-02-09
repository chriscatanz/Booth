'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Truck, Package, Clock, ClipboardList, 
  MapPin, AlertCircle, Boxes, Calendar
} from 'lucide-react';

export default function LogisticsFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Never Miss a Shipping Deadline Again"
      subtitle="Shipping & Logistics"
      description="Track shipping cutoffs, manage packing lists, and ensure your booth materials arrive on time, every time."
      icon={Truck}
      iconColor="#BF8700"
      benefits={[
        "Visual shipping timeline shows upcoming deadlines at a glance",
        "Set shipping cutoff dates and get automatic reminders",
        "Track shipping costs as part of your total show budget",
        "Store tracking numbers with each show for easy reference",
        "Build reusable packing lists so nothing gets forgotten",
        "Know exactly what's shipping to which show",
      ]}
      capabilities={[
        {
          title: 'Shipping Timeline',
          description: 'See all upcoming shipping deadlines in a visual timeline on your dashboard.',
          icon: Calendar,
        },
        {
          title: 'Deadline Alerts',
          description: 'Get warned when shipping cutoffs are approaching so nothing ships late.',
          icon: AlertCircle,
        },
        {
          title: 'Packing Lists',
          description: 'Create reusable packing lists and check items off as they\'re loaded.',
          icon: ClipboardList,
        },
        {
          title: 'Tracking Numbers',
          description: 'Store tracking numbers with each show. One click to check delivery status.',
          icon: Package,
        },
        {
          title: 'Shipping Costs',
          description: 'Track shipping expenses as part of your overall show budget.',
          icon: Truck,
        },
        {
          title: 'Venue Details',
          description: 'Store receiving addresses, dock hours, and venue contact info.',
          icon: MapPin,
        },
      ]}
      onGetStarted={() => router.push('/')}
    />
  );
}
