'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ViewMode } from '@/types/enums';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Package,
  Activity,
  Settings,
  Command,
} from 'lucide-react';

const NAV_ITEMS: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: ViewMode.Dashboard, icon: LayoutDashboard, label: 'Dashboard' },
  { mode: ViewMode.Calendar, icon: Calendar, label: 'Calendar' },
  { mode: ViewMode.Tasks, icon: CheckSquare, label: 'Tasks' },
  { mode: ViewMode.Assets, icon: Package, label: 'Assets' },
  { mode: ViewMode.Activity, icon: Activity, label: 'Activity' },
];

interface TopNavProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
}

export function TopNav({ 
  viewMode, 
  onViewModeChange, 
  onOpenSettings,
  onOpenCommandPalette,
}: TopNavProps) {
  const { organization } = useAuthStore();
  const brandColor = organization?.brandColor || '#9333ea';

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0">
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-3">
        {organization?.logoUrl ? (
          <img 
            src={organization.logoUrl} 
            alt={organization.name || 'Logo'} 
            className="w-8 h-8 rounded-lg object-contain bg-bg-tertiary"
          />
        ) : (
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: brandColor }}
          >
            {organization?.name?.[0]?.toUpperCase() || 'B'}
          </div>
        )}
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-text-primary">
            {organization?.name || 'Booth'}
          </h1>
        </div>
      </div>

      {/* Center: Navigation */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ mode, icon: Icon, label }) => {
          const isActive = viewMode === mode;
          return (
            <motion.button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive 
                  ? 'text-text-primary' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={18} />
              <span className="hidden md:inline">{label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-lg bg-brand-purple/10 border border-brand-purple/20"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <motion.button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary text-sm transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Command size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 rounded bg-bg-secondary text-[10px] font-mono">
            ⌘K
          </kbd>
        </motion.button>

        {/* Settings */}
        <motion.button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings size={18} />
        </motion.button>
      </div>
    </header>
  );
}
