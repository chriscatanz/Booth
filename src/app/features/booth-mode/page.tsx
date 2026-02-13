'use client';

import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Smartphone, 
  MapPin, 
  Users, 
  Car, 
  Calendar, 
  FileText,
  Navigation,
  Clock,
  Phone,
  CheckSquare
} from 'lucide-react';

export default function BoothModePage() {
  const router = useRouter();

  const benefits = [
    'Instant access to venue and hotel locations',
    'One-tap Uber to get you there on time',
    'Team member contacts at your fingertips',
    'Show agenda always available offline',
    'Quick access to booth assignments and setup info',
    'No more digging through emails on the show floor',
  ];

  const capabilities = [
    {
      title: 'Show Day Dashboard',
      description: 'Everything you need for the current show in one mobile-optimized view. No scrolling through tabs.',
      icon: Smartphone,
    },
    {
      title: 'One-Tap Uber',
      description: 'Get an Uber to the venue or hotel with a single tap. We handle the address lookup automatically.',
      icon: Car,
    },
    {
      title: 'Venue Navigation',
      description: 'Interactive map showing venue location, your hotel, and directions between them.',
      icon: MapPin,
    },
    {
      title: 'Team Contacts',
      description: 'Tap to call or text any team member assigned to the show. No contact hunting required.',
      icon: Phone,
    },
    {
      title: 'Show Agenda',
      description: 'Full agenda view with times and sessions. Know where you need to be and when.',
      icon: Calendar,
    },
    {
      title: 'Booth Assignment',
      description: 'Your booth number, kit details, and setup instructions. All in your pocket.',
      icon: CheckSquare,
    },
    {
      title: 'Quick Documents',
      description: 'Access important show documents, contracts, and exhibitor manuals on the go.',
      icon: FileText,
    },
    {
      title: 'Show Timeline',
      description: 'See setup, show days, and teardown at a glance. Always know what phase you are in.',
      icon: Clock,
    },
    {
      title: 'Offline Ready',
      description: 'Key information cached locally. Works even when conference WiFi lets you down.',
      icon: Navigation,
    },
  ];

  return (
    <FeaturePageLayout
      title="Your Show Day Command Center"
      subtitle="Booth Mode"
      description="A mobile-first experience designed for when you are on the show floor. Everything you need, nothing you do not. Activate it from the menu when you arrive at your next show."
      icon={Smartphone}
      iconColor="#8B5CF6"
      benefits={benefits}
      capabilities={capabilities}
      ctaText="Start Free Trial"
      screenshot="/screenshots/detail.png"
      onGetStarted={() => router.push('/signup')}
    />
  );
}
