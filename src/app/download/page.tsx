'use client';

import { motion } from 'framer-motion';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { Download, Apple, Monitor, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-purple/10 mb-6">
              <Download size={32} className="text-brand-purple" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
              Download Booth
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Get the native desktop app for the best experience. Works offline and syncs automatically when you're back online.
            </p>
          </motion.div>

          {/* Download Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid sm:grid-cols-2 gap-6 mb-12"
          >
            {/* macOS */}
            <div className="bg-surface border border-border rounded-2xl p-6 text-center hover:border-brand-purple/50 transition-colors">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-bg-tertiary mb-4">
                <Apple size={28} className="text-text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">macOS</h3>
              <p className="text-sm text-text-secondary mb-4">
                For Mac computers running macOS 11 or later
              </p>
              <a
                href="https://github.com/chriscatanz/Booth/releases/latest/download/Booth_macos.dmg"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-purple text-white rounded-lg font-medium hover:bg-brand-purple-dark transition-colors"
              >
                <Download size={18} />
                Download for Mac
              </a>
              <p className="text-xs text-text-tertiary mt-3">
                Universal binary (Intel + Apple Silicon)
              </p>
            </div>

            {/* Windows */}
            <div className="bg-surface border border-border rounded-2xl p-6 text-center hover:border-brand-purple/50 transition-colors">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-bg-tertiary mb-4">
                <Monitor size={28} className="text-text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Windows</h3>
              <p className="text-sm text-text-secondary mb-4">
                For Windows 10 or later (64-bit)
              </p>
              <a
                href="https://github.com/chriscatanz/Booth/releases/latest/download/Booth_windows.msi"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-purple text-white rounded-lg font-medium hover:bg-brand-purple-dark transition-colors"
              >
                <Download size={18} />
                Download for Windows
              </a>
              <p className="text-xs text-text-tertiary mt-3">
                MSI installer
              </p>
            </div>
          </motion.div>

          {/* Web App Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-tertiary/50 border border-border rounded-xl p-6 text-center"
          >
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface mb-3">
              <Smartphone size={20} className="text-text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              Prefer the web?
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Booth also works great in your browser. No download required.
            </p>
            <Link
              href="/"
              className="text-brand-purple hover:underline text-sm font-medium"
            >
              Open Web App →
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <h3 className="text-lg font-medium text-text-primary mb-4">
              Why download the app?
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm text-text-secondary">
              <div className="p-4 bg-surface rounded-lg border border-border">
                <strong className="block text-text-primary mb-1">Faster</strong>
                Native performance, instant startup
              </div>
              <div className="p-4 bg-surface rounded-lg border border-border">
                <strong className="block text-text-primary mb-1">Offline</strong>
                Access your data without internet
              </div>
              <div className="p-4 bg-surface rounded-lg border border-border">
                <strong className="block text-text-primary mb-1">Notifications</strong>
                Desktop alerts for deadlines
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
