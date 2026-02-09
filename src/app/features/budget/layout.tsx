import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trade Show Budget Management - Booth',
  description: 'Track every dollar across all your trade shows. Budget forecasting, expense tracking, and cost analysis in one place.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
