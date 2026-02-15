import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Booth team. We\'re here to help with questions about trade show management software, pricing, or technical support.',
  openGraph: {
    title: 'Contact Booth - Trade Show Management Software',
    description: 'Get in touch with the Booth team for questions about trade show management.',
    url: 'https://getbooth.io/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
