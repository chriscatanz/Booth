import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PWARegister } from '@/components/pwa-register';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { CookieConsent } from '@/components/legal/cookie-consent';
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://getbooth.io'),
  title: {
    default: 'Booth - Trade Show Management Software',
    template: '%s | Booth',
  },
  description: 'Your trade show command center. Track shows, manage budgets, coordinate teams, and measure ROI, all in one place. Built by a trade show manager, for trade show managers.',
  keywords: ['trade show management', 'event management', 'trade show software', 'booth management', 'event ROI', 'trade show budget', 'exhibit management'],
  authors: [{ name: 'Booth' }],
  creator: 'Booth',
  publisher: 'Booth',
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Booth',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Booth',
    title: 'Booth - Trade Show Management Software',
    description: 'Your trade show command center. Track shows, manage budgets, coordinate teams, and measure ROI.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Booth - Trade Show Management Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Booth - Trade Show Management Software',
    description: 'Your trade show command center. Track shows, manage budgets, and measure ROI.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D1117',
  viewportFit: 'cover', // Required for safe-area-inset-* to work on notched devices
};

// JSON-LD structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Booth',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android, Windows, macOS',
  description: 'Trade show management software for tracking shows, managing budgets, coordinating teams, and measuring ROI.',
  url: 'https://getbooth.io',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free trial available',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5',
    ratingCount: '1',
  },
  author: {
    '@type': 'Organization',
    name: 'Booth',
    url: 'https://getbooth.io',
  },
  featureList: [
    'Trade show calendar management',
    'Budget tracking and ROI analysis',
    'Team coordination',
    'Logistics and shipping management',
    'AI-powered content generation',
    'Email notifications and reminders',
    'Offline booth mode for show days',
    'Templates and CSV import',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
        <PWARegister />
        <PWAInstallPrompt />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
