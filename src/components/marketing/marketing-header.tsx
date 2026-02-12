'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, DollarSign, Users, BarChart3, Truck,
  ChevronDown, Menu, X, Sparkles, FileSpreadsheet, 
  Layers, RefreshCw, Bell, Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_FEATURES = [
  { slug: 'calendar', icon: Calendar, title: 'Trade Show Calendar', color: '#0969DA' },
  { slug: 'calendar-sync', icon: RefreshCw, title: 'Calendar Sync', color: '#06B6D4' },
  { slug: 'budget', icon: DollarSign, title: 'Budget Management', color: '#1A7F37' },
  { slug: 'team', icon: Users, title: 'Team Collaboration', color: '#8250DF' },
  { slug: 'logistics', icon: Truck, title: 'Shipping & Logistics', color: '#BF8700' },
  { slug: 'kits', icon: Box, title: 'Booth Kits', color: '#CF222E' },
  { slug: 'analytics', icon: BarChart3, title: 'ROI & Analytics', color: '#0969DA' },
  { slug: 'ai', icon: Sparkles, title: 'AI Assistant', color: '#8B5CF6' },
  { slug: 'notifications', icon: Bell, title: 'Notifications', color: '#F59E0B' },
  { slug: 'import-export', icon: FileSpreadsheet, title: 'Import & Export', color: '#059669' },
  { slug: 'templates', icon: Layers, title: 'Show Templates', color: '#EA580C' },
];

interface MarketingHeaderProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function MarketingHeader({ onGetStarted, onSignIn }: MarketingHeaderProps) {
  const router = useRouter();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push('/');
    }
  };

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      router.push('/?mode=login');
    }
  };

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
                            <span className="text-sm font-semibold text-text-primary group-hover:text-brand-purple transition-colors">
                              {feature.title}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    
                    {/* View All Link */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <Link 
                        href="/features"
                        className="text-sm font-semibold text-brand-purple hover:text-brand-purple-dark transition-colors"
                        onClick={() => setFeaturesOpen(false)}
                      >
                        View all features →
                      </Link>
                    </div>
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
          </nav>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={handleSignIn}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Log In
            </button>
            <Button variant="primary" size="sm" onClick={handleGetStarted}>
              Start Free Trial
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
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
              className="md:hidden mt-4 pb-4 border-t border-border pt-4"
            >
              <nav className="flex flex-col gap-2">
                <Link 
                  href="/features"
                  className="px-4 py-2 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  All Features
                </Link>
                <Link 
                  href="/#pricing"
                  className="px-4 py-2 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <hr className="border-border my-2" />
                <button 
                  onClick={() => { handleSignIn(); setMobileMenuOpen(false); }}
                  className="px-4 py-2 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors text-left"
                >
                  Log In
                </button>
                <Button 
                  variant="primary" 
                  className="mx-4 mt-2"
                  onClick={() => { handleGetStarted(); setMobileMenuOpen(false); }}
                >
                  Start Free Trial
                </Button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
