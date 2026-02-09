import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trade Show Calendar Management - Booth',
  description: 'Manage your entire trade show calendar in one place. Track dates, deadlines, and never double-book your team again.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
