'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useFilteredShows } from '@/hooks/use-filtered-shows';
import { DateRange } from '@/types/enums';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateRange } from '@/lib/date-utils';
import { daysUntilShow } from '@/types/computed';
import { cn } from '@/lib/utils';
import { SHOW_STATUSES } from '@/lib/constants';
import { sidebarItem, staggerContainer } from '@/lib/animations';
import {
  Search, Plus, Archive, ChevronDown, MapPin, FileStack, X, Calendar,
  LayoutGrid, List as ListIcon, Sparkles,
} from 'lucide-react';
import { TemplateModal } from '@/components/ui/template-modal';
import { PermissionGate } from '@/components/auth/permission-gate';
import { OneClickShow } from '@/components/ai/one-click-show';

type ShowListView = 'list' | 'compact';

interface SidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ onCloseMobile, isMobile }: SidebarProps) {
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
  const [showOneClickModal, setShowOneClickModal] = useState(false);
  const [listView, setListView] = useState<ShowListView>('list');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const handleSelectShow = (show: typeof filteredShows[0]) => {
    selectShow(show);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const activeFilterCount = [
    filterLocation,
    filterDateRange !== DateRange.All ? filterDateRange : null,
    filterStatus,
  ].filter(Boolean).length;

  return (
    <aside className="w-[280px] flex-shrink-0 h-full flex flex-col bg-surface border-r border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Trade Shows</h2>
        <div className="flex items-center gap-1">
          {isMobile && onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search shows..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-bg-tertiary text-sm text-text-primary placeholder:text-text-tertiary border border-transparent focus:outline-none focus:border-brand-purple/50 transition-colors"
          />
        </div>
      </div>

      {/* Filters Toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-bg-tertiary transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ChevronDown 
              size={14} 
              className={cn('transition-transform', filtersExpanded && 'rotate-180')} 
            />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple text-[10px] font-medium">
                {activeFilterCount}
              </span>
            )}
          </span>
        </button>
        
        <AnimatePresence>
          {filtersExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-2">
                {/* Location filter */}
                <div className="relative">
                  <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <select
                    value={filterLocation}
                    onChange={e => setFilterLocation(e.target.value)}
                    className="w-full pl-7 pr-6 py-1.5 rounded-lg bg-bg-tertiary text-xs text-text-primary border border-transparent focus:outline-none appearance-none cursor-pointer transition-colors hover:border-border"
                  >
                    <option value="">All Locations</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                </div>

                {/* Date range filter */}
                <div className="relative">
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <select
                    value={filterDateRange}
                    onChange={e => setFilterDateRange(e.target.value as DateRange)}
                    className="w-full pl-7 pr-6 py-1.5 rounded-lg bg-bg-tertiary text-xs text-text-primary border border-transparent focus:outline-none appearance-none cursor-pointer transition-colors hover:border-border"
                  >
                    {Object.values(DateRange).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                </div>

                {/* Status filter */}
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full pl-3 pr-6 py-1.5 rounded-lg bg-bg-tertiary text-xs text-text-primary border border-transparent focus:outline-none appearance-none cursor-pointer transition-colors hover:border-border"
                  >
                    <option value="">All Statuses</option>
                    {SHOW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions row */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-border">
        <PermissionGate requires="editor" hideOnly>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewShow}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-purple text-white text-xs font-medium hover:bg-brand-purple-dark transition-colors"
          >
            <Plus size={14} />
            New Show
          </motion.button>
        </PermissionGate>
        <PermissionGate requires="editor" hideOnly>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowOneClickModal(true)}
            className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 hover:from-purple-500/30 hover:to-indigo-500/30 transition-colors"
            title="One Click Show - AI powered"
          >
            <Sparkles size={14} />
          </motion.button>
        </PermissionGate>
        <PermissionGate requires="editor" hideOnly>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowTemplateModal(true)}
            className="p-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
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
            'p-2 rounded-lg transition-colors',
            isHistorical ? 'bg-brand-purple/20 text-brand-purple' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
          )}
          title={isHistorical ? 'View Upcoming' : 'View Archive'}
        >
          <Archive size={14} />
        </motion.button>
        
        {/* View toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setListView('list')}
            className={cn(
              'p-1.5 transition-colors',
              listView === 'list' ? 'bg-bg-tertiary text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            <ListIcon size={14} />
          </button>
          <button
            onClick={() => setListView('compact')}
            className={cn(
              'p-1.5 transition-colors',
              listView === 'compact' ? 'bg-bg-tertiary text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* Show List */}
      <motion.div 
        className="flex-1 overflow-y-auto px-2 py-2 space-y-1"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence mode="popLayout">
          {filteredShows.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-text-tertiary text-sm">No shows found</p>
              <p className="text-text-tertiary text-xs mt-1">Try adjusting your filters</p>
            </motion.div>
          ) : (
            filteredShows.map((show) => {
              const isSelected = selectedShow?.id === show.id;
              const days = daysUntilShow(show);
              
              if (listView === 'compact') {
                return (
                  <motion.button
                    key={show.id}
                    variants={sidebarItem}
                    layout
                    onClick={() => handleSelectShow(show)}
                    className={cn(
                      'w-full text-left p-2 rounded-lg transition-colors',
                      isSelected ? 'bg-brand-purple/10 border border-brand-purple/20' : 'hover:bg-bg-tertiary border border-transparent'
                    )}
                  >
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-brand-purple' : 'text-text-primary'
                    )}>
                      {show.name}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {formatDateRange(show.startDate, show.endDate)}
                    </p>
                  </motion.button>
                );
              }

              return (
                <motion.button
                  key={show.id}
                  variants={sidebarItem}
                  layout
                  whileHover={{ x: 2 }}
                  onClick={() => handleSelectShow(show)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                    isSelected ? 'bg-brand-purple/10 border border-brand-purple/20' : 'hover:bg-bg-tertiary border border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-brand-purple' : 'text-text-primary'
                    )}>
                      {show.name}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {show.eventType && show.eventType !== 'in_person' && (
                        <span className={cn(
                          'text-[9px] font-medium px-1.5 py-0.5 rounded-full',
                          show.eventType === 'virtual' ? 'bg-brand-purple/20 text-brand-purple' : 'bg-warning/20 text-warning'
                        )}>
                          {show.eventType === 'virtual' ? 'Virtual' : 'Hybrid'}
                        </span>
                      )}
                      {days !== null && days >= 0 && days <= 30 && (
                        <span className="text-[10px] font-medium text-brand-cyan px-1.5 py-0.5 bg-brand-cyan/10 rounded-full">
                          {days === 0 ? 'Today' : `${days}d`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {show.location && (
                      <span className="text-[11px] text-text-tertiary truncate">
                        {show.location}
                      </span>
                    )}
                    <span className="text-[11px] text-text-tertiary shrink-0">
                      {formatDateRange(show.startDate, show.endDate)}
                    </span>
                  </div>
                  {show.showStatus && (
                    <div className="mt-1.5">
                      <StatusBadge status={show.showStatus} />
                    </div>
                  )}
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-[11px] text-text-tertiary">
        {filteredShows.length} show{filteredShows.length !== 1 ? 's' : ''}
        {isHistorical && ' (archived)'}
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <TemplateModal
            mode="load"
            onClose={() => setShowTemplateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* One Click Show Modal */}
      <OneClickShow
        isOpen={showOneClickModal}
        onClose={() => setShowOneClickModal(false)}
        onShowCreated={(showId) => {
          setShowOneClickModal(false);
          // Select the newly created show
          const newShow = filteredShows.find(s => s.id === showId);
          if (newShow) selectShow(newShow);
        }}
      />
    </aside>
  );
}
