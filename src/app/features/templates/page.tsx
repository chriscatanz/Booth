'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Layers, Copy, FolderOpen,
  Zap, Settings, Repeat, Upload, FileSpreadsheet, FileJson, Users
} from 'lucide-react';

export default function TemplatesFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Set It Up Once, Reuse Forever"
      subtitle="Templates & Import"
      description="Stop recreating the same setup for every show. Save templates, import from spreadsheets, and spin up new shows in seconds."
      icon={Layers}
      iconColor="#F59E0B"
      benefits={[
        "Save any show as a reusable template",
        "Import shows from CSV and migrate from spreadsheets in minutes",
        "Pre-fill booth equipment, packing lists, and standard costs",
        "Create templates for different show types (10x10, 20x20, tabletop)",
        "Export shows and attendees to CSV with custom field selection",
        "Full JSON backup for data portability",
      ]}
      capabilities={[
        {
          title: 'Save as Template',
          description: 'Set up a show the way you like it, then save it as a template. Booth gear, packing lists, costs - all captured.',
          icon: Copy,
        },
        {
          title: 'Create from Template',
          description: 'Start a new show by selecting a template. All your standard setup is pre-filled, just add dates and venue.',
          icon: Zap,
        },
        {
          title: 'CSV Import',
          description: 'Upload a CSV with your shows. We auto-detect columns and map them for you. Migrate from spreadsheets in minutes.',
          icon: Upload,
        },
        {
          title: 'Template Library',
          description: 'Build a library of templates for different scenarios: flagship booth, compact tabletop, virtual event setup.',
          icon: FolderOpen,
        },
        {
          title: 'Attendee Import',
          description: 'Include attendee columns in your CSV and they will be added to each show automatically.',
          icon: Users,
        },
        {
          title: 'Custom Export',
          description: 'Choose exactly which fields to include in your export. Generate reports for finance or planning.',
          icon: FileSpreadsheet,
        },
        {
          title: 'Duplicate & Repeat',
          description: 'Duplicate any show for a similar event, or use Repeat Yearly for annual shows that come back.',
          icon: Repeat,
        },
        {
          title: 'JSON Backup',
          description: 'Download your complete data as JSON for backup or migration to other systems.',
          icon: FileJson,
        },
      ]}
      ctaText="Start Free Trial"
      screenshot="/screenshots/detail.svg"
      onGetStarted={() => router.push('/')}
    />
  );
}
