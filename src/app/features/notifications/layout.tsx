import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Notifications',
  description: 'Never miss a shipping deadline or registration cutoff. Get timely reminders about upcoming shows and critical dates delivered to your inbox.',
  keywords: ['trade show reminders', 'deadline notifications', 'shipping alerts', 'event notifications', 'trade show deadlines'],
  openGraph: {
    title: 'Email Notifications - Booth Trade Show Management',
    description: 'Never miss a shipping deadline or registration cutoff. Timely reminders delivered to your inbox.',
    url: 'https://getbooth.io/features/notifications',
  },
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
