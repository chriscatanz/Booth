import { create } from 'zustand';
import { ViewMode } from '@/types/enums';

interface SettingsState {
  defaultView: ViewMode;
  sidebarCollapsed: boolean;
  showSettings: boolean;
  setDefaultView: (view: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (val: boolean) => void;
  setShowSettings: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  defaultView: (typeof window !== 'undefined' ? localStorage.getItem('tsm_default_view') as ViewMode : null) || ViewMode.Dashboard,
  sidebarCollapsed: false,
  showSettings: false,

  setDefaultView: (view) => {
    set({ defaultView: view });
    localStorage.setItem('tsm_default_view', view);
  },
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
  setShowSettings: (val) => set({ showSettings: val }),
}));
