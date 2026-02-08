'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  label?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

export function Toggle({ label, enabled, onChange, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn('flex items-center gap-3 min-h-[44px] py-2', className)}
    >
      <div
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
          enabled ? 'bg-brand-purple' : 'bg-border-strong'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </div>
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </button>
  );
}
