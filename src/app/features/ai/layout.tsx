import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI-Powered Trade Show Assistant',
  description: 'Generate booth talking points, social posts, follow-up emails, and post-show reports with AI. Extract data from vendor packets automatically.',
  keywords: ['AI trade show', 'booth talking points', 'trade show AI assistant', 'automated content generation', 'vendor packet extraction'],
  openGraph: {
    title: 'AI Integration - Booth Trade Show Management',
    description: 'Generate booth talking points, social posts, follow-up emails, and post-show reports with AI.',
    url: 'https://getbooth.io/features/ai',
  },
};

export default function AIFeatureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
