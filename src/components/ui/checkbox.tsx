'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onChange, className, disabled }: CheckboxProps) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer min-h-[44px] py-2', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="w-5 h-5 rounded border-border text-brand-purple focus:ring-brand-purple/40 bg-bg-secondary cursor-pointer shrink-0"
      />
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}
