'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Truck, Package, ClipboardList, 
  MapPin, AlertCircle, Calendar, Radio, RotateCcw
} from 'lucide-react';

export default function LogisticsFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Never Miss a Shipping Deadline Again"
      subtitle="Shipping & Logistics"
      description="Track shipping cutoffs, manage packing lists, and monitor your shipments in real-time. Know exactly where your booth materials are at every moment."
      icon={Truck}
      iconColor="#BF8700"
      benefits={[
        "Live shipment tracking shows exactly where your materials are",
        "Visual shipping timeline shows upcoming deadlines at a glance",
        "Get notified when packages are delivered or delayed",
        "Track both outbound and return shipments in one place",
        "Build reusable packing lists so nothing gets forgotten",
        "Store warehouse addresses and shipping instructions per show",
      ]}
      capabilities={[
        {
          title: 'Live Shipment Tracking',
          description: 'Enter a tracking number and see real-time status updates right in the app. Works with FedEx, UPS, DHL, and 50+ carriers via Shippo integration.',
          icon: Radio,
        },
        {
          title: 'Shipping Timeline',
          description: 'See all upcoming shipping deadlines in a visual timeline on your dashboard. Never miss an advance warehouse cutoff.',
          icon: Calendar,
        },
        {
          title: 'Deadline Alerts',
          description: 'Get warned when shipping cutoffs are approaching. Configurable buffer days so you have time to act.',
          icon: AlertCircle,
        },
        {
          title: 'Return Shipping',
          description: 'Track return shipments separately. Know when your booth materials made it back to the office or warehouse.',
          icon: RotateCcw,
        },
        {
          title: 'Packing Lists',
          description: 'Create reusable packing lists with your standard booth items. Check items off as they are loaded for each show.',
          icon: ClipboardList,
        },
        {
          title: 'Venue & Warehouse Details',
          description: 'Store advance warehouse addresses, receiving hours, and venue dock info. No more digging through exhibitor packets.',
          icon: MapPin,
        },
      ]}
      ctaText="Start Free Trial"
      screenshot="/screenshots/dashboard.svg"
      onGetStarted={() => router.push('/')}
    />
  );
}
