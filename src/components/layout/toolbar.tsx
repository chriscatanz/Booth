'use client';

import React from 'react';
import { useTheme } from '@/theme/theme-provider';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAuthStore } from '@/store/auth-store';
import { Moon, Sun, RefreshCw, Settings, Download, Menu } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';

interface ToolbarProps {
  onExport?: () => void;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  onOpenOrgSettings?: () => void;
}

export function Toolbar({ onExport, onMenuToggle, showMenuButton, onOpenOrgSettings }: ToolbarProps) {
  const { resolved, toggle } = useTheme();
  const loadShows = useTradeShowStore(s => s.loadShows);
  const isLoading = useTradeShowStore(s => s.isLoading);
  const setShowSettings = useSettingsStore(s => s.setShowSettings);
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface">
      {/* Mobile menu button */}
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors lg:hidden"
          title="Menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile title */}
      {showMenuButton && (
        <h1 className="text-sm font-semibold text-text-primary lg:hidden">Trade Shows</h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side buttons */}
      {onExport && (
        <button
          onClick={onExport}
          className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors"
          title="Export"
        >
          <Download size={16} />
        </button>
      )}

      <button
        onClick={() => loadShows()}
        disabled={isLoading}
        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors disabled:opacity-50"
        title="Refresh (Cmd+Shift+R)"
      >
        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      </button>

      <button
        onClick={toggle}
        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors"
        title="Toggle theme"
      >
        {resolved === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <button
        onClick={() => setShowSettings(true)}
        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors"
        title="Settings"
      >
        <Settings size={16} />
      </button>

      {/* User Menu */}
      {isAuthenticated && (
        <div className="ml-2 pl-2 border-l border-border">
          <UserMenu 
            onOpenSettings={() => setShowSettings(true)} 
            onOpenOrgSettings={onOpenOrgSettings}
          />
        </div>
      )}
    </div>
  );
}
