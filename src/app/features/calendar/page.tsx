'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Calendar, Clock, Eye, Filter, 
  CalendarDays, Map, AlertTriangle, RefreshCw, Globe, Smartphone
} from 'lucide-react';

export default function CalendarFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Your Trade Show Calendar, Finally Organized"
      subtitle="Calendar & Sync"
      description="See your entire trade show schedule at a glance. Track dates, deadlines, and sync to Google Calendar, Outlook, or Apple Calendar."
      icon={Calendar}
      iconColor="#0969DA"
      benefits={[
        "See all shows in a beautiful calendar or list view",
        "Track key deadlines: shipping cutoffs, registration dates, hotel bookings",
        "Sync to Google Calendar, Outlook, or Apple Calendar with one click",
        "Spot scheduling conflicts before they become problems",
        "Automatic updates when show dates change",
        "Export to .ics file for any calendar app",
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
          title: 'Calendar Sync',
          description: 'One-click subscribe from Google Calendar, Outlook, or Apple Calendar. Events update automatically.',
          icon: RefreshCw,
        },
        {
          title: 'Conflict Detection',
          description: 'Get warned when shows overlap or when your team is double-booked.',
          icon: AlertTriangle,
        },
        {
          title: 'Works Everywhere',
          description: 'Native support for Google, Outlook (web & desktop), and Apple Calendar on Mac, iPhone, and iPad.',
          icon: Globe,
        },
        {
          title: 'Mobile Ready',
          description: 'Your shows follow you everywhere. See your trade show schedule on any device.',
          icon: Smartphone,
        },
        {
          title: 'Advanced Filtering',
          description: 'Filter by status, date range, location, or any custom field you create.',
          icon: Filter,
        },
        {
          title: 'Location Mapping',
          description: 'See where your shows are geographically and plan travel accordingly.',
          icon: Map,
        },
      ]}
      screenshot="/screenshots/calendar.svg"
      onGetStarted={() => router.push('/')}
    />
  );
}
