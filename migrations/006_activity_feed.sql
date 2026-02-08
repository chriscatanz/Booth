-- Migration: Activity Feed
-- Real-time feed of team activity with reactions

-- Activity types
CREATE TYPE activity_type AS ENUM (
  'show_created', 'show_updated', 'show_deleted',
  'task_created', 'task_completed', 'task_assigned',
  'member_joined', 'member_invited',
  'asset_reserved', 'asset_returned',
  'comment_added', 'file_uploaded'
);

-- Activity feed table
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Activity details
  type activity_type NOT NULL,
  actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  -- Related entities (nullable - depends on activity type)
  trade_show_id UUID REFERENCES public.trade_shows(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Activity content
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity reactions (likes, etc.)
CREATE TABLE public.activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '👍',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(activity_id, user_id, emoji)
);

-- Activity comments
CREATE TABLE public.activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_feed_org ON public.activity_feed(organization_id);
CREATE INDEX idx_activity_feed_created ON public.activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_show ON public.activity_feed(trade_show_id);
CREATE INDEX idx_activity_reactions_activity ON public.activity_reactions(activity_id);
CREATE INDEX idx_activity_comments_activity ON public.activity_comments(activity_id);

-- RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- Activity feed: Users can view their org's activity
CREATE POLICY "Users can view org activity" ON public.activity_feed
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- System/triggers create activity entries
CREATE POLICY "System can create activity" ON public.activity_feed
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Reactions: Users can view reactions on activities they can see
CREATE POLICY "Users can view reactions" ON public.activity_reactions
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM public.activity_feed WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can add/remove their own reactions
CREATE POLICY "Users can add reactions" ON public.activity_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own reactions" ON public.activity_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Comments: Users can view comments on activities they can see
CREATE POLICY "Users can view activity comments" ON public.activity_comments
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM public.activity_feed WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add comments" ON public.activity_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    activity_id IN (
      SELECT id FROM public.activity_feed WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can edit own comments" ON public.activity_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON public.activity_comments
  FOR DELETE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER activity_comments_updated_at
  BEFORE UPDATE ON public.activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Helper function to create activity entries
CREATE OR REPLACE FUNCTION public.create_activity(
  p_org_id UUID,
  p_type activity_type,
  p_actor_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_show_id UUID DEFAULT NULL,
  p_task_id UUID DEFAULT NULL,
  p_asset_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.activity_feed (
    organization_id, type, actor_id, title, description,
    trade_show_id, task_id, asset_id, metadata
  ) VALUES (
    p_org_id, p_type, p_actor_id, p_title, p_description,
    p_show_id, p_task_id, p_asset_id, p_metadata
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.activity_feed IS 'Organization activity feed for team collaboration';
COMMENT ON TABLE public.activity_reactions IS 'Emoji reactions on activity items';
COMMENT ON TABLE public.activity_comments IS 'Comments on activity items';
