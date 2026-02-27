'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, UserPlus, ClipboardList, FolderOpen, Users } from 'lucide-react';
import { TradeShow } from '@/types';
import { format, parseISO } from 'date-fns';
import { BoothModeInfo } from './booth-mode-info';
import { BoothModeAgenda } from './booth-mode-agenda';
import { BoothModeLeadCapture } from './booth-mode-lead-capture';
import { BoothModeTasks } from './booth-mode-tasks';
import { BoothModeFiles } from './booth-mode-files';
import { BoothModeTeam } from './booth-mode-team';

type TabId = 'info' | 'agenda' | 'leads' | 'tasks' | 'files' | 'team';

interface Tab {
  id: TabId;
  label: string;
  Icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: 'info',   label: 'Info',   Icon: MapPin },
  { id: 'agenda', label: 'Agenda', Icon: Calendar },
  { id: 'leads',  label: 'Leads',  Icon: UserPlus },
  { id: 'tasks',  label: 'Tasks',  Icon: ClipboardList },
  { id: 'files',  label: 'Files',  Icon: FolderOpen },
  { id: 'team',   label: 'Team',   Icon: Users },
];

interface BoothModeShellProps {
  show: TradeShow;
  onExit: () => void;
}

export function BoothModeShell({ show, onExit }: BoothModeShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>('info');

  const startDate = show.startDate ? parseISO(show.startDate) : null;
  const endDate = show.endDate ? parseISO(show.endDate) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[60] bg-[#0a0a0f] flex flex-col overflow-hidden"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-brand-purple/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-brand-pink/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative flex-shrink-0 px-4 pt-12 pb-3 border-b border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Booth Mode</span>
            </div>
            <h1 className="text-lg font-bold text-white leading-tight truncate">{show.name}</h1>
            {startDate && endDate && (
              <p className="text-xs text-white/40 mt-0.5">
                {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <button
            onClick={onExit}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <X size={14} className="text-white/70" />
            <span className="text-xs text-white/70 font-medium">Exit</span>
          </button>
        </div>
      </header>

      {/* Scrollable tab content */}
      <div className="relative flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'info'   && <BoothModeInfo show={show} />}
            {activeTab === 'agenda' && <BoothModeAgenda show={show} />}
            {activeTab === 'leads'  && <BoothModeLeadCapture show={show} />}
            {activeTab === 'tasks'  && <BoothModeTasks show={show} />}
            {activeTab === 'files'  && <BoothModeFiles showId={show.id} />}
            {activeTab === 'team'   && <BoothModeTeam showId={show.id} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom tab bar — 6 tabs, compact */}
      <nav className="relative flex-shrink-0 border-t border-white/10 bg-[#0a0a0f]/90 backdrop-blur-md pb-safe">
        <div className="flex">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors relative ${
                  active ? 'text-white' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <tab.Icon size={18} />
                <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-brand-purple rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
}
