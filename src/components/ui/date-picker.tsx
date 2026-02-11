'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({ label, value, onChange, error, className, disabled }: DatePickerProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-text-secondary">{label}</label>
      )}
      <input
        type="date"
        value={value?.slice(0, 10) ?? ''}
        onChange={e => onChange(e.target.value || null)}
        disabled={disabled}
        className={cn(
          'w-full min-h-[44px] rounded-xl border-2 border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all duration-200 hover:border-border-strong',
          error && 'border-error focus:ring-error/30 focus:border-error',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
