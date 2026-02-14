import { supabase } from '@/lib/supabase';
import type { Badge, UserBadge, UserStats, BadgeProgress } from '@/types/badges';

/**
 * Fetch all badge definitions
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('category')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

/**
 * Fetch user's earned badges
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch user stats
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

/**
 * Update user stats (upsert)
 */
export async function updateUserStats(
  userId: string, 
  updates: Partial<Omit<UserStats, 'user_id' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('user_stats')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) throw error;
}

/**
 * Increment a specific stat
 */
export async function incrementStat(
  userId: string,
  stat: keyof Pick<UserStats, 
    'ai_extractions_used' | 'booth_mode_uses' | 'kits_assigned' | 
    'team_members_invited' | 'tasks_assigned_to_others' | 
    'shows_under_budget' | 'shows_with_leads'
  >,
  amount = 1
): Promise<void> {
  const stats = await getUserStats(userId);
  const currentValue = stats?.[stat] ?? 0;
  
  await updateUserStats(userId, {
    [stat]: (currentValue as number) + amount,
  });
}

/**
 * Mark calendar as synced
 */
export async function markCalendarSynced(userId: string): Promise<void> {
  await updateUserStats(userId, { calendar_synced: true });
}

/**
 * Update login streak (call on each session start)
 */
export async function updateLoginStreak(userId: string): Promise<void> {
  const { error } = await supabase.rpc('update_login_streak', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Failed to update login streak:', error);
  }
}

/**
 * Award a badge to user
 */
export async function awardBadge(
  userId: string, 
  badgeId: string, 
  orgId?: string
): Promise<UserBadge | null> {
  const { data, error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId,
      org_id: orgId || null,
    })
    .select(`
      *,
      badge:badges(*)
    `)
    .single();

  if (error) {
    // Unique constraint violation = already earned
    if (error.code === '23505') return null;
    throw error;
  }

  return data;
}

/**
 * Check if user qualifies for a badge based on stats
 */
function checkBadgeCriteria(badge: Badge, stats: UserStats): { eligible: boolean; current: number } {
  const { type, threshold } = badge.criteria;
  let current = 0;

  switch (type) {
    case 'show_count':
      current = stats.shows_created;
      break;
    case 'shows_completed':
      current = stats.shows_completed;
      break;
    case 'tasks_completed':
      current = stats.tasks_completed;
      break;
    case 'documents_uploaded':
      current = stats.documents_uploaded;
      break;
    case 'ai_extractions':
      current = stats.ai_extractions_used;
      break;
    case 'team_invited':
      current = stats.team_members_invited;
      break;
    case 'login_streak':
      current = stats.login_streak_max;
      break;
    case 'kits_assigned':
      current = stats.kits_assigned;
      break;
    case 'booth_mode_used':
      current = stats.booth_mode_uses;
      break;
    case 'calendar_synced':
      current = stats.calendar_synced ? 1 : 0;
      break;
    case 'under_budget':
      current = stats.shows_under_budget;
      break;
    case 'shows_with_leads':
      current = stats.shows_with_leads;
      break;
    case 'unique_assignees':
      current = stats.tasks_assigned_to_others;
      break;
    case 'days_active':
      if (stats.first_login_at) {
        const days = Math.floor(
          (Date.now() - new Date(stats.first_login_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        current = days;
      }
      break;
    default:
      // Complex criteria that need additional queries
      current = 0;
  }

  return {
    eligible: current >= threshold,
    current,
  };
}

/**
 * Check and award all eligible badges for a user
 */
export async function checkAndAwardBadges(
  userId: string, 
  orgId?: string
): Promise<UserBadge[]> {
  const [badges, earnedBadges, stats] = await Promise.all([
    getAllBadges(),
    getUserBadges(userId),
    getUserStats(userId),
  ]);

  if (!stats) return [];

  const earnedBadgeIds = new Set(earnedBadges.map(ub => ub.badge_id));
  const newBadges: UserBadge[] = [];

  for (const badge of badges) {
    // Skip already earned
    if (earnedBadgeIds.has(badge.id)) continue;

    const { eligible } = checkBadgeCriteria(badge, stats);
    
    if (eligible) {
      const awarded = await awardBadge(userId, badge.id, orgId);
      if (awarded) {
        newBadges.push(awarded);
      }
    }
  }

  return newBadges;
}

/**
 * Get badge progress for display
 */
export async function getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
  const [badges, earnedBadges, stats] = await Promise.all([
    getAllBadges(),
    getUserBadges(userId),
    getUserStats(userId),
  ]);

  const defaultStats: UserStats = {
    user_id: userId,
    shows_created: 0,
    shows_completed: 0,
    tasks_completed: 0,
    documents_uploaded: 0,
    ai_extractions_used: 0,
    team_members_invited: 0,
    tasks_assigned_to_others: 0,
    shows_under_budget: 0,
    shows_with_leads: 0,
    booth_mode_uses: 0,
    calendar_synced: false,
    kits_assigned: 0,
    login_streak_current: 0,
    login_streak_max: 0,
    last_login_date: null,
    first_login_at: null,
    updated_at: new Date().toISOString(),
  };

  const userStats = stats || defaultStats;
  const earnedMap = new Map(earnedBadges.map(ub => [ub.badge_id, ub]));

  return badges.map(badge => {
    const earned = earnedMap.get(badge.id);
    const { current } = checkBadgeCriteria(badge, userStats);
    const threshold = badge.criteria.threshold;
    const progress = Math.min(100, Math.round((current / threshold) * 100));

    return {
      badge,
      earned: !!earned,
      earnedAt: earned?.earned_at,
      progress,
      current,
      threshold,
    };
  });
}

/**
 * Get total points earned by user
 */
export async function getUserPoints(userId: string): Promise<number> {
  const earnedBadges = await getUserBadges(userId);
  return earnedBadges.reduce((sum, ub) => sum + (ub.badge?.points || 0), 0);
}
