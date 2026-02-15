import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Booth',
  description: 'Built by trade show professionals who understand the chaos of managing dozens of events. Learn about our mission to simplify trade show management.',
  openGraph: {
    title: 'About Booth - Trade Show Management Software',
    description: 'Built by trade show professionals who understand the chaos of managing dozens of events.',
    url: 'https://getbooth.io/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
