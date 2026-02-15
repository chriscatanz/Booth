'use client';

import React from 'react';
import { TradeShow } from '@/types';
import { calculateShowCompleteness, getCompletionStatus } from '@/lib/show-completeness';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface CompletionBadgeProps {
  show: TradeShow;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showMessage?: boolean;
  className?: string;
}

export function CompletionBadge({ 
  show, 
  size = 'md', 
  showPercentage = true, 
  showMessage = false,
  className 
}: CompletionBadgeProps) {
  const completeness = calculateShowCompleteness(show);
  const status = getCompletionStatus(completeness.percentage);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  const getIcon = () => {
    if (completeness.percentage >= 80) {
      return <CheckCircle size={iconSizes[size]} />;
    } else if (completeness.percentage >= 50) {
      return <Clock size={iconSizes[size]} />;
    } else {
      return <AlertCircle size={iconSizes[size]} />;
    }
  };

  const content = showMessage ? status.message : `${completeness.percentage}%`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        status.colorClass,
        status.bgClass,
        className
      )}
      title={`${completeness.percentage}% complete - ${status.message}\n\nCompleted: ${completeness.completed.join(', ') || 'None'}\n\nMissing: ${completeness.missing.join(', ') || 'None'}`}
    >
      {getIcon()}
      {showPercentage && (
        <span>
          {content}
        </span>
      )}
    </span>
  );
}

interface CompletionProgressProps {
  show: TradeShow;
  className?: string;
}

export function CompletionProgress({ show, className }: CompletionProgressProps) {
  const completeness = calculateShowCompleteness(show);
  const status = getCompletionStatus(completeness.percentage);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">Setup Progress</span>
        <span className={cn('text-xs font-semibold', status.colorClass)}>
          {completeness.percentage}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            completeness.percentage >= 80 ? 'bg-success' : completeness.percentage >= 50 ? 'bg-warning' : 'bg-error'
          )}
          style={{ width: `${completeness.percentage}%` }}
        />
      </div>
      <p className={cn('text-xs', status.colorClass)}>
        {status.message}
      </p>
    </div>
  );
}