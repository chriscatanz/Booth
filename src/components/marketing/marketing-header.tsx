'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, Sparkles, FileSpreadsheet, Layers, Calendar, DollarSign, Users, Truck, Package, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketingHeaderProps {
  onGetStarted?: () => void;
}

const FEATURES = [
  { slug: 'calendar', icon: Calendar, color: '#0969DA', title: 'Trade Show Calendar' },
  { slug: 'budget', icon: DollarSign, color: '#1A7F37', title: 'Budget Management' },
  { slug: 'team', icon: Users, color: '#8250DF', title: 'Team Collaboration' },
  { slug: 'logistics', icon: Truck, color: '#BF8700', title: 'Shipping & Logistics' },
  { slug: 'assets', icon: Package, color: '#CF222E', title: 'Asset Management' },
  { slug: 'analytics', icon: BarChart3, color: '#0969DA', title: 'ROI & Analytics' },
  { slug: 'ai', icon: Sparkles, color: '#8B5CF6', title: 'AI Assistant' },
  { slug: 'import-export', icon: FileSpreadsheet, color: '#059669', title: 'Import & Export' },
  { slug: 'templates', icon: Layers, color: '#F59E0B', title: 'Show Templates' },
];

export function MarketingHeader({ onGetStarted }: MarketingHeaderProps) {
  const router = useRouter();
  const handleGetStarted = onGetStarted || (() => router.push('/'));
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center shadow-lg shadow-brand-purple/25">
              <span className="text-white text-lg font-black">B</span>
            </div>
            <span className="font-black text-xl text-text-primary">Booth</span>
          </Link>

          {/* Centered Nav - Desktop */}
          <nav className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2">
            {/* Features Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setFeaturesOpen(!featuresOpen)}
                className="flex items-center gap-1 text-base font-semibold text-text-primary hover:text-brand-purple transition-colors"
              >
                Features
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${featuresOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <AnimatePresence>
                {featuresOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-64 py-2 bg-surface border border-border rounded-xl shadow-xl"
                  >
                    {FEATURES.map((feature) => (
                      <Link
                        key={feature.slug}
                        href={`/features/${feature.slug}`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                        onClick={() => setFeaturesOpen(false)}
                      >
                        <feature.icon size={16} style={{ color: feature.color }} />
                        {feature.title}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link 
              href="/#pricing"
              className="text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Pricing
            </Link>

            <Link 
              href="/about"
              className="text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              About
            </Link>

            <Link 
              href="/contact"
              className="text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={handleGetStarted}>
              Start Free Trial
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <nav className="pt-4 pb-2 border-t border-border mt-4">
                {/* Features section */}
                <div className="mb-2">
                  <span className="block px-2 py-2 text-base font-semibold text-text-primary">
                    Features
                  </span>
                  <div className="pl-4 space-y-1">
                    {FEATURES.map((feature) => (
                      <Link
                        key={feature.slug}
                        href={`/features/${feature.slug}`}
                        className="flex items-center gap-3 px-2 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <feature.icon size={16} style={{ color: feature.color }} />
                        {feature.title}
                      </Link>
                    ))}
                  </div>
                </div>

                <Link 
                  href="/#pricing"
                  className="block px-2 py-2 text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>

                <Link 
                  href="/about"
                  className="block px-2 py-2 text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>

                <Link 
                  href="/contact"
                  className="block px-2 py-2 text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>

                <div className="mt-4 pt-4 border-t border-border">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleGetStarted();
                    }}
                    className="w-full"
                  >
                    Start Free Trial
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
