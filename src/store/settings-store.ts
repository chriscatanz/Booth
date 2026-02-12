import { create } from 'zustand';
import { ViewMode } from '@/types/enums';

interface SettingsState {
  defaultView: ViewMode;
  currentView: ViewMode;
  sidebarCollapsed: boolean;
  showSettings: boolean;
  setDefaultView: (view: ViewMode) => void;
  setCurrentView: (view: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (val: boolean) => void;
  setShowSettings: (val: boolean) => void;
}

const getInitialView = (): ViewMode => {
  if (typeof window === 'undefined') return ViewMode.Dashboard;
  return (localStorage.getItem('tsm_default_view') as ViewMode) || ViewMode.Dashboard;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  defaultView: getInitialView(),
  currentView: getInitialView(),
  sidebarCollapsed: false,
  showSettings: false,

  setDefaultView: (view) => {
    set({ defaultView: view, currentView: view }); // Also update current view immediately
    localStorage.setItem('tsm_default_view', view);
  },
  setCurrentView: (view) => {
    set({ currentView: view });
  },
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
  setShowSettings: (val) => set({ showSettings: val }),
}));
