'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing';
import { 
  Calendar, DollarSign, Users, 
  Truck, ArrowRight,
  Sparkles, Layers, Smartphone, Bell
} from 'lucide-react';

const FEATURES = [
  {
    slug: 'calendar',
    icon: Calendar,
    color: '#0969DA',
    title: 'Calendar',
    description: 'Your entire show schedule in one view, synced to Google, Outlook, or Apple Calendar.',
    highlights: ['Visual calendar view', 'Deadline tracking', 'One-click sync'],
  },
  {
    slug: 'budget',
    icon: DollarSign,
    color: '#1A7F37',
    title: 'Budget & ROI',
    description: 'Track every dollar and measure what actually works with real performance data.',
    highlights: ['Cost tracking', 'Cost per lead', 'Revenue attribution'],
  },
  {
    slug: 'logistics',
    icon: Truck,
    color: '#BF8700',
    title: 'Logistics',
    description: 'Track shipments in real-time, manage booth kits, and never miss a deadline.',
    highlights: ['Live tracking', 'Kit inventory', 'Deadline alerts'],
  },
  {
    slug: 'templates',
    icon: Layers,
    color: '#F59E0B',
    title: 'Templates & Import',
    description: 'Save your booth setup once, reuse it forever. Import from spreadsheets in minutes.',
    highlights: ['Reusable setups', 'CSV import', 'Custom exports'],
  },
  {
    slug: 'booth-mode',
    icon: Smartphone,
    color: '#8B5CF6',
    title: 'Booth Mode',
    description: 'A focused, mobile-first interface for the trade show floor.',
    highlights: ['Show-day command center', 'One-tap Uber', 'Team contacts'],
  },
  {
    slug: 'ai',
    icon: Sparkles,
    color: '#8B5CF6',
    title: 'AI Assistant',
    description: 'Generate content, extract 40+ fields from documents, and chat about your shows.',
    highlights: ['Content generation', 'Smart extraction', 'Selective import'],
  },
  {
    slug: 'team',
    icon: Users,
    color: '#8250DF',
    title: 'Team',
    description: 'Get your whole team on the same page with shared access and role-based permissions.',
    highlights: ['Role-based access', 'Document visibility', 'Read view'],
  },
  {
    slug: 'notifications',
    icon: Bell,
    color: '#DC2626',
    title: 'Notifications',
    description: 'Get timely reminders about deadlines, shipping cutoffs, and upcoming shows.',
    highlights: ['Deadline alerts', 'Daily digests', 'Configurable timing'],
  },
];

export default function FeaturesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-6">
              Everything you need to
              <span className="bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent"> manage trade shows</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Built by a trade show manager who was tired of spreadsheet chaos. 
              Every feature solves a real problem.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link 
                  href={`/features/${feature.slug}`}
                  className="block p-6 rounded-xl bg-surface border border-border hover:border-brand-purple/30 hover:shadow-lg transition-all group h-full"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon size={24} style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-brand-purple transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-1">
                    {feature.highlights.map((h) => (
                      <li key={h} className="text-xs text-text-tertiary flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: feature.color }} />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-sm font-medium text-brand-purple flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight size={14} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 bg-bg-secondary">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to take control?
          </h2>
          <p className="text-text-secondary mb-8">
            Start your free trial today. No credit card required.
          </p>
          <Button variant="primary" size="lg" onClick={() => router.push('/')}>
            Start 7-Day Free Trial <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center">
              <span className="text-white text-xs font-black">B</span>
            </div>
            <span className="text-sm font-bold text-text-secondary">Booth</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-tertiary">
            <Link href="/#pricing" className="hover:text-text-secondary transition-colors">Pricing</Link>
            <Link href="/about" className="hover:text-text-secondary transition-colors">About</Link>
            <Link href="/contact" className="hover:text-text-secondary transition-colors">Contact</Link>
            <Link href="/terms" className="hover:text-text-secondary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-text-secondary transition-colors">Privacy</Link>
          </div>
          <p className="text-sm text-text-tertiary">
            © {new Date().getFullYear()} Booth
          </p>
        </div>
      </footer>
    </div>
  );
}
