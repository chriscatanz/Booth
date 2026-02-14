// Badge system types

export type BadgeCategory = 
  | 'shows'
  | 'tasks'
  | 'budget'
  | 'documents'
  | 'team'
  | 'streaks'
  | 'completeness'
  | 'power_user'
  | 'milestones';

export interface BadgeCriteria {
  type: string;
  threshold: number;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  criteria: BadgeCriteria;
  points: number;
  sort_order: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  org_id: string | null;
  badge?: Badge; // Joined from badges table
}

export interface UserStats {
  user_id: string;
  shows_created: number;
  shows_completed: number;
  tasks_completed: number;
  documents_uploaded: number;
  ai_extractions_used: number;
  team_members_invited: number;
  tasks_assigned_to_others: number;
  shows_under_budget: number;
  shows_with_leads: number;
  booth_mode_uses: number;
  calendar_synced: boolean;
  kits_assigned: number;
  login_streak_current: number;
  login_streak_max: number;
  last_login_date: string | null;
  first_login_at: string | null;
  updated_at: string;
}

export interface BadgeProgress {
  badge: Badge;
  earned: boolean;
  earnedAt?: string;
  progress: number; // 0-100 percentage
  current: number;  // Current value
  threshold: number; // Required value
}

// Category display info
export const BADGE_CATEGORIES: Record<BadgeCategory, { label: string; icon: string }> = {
  shows: { label: 'Shows', icon: '🎪' },
  tasks: { label: 'Tasks', icon: '✅' },
  budget: { label: 'Budget', icon: '💰' },
  documents: { label: 'Documents', icon: '📄' },
  team: { label: 'Team', icon: '👥' },
  streaks: { label: 'Streaks', icon: '🔥' },
  completeness: { label: 'Completeness', icon: '💯' },
  power_user: { label: 'Power User', icon: '⚡' },
  milestones: { label: 'Milestones', icon: '🏆' },
};
