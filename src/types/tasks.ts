// Task Management Types

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  organizationId: string;
  tradeShowId: number | null;
  
  // Task details
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  
  // Assignment
  assigneeId: string | null;
  assignee?: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  
  // Dates
  dueDate: string | null;
  completedAt: string | null;
  
  // Metadata
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  position: number;
  
  // Joined data
  tradeShow?: {
    id: number;
    name: string;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  tradeShowId?: number;
  assigneeId?: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  position?: number;
}

// Kanban column configuration
export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'text-text-secondary' },
  in_progress: { label: 'In Progress', color: 'text-brand-cyan' },
  done: { label: 'Done', color: 'text-success' },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-text-tertiary', bgColor: 'bg-bg-tertiary' },
  medium: { label: 'Medium', color: 'text-brand-cyan', bgColor: 'bg-brand-cyan/10' },
  high: { label: 'High', color: 'text-warning', bgColor: 'bg-warning/10' },
  urgent: { label: 'Urgent', color: 'text-error', bgColor: 'bg-error/10' },
};
