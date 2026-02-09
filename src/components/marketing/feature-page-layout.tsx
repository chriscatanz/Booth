'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FeaturePageLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  benefits: string[];
  capabilities: {
    title: string;
    description: string;
    icon: React.ElementType;
  }[];
  ctaText?: string;
  onGetStarted: () => void;
}

export function FeaturePageLayout({
  title,
  subtitle,
  description,
  icon: Icon,
  iconColor,
  benefits,
  capabilities,
  ctaText = 'Start Free Trial',
  onGetStarted,
}: FeaturePageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center shadow-lg shadow-brand-purple/25">
              <span className="text-white text-lg font-black">B</span>
            </div>
            <span className="font-black text-xl text-text-primary">Booth</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/features"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:inline"
            >
              All Features
            </Link>
            <Link 
              href="/#pricing"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:inline"
            >
              Pricing
            </Link>
            <Button variant="primary" size="sm" onClick={onGetStarted}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Back link */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${iconColor}15` }}
            >
              <Icon size={32} style={{ color: iconColor }} />
            </div>
            <p className="text-sm font-medium text-brand-purple uppercase tracking-wide mb-3">
              {subtitle}
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-6">
              {title}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              {description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 px-4 sm:px-6 bg-bg-secondary">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-border"
              >
                <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
                <span className="text-text-primary">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Everything you need
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Purpose-built features that solve real problems trade show managers face every day.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-surface border border-border hover:border-brand-purple/30 transition-colors"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${iconColor}15` }}
                >
                  <cap.icon size={20} style={{ color: iconColor }} />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{cap.title}</h3>
                <p className="text-sm text-text-secondary">{cap.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 bg-bg-secondary">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to get organized?
          </h2>
          <p className="text-text-secondary mb-8">
            Join other marketing teams who've ditched the spreadsheet chaos.
          </p>
          <Button variant="primary" size="lg" onClick={onGetStarted}>
            {ctaText} <ArrowRight size={16} className="ml-1" />
          </Button>
          <p className="text-sm text-text-tertiary mt-4">No credit card required</p>
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
            <Link href="/features" className="hover:text-text-secondary transition-colors">Features</Link>
            <Link href="/#pricing" className="hover:text-text-secondary transition-colors">Pricing</Link>
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
