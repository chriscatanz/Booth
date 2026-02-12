'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';
import { CommandPalette } from './command-palette';
import { ViewMode } from '@/types/enums';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useSettingsStore } from '@/store/settings-store';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { ToastContainer } from '@/components/ui/toast';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AlertCircle, X, Menu, PanelLeftClose, PanelLeft } from 'lucide-react';

import DashboardView from '@/components/views/dashboard-view';
import QuickLookView from '@/components/views/quick-look-view';
import ListView from '@/components/views/list-view';
import CalendarView from '@/components/views/calendar-view';
import BudgetView from '@/components/views/budget-view';
import TasksView from '@/components/views/tasks-view';
import KitsView from '@/components/views/kits-view';
import AssetsView from '@/components/views/assets-view';
import ActivityView from '@/components/views/activity-view';
import AIView from '@/components/views/ai-view';
import DetailView from '@/components/views/detail-view';
import ExportFieldSelector from '@/components/export/export-field-selector';
import CSVImportModal from '@/components/import/csv-import-modal';
import { OrgSettingsModal } from '@/components/settings';
import { WelcomeWizard } from '@/components/onboarding';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { SubscriptionBanner } from '@/components/subscription/subscription-banner';
// AI modal disabled - using full AIView now, but keep floating bubble for quick access
// import { AIAssistantPanel } from '@/components/ai/ai-assistant-panel';
import { AIChatBubble } from '@/components/ai/ai-chat-bubble';

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
  const viewMode = useSettingsStore(s => s.currentView);
  const setViewMode = useSettingsStore(s => s.setCurrentView);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  // const [showAIAssistant, setShowAIAssistant] = useState(false); // Disabled - using full AIView
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Onboarding wizard
  const { user, organization } = useAuthStore();
  
  // Subscription status
  const { status: subscriptionStatus, loadSubscription } = useSubscriptionStore();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Apply brand color as CSS variable
  const brandColor = organization?.brandColor || '#9333ea';
  
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', brandColor);
    const hex = brandColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--brand-color-rgb', `${r}, ${g}, ${b}`);
  }, [brandColor]);
  
  // Check if user needs onboarding
  useEffect(() => {
    if (user && organization) {
      const onboardingKey = `onboarding_complete_${user.id}`;
      const hasCompleted = localStorage.getItem(onboardingKey);
      if (!hasCompleted) {
        setShowOnboarding(true);
      }
    }
  }, [user, organization]);
  
  // Load subscription status
  useEffect(() => {
    if (organization?.id) {
      loadSubscription(organization.id);
    }
  }, [organization?.id, loadSubscription]);

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

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
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
      setSidebarMobileOpen(false);
    }
  }, [selectedShow, isMobile]);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setSelectedShow(null);
    setViewMode(mode);
    if (isMobile) setSidebarMobileOpen(false);
    setShowCommandPalette(false);
  }, [setSelectedShow, isMobile]);

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
    if (selectedShow) {
      return <DetailView />;
    }

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
      case ViewMode.Kits:
        return <KitsView />;
      case ViewMode.Assets:
        return <AssetsView />;
      case ViewMode.Activity:
        return <ActivityView />;
      case ViewMode.AI:
        return <AIView />;
      default:
        return <DashboardView viewMode={viewMode} onViewModeChange={handleViewModeChange} />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Navigation */}
      <TopNav
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onOpenSettings={() => setShowOrgSettings(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />
      
      {/* Subscription Banner */}
      {subscriptionStatus && organization && !bannerDismissed && (
        <SubscriptionBanner 
          status={subscriptionStatus} 
          orgId={organization.id}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {isMobile && sidebarMobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarMobileOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {(isMobile ? sidebarMobileOpen : sidebarOpen) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`
                ${isMobile ? 'fixed inset-y-0 left-0 z-50 pt-14' : 'relative'}
                overflow-hidden
              `}
            >
              <Sidebar 
                onCloseMobile={() => setSidebarMobileOpen(false)}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sidebar toggle + breadcrumb bar */}
          <div className="h-10 border-b border-border flex items-center px-3 gap-2 shrink-0 bg-surface">
            {/* Mobile menu button */}
            {isMobile && (
              <motion.button
                onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
                className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu size={18} />
              </motion.button>
            )}
            
            {/* Desktop sidebar toggle */}
            {!isMobile && (
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
              </motion.button>
            )}

            {/* Breadcrumb / Context */}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              {selectedShow ? (
                <>
                  <button 
                    onClick={() => setSelectedShow(null)}
                    className="hover:text-text-primary transition-colors"
                  >
                    {viewMode}
                  </button>
                  <span className="text-text-tertiary">/</span>
                  <span className="text-text-primary font-medium truncate max-w-[200px]">
                    {selectedShow.name}
                  </span>
                  {selectedShow.showStatus && (
                    <>
                      <span className="text-text-tertiary">·</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        selectedShow.showStatus === 'Complete' ? 'bg-success/10 text-success' :
                        selectedShow.showStatus === 'Planning' ? 'bg-brand-cyan/10 text-brand-cyan' :
                        selectedShow.showStatus === 'Confirmed' ? 'bg-brand-purple/10 text-brand-purple' :
                        selectedShow.showStatus === 'Cancelled' ? 'bg-error/10 text-error' :
                        'bg-bg-tertiary text-text-secondary'
                      }`}>
                        {selectedShow.showStatus}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-text-primary font-medium">{viewMode}</span>
              )}
            </div>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
              {/* Import/Export buttons - only show on relevant views */}
              {(viewMode === ViewMode.List || viewMode === ViewMode.Dashboard) && !selectedShow && (
                <>
                  <button
                    onClick={() => setShowImport(true)}
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Import
                  </button>
                  <span className="text-text-tertiary">|</span>
                  <button
                    onClick={() => setShowExport(true)}
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Export
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-3 px-4 py-2 bg-error-bg border-b border-error/20"
              >
                <AlertCircle size={16} className="text-error shrink-0" />
                <p className="text-sm text-error flex-1">{errorMessage}</p>
                <button onClick={clearError} className="p-1 rounded hover:bg-error/10">
                  <X size={14} className="text-error" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content area */}
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
      </div>

      <ToastContainer />
      
      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            onNavigate={handleViewModeChange}
            onOpenSettings={() => setShowOrgSettings(true)}
          />
        )}
      </AnimatePresence>
      
      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <ExportFieldSelector shows={shows} onClose={() => setShowExport(false)} />
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <CSVImportModal onClose={() => setShowImport(false)} />
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

      {/* AI Assistant - now a full view, modal/bubble disabled */}
      {/* <AIAssistantPanel
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onOpenSettings={() => setShowOrgSettings(true)}
        context={selectedShow ? {
          showName: selectedShow.name,
          showLocation: selectedShow.location || undefined,
          showDates: selectedShow.startDate && selectedShow.endDate 
            ? `${selectedShow.startDate} - ${selectedShow.endDate}` 
            : undefined,
        } : undefined}
      /> */}

      {/* Floating AI Chat Bubble - disabled, using full view */}
      {/* Floating AI Chat Bubble - quick access to AI view */}
      <AIChatBubble />
    </div>
  );
}
