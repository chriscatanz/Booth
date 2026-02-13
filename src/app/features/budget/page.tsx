'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  DollarSign, PieChart, TrendingUp, Receipt, 
  Calculator, FileSpreadsheet, Target
} from 'lucide-react';

export default function BudgetFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Know Exactly What Every Show Costs"
      subtitle="Budget Management"
      description="Stop guessing what your trade show program actually costs. Track every expense, forecast spending, and make data-driven decisions."
      icon={DollarSign}
      iconColor="#1A7F37"
      benefits={[
        "Track all costs in one place: booth fees, travel, shipping, services",
        "See total program spend at a glance with rollup dashboards",
        "Compare budgeted vs actual costs for every show",
        "Forecast quarterly and annual trade show spending",
        "Break down costs by category to find savings opportunities",
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
          title: 'Spending Forecasts',
          description: 'See your projected spend for the quarter and year based on upcoming shows.',
          icon: TrendingUp,
        },
        {
          title: 'Category Breakdown',
          description: 'Understand where your money goes with automatic expense categorization.',
          icon: PieChart,
        },
        {
          title: 'Quick Calculations',
          description: 'Automatic totals, per-show costs, and cost-per-lead calculations.',
          icon: Calculator,
        },
        {
          title: 'Export Reports',
          description: 'One-click export to CSV for expense reports and finance reviews.',
          icon: FileSpreadsheet,
        },
      ]}
      screenshot="/screenshots/budget.png"
      onGetStarted={() => router.push('/')}
    />
  );
}
