-- Fix search_path on gamification functions to prevent search path injection

-- init_user_stats
CREATE OR REPLACE FUNCTION init_user_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_stats (user_id, first_login_at, last_login_date, login_streak_current)
  VALUES (NEW.id, NOW(), CURRENT_DATE, 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- update_login_streak
CREATE OR REPLACE FUNCTION update_login_streak(p_user_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- increment_show_count
CREATE OR REPLACE FUNCTION increment_show_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_stats (user_id, shows_created)
  VALUES (NEW.created_by, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    shows_created = user_stats.shows_created + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- increment_document_count
CREATE OR REPLACE FUNCTION increment_document_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_stats (user_id, documents_uploaded)
  VALUES (auth.uid(), 1)
  ON CONFLICT (user_id) DO UPDATE SET
    documents_uploaded = user_stats.documents_uploaded + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- increment_task_completed
CREATE OR REPLACE FUNCTION increment_task_completed()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
