'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  BarChart3, TrendingUp, Target, DollarSign, 
  Award, LineChart
} from 'lucide-react';

export default function AnalyticsFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Finally Measure What Actually Works"
      subtitle="ROI & Analytics"
      description="Stop guessing which shows are worth it. Track leads, measure cost per lead, and see real revenue attribution."
      icon={BarChart3}
      iconColor="#0969DA"
      benefits={[
        "Calculate cost per lead for every show automatically",
        "Track qualified leads vs total leads scanned",
        "Attribute revenue back to specific trade shows",
        "Compare show performance side by side",
        "Identify your highest and lowest performing shows",
        "Make data-driven decisions about next year's calendar",
      ]}
      capabilities={[
        {
          title: 'Cost Per Lead',
          description: 'Automatic calculation based on your total costs and leads captured.',
          icon: DollarSign,
        },
        {
          title: 'Lead Quality Tracking',
          description: 'Distinguish between badge scans and qualified opportunities.',
          icon: Target,
        },
        {
          title: 'Revenue Attribution',
          description: 'Connect closed deals back to the shows where relationships started.',
          icon: TrendingUp,
        },
        {
          title: 'Show Comparisons',
          description: 'Compare performance across shows to identify your winners and losers.',
          icon: BarChart3,
        },
        {
          title: 'Pipeline Tracking',
          description: 'Track meetings booked, deals in pipeline, and closed revenue by show.',
          icon: LineChart,
        },
        {
          title: 'ROI Calculations',
          description: 'See your return on investment with automatic ROI percentage calculations.',
          icon: Award,
        },
      ]}
      screenshot="/screenshots/budget.png"
      onGetStarted={() => router.push('/')}
    />
  );
}
