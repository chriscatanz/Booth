import { supabase } from '@/lib/supabase';
import { Task, TaskComment, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/types/tasks';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapTask(row: Record<string, unknown>): Task {
  const assignee = row.assignee as Record<string, unknown> | null;
  const tradeShow = row.trade_shows as Record<string, unknown> | null;
  
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    tradeShowId: row.trade_show_id as string | null,
    title: row.title as string,
    description: row.description as string | null,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    assigneeId: row.assignee_id as string | null,
    assignee: assignee ? {
      id: assignee.id as string,
      fullName: assignee.full_name as string | null,
      email: assignee.email as string,
      avatarUrl: assignee.avatar_url as string | null,
    } : undefined,
    dueDate: row.due_date as string | null,
    completedAt: row.completed_at as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    position: row.position as number,
    tradeShow: tradeShow ? {
      id: tradeShow.id as string,
      name: tradeShow.name as string,
    } : undefined,
  };
}

function mapComment(row: Record<string, unknown>): TaskComment {
  const user = row.user_profiles as Record<string, unknown> | null;
  
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    user: user ? {
      id: user.id as string,
      fullName: user.full_name as string | null,
      email: user.email as string,
      avatarUrl: user.avatar_url as string | null,
    } : undefined,
  };
}

// ─── Task CRUD ───────────────────────────────────────────────────────────────

export async function fetchTasks(orgId: string, filters?: {
  tradeShowId?: string;
  assigneeId?: string;
  status?: TaskStatus;
}): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select(`
      *,
      assignee:user_profiles!tasks_assignee_id_fkey (
        id, full_name, email, avatar_url
      ),
      trade_shows (id, name)
    `)
    .eq('organization_id', orgId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (filters?.tradeShowId) {
    query = query.eq('trade_show_id', filters.tradeShowId);
  }
  if (filters?.assigneeId) {
    query = query.eq('assignee_id', filters.assigneeId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapTask);
}

export async function fetchTasksByShow(showId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:user_profiles!tasks_assignee_id_fkey (
        id, full_name, email, avatar_url
      )
    `)
    .eq('trade_show_id', showId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTask);
}

export async function createTask(
  orgId: string,
  userId: string,
  input: CreateTaskInput
): Promise<Task> {
  // Get max position for this status
  const { data: maxPos } = await supabase
    .from('tasks')
    .select('position')
    .eq('organization_id', orgId)
    .eq('status', 'todo')
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = (maxPos?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      organization_id: orgId,
      trade_show_id: input.tradeShowId || null,
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'medium',
      assignee_id: input.assigneeId || null,
      due_date: input.dueDate || null,
      created_by: userId,
      position,
    })
    .select(`
      *,
      assignee:user_profiles!tasks_assignee_id_fkey (
        id, full_name, email, avatar_url
      ),
      trade_shows (id, name)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapTask(data);
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const updates: Record<string, unknown> = {};
  
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.status !== undefined) {
    updates.status = input.status;
    if (input.status === 'done') {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }
  }
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.assigneeId !== undefined) updates.assignee_id = input.assigneeId;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.position !== undefined) updates.position = input.position;

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select(`
      *,
      assignee:user_profiles!tasks_assignee_id_fkey (
        id, full_name, email, avatar_url
      ),
      trade_shows (id, name)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapTask(data);
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

// ─── Batch position update (for drag & drop) ─────────────────────────────────

export async function reorderTasks(
  taskId: string,
  newStatus: TaskStatus,
  newPosition: number
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      status: newStatus,
      position: newPosition,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      user_profiles (id, full_name, email, avatar_url)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapComment);
}

export async function createComment(
  taskId: string,
  userId: string,
  content: string
): Promise<TaskComment> {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      content,
    })
    .select(`
      *,
      user_profiles (id, full_name, email, avatar_url)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapComment(data);
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw new Error(error.message);
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function fetchTaskStats(orgId: string): Promise<{
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}> {
  const { data, error } = await supabase
    .from('tasks')
    .select('status, due_date')
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  const today = new Date().toISOString().split('T')[0];
  const stats = {
    total: data?.length || 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
  };

  for (const task of data || []) {
    if (task.status === 'todo') stats.todo++;
    if (task.status === 'in_progress') stats.inProgress++;
    if (task.status === 'done') stats.done++;
    if (task.due_date && task.due_date < today && task.status !== 'done') {
      stats.overdue++;
    }
  }

  return stats;
}
