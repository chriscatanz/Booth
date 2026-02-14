'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  DollarSign, PieChart, TrendingUp, Receipt, 
  Calculator, FileSpreadsheet, Target, BarChart3, Award
} from 'lucide-react';

export default function BudgetFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Track Costs, Measure Results"
      subtitle="Budget & ROI"
      description="Know exactly what every show costs and whether it's worth it. Track expenses, measure leads, and calculate real ROI."
      icon={DollarSign}
      iconColor="#1A7F37"
      benefits={[
        "Track all costs in one place: booth fees, travel, shipping, services",
        "See total program spend at a glance with rollup dashboards",
        "Calculate cost per lead automatically for every show",
        "Compare budgeted vs actual costs in real-time",
        "Attribute revenue back to specific trade shows",
        "Generate expense reports for finance in seconds",
      ]}
      capabilities={[
        {
          title: 'Complete Cost Tracking',
          description: 'Registration, booth, travel, hotel, shipping, services. Every dollar captured.',
          icon: Receipt,
        },
        {
          title: 'Budget vs Actual',
          description: 'Set budgets for each show and track actual spending against them in real-time.',
          icon: Target,
        },
        {
          title: 'Cost Per Lead',
          description: 'Automatic calculation based on your total costs and leads captured at each show.',
          icon: Calculator,
        },
        {
          title: 'ROI Calculations',
          description: 'See your return on investment with automatic ROI percentage calculations.',
          icon: Award,
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
          title: 'Category Breakdown',
          description: 'Understand where your money goes with automatic expense categorization.',
          icon: PieChart,
        },
        {
          title: 'Export Reports',
          description: 'One-click export to CSV for expense reports and finance reviews.',
          icon: FileSpreadsheet,
        },
      ]}
      screenshot="/screenshots/budget.svg"
      onGetStarted={() => router.push('/')}
    />
  );
}
