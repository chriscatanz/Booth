'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Calendar, Clock, Eye, Filter, 
  CalendarDays, Map, AlertTriangle
} from 'lucide-react';

export default function CalendarFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Your Trade Show Calendar, Finally Organized"
      subtitle="Calendar Management"
      description="See your entire trade show schedule at a glance. Track dates, deadlines, and never double-book your team again."
      icon={Calendar}
      iconColor="#0969DA"
      benefits={[
        "See all shows in a beautiful calendar or list view",
        "Track key deadlines — shipping cutoffs, registration dates, hotel bookings",
        "Spot scheduling conflicts before they become problems",
        "Filter by status, date range, or team member",
        "Quick-add shows from templates you create",
        "Export to Google Calendar, Outlook, or iCal",
      ]}
      capabilities={[
        {
          title: 'Multiple Views',
          description: 'Switch between calendar, list, and dashboard views to see your data the way you want.',
          icon: Eye,
        },
        {
          title: 'Smart Deadlines',
          description: 'Automatic deadline tracking for shipping, registration, and hotel cutoffs.',
          icon: Clock,
        },
        {
          title: 'Conflict Detection',
          description: 'Get warned when shows overlap or when your team is double-booked.',
          icon: AlertTriangle,
        },
        {
          title: 'Advanced Filtering',
          description: 'Filter by status, date range, location, or any custom field you create.',
          icon: Filter,
        },
        {
          title: 'Calendar Sync',
          description: 'One-click export to your personal calendar. Never miss a show date.',
          icon: CalendarDays,
        },
        {
          title: 'Location Mapping',
          description: 'See where your shows are geographically and plan travel accordingly.',
          icon: Map,
        },
      ]}
      onGetStarted={() => router.push('/')}
    />
  );
}
