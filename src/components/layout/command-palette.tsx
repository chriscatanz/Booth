'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeShowStore } from '@/store/trade-show-store';
import { ViewMode } from '@/types/enums';
import { cn } from '@/lib/utils';
import {
  Search, Calendar, CheckSquare, Package, Activity, LayoutDashboard,
  Plus, Settings, Archive, FileText, MapPin, ArrowRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  type: 'navigation' | 'action' | 'show';
  icon: React.ElementType;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (mode: ViewMode) => void;
  onOpenSettings: () => void;
}

export function CommandPalette({ 
  isOpen, 
  onClose, 
  onNavigate,
  onOpenSettings,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { shows, createNewShow, selectShow, setIsHistorical } = useTradeShowStore();

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Build command list
  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Navigation commands
    const navItems: CommandItem[] = [
      { id: 'nav-dashboard', type: 'navigation', icon: LayoutDashboard, label: 'Go to Dashboard', action: () => onNavigate(ViewMode.Dashboard) },
      { id: 'nav-calendar', type: 'navigation', icon: Calendar, label: 'Go to Calendar', action: () => onNavigate(ViewMode.Calendar) },
      { id: 'nav-tasks', type: 'navigation', icon: CheckSquare, label: 'Go to Tasks', action: () => onNavigate(ViewMode.Tasks) },
      { id: 'nav-assets', type: 'navigation', icon: Package, label: 'Go to Assets', action: () => onNavigate(ViewMode.Assets) },
      { id: 'nav-activity', type: 'navigation', icon: Activity, label: 'Go to Activity', action: () => onNavigate(ViewMode.Activity) },
    ];

    // Action commands
    const actionItems: CommandItem[] = [
      { id: 'action-new-show', type: 'action', icon: Plus, label: 'Create New Show', shortcut: '⌘N', action: () => { createNewShow(); onClose(); } },
      { id: 'action-settings', type: 'action', icon: Settings, label: 'Open Settings', shortcut: '⌘,', action: () => { onOpenSettings(); onClose(); } },
      { id: 'action-archive', type: 'action', icon: Archive, label: 'View Archived Shows', action: () => { setIsHistorical(true); onClose(); } },
    ];

    // Show search results
    const showItems: CommandItem[] = shows
      .filter(s => !s.isTemplate)
      .slice(0, 5)
      .map(show => ({
        id: `show-${show.id}`,
        type: 'show' as const,
        icon: MapPin,
        label: show.name,
        description: show.location || undefined,
        action: () => { selectShow(show); onClose(); },
      }));

    // Filter based on query
    const q = query.toLowerCase().trim();
    
    if (!q) {
      // Show recent/suggested when no query
      items.push(...actionItems.slice(0, 2));
      items.push(...navItems);
      if (showItems.length > 0) {
        items.push(...showItems.slice(0, 3));
      }
    } else {
      // Filter all items
      const allItems = [...navItems, ...actionItems, ...showItems];
      const filtered = allItems.filter(item => 
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
      items.push(...filtered);
      
      // Also search all shows
      const matchingShows = shows
        .filter(s => !s.isTemplate && (
          s.name.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q)
        ))
        .slice(0, 5)
        .map(show => ({
          id: `show-${show.id}`,
          type: 'show' as const,
          icon: MapPin,
          label: show.name,
          description: show.location || undefined,
          action: () => { selectShow(show); onClose(); },
        }));
      
      // Add shows that aren't already in items
      matchingShows.forEach(show => {
        if (!items.find(i => i.id === show.id)) {
          items.push(show);
        }
      });
    }

    return items;
  }, [query, shows, onNavigate, createNewShow, selectShow, onOpenSettings, setIsHistorical, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, commands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (commands[selectedIndex]) {
          commands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, commands, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset selected index when commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [commands.length]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Palette */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg bg-surface rounded-xl border border-border shadow-2xl z-50 overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-text-tertiary shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search shows, navigate, or run commands..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-1 rounded bg-bg-tertiary text-text-tertiary text-xs font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {commands.length === 0 ? (
            <div className="py-8 text-center text-text-tertiary text-sm">
              No results found
            </div>
          ) : (
            <div className="space-y-1">
              {commands.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                      isSelected ? 'bg-brand-purple/10 text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'
                    )}
                  >
                    <div className={cn(
                      'p-1.5 rounded-lg',
                      isSelected ? 'bg-brand-purple/20 text-brand-purple' : 'bg-bg-tertiary text-text-tertiary'
                    )}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-text-tertiary truncate">{item.description}</p>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-bg-tertiary text-text-tertiary text-[10px] font-mono">
                        {item.shortcut}
                      </kbd>
                    )}
                    {item.type === 'show' && (
                      <ArrowRight size={14} className="text-text-tertiary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[11px] text-text-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-bg-tertiary">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-bg-tertiary">↵</kbd> select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-bg-tertiary">esc</kbd> close
          </span>
        </div>
      </motion.div>
    </>
  );
}
