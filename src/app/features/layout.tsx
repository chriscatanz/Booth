import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features - Booth',
  description: 'Explore all the features that make Booth the best trade show management software. Calendar, budget tracking, team collaboration, logistics, and more.',
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
