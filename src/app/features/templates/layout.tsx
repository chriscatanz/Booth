import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Templates & Import',
  description: 'Save shows as reusable templates and import from CSV. Migrate from spreadsheets in minutes. Set up once, reuse forever.',
  keywords: ['trade show templates', 'show template', 'CSV import', 'trade show spreadsheet', 'event templates'],
  openGraph: {
    title: 'Templates & Import - Booth Trade Show Management',
    description: 'Save shows as reusable templates and import from CSV. Migrate from spreadsheets in minutes.',
    url: 'https://getbooth.io/features/templates',
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
