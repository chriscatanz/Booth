'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  FileSpreadsheet, Upload, Calendar,
  FileJson, CheckSquare, Users, Filter
} from 'lucide-react';

export default function ImportExportFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Your Data, Your Way"
      subtitle="Import & Export"
      description="Migrate from spreadsheets in minutes. Export reports for finance. Full control over your trade show data."
      icon={FileSpreadsheet}
      iconColor="#059669"
      benefits={[
        "Import shows from CSV — migrate from spreadsheets in minutes",
        "Smart column mapping detects your field names automatically",
        "Include attendees in the same import file",
        "Export shows and attendees to CSV with custom field selection",
        "Export to calendar (.ics) for Outlook/Google Calendar sync",
        "Full JSON backup for data portability",
      ]}
      capabilities={[
        {
          title: 'CSV Show Import',
          description: 'Upload a CSV with your shows. We auto-detect columns like "Show Name", "Location", "Start Date" and map them for you.',
          icon: Upload,
        },
        {
          title: 'Attendee Import',
          description: 'Include attendee columns in your CSV (Attendee Name, Email, etc.) and they\'ll be added to each show automatically.',
          icon: Users,
        },
        {
          title: 'Custom Export Fields',
          description: 'Choose exactly which fields to include in your export. Only need name, dates, and cost? Uncheck the rest.',
          icon: Filter,
        },
        {
          title: 'Calendar Export',
          description: 'Export your shows as an .ics file to add them to Outlook, Google Calendar, or Apple Calendar.',
          icon: Calendar,
        },
        {
          title: 'JSON Data Backup',
          description: 'Download your complete data as JSON for backup or migration to other systems.',
          icon: FileJson,
        },
        {
          title: 'Import Preview',
          description: 'Review exactly what will be imported before committing. See warnings for duplicates or missing fields.',
          icon: CheckSquare,
        },
      ]}
      ctaText="Start Free Trial"
      onGetStarted={() => router.push('/')}
    />
  );
}
