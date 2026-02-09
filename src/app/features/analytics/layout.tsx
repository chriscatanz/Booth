import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trade Show ROI & Analytics - Booth',
  description: 'Measure what actually works. Cost per lead, revenue attribution, and show performance comparisons.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
