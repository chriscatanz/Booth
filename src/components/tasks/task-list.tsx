'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as taskService from '@/services/task-service';
import { Task, TaskStatus, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Plus, CheckSquare, Circle, CheckCircle2, Clock, User,
  MoreHorizontal, Trash2, Edit, AlertCircle
} from 'lucide-react';
import { TaskModal } from './task-modal';
import { format, isPast, parseISO } from 'date-fns';

interface TaskListProps {
  tradeShowId: number;
  readOnly?: boolean;
}

export function TaskList({ tradeShowId, readOnly = false }: TaskListProps) {
  const { organization, user, isEditor } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, [tradeShowId]);

  async function loadTasks() {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await taskService.fetchTasksByShow(tradeShowId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    }
    
    setIsLoading(false);
  }

  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [task, ...prev]);
    setShowCreateModal(false);
  };

  const handleTaskUpdated = (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    setEditingTask(null);
  };

  const handleTaskDeleted = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (readOnly || !isEditor) return;
    
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const updated = await taskService.updateTask(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Group tasks
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          <CheckSquare size={16} className="text-brand-purple" />
          Tasks
          <span className="text-text-tertiary">({tasks.length})</span>
        </h3>
        {isEditor && !readOnly && (
          <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Add Task
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-error-bg text-error text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-6 text-text-tertiary text-sm">
          No tasks yet
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div className="space-y-1">
              {activeTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleStatus(task)}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleTaskDeleted(task.id)}
                  isEditor={isEditor && !readOnly}
                />
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <p className="text-xs text-text-tertiary mb-2">
                Completed ({completedTasks.length})
              </p>
              <div className="space-y-1">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleStatus(task)}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => handleTaskDeleted(task.id)}
                    isEditor={isEditor && !readOnly}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingTask) && (
          <TaskModal
            task={editingTask}
            onClose={() => { setShowCreateModal(false); setEditingTask(null); }}
            onSave={editingTask ? handleTaskUpdated : handleTaskCreated}
            onDelete={editingTask ? () => handleTaskDeleted(editingTask.id) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Task Item ───────────────────────────────────────────────────────────────

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditor: boolean;
}

function TaskItem({ task, onToggle, onEdit, onDelete, isEditor }: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isDone = task.status === 'done';
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  const isOverdue = task.dueDate && !isDone && isPast(parseISO(task.dueDate));

  return (
    <div className={cn(
      'flex items-center gap-3 p-2 rounded-lg hover:bg-bg-tertiary group',
      isDone && 'opacity-60'
    )}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={!isEditor}
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          isDone 
            ? 'bg-success border-success text-white' 
            : 'border-border hover:border-brand-purple',
          !isEditor && 'cursor-default'
        )}
      >
        {isDone && <CheckCircle2 size={12} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={isEditor ? onEdit : undefined}>
        <p className={cn(
          'text-sm text-text-primary truncate',
          isDone && 'line-through',
          isEditor && 'cursor-pointer hover:text-brand-purple'
        )}>
          {task.title}
        </p>
        
        {/* Meta row */}
        <div className="flex items-center gap-2 mt-0.5">
          {/* Priority badge (only for high/urgent) */}
          {(task.priority === 'high' || task.priority === 'urgent') && (
            <span className={cn(
              'text-[10px] px-1 py-0.5 rounded',
              priorityConfig.bgColor,
              priorityConfig.color
            )}>
              {priorityConfig.label}
            </span>
          )}
          
          {/* Due date */}
          {task.dueDate && (
            <span className={cn(
              'text-[10px] flex items-center gap-0.5',
              isOverdue ? 'text-error' : 'text-text-tertiary'
            )}>
              <Clock size={10} />
              {format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}
          
          {/* Assignee */}
          {task.assignee && (
            <span className="text-[10px] text-text-tertiary flex items-center gap-0.5">
              <User size={10} />
              {task.assignee.fullName?.split(' ')[0] || task.assignee.email.split('@')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      {isEditor && (
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary"
          >
            <MoreHorizontal size={14} />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-6 bg-surface border border-border rounded-lg shadow-lg py-1 z-20 min-w-[100px]">
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2 text-error"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
