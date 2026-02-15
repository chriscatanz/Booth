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

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultMode?: ViewMode;
}

// Main navigation items (4-5 groups as requested)
const MAIN_NAV_ITEMS: NavItem[] = [
  { mode: ViewMode.Dashboard, icon: LayoutDashboard, label: 'Dashboard' },
  { mode: ViewMode.Tasks, icon: CheckSquare, label: 'Tasks', requiresCategory: 'tasks' },
  { mode: ViewMode.Budget, icon: DollarSign, label: 'Budget', requiresCategory: 'budget' },
];

// Shows dropdown group (consolidating Quick Look, List, Calendar)
const SHOWS_GROUP: NavGroup = {
  id: 'shows',
  label: 'Shows',
  icon: LayoutGrid,
  defaultMode: ViewMode.QuickLook,
  items: [
    { mode: ViewMode.QuickLook, icon: LayoutGrid, label: 'Quick Look' },
    { mode: ViewMode.List, icon: List, label: 'List View' },
    { mode: ViewMode.Calendar, icon: Calendar, label: 'Calendar' },
  ],
};

// More overflow items (Activity, Kits, Assets)
const MORE_OVERFLOW_ITEMS: NavItem[] = [
  { mode: ViewMode.Activity, icon: Activity, label: 'Activity' },
  { mode: ViewMode.Kits, icon: Box, label: 'Kits', requiresCategory: 'logistics' },
  { mode: ViewMode.Assets, icon: Package, label: 'Assets', requiresCategory: 'documents' },
  { mode: ViewMode.AI, icon: Sparkles, label: 'AI' },
];

const NAV_ITEMS: NavItem[] = [...MAIN_NAV_ITEMS, ...SHOWS_GROUP.items, ...MORE_OVERFLOW_ITEMS];

interface TopNavProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
  onEnterBoothMode?: () => void;
  canEnterBoothMode?: boolean;
}

export function TopNav({ 
  viewMode, 
  onViewModeChange, 
  onOpenSettings,
  onOpenCommandPalette,
  onEnterBoothMode,
  canEnterBoothMode,
}: TopNavProps) {
  const { organization } = useAuthStore();
  const { canSeeCategory } = useDataVisibility();
  const brandColor = organization?.brandColor || '#9333ea';
  const [showOverflow, setShowOverflow] = useState(false);
  const [showShowsDropdown, setShowShowsDropdown] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const showsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
      if (showsRef.current && !showsRef.current.contains(e.target as Node)) {
        setShowShowsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter nav items based on data visibility
  const visibleMainItems = useMemo(() => 
    MAIN_NAV_ITEMS.filter(item => 
      !item.requiresCategory || canSeeCategory(item.requiresCategory)
    ),
    [canSeeCategory]
  );

  const visibleShowsItems = useMemo(() => 
    SHOWS_GROUP.items.filter(item => 
      !item.requiresCategory || canSeeCategory(item.requiresCategory)
    ),
    [canSeeCategory]
  );

  const visibleMoreItems = useMemo(() => 
    MORE_OVERFLOW_ITEMS.filter(item => 
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

  // Check if current view is in Shows group
  const isShowsActive = visibleShowsItems.some(item => item.mode === viewMode);
  // Check if current view is in More overflow
  const isMoreActive = visibleMoreItems.some(item => item.mode === viewMode);
  // Get current shows item for display
  const currentShowsItem = visibleShowsItems.find(item => item.mode === viewMode) || visibleShowsItems[0];

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
        {/* Main navigation items */}
        {visibleMainItems.map(({ mode, icon: Icon, label }) => {
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

        {/* Shows dropdown */}
        {visibleShowsItems.length > 0 && (
          <div className="relative" ref={showsRef}>
            <motion.button
              onClick={() => setShowShowsDropdown(!showShowsDropdown)}
              className={cn(
                'relative flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isShowsActive || showShowsDropdown
                  ? 'text-text-primary' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SHOWS_GROUP.icon size={18} />
              <span className="hidden lg:inline">{SHOWS_GROUP.label}</span>
              <motion.div
                animate={{ rotate: showShowsDropdown ? 180 : 0 }}
                transition={{ duration: 0.15 }}
                className="ml-1"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </motion.div>
              
              {isShowsActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-lg bg-brand-purple/10 border border-brand-purple/20"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>

            <AnimatePresence>
              {showShowsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden min-w-[160px]"
                >
                  {visibleShowsItems.map(({ mode, icon: Icon, label }) => {
                    const isActive = viewMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => {
                          onViewModeChange(mode);
                          setShowShowsDropdown(false);
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

        {/* More overflow menu */}
        {visibleMoreItems.length > 0 && (
          <div className="relative" ref={overflowRef}>
            <motion.button
              onClick={() => setShowOverflow(!showOverflow)}
              className={cn(
                'relative flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isMoreActive || showOverflow
                  ? 'text-text-primary' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MoreHorizontal size={18} />
              <span className="hidden lg:inline">More</span>
              
              {isMoreActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-lg bg-brand-purple/10 border border-brand-purple/20"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
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
                  {visibleMoreItems.map(({ mode, icon: Icon, label }) => {
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
        <UserMenu 
          onOpenOrgSettings={onOpenSettings}
          onEnterBoothMode={onEnterBoothMode}
          canEnterBoothMode={canEnterBoothMode}
        />
      </div>
    </header>
  );
}
