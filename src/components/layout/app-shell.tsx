'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';
import { Toolbar } from './toolbar';
import { ViewMode } from '@/types/enums';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useSettingsStore } from '@/store/settings-store';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { ToastContainer } from '@/components/ui/toast';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AlertCircle, X, Menu } from 'lucide-react';

import DashboardView from '@/components/views/dashboard-view';
import QuickLookView from '@/components/views/quick-look-view';
import ListView from '@/components/views/list-view';
import CalendarView from '@/components/views/calendar-view';
import BudgetView from '@/components/views/budget-view';
import TasksView from '@/components/views/tasks-view';
import DetailView from '@/components/views/detail-view';
import SettingsView from '@/components/views/settings-view';
import ExportFieldSelector from '@/components/export/export-field-selector';
import { OrgSettingsModal } from '@/components/settings';
import { WelcomeWizard } from '@/components/onboarding';
import { useAuthStore } from '@/store/auth-store';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: 0.15 }
  },
};

export function AppShell() {
  const defaultView = useSettingsStore(s => s.defaultView);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [showExport, setShowExport] = useState(false);
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Onboarding wizard
  const { user, organization } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Apply brand color as CSS variable
  const brandColor = organization?.brandColor || '#9333ea';
  
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', brandColor);
    // Also set RGB values for transparency variants
    const hex = brandColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--brand-color-rgb', `${r}, ${g}, ${b}`);
  }, [brandColor]);
  
  // Check if user needs onboarding (first time)
  useEffect(() => {
    if (user && organization) {
      const onboardingKey = `onboarding_complete_${user.id}`;
      const hasCompleted = localStorage.getItem(onboardingKey);
      if (!hasCompleted) {
        setShowOnboarding(true);
      }
    }
  }, [user, organization]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };
  
  const selectedShow = useTradeShowStore(s => s.selectedShow);
  const setSelectedShow = useTradeShowStore(s => s.setSelectedShow);
  const isLoading = useTradeShowStore(s => s.isLoading);
  const shows = useTradeShowStore(s => s.shows);
  const loadShows = useTradeShowStore(s => s.loadShows);
  const errorMessage = useTradeShowStore(s => s.errorMessage);
  const clearError = useTradeShowStore(s => s.clearError);
  const showSettings = useSettingsStore(s => s.showSettings);
  const setShowSettings = useSettingsStore(s => s.setShowSettings);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when selecting a show on mobile
  useEffect(() => {
    if (isMobile && selectedShow) {
      setSidebarOpen(false);
    }
  }, [selectedShow, isMobile]);

  // When switching view modes, clear any selected show so the view actually changes
  const handleViewModeChange = (mode: ViewMode) => {
    setSelectedShow(null);
    setViewMode(mode);
    if (isMobile) setSidebarOpen(false);
  };

  useKeyboardShortcuts();

  // Initial load
  useEffect(() => {
    loadShows();
  }, [loadShows]);

  const getViewKey = () => {
    if (selectedShow) return `detail-${selectedShow.id}`;
    return viewMode;
  };

  const renderContent = () => {
    // If a show is selected, show detail view
    if (selectedShow) {
      return <DetailView />;
    }

    // Show a loading state only on first load
    if (isLoading && shows.length === 0) {
      return <LoadingOverlay />;
    }

    switch (viewMode) {
      case ViewMode.Dashboard:
        return <DashboardView viewMode={viewMode} onViewModeChange={handleViewModeChange} />;
      case ViewMode.QuickLook:
        return <QuickLookView />;
      case ViewMode.List:
        return <ListView />;
      case ViewMode.Calendar:
        return <CalendarView />;
      case ViewMode.Budget:
        return <BudgetView />;
      case ViewMode.Tasks:
        return <TasksView />;
      default:
        return <DashboardView viewMode={viewMode} onViewModeChange={handleViewModeChange} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - hidden on mobile unless open */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300' : ''}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <Sidebar 
          viewMode={viewMode} 
          onViewModeChange={handleViewModeChange}
          onCloseMobile={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar 
          onExport={() => setShowExport(true)}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={isMobile}
          onOpenOrgSettings={() => setShowOrgSettings(true)}
        />

        {/* Error banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
              className="flex items-center gap-3 px-4 py-2 bg-error-bg border-b border-error/20 overflow-hidden"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
              >
                <AlertCircle size={16} className="text-error shrink-0" />
              </motion.div>
              <p className="text-sm text-error flex-1">{errorMessage}</p>
              <motion.button 
                onClick={clearError} 
                className="p-1 rounded hover:bg-error/10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} className="text-error" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={getViewKey()}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              <ErrorBoundary key={viewMode} fallbackMessage="This view encountered an error">
                {renderContent()}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ToastContainer />
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SettingsView onClose={() => setShowSettings(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ExportFieldSelector shows={shows} onClose={() => setShowExport(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Org Settings Modal */}
      <AnimatePresence>
        {showOrgSettings && (
          <OrgSettingsModal onClose={() => setShowOrgSettings(false)} />
        )}
      </AnimatePresence>

      {/* Onboarding Wizard */}
      <AnimatePresence>
        {showOnboarding && (
          <WelcomeWizard onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}
