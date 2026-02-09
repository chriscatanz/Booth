'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, DollarSign, Users, BarChart3, 
  CheckCircle, ArrowRight, Truck, FileText,
  Shield, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingSection } from './pricing-section';
import { TestimonialsSection } from './testimonials-section';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const features = [
    {
      icon: Calendar,
      title: 'All Your Shows in One Place',
      description: 'Track dates, venues, booth details, and deadlines across your entire trade show calendar.',
    },
    {
      icon: DollarSign,
      title: 'Budget Tracking That Works',
      description: 'Know exactly what each show costs — booth fees, travel, shipping, services, everything.',
    },
    {
      icon: BarChart3,
      title: 'Actual ROI Metrics',
      description: 'Cost per lead, qualified lead rates, revenue attribution. Finally measure what matters.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share access with your team. No more "where\'s that spreadsheet?" conversations.',
    },
    {
      icon: Truck,
      title: 'Shipping & Logistics',
      description: 'Tracking numbers, cutoff dates, packing lists. Never show up missing a power strip again.',
    },
    {
      icon: FileText,
      title: 'All Your Documents',
      description: 'Vendor packets, hotel confirmations, booth layouts — attached right to each show.',
    },
  ];

  const benefits = [
    'Stop managing shows across 14 spreadsheets',
    'Know your true cost per lead after every show',
    'Never miss a shipping deadline again',
    'Get your whole team on the same page',
    'Make data-driven decisions about which shows to attend',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center shadow-lg shadow-brand-purple/25">
              <span className="text-white text-lg font-black">B</span>
            </div>
            <span className="font-black text-xl text-text-primary">Booth</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onSignIn}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </button>
            <Button variant="primary" size="sm" onClick={onGetStarted}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
              Your trade show program,
              <span className="bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent"> finally organized</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
              Booth is the command center for your entire trade show calendar. 
              Track every show, manage budgets, and measure what actually works.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" size="lg" onClick={onGetStarted}>
                Start 7-Day Free Trial <ArrowRight size={16} className="ml-1" />
              </Button>
              <p className="text-sm text-text-tertiary">No credit card required</p>
            </div>
          </motion.div>

          {/* App preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden"
          >
            <div className="bg-sidebar-bg px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span className="text-xs text-white/40 ml-2">Booth — Dashboard</span>
            </div>
            <img 
              src="/app-screenshot.png" 
              alt="Booth dashboard showing trade show management interface with calendar, tasks, and budget tracking"
              className="w-full"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
              Everything you need to manage trade shows
            </h2>
            <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
              Built by a trade show manager, for trade show managers. 
              Every feature solves a real problem.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-surface border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center mb-4">
                  <feature.icon size={20} className="text-brand-purple" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-text-primary mb-6">
                Stop the spreadsheet madness
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-brand-purple/10 to-brand-cyan/10 rounded-2xl p-8">
              <div className="text-center">
                <p className="text-5xl font-bold text-brand-purple">2x</p>
                <p className="text-text-secondary mt-2">faster show prep on average</p>
              </div>
              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-4xl font-bold text-brand-cyan">100%</p>
                <p className="text-text-secondary mt-2">visibility into show costs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing */}
      <div className="bg-bg-secondary">
        <PricingSection onGetStarted={onGetStarted} />
      </div>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to take control of your trade show program?
          </h2>
          <p className="text-text-secondary mb-8">
            Join other marketing teams who've ditched the spreadsheet chaos.
          </p>
          <Button variant="primary" size="lg" onClick={onGetStarted}>
            Start Free Trial <ArrowRight size={16} className="ml-1" />
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
            <a href="/terms" className="hover:text-text-secondary transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-text-secondary transition-colors">Privacy</a>
            <a href="mailto:support@example.com" className="hover:text-text-secondary transition-colors">Contact</a>
          </div>
          <p className="text-sm text-text-tertiary">
            © {new Date().getFullYear()} Booth
          </p>
        </div>
      </footer>
    </div>
  );
}
