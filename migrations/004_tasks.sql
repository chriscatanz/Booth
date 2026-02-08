-- Migration: Task Management
-- Adds task tracking with assignment, status, and due dates

-- Task status enum
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');

-- Task priority enum  
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trade_show_id UUID REFERENCES public.trade_shows(id) ON DELETE CASCADE,
  
  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  
  -- Assignment
  assignee_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  -- Dates
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Position for ordering within status column
  position INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX idx_tasks_show ON public.tasks(trade_show_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks in their org
CREATE POLICY "Users can view org tasks" ON public.tasks
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Editors+ can create tasks
CREATE POLICY "Editors can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Editors+ can update tasks
CREATE POLICY "Editors can update tasks" ON public.tasks
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Admins+ can delete tasks
CREATE POLICY "Admins can delete tasks" ON public.tasks
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Updated_at trigger
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments on tasks (for activity/collaboration)
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on tasks they can see
CREATE POLICY "Users can view task comments" ON public.task_comments
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create comments on tasks they can see
CREATE POLICY "Users can create comments" ON public.task_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    task_id IN (
      SELECT id FROM public.tasks WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.task_comments
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.task_comments
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE public.tasks IS 'Tasks for trade show management with kanban workflow';
COMMENT ON TABLE public.task_comments IS 'Comments on tasks for team collaboration';
