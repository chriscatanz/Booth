'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/theme/theme-provider';
import { useSettingsStore } from '@/store/settings-store';
import { ViewMode } from '@/types/enums';
import { clearAllCache } from '@/services/cache-service';
import { useToastStore } from '@/store/toast-store';

interface SettingsViewProps {
  onClose: () => void;
}

export default function SettingsView({ onClose }: SettingsViewProps) {
  const { mode, setMode } = useTheme();
  const { defaultView, setDefaultView } = useSettingsStore();
  const toast = useToastStore();

  return (
    <Dialog open onClose={onClose} title="Settings" size="md">
      <div className="space-y-6">
        {/* Appearance */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Appearance</h3>
          <Select
            label="Theme"
            value={mode}
            onChange={e => setMode(e.target.value as 'light' | 'dark' | 'system')}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </div>

        {/* Default View */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Default View</h3>
          <Select
            label="Default view on launch"
            value={defaultView}
            onChange={e => setDefaultView(e.target.value as ViewMode)}
            options={Object.values(ViewMode).map(v => ({ value: v, label: v }))}
          />
        </div>

        {/* Cache */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Data</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearAllCache();
              toast.success('Cache cleared');
            }}
          >
            Clear Cache
          </Button>
        </div>

        {/* Keyboard shortcuts */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <div className="flex justify-between"><span>Save show</span><kbd className="px-2 py-0.5 rounded bg-bg-tertiary text-xs">Cmd+S</kbd></div>
            <div className="flex justify-between"><span>New show</span><kbd className="px-2 py-0.5 rounded bg-bg-tertiary text-xs">Cmd+N</kbd></div>
            <div className="flex justify-between"><span>Refresh</span><kbd className="px-2 py-0.5 rounded bg-bg-tertiary text-xs">Cmd+Shift+R</kbd></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-border">
        <Button variant="primary" size="sm" onClick={onClose}>Done</Button>
      </div>
    </Dialog>
  );
}
