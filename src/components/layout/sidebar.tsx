'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useFilteredShows } from '@/hooks/use-filtered-shows';
import { ViewMode, DateRange } from '@/types/enums';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateRange } from '@/lib/date-utils';
import { daysUntilShow } from '@/types/computed';
import { cn } from '@/lib/utils';
import { SHOW_STATUSES } from '@/lib/constants';
import { sidebarItem, staggerContainer, buttonPress } from '@/lib/animations';
import {
  LayoutDashboard, LayoutGrid, List, Calendar, BarChart3,
  Search, Plus, Archive, ChevronDown, MapPin, FileStack, X,
} from 'lucide-react';
import { TemplateModal } from '@/components/ui/template-modal';
import { PermissionGate } from '@/components/auth/permission-gate';
import { useAuthStore } from '@/store/auth-store';

const VIEW_ICONS: Record<ViewMode, React.ElementType> = {
  [ViewMode.Dashboard]: LayoutDashboard,
  [ViewMode.QuickLook]: LayoutGrid,
  [ViewMode.List]: List,
  [ViewMode.Calendar]: Calendar,
  [ViewMode.Budget]: BarChart3,
};

interface SidebarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ viewMode, onViewModeChange, onCloseMobile, isMobile }: SidebarProps) {
  const {
    searchText, setSearchText,
    filterLocation, setFilterLocation,
    filterDateRange, setFilterDateRange,
    filterStatus, setFilterStatus,
    isHistorical, setIsHistorical,
    selectedShow, selectShow,
    createNewShow,
    uniqueLocations,
  } = useTradeShowStore();

  const filteredShows = useFilteredShows();
  const locations = uniqueLocations();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const { organization } = useAuthStore();
  
  // Brand color with fallback
  const brandColor = organization?.brandColor || '#9333ea';

  const handleSelectShow = (show: typeof filteredShows[0]) => {
    selectShow(show);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className="w-[280px] flex-shrink-0 h-screen flex flex-col sidebar-gradient text-white overflow-hidden">
      {/* Logo / Brand */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent"
      >
        <div className="flex items-center gap-3">
          {organization?.logoUrl ? (
            <img 
              src={organization.logoUrl} 
              alt={organization.name || 'Logo'} 
              className="w-10 h-10 rounded-lg object-contain bg-white/10"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: brandColor }}
            >
              {organization?.name?.[0]?.toUpperCase() || 'B'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {organization?.name || 'Booth'}
            </h1>
            <p className="text-[10px] text-white/50 mt-0.5 font-medium uppercase tracking-widest">Trade Show HQ</p>
          </div>
        </div>
        {isMobile && onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60"
          >
            <X size={20} />
          </button>
        )}
      </motion.div>

      {/* View Mode Picker */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex flex-wrap gap-1">
          {Object.values(ViewMode).map((mode, i) => {
            const Icon = VIEW_ICONS[mode];
            return (
              <motion.button
                key={mode}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                  viewMode === mode
                    ? 'bg-white/12 text-white'
                    : 'text-white/60 hover:bg-white/8 hover:text-white/80'
                )}
              >
                <Icon size={14} />
                {mode}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-3 py-2"
      >
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search shows..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/8 text-sm text-white placeholder:text-white/40 border border-white/10 focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>
      </motion.div>

      {/* Filters */}
      <div className="px-3 py-1 space-y-1.5">
        {/* Location filter */}
        <div className="relative">
          <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <select
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            className="w-full pl-7 pr-6 py-1.5 rounded-lg bg-white/8 text-xs text-white/80 border border-white/10 focus:outline-none appearance-none cursor-pointer transition-colors hover:bg-white/12"
          >
            <option value="">All Locations</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>

        {/* Date range filter */}
        <div className="relative">
          <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <select
            value={filterDateRange}
            onChange={e => setFilterDateRange(e.target.value as DateRange)}
            className="w-full pl-7 pr-6 py-1.5 rounded-lg bg-white/8 text-xs text-white/80 border border-white/10 focus:outline-none appearance-none cursor-pointer transition-colors hover:bg-white/12"
          >
            {Object.values(DateRange).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full pl-3 pr-6 py-1.5 rounded-lg bg-white/8 text-xs text-white/80 border border-white/10 focus:outline-none appearance-none cursor-pointer transition-colors hover:bg-white/12"
          >
            <option value="">All Statuses</option>
            {SHOW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* Actions row */}
      <div className="px-3 py-2 flex gap-2 border-b border-white/10">
        <PermissionGate requires="editor" hideOnly>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewShow}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-brand-purple text-white text-xs font-medium hover:bg-brand-purple-dark transition-colors"
          >
            <Plus size={14} />
            New
          </motion.button>
        </PermissionGate>
        <PermissionGate requires="editor" hideOnly>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/8 text-white/60 hover:text-white/80 text-xs font-medium transition-colors"
            title="New from Template"
          >
            <FileStack size={14} />
          </motion.button>
        </PermissionGate>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsHistorical(!isHistorical)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
            isHistorical ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-white/8 text-white/60 hover:text-white/80'
          )}
          title={isHistorical ? 'View Upcoming' : 'View Archive'}
        >
          <Archive size={14} />
        </motion.button>
      </div>

      {/* Show List */}
      <motion.div 
        className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence mode="popLayout">
          {filteredShows.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-white/40 text-xs py-8"
            >
              No shows found
            </motion.p>
          ) : (
            filteredShows.map((show, index) => {
              const isSelected = selectedShow?.id === show.id;
              const days = daysUntilShow(show);
              return (
                <motion.button
                  key={show.id}
                  variants={sidebarItem}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                  layoutId={`show-${show.id}`}
                  whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectShow(show)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg transition-colors group',
                    isSelected ? 'bg-white/12' : ''
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-white' : 'text-white/80'
                    )}>
                      {show.name}
                    </p>
                    {days !== null && days >= 0 && days <= 30 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-[10px] font-medium text-brand-cyan shrink-0 px-1.5 py-0.5 bg-brand-cyan/20 rounded-full"
                      >
                        {days === 0 ? 'Today' : `${days}d`}
                      </motion.span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {show.location && (
                      <span className="text-[11px] text-white/50 truncate">
                        {show.location}
                      </span>
                    )}
                    <span className="text-[11px] text-white/40 shrink-0">
                      {formatDateRange(show.startDate, show.endDate)}
                    </span>
                  </div>
                  {show.showStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mt-1.5"
                    >
                      <StatusBadge status={show.showStatus} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="px-4 py-2 border-t border-white/10 text-[10px] text-white/30"
      >
        {filteredShows.length} show{filteredShows.length !== 1 ? 's' : ''}
      </motion.div>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <TemplateModal
            mode="load"
            onClose={() => setShowTemplateModal(false)}
          />
        )}
      </AnimatePresence>
    </aside>
  );
}
