'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Shield, Lock, Eye, Server, 
  Users, Database, RefreshCw,
  CheckCircle2, ExternalLink
} from 'lucide-react';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Encryption Everywhere',
    description: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Sensitive fields like emails and phone numbers use additional application-level encryption.',
  },
  {
    icon: Shield,
    title: 'Row-Level Security',
    description: "Database-enforced access controls ensure users only see data they're authorized to access. Your data is isolated from other organizations at the database level.",
  },
  {
    icon: Eye,
    title: 'Comprehensive Audit Logging',
    description: 'Every action is logged with timestamps and user attribution. Know who did what, when — essential for compliance and accountability.',
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    description: 'Granular permissions let you control exactly what team members can see and do. Owners, admins, and members have distinct capabilities.',
  },
  {
    icon: Database,
    title: 'Secure Authentication',
    description: 'Industry-standard authentication powered by Supabase Auth. Support for email/password with secure password policies and session management.',
  },
  {
    icon: RefreshCw,
    title: 'Regular Backups',
    description: 'Your data is backed up automatically with point-in-time recovery. In the unlikely event of data loss, we can restore to any point.',
  },
];

const infrastructurePartners = [
  {
    name: 'Vercel',
    role: 'Application Hosting',
    certifications: ['SOC 2 Type II', 'GDPR'],
    url: 'https://vercel.com/security',
  },
  {
    name: 'Supabase',
    role: 'Database & Auth',
    certifications: ['SOC 2 Type II', 'HIPAA'],
    url: 'https://supabase.com/security',
  },
  {
    name: 'Stripe',
    role: 'Payment Processing',
    certifications: ['PCI DSS Level 1', 'SOC 2'],
    url: 'https://stripe.com/docs/security',
  },
];

const complianceItems = [
  {
    title: 'GDPR Compliant',
    description: 'We respect EU data protection requirements. Export or delete your data anytime.',
  },
  {
    title: 'CCPA Compliant',
    description: "California residents can exercise their privacy rights. We don't sell your data.",
  },
  {
    title: 'Data Portability',
    description: 'Export all your data in standard formats (CSV, JSON) whenever you need it.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/10 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 py-12 relative">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-purple/20 text-brand-purple mb-6">
              <Shield size={32} />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Security & Trust
            </h1>
            <p className="text-lg text-text-secondary">
              Your trade show data is sensitive. We treat it that way. Here&apos;s how we protect 
              your information and maintain your trust.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Security Features Grid */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl font-bold text-text-primary mb-8"
        >
          Built-In Security
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl border border-border bg-surface"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-success/20 text-success mb-4">
                <feature.icon size={20} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Infrastructure Partners */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Enterprise-Grade Infrastructure
          </h2>
          <p className="text-text-secondary mb-8">
            We partner with industry-leading providers who maintain rigorous security certifications.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {infrastructurePartners.map((partner, index) => (
            <motion.a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl border border-border bg-surface hover:border-brand-purple/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-brand-purple transition-colors">
                    {partner.name}
                  </h3>
                  <p className="text-sm text-text-tertiary">{partner.role}</p>
                </div>
                <ExternalLink size={16} className="text-text-tertiary group-hover:text-brand-purple transition-colors" />
              </div>
              <div className="flex flex-wrap gap-2">
                {partner.certifications.map((cert) => (
                  <span 
                    key={cert}
                    className="px-2 py-1 text-xs rounded-full bg-bg-tertiary text-text-secondary"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Compliance Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Privacy & Compliance
          </h2>
          <p className="text-text-secondary mb-8">
            We&apos;re committed to protecting your privacy and meeting regulatory requirements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {complianceItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4"
            >
              <CheckCircle2 className="shrink-0 text-success mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">{item.title}</h3>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What We Don't Do */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl border border-border bg-surface"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            What We Don&apos;t Do
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-text-secondary">
            <div className="flex items-center gap-3">
              <span className="text-error">✕</span>
              <span>Sell your data to third parties</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-error">✕</span>
              <span>Use third-party advertising trackers</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-error">✕</span>
              <span>Store payment card details (Stripe handles this)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-error">✕</span>
              <span>Share data between organizations</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-error">✕</span>
              <span>Access your data without your permission</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-error">✕</span>
              <span>Train AI models on your data</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* AI Features Note */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 border border-brand-purple/20"
        >
          <div className="flex gap-4">
            <Server className="shrink-0 text-brand-purple mt-1" size={24} />
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                A Note About AI Features
              </h2>
              <p className="text-text-secondary mb-4">
                Booth offers optional AI-powered features for content generation. When you use these features:
              </p>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="shrink-0 text-success mt-0.5" size={16} />
                  <span>You provide your own API key (BYOK) — we never see it</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="shrink-0 text-success mt-0.5" size={16} />
                  <span>Only data you explicitly include is sent to the AI provider</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="shrink-0 text-success mt-0.5" size={16} />
                  <span>AI features are completely optional — the app works without them</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="shrink-0 text-success mt-0.5" size={16} />
                  <span>We use Anthropic&apos;s Claude, which doesn&apos;t train on API inputs</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="max-w-5xl mx-auto px-4 py-12 mb-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Security Questions?
          </h2>
          <p className="text-text-secondary mb-6">
            We take security seriously. If you have questions, concerns, or need to report a vulnerability, 
            we&apos;re here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:security@getbooth.io"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-purple text-white font-medium hover:bg-brand-purple/90 transition-colors"
            >
              Contact Security Team
            </a>
            <Link 
              href="/privacy"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text-primary font-medium hover:bg-surface transition-colors"
            >
              Read Privacy Policy
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
