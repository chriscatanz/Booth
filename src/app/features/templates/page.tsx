'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Layers, Copy, FolderOpen,
  Zap, Settings, Repeat
} from 'lucide-react';

export default function TemplatesFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Set It Up Once, Reuse Forever"
      subtitle="Show Templates"
      description="Stop recreating the same booth setup for every show. Save templates and spin up new shows in seconds."
      icon={Layers}
      iconColor="#F59E0B"
      benefits={[
        "Save any show as a reusable template",
        "Pre-fill booth equipment, packing lists, and standard costs",
        "Create templates for different show types (10x10, 20x20, tabletop)",
        "New shows start with your defaults, not from scratch",
        "Update a template once, future shows get the improvements",
        "Share templates across your team",
      ]}
      capabilities={[
        {
          title: 'Save as Template',
          description: 'Set up a show the way you like it, then save it as a template. Booth gear, packing lists, standard costs — all captured.',
          icon: Copy,
        },
        {
          title: 'Create from Template',
          description: 'Start a new show by selecting a template. All your standard setup is pre-filled, just add the dates and venue.',
          icon: Zap,
        },
        {
          title: 'Template Library',
          description: 'Build a library of templates for different scenarios — flagship 20x20 booth, compact tabletop, virtual event setup.',
          icon: FolderOpen,
        },
        {
          title: 'Smart Field Clearing',
          description: 'Templates automatically clear date-specific fields (confirmations, tracking numbers) while keeping your reusable setup.',
          icon: Settings,
        },
        {
          title: 'Duplicate & Repeat',
          description: 'Duplicate any show for a similar event, or use "Repeat Yearly" for annual shows that come back each year.',
          icon: Repeat,
        },
      ]}
      ctaText="Start Free Trial"
      onGetStarted={() => router.push('/')}
    />
  );
}
