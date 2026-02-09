import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Collaboration for Trade Shows - Booth',
  description: 'Get your whole team on the same page. Role-based permissions, activity feeds, and real-time collaboration.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
