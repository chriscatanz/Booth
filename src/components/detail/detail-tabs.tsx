'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Info, Truck, Plane, DollarSign, FileText,
} from 'lucide-react';

export type DetailTab = 'overview' | 'logistics' | 'travel' | 'budget' | 'notes';

interface TabConfig {
  id: DetailTab;
  label: string;
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'logistics', label: 'Logistics', icon: Truck },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'notes', label: 'Notes & Tasks', icon: FileText },
];

interface DetailTabsProps {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  tabCounts?: Partial<Record<DetailTab, number>>;
}

export function DetailTabs({ activeTab, onTabChange, tabCounts }: DetailTabsProps) {
  return (
    <div className="border-b border-border bg-surface sticky top-0 z-10">
      <div className="flex items-center gap-1 px-4 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const count = tabCounts?.[id];
          
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                isActive 
                  ? 'text-brand-purple' 
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
              {count !== undefined && count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                  isActive 
                    ? 'bg-brand-purple/20 text-brand-purple' 
                    : 'bg-bg-tertiary text-text-tertiary'
                )}>
                  {count}
                </span>
              )}
              
              {isActive && (
                <motion.div
                  layoutId="detail-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DetailTabPanelProps {
  id: DetailTab;
  activeTab: DetailTab;
  children: React.ReactNode;
}

export function DetailTabPanel({ id, activeTab, children }: DetailTabPanelProps) {
  if (id !== activeTab) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-6"
    >
      {children}
    </motion.div>
  );
}

// Utility component for tab sections
interface TabSectionProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function TabSection({ 
  title, 
  icon: Icon, 
  children, 
  className,
  collapsible = false,
  defaultOpen = true,
}: TabSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface overflow-hidden', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-tertiary/50 transition-colors"
        >
          {Icon && <Icon size={18} className="text-text-tertiary shrink-0" />}
          <span className="font-medium text-text-primary flex-1">{title}</span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="text-text-tertiary"
          >
            ▼
          </motion.span>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 pb-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-border bg-surface p-4', className)}>
      <div className="flex items-center gap-3 mb-4">
        {Icon && <Icon size={18} className="text-text-tertiary" />}
        <h3 className="font-medium text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}
