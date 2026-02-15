import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Explore all the features that make Booth the best trade show management software. Calendar, budget tracking, team collaboration, logistics, and more.',
  openGraph: {
    title: 'Features - Booth Trade Show Management',
    description: 'Explore all features: calendar, budget tracking, team collaboration, AI assistant, and more.',
    url: 'https://getbooth.io/features',
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
