'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useFilteredShows } from '@/hooks/use-filtered-shows';
import { DateRange } from '@/types/enums';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateRange } from '@/lib/date-utils';
import { daysUntilShow } from '@/types/computed';
import { cn } from '@/lib/utils';
import { SHOW_STATUSES } from '@/lib/constants';
import {
  Search, Plus, Archive, ChevronDown, MapPin, FileStack, Calendar,
  Sparkles, Check, X, Filter,
} from 'lucide-react';
import { TemplateModal } from '@/components/ui/template-modal';
import { PermissionGate } from '@/components/auth/permission-gate';
import { OneClickShow } from '@/components/ai/one-click-show';

export function ShowSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showOneClickModal, setShowOneClickModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use Zustand selectors to prevent unnecessary re-renders
  const searchText = useTradeShowStore((state) => state.searchText);
  const setSearchText = useTradeShowStore((state) => state.setSearchText);
  const filterLocation = useTradeShowStore((state) => state.filterLocation);
  const setFilterLocation = useTradeShowStore((state) => state.setFilterLocation);
  const filterDateRange = useTradeShowStore((state) => state.filterDateRange);
  const setFilterDateRange = useTradeShowStore((state) => state.setFilterDateRange);
  const filterStatus = useTradeShowStore((state) => state.filterStatus);
  const setFilterStatus = useTradeShowStore((state) => state.setFilterStatus);
  const isHistorical = useTradeShowStore((state) => state.isHistorical);
  const setIsHistorical = useTradeShowStore((state) => state.setIsHistorical);
  const selectedShow = useTradeShowStore((state) => state.selectedShow);
  const selectShow = useTradeShowStore((state) => state.selectShow);
  const setSelectedShow = useTradeShowStore((state) => state.setSelectedShow);
  const createNewShow = useTradeShowStore((state) => state.createNewShow);
  const uniqueLocations = useTradeShowStore((state) => state.uniqueLocations);

  const filteredShows = useFilteredShows();
  const locations = uniqueLocations();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSelectShow = (show: typeof filteredShows[0]) => {
    selectShow(show);
    setIsOpen(false);
    setSearchText('');
  };

  const handleNewShow = () => {
    createNewShow();
    setIsOpen(false);
  };

  const activeFilterCount = [
    filterLocation,
    filterDateRange !== DateRange.All ? filterDateRange : null,
    filterStatus,
  ].filter(Boolean).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border transition-all min-w-[140px] sm:min-w-[200px] max-w-[200px] sm:max-w-[320px]',
          isOpen 
            ? 'border-brand-purple bg-brand-purple/5' 
            : 'border-border hover:border-text-tertiary bg-surface'
        )}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex-1 text-left truncate">
          {selectedShow ? (
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary truncate">{selectedShow.name}</span>
              {selectedShow.showStatus && (
                <StatusBadge status={selectedShow.showStatus} size="sm" />
              )}
            </div>
          ) : (
            <span className="text-text-secondary">Select a show...</span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={cn(
            'text-text-tertiary transition-transform shrink-0',
            isOpen && 'rotate-180'
          )} 
        />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-[calc(100vw-1rem)] sm:w-[360px] max-w-[360px] bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Search + Actions Header */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search shows..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-bg-tertiary text-sm text-text-primary placeholder:text-text-tertiary border border-transparent focus:outline-none focus:border-brand-purple/50"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    showFilters || activeFilterCount > 0
                      ? 'bg-brand-purple/10 text-brand-purple' 
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  )}
                  title="Filters"
                >
                  <Filter size={14} />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-purple text-white text-[10px] flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 grid grid-cols-3 gap-2">
                      <div className="relative">
                        <MapPin size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <select
                          value={filterLocation}
                          onChange={e => setFilterLocation(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-bg-tertiary text-[11px] text-text-primary border border-transparent focus:outline-none appearance-none"
                        >
                          <option value="">Location</option>
                          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                      </div>
                      <div className="relative">
                        <Calendar size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <select
                          value={filterDateRange}
                          onChange={e => setFilterDateRange(e.target.value as DateRange)}
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-bg-tertiary text-[11px] text-text-primary border border-transparent focus:outline-none appearance-none"
                        >
                          {Object.values(DateRange).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-bg-tertiary text-[11px] text-text-primary border border-transparent focus:outline-none appearance-none"
                      >
                        <option value="">Status</option>
                        {SHOW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-3">
                <PermissionGate requires="editor" hideOnly>
                  <button
                    onClick={handleNewShow}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-purple text-white text-xs font-medium hover:bg-brand-purple-dark transition-colors"
                  >
                    <Plus size={14} />
                    New Show
                  </button>
                </PermissionGate>
                <PermissionGate requires="editor" hideOnly>
                  <button
                    onClick={() => { setShowOneClickModal(true); setIsOpen(false); }}
                    className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 hover:from-purple-500/30 hover:to-indigo-500/30 transition-colors"
                    title="AI Quick Create"
                  >
                    <Sparkles size={14} />
                  </button>
                </PermissionGate>
                <PermissionGate requires="editor" hideOnly>
                  <button
                    onClick={() => { setShowTemplateModal(true); setIsOpen(false); }}
                    className="p-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                    title="From Template"
                  >
                    <FileStack size={14} />
                  </button>
                </PermissionGate>
                <button
                  onClick={() => setIsHistorical(!isHistorical)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    isHistorical ? 'bg-brand-purple/20 text-brand-purple' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  )}
                  title={isHistorical ? 'Viewing Archive' : 'View Archive'}
                >
                  <Archive size={14} />
                </button>
              </div>
            </div>

            {/* Show List */}
            <div className="max-h-[320px] overflow-y-auto">
              {filteredShows.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-text-tertiary text-sm">No shows found</p>
                  <p className="text-text-tertiary text-xs mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {filteredShows.map((show) => {
                    const isSelected = selectedShow?.id === show.id;
                    const days = daysUntilShow(show);
                    
                    return (
                      <button
                        key={show.id}
                        onClick={() => handleSelectShow(show)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-lg transition-colors group',
                          isSelected 
                            ? 'bg-brand-purple/10' 
                            : 'hover:bg-bg-tertiary'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-sm font-medium truncate',
                                isSelected ? 'text-brand-purple' : 'text-text-primary'
                              )}>
                                {show.name}
                              </span>
                              {show.eventType && show.eventType !== 'in_person' && (
                                <span className={cn(
                                  'text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0',
                                  show.eventType === 'virtual' ? 'bg-brand-purple/20 text-brand-purple' : 'bg-warning/20 text-warning'
                                )}>
                                  {show.eventType === 'virtual' ? 'Virtual' : 'Hybrid'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {show.location && (
                                <span className="text-[11px] text-text-tertiary truncate">
                                  {show.location}
                                </span>
                              )}
                              <span className="text-[11px] text-text-tertiary shrink-0">
                                {formatDateRange(show.startDate, show.endDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {days !== null && days >= 0 && days <= 30 && (
                              <span className="text-[10px] font-medium text-brand-cyan px-1.5 py-0.5 bg-brand-cyan/10 rounded-full">
                                {days === 0 ? 'Today' : `${days}d`}
                              </span>
                            )}
                            {show.showStatus && (
                              <StatusBadge status={show.showStatus} size="sm" />
                            )}
                            {isSelected && (
                              <Check size={14} className="text-brand-purple" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-border bg-bg-tertiary/50 text-[11px] text-text-tertiary flex items-center justify-between">
              <span>{filteredShows.length} show{filteredShows.length !== 1 ? 's' : ''}{isHistorical ? ' (archived)' : ''}</span>
              {selectedShow && (
                <button
                  onClick={() => { setSelectedShow(null); setIsOpen(false); }}
                  className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X size={12} />
                  Clear selection
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          const newShow = filteredShows.find(s => s.id === showId);
          if (newShow) selectShow(newShow);
        }}
      />
    </div>
  );
}
