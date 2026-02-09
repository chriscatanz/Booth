import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trade Show Shipping & Logistics - Booth',
  description: 'Never miss a shipping deadline again. Track cutoffs, manage packing lists, and ensure materials arrive on time.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
