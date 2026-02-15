'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from './tooltip';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
}

export function Input({ label, help, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
          {label}
          {help && (
            <Tooltip content={help}>
              <HelpCircle size={12} className="text-text-tertiary hover:text-text-secondary cursor-help transition-colors" />
            </Tooltip>
          )}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full min-h-[44px] rounded-xl border-2 border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all duration-200 hover:border-border-strong',
          error && 'border-error focus:ring-error/30 focus:border-error',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
