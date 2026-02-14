'use client';

import { cn } from '@/lib/utils';
import type { BadgeProgress } from '@/types/badges';

interface BadgeCardProps {
  badge: BadgeProgress;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export function BadgeCard({ badge, size = 'md', showProgress = true }: BadgeCardProps) {
  const { badge: badgeInfo, earned, earnedAt, progress, current, threshold } = badge;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div className="flex flex-col items-center text-center group">
      {/* Badge icon */}
      <div
        className={cn(
          sizeClasses[size],
          'rounded-full flex items-center justify-center relative transition-all',
          earned
            ? 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/30'
            : 'bg-surface-secondary border-2 border-dashed border-border'
        )}
      >
        <span
          className={cn(
            iconSizes[size],
            earned ? '' : 'grayscale opacity-40'
          )}
        >
          {badgeInfo.icon}
        </span>

        {/* Progress ring for unearned badges */}
        {!earned && showProgress && progress > 0 && (
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-purple-500/30"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${progress * 2.89} 289`}
              className="text-purple-500"
            />
          </svg>
        )}

        {/* Checkmark for earned */}
        {earned && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Badge name */}
      <h4 className={cn(
        'font-medium mt-2 text-text-primary',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}>
        {badgeInfo.name}
      </h4>

      {/* Description or progress */}
      {size !== 'sm' && (
        <p className="text-xs text-text-secondary mt-0.5 max-w-[120px]">
          {earned ? (
            earnedAt && (
              <span className="text-green-600">
                Earned {new Date(earnedAt).toLocaleDateString()}
              </span>
            )
          ) : (
            showProgress && (
              <span>{current} / {threshold}</span>
            )
          )}
        </p>
      )}

      {/* Tooltip on hover */}
      <div className={cn(
        'absolute bottom-full mb-2 px-3 py-2 bg-surface rounded-lg shadow-lg',
        'border border-border opacity-0 group-hover:opacity-100 transition-opacity',
        'pointer-events-none z-50 w-48 text-left',
        'hidden group-hover:block'
      )}>
        <p className="font-medium text-sm text-text-primary">{badgeInfo.name}</p>
        <p className="text-xs text-text-secondary mt-1">{badgeInfo.description}</p>
        <p className="text-xs text-purple-500 mt-1">{badgeInfo.points} points</p>
      </div>
    </div>
  );
}
