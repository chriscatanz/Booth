'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePageLayout } from '@/components/marketing/feature-page-layout';
import { 
  Sparkles, MessageSquare, Palette,
  Target, Key, Zap, Upload
} from 'lucide-react';

export default function AIFeaturePage() {
  const router = useRouter();

  return (
    <FeaturePageLayout
      title="Your AI-Powered Trade Show Assistant"
      subtitle="AI Integration"
      description="From generating booth talking points to creating post-show reports, let AI handle the content creation while you focus on relationships."
      icon={Sparkles}
      iconColor="#8B5CF6"
      benefits={[
        "Generate booth talking points tailored to each show's audience",
        "Create compelling social media posts announcing your attendance",
        "Draft personalized follow-up emails for leads",
        "Produce comprehensive post-show reports in minutes",
        "Build show-specific packing checklists automatically",
        "Get answers about your shows instantly via AI chat",
      ]}
      capabilities={[
        {
          title: 'One-Click Content Generation',
          description: 'Select a show and content type, hit generate. Talking points, social posts, emails, reports, and checklists — all customized to your specific show.',
          icon: Zap,
        },
        {
          title: 'Smart Document Extraction',
          description: 'Upload a vendor packet, exhibitor guide, or contract — AI extracts show details automatically and populates your show record.',
          icon: Upload,
        },
        {
          title: 'AI Chat Assistant',
          description: 'Ask questions about your trade show program. "What\'s my total Q1 spend?" "Which shows have missing hotel confirmations?" Get instant answers.',
          icon: MessageSquare,
        },
        {
          title: 'Branding-Aware Content',
          description: 'Set your company and product descriptions once. AI uses this context to generate on-brand content that sounds like you, not a robot.',
          icon: Palette,
        },
        {
          title: 'Show-Specific Context',
          description: 'Select which show to focus on. AI pulls in all details — dates, location, booth size, attendees — to create relevant, specific content.',
          icon: Target,
        },
        {
          title: 'Bring Your Own API Key',
          description: 'Use your own Claude API key for complete control over costs and usage. Your data stays private — we never store your prompts or responses.',
          icon: Key,
        },
      ]}
      ctaText="Start Free Trial"
      onGetStarted={() => router.push('/')}
    />
  );
}
