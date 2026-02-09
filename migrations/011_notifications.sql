-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

-- Notification types: task_due, shipping_cutoff, show_upcoming, general
-- Priority: low, normal, high, urgent

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE, -- NULL = all org members
  
  -- Content
  type TEXT NOT NULL CHECK (type IN ('task_due', 'shipping_cutoff', 'show_upcoming', 'general')),
  title TEXT NOT NULL,
  message TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Related entities
  tradeshow_id INTEGER REFERENCES public.tradeshows(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  
  -- Status
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  action_url TEXT, -- Optional deep link
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ, -- When to show (for future notifications)
  sent_at TIMESTAMPTZ, -- When actually delivered
  
  -- Deduplication
  dedup_key TEXT, -- Prevent duplicate notifications for same event
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read_at) WHERE dismissed_at IS NULL;
CREATE INDEX idx_notifications_org ON public.notifications(organization_id, created_at);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE sent_at IS NULL;
CREATE UNIQUE INDEX idx_notifications_dedup ON public.notifications(organization_id, dedup_key) WHERE dedup_key IS NOT NULL;

-- User notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Reminder timing (days before)
  task_reminder_days INTEGER DEFAULT 1,
  shipping_reminder_days INTEGER DEFAULT 3,
  show_reminder_days INTEGER DEFAULT 7,
  
  -- Notification channels
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  
  -- Types to receive
  task_notifications BOOLEAN DEFAULT true,
  shipping_notifications BOOLEAN DEFAULT true,
  show_notifications BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, organization_id)
);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications (or org-wide ones)
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Users can update (mark read/dismissed) their own notifications
CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Admins can create notifications
CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- System can create notifications (for background jobs)
CREATE POLICY "Service role can manage notifications"
  ON public.notifications FOR ALL
  USING (auth.role() = 'service_role');

-- Notification preferences policies
CREATE POLICY "Users can view their preferences"
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their preferences"
  ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to create deadline notifications
CREATE OR REPLACE FUNCTION check_upcoming_deadlines()
RETURNS void AS $$
DECLARE
  pref RECORD;
  show RECORD;
  task RECORD;
BEGIN
  -- Check shipping cutoffs
  FOR pref IN 
    SELECT np.*, om.organization_id 
    FROM notification_preferences np
    JOIN organization_members om ON om.user_id = np.user_id AND om.organization_id = np.organization_id
    WHERE np.shipping_notifications = true AND np.in_app_enabled = true
  LOOP
    FOR show IN
      SELECT * FROM tradeshows 
      WHERE organization_id = pref.organization_id
      AND shipping_cutoff IS NOT NULL
      AND shipping_cutoff BETWEEN CURRENT_DATE AND CURRENT_DATE + (pref.shipping_reminder_days || ' days')::interval
    LOOP
      INSERT INTO notifications (organization_id, user_id, type, title, message, priority, tradeshow_id, dedup_key)
      VALUES (
        pref.organization_id,
        pref.user_id,
        'shipping_cutoff',
        'Shipping Deadline Approaching',
        'Shipping cutoff for ' || show.name || ' is ' || to_char(show.shipping_cutoff, 'Mon DD'),
        CASE WHEN show.shipping_cutoff <= CURRENT_DATE + interval '1 day' THEN 'urgent' ELSE 'high' END,
        show.id,
        'shipping_' || show.id || '_' || to_char(show.shipping_cutoff, 'YYYY-MM-DD')
      )
      ON CONFLICT (organization_id, dedup_key) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Check task due dates
  FOR pref IN 
    SELECT np.*, om.organization_id 
    FROM notification_preferences np
    JOIN organization_members om ON om.user_id = np.user_id AND om.organization_id = np.organization_id
    WHERE np.task_notifications = true AND np.in_app_enabled = true
  LOOP
    FOR task IN
      SELECT t.*, ts.name as show_name 
      FROM tasks t
      LEFT JOIN tradeshows ts ON t.tradeshow_id = ts.id
      WHERE t.organization_id = pref.organization_id
      AND t.due_date IS NOT NULL
      AND t.status != 'completed'
      AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (pref.task_reminder_days || ' days')::interval
      AND (t.assigned_to IS NULL OR t.assigned_to = pref.user_id)
    LOOP
      INSERT INTO notifications (organization_id, user_id, type, title, message, priority, task_id, tradeshow_id, dedup_key)
      VALUES (
        pref.organization_id,
        pref.user_id,
        'task_due',
        'Task Due Soon',
        task.title || COALESCE(' (' || task.show_name || ')', '') || ' is due ' || to_char(task.due_date, 'Mon DD'),
        CASE WHEN task.due_date <= CURRENT_DATE THEN 'urgent' WHEN task.due_date <= CURRENT_DATE + interval '1 day' THEN 'high' ELSE 'normal' END,
        task.id,
        task.tradeshow_id,
        'task_' || task.id || '_' || to_char(task.due_date, 'YYYY-MM-DD')
      )
      ON CONFLICT (organization_id, dedup_key) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Check upcoming shows
  FOR pref IN 
    SELECT np.*, om.organization_id 
    FROM notification_preferences np
    JOIN organization_members om ON om.user_id = np.user_id AND om.organization_id = np.organization_id
    WHERE np.show_notifications = true AND np.in_app_enabled = true
  LOOP
    FOR show IN
      SELECT * FROM tradeshows 
      WHERE organization_id = pref.organization_id
      AND start_date IS NOT NULL
      AND start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (pref.show_reminder_days || ' days')::interval
    LOOP
      INSERT INTO notifications (organization_id, user_id, type, title, message, priority, tradeshow_id, dedup_key)
      VALUES (
        pref.organization_id,
        pref.user_id,
        'show_upcoming',
        'Show Coming Up',
        show.name || ' starts ' || to_char(show.start_date, 'Mon DD') || COALESCE(' in ' || show.location, ''),
        CASE WHEN show.start_date <= CURRENT_DATE + interval '2 days' THEN 'high' ELSE 'normal' END,
        show.id,
        'show_' || show.id || '_' || to_char(show.start_date, 'YYYY-MM-DD')
      )
      ON CONFLICT (organization_id, dedup_key) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
