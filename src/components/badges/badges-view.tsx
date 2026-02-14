'use client';

import { useBadges } from '@/hooks/use-badges';
import { BadgeCard } from './badge-card';
import { BADGE_CATEGORIES, type BadgeCategory } from '@/types/badges';
import { cn } from '@/lib/utils';

interface BadgesViewProps {
  compact?: boolean;
}

export function BadgesView({ compact = false }: BadgesViewProps) {
  const { 
    badgesByCategory, 
    earnedCount, 
    totalCount, 
    totalPoints, 
    stats,
    loading 
  } = useBadges();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  const categoryOrder: BadgeCategory[] = [
    'shows', 'tasks', 'budget', 'documents', 'team',
    'streaks', 'completeness', 'power_user', 'milestones'
  ];

  return (
    <div className={cn('space-y-6', compact && 'space-y-4')}>
      {/* Summary stats */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{totalPoints}</p>
            <p className="text-sm text-text-secondary">Total Points</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-text-primary">{earnedCount}</p>
          <p className="text-sm text-text-secondary">of {totalCount} badges</p>
        </div>
      </div>

      {/* Streak highlight */}
      {stats && stats.login_streak_current > 1 && (
        <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-medium text-text-primary">
              {stats.login_streak_current} day streak!
            </p>
            <p className="text-sm text-text-secondary">
              Best streak: {stats.login_streak_max} days
            </p>
          </div>
        </div>
      )}

      {/* Badges by category */}
      {categoryOrder.map(category => {
        const badges = badgesByCategory[category];
        if (!badges || badges.length === 0) return null;

        const categoryInfo = BADGE_CATEGORIES[category];
        const earnedInCategory = badges.filter(b => b.earned).length;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <span>{categoryInfo.icon}</span>
                {categoryInfo.label}
              </h3>
              <span className="text-sm text-text-secondary">
                {earnedInCategory}/{badges.length}
              </span>
            </div>

            <div className={cn(
              'grid gap-4',
              compact 
                ? 'grid-cols-4 sm:grid-cols-6' 
                : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
            )}>
              {badges
                .sort((a, b) => a.badge.sort_order - b.badge.sort_order)
                .map(badge => (
                  <div key={badge.badge.id} className="relative">
                    <BadgeCard 
                      badge={badge} 
                      size={compact ? 'sm' : 'md'}
                      showProgress={!compact}
                    />
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
