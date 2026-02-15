import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Learn how Booth protects your trade show data with enterprise-grade security. SOC 2 compliant infrastructure, encryption, and privacy-first design.',
  openGraph: {
    title: 'Security - Booth Trade Show Management',
    description: 'Enterprise-grade security for your trade show data. SOC 2 compliant infrastructure and privacy-first design.',
    url: 'https://getbooth.io/security',
  },
};

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
