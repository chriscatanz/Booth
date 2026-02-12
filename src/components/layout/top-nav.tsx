'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ViewMode } from '@/types/enums';
import { useAuthStore } from '@/store/auth-store';
import { useDataVisibility } from '@/hooks/use-data-visibility';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  LayoutGrid,
  List,
  Calendar,
  CheckSquare,
  Package,
  Box,
  Activity,
  Command,
  DollarSign,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';
import { DataCategory } from '@/types/data-visibility';

interface NavItem {
  mode: ViewMode;
  icon: React.ElementType;
  label: string;
  requiresCategory?: DataCategory;
}

// Primary items always shown
const PRIMARY_NAV_ITEMS: NavItem[] = [
  { mode: ViewMode.Dashboard, icon: LayoutDashboard, label: 'Dashboard' },
  { mode: ViewMode.QuickLook, icon: LayoutGrid, label: 'Quick Look' },
  { mode: ViewMode.List, icon: List, label: 'List' },
  { mode: ViewMode.Calendar, icon: Calendar, label: 'Calendar' },
  { mode: ViewMode.Tasks, icon: CheckSquare, label: 'Tasks', requiresCategory: 'tasks' },
];

// Overflow items - shown in "More" menu on mobile
const OVERFLOW_NAV_ITEMS: NavItem[] = [
  { mode: ViewMode.Budget, icon: DollarSign, label: 'Budget', requiresCategory: 'budget' },
  { mode: ViewMode.Kits, icon: Box, label: 'Kits', requiresCategory: 'logistics' },
  { mode: ViewMode.Assets, icon: Package, label: 'Assets', requiresCategory: 'documents' },
  { mode: ViewMode.Activity, icon: Activity, label: 'Activity' },
  { mode: ViewMode.AI, icon: Sparkles, label: 'AI' },
];

const NAV_ITEMS: NavItem[] = [...PRIMARY_NAV_ITEMS, ...OVERFLOW_NAV_ITEMS];

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
  const { canSeeCategory } = useDataVisibility();
  const brandColor = organization?.brandColor || '#9333ea';
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Close overflow on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter nav items based on data visibility
  const visiblePrimaryItems = useMemo(() => 
    PRIMARY_NAV_ITEMS.filter(item => 
      !item.requiresCategory || canSeeCategory(item.requiresCategory)
    ),
    [canSeeCategory]
  );

  const visibleOverflowItems = useMemo(() => 
    OVERFLOW_NAV_ITEMS.filter(item => 
      !item.requiresCategory || canSeeCategory(item.requiresCategory)
    ),
    [canSeeCategory]
  );

  const visibleNavItems = useMemo(() => 
    NAV_ITEMS.filter(item => 
      !item.requiresCategory || canSeeCategory(item.requiresCategory)
    ),
    [canSeeCategory]
  );

  // Check if current view is in overflow
  const isOverflowActive = visibleOverflowItems.some(item => item.mode === viewMode);

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0">
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-3">
        {organization?.logoUrl ? (
          <Image 
            src={organization.logoUrl} 
            alt={organization.name || 'Logo'} 
            width={32}
            height={32}
            className="rounded-lg object-contain bg-bg-tertiary"
            unoptimized
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
        {/* Primary items - always visible */}
        {visiblePrimaryItems.map(({ mode, icon: Icon, label }) => {
          const isActive = viewMode === mode;
          return (
            <motion.button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                'relative flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive 
                  ? 'text-text-primary' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={18} />
              <span className="hidden lg:inline">{label}</span>
              
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

        {/* Overflow items - shown inline on desktop, in dropdown on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {visibleOverflowItems.map(({ mode, icon: Icon, label }) => {
            const isActive = viewMode === mode;
            return (
              <motion.button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  'relative flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive 
                    ? 'text-text-primary' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={18} />
                <span className="hidden lg:inline">{label}</span>
                
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
        </div>

        {/* Mobile overflow menu */}
        {visibleOverflowItems.length > 0 && (
          <div className="relative sm:hidden" ref={overflowRef}>
            <motion.button
              onClick={() => setShowOverflow(!showOverflow)}
              className={cn(
                'relative flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                isOverflowActive || showOverflow
                  ? 'text-text-primary bg-brand-purple/10' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              )}
              whileTap={{ scale: 0.98 }}
            >
              <MoreHorizontal size={18} />
            </motion.button>

            <AnimatePresence>
              {showOverflow && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden min-w-[160px]"
                >
                  {visibleOverflowItems.map(({ mode, icon: Icon, label }) => {
                    const isActive = viewMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => {
                          onViewModeChange(mode);
                          setShowOverflow(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                          isActive 
                            ? 'bg-brand-purple/10 text-brand-purple' 
                            : 'text-text-primary hover:bg-bg-tertiary'
                        )}
                      >
                        <Icon size={18} />
                        {label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger - hidden on mobile */}
        <motion.button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary text-sm transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Command size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 rounded bg-bg-secondary text-[10px] font-mono">
            ⌘K
          </kbd>
        </motion.button>

        {/* User Menu with Sign Out */}
        <UserMenu onOpenOrgSettings={onOpenSettings} />
      </div>
    </header>
  );
}
