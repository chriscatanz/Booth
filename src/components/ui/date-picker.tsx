'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function DatePicker({ label, value, onChange, error, className, disabled, id }: DatePickerProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">{label}</label>
      )}
      <input
        id={inputId}
        type="date"
        value={value?.slice(0, 10) ?? ''}
        onChange={e => onChange(e.target.value || null)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'w-full min-h-[44px] rounded-xl border-2 border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all duration-200 hover:border-border-strong',
          error && 'border-error focus:ring-error/30 focus:border-error',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      />
      {error && <p id={errorId} className="text-xs text-error">{error}</p>}
    </div>
  );
}
