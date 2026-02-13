'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Package, Boxes, Calendar, AlertTriangle, 
  ClipboardCheck, DollarSign, Archive
} from 'lucide-react';

export default function AssetsFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Track Every Booth Kit, Banner, and Giveaway"
      subtitle="Asset Management"
      description="Know exactly what you have, where it is, and what's reserved for upcoming shows. Never double-book your 10-foot display again."
      icon={Package}
      iconColor="#CF222E"
      benefits={[
        "Inventory all your booth hardware: displays, banners, furniture",
        "Track collateral and giveaways with quantity alerts",
        "Reserve assets for upcoming shows to prevent conflicts",
        "See what's available before committing to a show",
        "Track asset costs and depreciation over time",
        "Know which shows used which equipment",
      ]}
      capabilities={[
        {
          title: 'Capital Asset Tracking',
          description: 'Track reusable items like booth kits, displays, monitors, and furniture.',
          icon: Boxes,
        },
        {
          title: 'Collateral Inventory',
          description: 'Monitor consumables like brochures, swag, and giveaways with quantity tracking.',
          icon: ClipboardCheck,
        },
        {
          title: 'Reservation System',
          description: 'Reserve assets for shows and see conflicts before they happen.',
          icon: Calendar,
        },
        {
          title: 'Low Stock Alerts',
          description: 'Get notified when collateral quantities drop below your set thresholds.',
          icon: AlertTriangle,
        },
        {
          title: 'Cost Tracking',
          description: 'Track purchase costs and see your total investment in trade show assets.',
          icon: DollarSign,
        },
        {
          title: 'Asset History',
          description: 'See which shows each asset has been used at over time.',
          icon: Archive,
        },
      ]}
      screenshot="/screenshots/assets.svg"
      onGetStarted={() => router.push('/')}
    />
  );
}
