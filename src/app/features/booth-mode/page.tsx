'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Smartphone, MapPin, Users, Calendar,
  Navigation, Clock, Wifi, Bell
} from 'lucide-react';

export default function BoothModeFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Your Show-Day Command Center"
      subtitle="Booth Mode"
      description="When the show starts, switch to Booth Mode. A focused, mobile-first interface designed for the trade show floor. Everything you need, nothing you don't."
      icon={Smartphone}
      iconColor="#06B6D4"
      benefits={[
        "Tap your booth number to copy it instantly when asked",
        "One-tap Uber to venue or hotel with pre-loaded addresses",
        "Quick access to team contact info on the floor",
        "View the show agenda without digging through emails",
        "Hotel confirmation number always one tap away",
        "Distraction-free dark interface that works in any lighting",
      ]}
      capabilities={[
        {
          title: 'Immersive Show-Day Interface',
          description: 'Full-screen dark mode interface built for the trade show floor. Large tap targets, essential info front and center, zero clutter.',
          icon: Smartphone,
        },
        {
          title: 'Venue & Hotel at a Glance',
          description: 'Venue address, hotel details, and confirmation numbers displayed prominently. Tap to copy, tap to navigate, tap to call an Uber.',
          icon: MapPin,
        },
        {
          title: 'One-Tap Transportation',
          description: 'Uber buttons pre-loaded with venue and hotel coordinates. No typing addresses into your phone while juggling booth materials.',
          icon: Navigation,
        },
        {
          title: 'Team Contacts Ready',
          description: 'See who from your team is at the show. Tap to text or call. No searching through your contacts during setup.',
          icon: Users,
        },
        {
          title: 'Show Agenda Built In',
          description: 'Exhibitor hours, setup times, reception schedules. All extracted from your vendor packet and displayed cleanly.',
          icon: Calendar,
        },
        {
          title: 'Quick Reference Info',
          description: 'WiFi credentials, show contact, badge pickup location. The stuff you always forget and need in the moment.',
          icon: Wifi,
        },
      ]}
      ctaText="Start Free Trial"
      onGetStarted={() => router.push('/')}
    />
  );
}
