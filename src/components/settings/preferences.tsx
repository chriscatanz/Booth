'use client';

import React from 'react';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/theme/theme-provider';
import { useSettingsStore } from '@/store/settings-store';
import { ViewMode } from '@/types/enums';
import { clearAllCache } from '@/services/cache-service';
import { useToastStore } from '@/store/toast-store';
import { Trash2 } from 'lucide-react';

export function Preferences() {
  const { mode, setMode } = useTheme();
  const { defaultView, setDefaultView } = useSettingsStore();
  const toast = useToastStore();

  return (
    <div className="space-y-8 max-w-xl">
      {/* Appearance */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Appearance</h3>
        <p className="text-xs text-text-tertiary mb-3">Customize how Booth looks on your device</p>
        <Select
          label="Theme"
          value={mode}
          onChange={e => setMode(e.target.value as 'light' | 'dark' | 'system')}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System (auto)' },
          ]}
        />
      </div>

      {/* Default View */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Default View</h3>
        <p className="text-xs text-text-tertiary mb-3">Choose which view opens when you launch Booth</p>
        <Select
          label="Default view on launch"
          value={defaultView}
          onChange={e => setDefaultView(e.target.value as ViewMode)}
          options={Object.values(ViewMode).map(v => ({ value: v, label: v }))}
        />
      </div>

      {/* Cache */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Data Cache</h3>
        <p className="text-xs text-text-tertiary mb-3">Clear locally cached data if you&apos;re experiencing sync issues</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clearAllCache();
            toast.success('Cache cleared successfully');
          }}
        >
          <Trash2 size={14} />
          Clear Cache
        </Button>
      </div>

      {/* Keyboard Shortcuts */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Keyboard Shortcuts</h3>
        <p className="text-xs text-text-tertiary mb-3">Quick actions to navigate Booth faster</p>
        <div className="space-y-2 text-sm text-text-secondary bg-bg-secondary rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span>Save show</span>
            <kbd className="px-2 py-1 rounded bg-bg-tertiary text-xs font-mono">⌘S</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>New show</span>
            <kbd className="px-2 py-1 rounded bg-bg-tertiary text-xs font-mono">⌘N</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Command palette</span>
            <kbd className="px-2 py-1 rounded bg-bg-tertiary text-xs font-mono">⌘K</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Refresh data</span>
            <kbd className="px-2 py-1 rounded bg-bg-tertiary text-xs font-mono">⌘⇧R</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Toggle sidebar</span>
            <kbd className="px-2 py-1 rounded bg-bg-tertiary text-xs font-mono">⌘B</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
