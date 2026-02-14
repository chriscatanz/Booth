'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Truck, Package, ClipboardList, 
  MapPin, AlertCircle, Calendar, Radio, RotateCcw, Box, Wrench
} from 'lucide-react';

export default function LogisticsFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Ship Smart, Track Everything"
      subtitle="Logistics & Booth Kits"
      description="Manage shipping deadlines, track packages in real-time, and know exactly where your booth equipment is. Never miss a cutoff or show up missing gear."
      icon={Truck}
      iconColor="#BF8700"
      benefits={[
        "Visual shipping timeline shows all upcoming deadlines at a glance",
        "Live shipment tracking for FedEx, UPS, DHL, and 50+ carriers",
        "Complete inventory of all your booth kits and equipment",
        "AI suggests the best kit for each show based on booth size",
        "Track both outbound and return shipments in one place",
        "Get alerts when kits are double-booked or deadlines approach",
      ]}
      capabilities={[
        {
          title: 'Shipping Timeline',
          description: 'See all upcoming shipping deadlines in a visual timeline on your dashboard. Never miss an advance warehouse cutoff.',
          icon: Calendar,
        },
        {
          title: 'Live Tracking',
          description: 'Enter a tracking number and see real-time status updates. Works with FedEx, UPS, DHL, and 50+ carriers.',
          icon: Radio,
        },
        {
          title: 'Kit Inventory',
          description: 'Track displays, banners, tablecloths, and accessories in organized kit groups.',
          icon: Box,
        },
        {
          title: 'Smart Assignment',
          description: 'Assign kits to shows with conflict detection. AI helps pick the right kit for each booth size.',
          icon: Package,
        },
        {
          title: 'Deadline Alerts',
          description: 'Get warned when shipping cutoffs are approaching. Configurable buffer days so you have time to act.',
          icon: AlertCircle,
        },
        {
          title: 'Return Shipping',
          description: 'Track return shipments separately. Know when your booth materials made it back.',
          icon: RotateCcw,
        },
        {
          title: 'Packing Lists',
          description: 'Create reusable packing lists with your standard booth items. Check items off as they load.',
          icon: ClipboardList,
        },
        {
          title: 'Venue Details',
          description: 'Store advance warehouse addresses, receiving hours, and venue dock info for every show.',
          icon: MapPin,
        },
        {
          title: 'Condition Tracking',
          description: 'Log maintenance, repairs, and condition notes. Know when to replace equipment.',
          icon: Wrench,
        },
      ]}
      ctaText="Start Free Trial"
      screenshot="/screenshots/kits.svg"
      onGetStarted={() => router.push('/')}
    />
  );
}
