-- Gamification: Badges System
-- Adds badge definitions and user badge tracking

-- Badge categories enum
CREATE TYPE badge_category AS ENUM (
  'shows',
  'tasks', 
  'budget',
  'documents',
  'team',
  'streaks',
  'completeness',
  'power_user',
  'milestones'
);

-- Badge definitions table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category badge_category NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name
  criteria JSONB NOT NULL, -- { "type": "show_count", "threshold": 5 }
  points INTEGER DEFAULT 10,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User earned badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- context where earned
  UNIQUE(user_id, badge_id)
);

-- User stats for tracking progress (updated via triggers)
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shows_created INTEGER DEFAULT 0,
  shows_completed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  documents_uploaded INTEGER DEFAULT 0,
  ai_extractions_used INTEGER DEFAULT 0,
  team_members_invited INTEGER DEFAULT 0,
  tasks_assigned_to_others INTEGER DEFAULT 0,
  shows_under_budget INTEGER DEFAULT 0,
  shows_with_leads INTEGER DEFAULT 0,
  booth_mode_uses INTEGER DEFAULT 0,
  calendar_synced BOOLEAN DEFAULT FALSE,
  kits_assigned INTEGER DEFAULT 0,
  login_streak_current INTEGER DEFAULT 0,
  login_streak_max INTEGER DEFAULT 0,
  last_login_date DATE,
  first_login_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Badges are readable by all authenticated users
CREATE POLICY "badges_select" ON badges
  FOR SELECT TO authenticated USING (true);

-- Users can see their own badges
CREATE POLICY "user_badges_select" ON user_badges
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- System inserts badges (via service role)
CREATE POLICY "user_badges_insert" ON user_badges
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can see their own stats
CREATE POLICY "user_stats_select" ON user_stats
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own stats
CREATE POLICY "user_stats_upsert" ON user_stats
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Seed badge definitions
INSERT INTO badges (slug, name, description, category, icon, criteria, points, sort_order) VALUES
-- Shows category
('first_steps', 'First Steps', 'Create your first trade show', 'shows', '🎯', '{"type": "show_count", "threshold": 1}', 10, 1),
('getting_busy', 'Getting Busy', 'Create 5 trade shows', 'shows', '📈', '{"type": "show_count", "threshold": 5}', 25, 2),
('road_warrior', 'Road Warrior', 'Create 25 trade shows', 'shows', '🛣️', '{"type": "show_count", "threshold": 25}', 50, 3),
('trade_show_pro', 'Trade Show Pro', 'Create 50 trade shows', 'shows', '🏅', '{"type": "show_count", "threshold": 50}', 100, 4),
('exhibition_empire', 'Exhibition Empire', 'Create 100 trade shows', 'shows', '👑', '{"type": "show_count", "threshold": 100}', 200, 5),

-- Tasks category
('task_tackler', 'Task Tackler', 'Complete 10 tasks', 'tasks', '✅', '{"type": "tasks_completed", "threshold": 10}', 15, 1),
('checklist_champion', 'Checklist Champion', 'Complete 50 tasks', 'tasks', '📋', '{"type": "tasks_completed", "threshold": 50}', 50, 2),
('zero_inbox', 'Zero Inbox', 'Clear all tasks for a show', 'tasks', '🎉', '{"type": "zero_tasks_show", "threshold": 1}', 25, 3),
('early_bird', 'Early Bird', 'Complete a task 7+ days before deadline', 'tasks', '🐦', '{"type": "early_task", "threshold": 1}', 20, 4),

-- Budget category
('penny_pincher', 'Penny Pincher', 'Come in under budget on a show', 'budget', '💰', '{"type": "under_budget", "threshold": 1}', 30, 1),
('budget_hawk', 'Budget Hawk', 'Track expenses on 10 shows', 'budget', '🦅', '{"type": "shows_with_budget", "threshold": 10}', 40, 2),
('roi_tracker', 'ROI Tracker', 'Log leads on 5 shows', 'budget', '📊', '{"type": "shows_with_leads", "threshold": 5}', 35, 3),

-- Documents category
('paper_pusher', 'Paper Pusher', 'Upload 10 documents', 'documents', '📄', '{"type": "documents_uploaded", "threshold": 10}', 15, 1),
('organized_chaos', 'Organized Chaos', 'Upload docs to 5 different shows', 'documents', '🗂️', '{"type": "shows_with_docs", "threshold": 5}', 25, 2),
('ai_believer', 'AI Believer', 'Use AI extraction 5 times', 'documents', '🤖', '{"type": "ai_extractions", "threshold": 5}', 30, 3),

-- Team category
('first_hire', 'First Hire', 'Invite a team member', 'team', '🤝', '{"type": "team_invited", "threshold": 1}', 20, 1),
('squad_goals', 'Squad Goals', 'Have 5+ members in your organization', 'team', '👥', '{"type": "org_members", "threshold": 5}', 40, 2),
('delegation_pro', 'Delegation Pro', 'Assign tasks to 3 different people', 'team', '📤', '{"type": "unique_assignees", "threshold": 3}', 30, 3),

-- Streaks category
('weekly_warrior', 'Weekly Warrior', 'Log in 7 days straight', 'streaks', '🔥', '{"type": "login_streak", "threshold": 7}', 25, 1),
('monthly_regular', 'Monthly Regular', 'Active 4 weeks in a row', 'streaks', '📆', '{"type": "login_streak", "threshold": 28}', 50, 2),
('show_season', 'Show Season', 'Manage shows 3 months running', 'streaks', '🗓️', '{"type": "active_months", "threshold": 3}', 75, 3),

-- Completeness category  
('detail_oriented', 'Detail Oriented', 'Fill 90%+ fields on a show', 'completeness', '🔍', '{"type": "show_completeness", "threshold": 90}', 25, 1),
('fully_loaded', 'Fully Loaded', 'Complete show with budget, travel, booth, and logistics', 'completeness', '💯', '{"type": "full_show", "threshold": 1}', 40, 2),
('template_master', 'Template Master', 'Create a show from a template', 'completeness', '📑', '{"type": "from_template", "threshold": 1}', 20, 3),

-- Power user category
('calendar_connected', 'Calendar Connected', 'Sync your calendar feed', 'power_user', '🔗', '{"type": "calendar_synced", "threshold": 1}', 20, 1),
('kit_commander', 'Kit Commander', 'Assign booth kits to 5 shows', 'power_user', '🎪', '{"type": "kits_assigned", "threshold": 5}', 30, 2),
('speed_demon', 'Speed Demon', 'Create a show in under 2 minutes', 'power_user', '⚡', '{"type": "fast_create", "threshold": 1}', 25, 3),
('booth_mode_activated', 'Booth Mode Activated', 'Use Booth Mode at a live show', 'power_user', '📱', '{"type": "booth_mode_used", "threshold": 1}', 30, 4),

-- Milestones category
('anniversary', 'Anniversary', '1 year using Booth', 'milestones', '🎂', '{"type": "days_active", "threshold": 365}', 100, 1),
('veteran', 'Veteran', 'Manage shows across 2 calendar years', 'milestones', '🎖️', '{"type": "calendar_years", "threshold": 2}', 75, 2),
('show_must_go_on', 'Show Must Go On', 'Mark 10 shows as completed', 'milestones', '🏁', '{"type": "shows_completed", "threshold": 10}', 50, 3);

-- Function to initialize user stats on first login
CREATE OR REPLACE FUNCTION init_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, first_login_at, last_login_date, login_streak_current)
  VALUES (NEW.id, NOW(), CURRENT_DATE, 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update login streak
CREATE OR REPLACE FUNCTION update_login_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_login DATE;
  v_current_streak INTEGER;
  v_max_streak INTEGER;
BEGIN
  SELECT last_login_date, login_streak_current, login_streak_max
  INTO v_last_login, v_current_streak, v_max_streak
  FROM user_stats
  WHERE user_id = p_user_id;
  
  IF v_last_login IS NULL THEN
    -- First login
    INSERT INTO user_stats (user_id, last_login_date, login_streak_current, login_streak_max, first_login_at)
    VALUES (p_user_id, CURRENT_DATE, 1, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      last_login_date = CURRENT_DATE,
      login_streak_current = 1,
      login_streak_max = GREATEST(user_stats.login_streak_max, 1),
      first_login_at = COALESCE(user_stats.first_login_at, NOW());
  ELSIF v_last_login = CURRENT_DATE THEN
    -- Already logged in today, no change
    NULL;
  ELSIF v_last_login = CURRENT_DATE - 1 THEN
    -- Consecutive day, increment streak
    UPDATE user_stats SET
      last_login_date = CURRENT_DATE,
      login_streak_current = v_current_streak + 1,
      login_streak_max = GREATEST(v_max_streak, v_current_streak + 1),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE user_stats SET
      last_login_date = CURRENT_DATE,
      login_streak_current = 1,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment shows_created when a show is created
CREATE OR REPLACE FUNCTION increment_show_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, shows_created)
  VALUES (NEW.created_by, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    shows_created = user_stats.shows_created + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_increment_show_count
  AFTER INSERT ON tradeshows
  FOR EACH ROW
  EXECUTE FUNCTION increment_show_count();

-- Trigger to increment documents_uploaded
CREATE OR REPLACE FUNCTION increment_document_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, documents_uploaded)
  VALUES (auth.uid(), 1)
  ON CONFLICT (user_id) DO UPDATE SET
    documents_uploaded = user_stats.documents_uploaded + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_increment_document_count
  AFTER INSERT ON additional_files
  FOR EACH ROW
  EXECUTE FUNCTION increment_document_count();

-- Trigger to increment tasks_completed
CREATE OR REPLACE FUNCTION increment_task_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    INSERT INTO user_stats (user_id, tasks_completed)
    VALUES (auth.uid(), 1)
    ON CONFLICT (user_id) DO UPDATE SET
      tasks_completed = user_stats.tasks_completed + 1,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_increment_task_completed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_task_completed();

-- Index for faster badge lookups
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_stats_user ON user_stats(user_id);
CREATE INDEX idx_badges_category ON badges(category);
