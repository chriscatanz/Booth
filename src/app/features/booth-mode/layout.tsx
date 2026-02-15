import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Booth Mode - Show Day Command Center',
  description: 'Mobile-first experience for the show floor. One-tap Uber, venue navigation, team contacts, and show agenda. Works offline when conference WiFi fails.',
  keywords: ['trade show mobile app', 'booth mode', 'show floor app', 'trade show command center', 'event day app'],
  openGraph: {
    title: 'Booth Mode - Booth Trade Show Management',
    description: 'Mobile-first experience for the show floor. Everything you need on show day, nothing you don\'t.',
    url: 'https://getbooth.io/features/booth-mode',
  },
};

export default function BoothModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
