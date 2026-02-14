'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, Sparkles, Layers, Calendar, DollarSign, Users, Truck, Bell, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketingHeaderProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

const NAV_FEATURES = [
  { slug: 'calendar', icon: Calendar, title: 'Calendar', color: '#0969DA', description: 'Schedule, deadlines & sync' },
  { slug: 'budget', icon: DollarSign, title: 'Budget & ROI', color: '#1A7F37', description: 'Track costs, measure results' },
  { slug: 'logistics', icon: Truck, title: 'Logistics', color: '#BF8700', description: 'Shipping, tracking & kits' },
  { slug: 'templates', icon: Layers, title: 'Templates & Import', color: '#F59E0B', description: 'Reuse setups, import CSV' },
  { slug: 'booth-mode', icon: Smartphone, title: 'Booth Mode', color: '#8B5CF6', description: 'Show-day mobile command' },
  { slug: 'ai', icon: Sparkles, title: 'AI Assistant', color: '#8B5CF6', description: 'Smart extraction & chat' },
  { slug: 'team', icon: Users, title: 'Team', color: '#8250DF', description: 'Roles & collaboration' },
  { slug: 'notifications', icon: Bell, title: 'Notifications', color: '#F59E0B', description: 'Email & in-app alerts' },
];

export function MarketingHeader({ onGetStarted, onSignIn }: MarketingHeaderProps) {
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
                className="flex items-center gap-1 text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
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
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[720px] p-6 bg-surface border border-border rounded-2xl shadow-2xl"
                  >
                    {/* Mega Menu Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {NAV_FEATURES.map((feature) => (
                        <Link
                          key={feature.slug}
                          href={`/features/${feature.slug}`}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-bg-secondary transition-colors group"
                          onClick={() => setFeaturesOpen(false)}
                        >
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${feature.color}15` }}
                          >
                            <feature.icon size={20} style={{ color: feature.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary group-hover:text-brand-purple transition-colors">
                              {feature.title}
                            </p>
                            <p className="text-xs text-text-tertiary mt-0.5">
                              {feature.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    
                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <Link
                        href="/features"
                        className="text-sm font-semibold text-brand-purple hover:text-brand-purple-dark transition-colors flex items-center gap-1"
                        onClick={() => setFeaturesOpen(false)}
                      >
                        View all features
                        <ChevronDown size={14} className="-rotate-90" />
                      </Link>
                      <p className="text-xs text-text-tertiary">
                        Built by a trade show manager, for trade show managers
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a 
              href="/#pricing"
              className="text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Pricing
            </a>

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
            {onSignIn && (
              <button 
                onClick={onSignIn}
                className="text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign In
              </button>
            )}
            <Button variant="primary" size="sm" onClick={handleGetStarted}>
              Start Free Trial
            </Button>
          </div>

          {/* Mobile - Sign In + Menu */}
          <div className="flex md:hidden items-center gap-2">
            {onSignIn && (
              <button 
                onClick={onSignIn}
                className="px-3 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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
                  <Link
                    href="/features"
                    className="block px-2 py-2 text-base font-semibold text-text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <div className="pl-4 space-y-1">
                    {NAV_FEATURES.map((feature) => (
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

                <a 
                  href="/#pricing"
                  className="block px-2 py-2 text-base font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>

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
