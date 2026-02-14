import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import * as badgeService from '@/services/badge-service';
import type { BadgeProgress, UserBadge, UserStats, BadgeCategory } from '@/types/badges';

export function useBadges() {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<BadgeProgress[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBadgeData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [progressData, statsData, points] = await Promise.all([
        badgeService.getBadgeProgress(user.id),
        badgeService.getUserStats(user.id),
        badgeService.getUserPoints(user.id),
      ]);

      setProgress(progressData);
      setStats(statsData);
      setTotalPoints(points);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load badges'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBadgeData();
  }, [loadBadgeData]);

  // Update login streak on mount
  useEffect(() => {
    if (user?.id) {
      badgeService.updateLoginStreak(user.id).catch(console.error);
    }
  }, [user?.id]);

  const checkForNewBadges = useCallback(async (orgId?: string): Promise<UserBadge[]> => {
    if (!user?.id) return [];

    try {
      const newBadges = await badgeService.checkAndAwardBadges(user.id, orgId);
      if (newBadges.length > 0) {
        // Refresh badge data
        await loadBadgeData();
      }
      return newBadges;
    } catch (err) {
      console.error('Failed to check badges:', err);
      return [];
    }
  }, [user?.id, loadBadgeData]);

  const incrementStat = useCallback(async (
    stat: Parameters<typeof badgeService.incrementStat>[1],
    amount = 1
  ) => {
    if (!user?.id) return;

    try {
      await badgeService.incrementStat(user.id, stat, amount);
      // Check if this triggered any new badges
      await checkForNewBadges();
    } catch (err) {
      console.error('Failed to increment stat:', err);
    }
  }, [user?.id, checkForNewBadges]);

  const markCalendarSynced = useCallback(async () => {
    if (!user?.id) return;

    try {
      await badgeService.markCalendarSynced(user.id);
      await checkForNewBadges();
    } catch (err) {
      console.error('Failed to mark calendar synced:', err);
    }
  }, [user?.id, checkForNewBadges]);

  // Group badges by category
  const badgesByCategory = progress.reduce((acc, bp) => {
    const cat = bp.badge.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(bp);
    return acc;
  }, {} as Record<BadgeCategory, BadgeProgress[]>);

  // Get counts
  const earnedCount = progress.filter(bp => bp.earned).length;
  const totalCount = progress.length;

  return {
    progress,
    stats,
    totalPoints,
    loading,
    error,
    badgesByCategory,
    earnedCount,
    totalCount,
    checkForNewBadges,
    incrementStat,
    markCalendarSynced,
    refresh: loadBadgeData,
  };
}
