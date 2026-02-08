'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as taskService from '@/services/task-service';
import { Task, TaskStatus, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Plus, CheckSquare, Clock, User, Calendar, AlertCircle,
  MoreHorizontal, Trash2, Edit, ChevronDown, Filter, X
} from 'lucide-react';
import { TaskModal } from '@/components/tasks/task-modal';
import { format, isPast, parseISO } from 'date-fns';

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

export default function TasksView() {
  const { organization, user, isEditor } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterShow, setFilterShow] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<TaskStatus>('todo');

  useEffect(() => {
    loadTasks();
  }, [organization?.id]);

  async function loadTasks() {
    if (!organization?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await taskService.fetchTasks(organization.id);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    }
    
    setIsLoading(false);
  }

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    let filtered = tasks;
    
    if (filterShow !== 'all') {
      filtered = filtered.filter(t => t.tradeShowId === filterShow);
    }
    if (filterAssignee !== 'all') {
      filtered = filtered.filter(t => t.assigneeId === filterAssignee);
    }
    
    return {
      todo: filtered.filter(t => t.status === 'todo'),
      in_progress: filtered.filter(t => t.status === 'in_progress'),
      done: filtered.filter(t => t.status === 'done'),
    };
  }, [tasks, filterShow, filterAssignee]);

  // Get unique shows and assignees for filters
  const uniqueShows = useMemo(() => {
    const shows = new Map<string, string>();
    tasks.forEach(t => {
      if (t.tradeShowId && t.tradeShow) {
        shows.set(t.tradeShowId, t.tradeShow.name);
      }
    });
    return Array.from(shows.entries());
  }, [tasks]);

  const uniqueAssignees = useMemo(() => {
    const assignees = new Map<string, string>();
    tasks.forEach(t => {
      if (t.assigneeId && t.assignee) {
        assignees.set(t.assigneeId, t.assignee.fullName || t.assignee.email);
      }
    });
    return Array.from(assignees.entries());
  }, [tasks]);

  const handleCreateTask = (status: TaskStatus) => {
    setSelectedColumn(status);
    setShowCreateModal(true);
  };

  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [task, ...prev]);
    setShowCreateModal(false);
  };

  const handleTaskUpdated = (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    setEditingTask(null);
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <CheckSquare className="text-brand-purple" />
            Task Board
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {tasks.length} tasks · {tasksByStatus.done.length} completed
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-text-tertiary" />
            
            <select
              value={filterShow}
              onChange={(e) => setFilterShow(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm"
            >
              <option value="all">All Shows</option>
              {uniqueShows.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm"
            >
              <option value="all">All Assignees</option>
              {uniqueAssignees.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            
            {(filterShow !== 'all' || filterAssignee !== 'all') && (
              <button
                onClick={() => { setFilterShow('all'); setFilterAssignee('all'); }}
                className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-tertiary"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {isEditor && (
            <Button variant="primary" onClick={() => handleCreateTask('todo')}>
              <Plus size={16} /> New Task
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onAddTask={() => handleCreateTask(status)}
              onEditTask={setEditingTask}
              onDeleteTask={handleTaskDeleted}
              onStatusChange={handleStatusChange}
              isEditor={isEditor}
            />
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingTask) && (
          <TaskModal
            task={editingTask}
            defaultStatus={selectedColumn}
            onClose={() => { setShowCreateModal(false); setEditingTask(null); }}
            onSave={editingTask ? handleTaskUpdated : handleTaskCreated}
            onDelete={editingTask ? () => handleTaskDeleted(editingTask.id) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Kanban Column ───────────────────────────────────────────────────────────

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  isEditor: boolean;
}

function KanbanColumn({
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  isEditor,
}: KanbanColumnProps) {
  const config = TASK_STATUS_CONFIG[status];
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="w-80 flex-shrink-0 flex flex-col bg-bg-tertiary/50 rounded-xl"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', config.color)}>{config.label}</span>
          <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        {isEditor && (
          <button
            onClick={onAddTask}
            className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
              isEditor={isEditor}
            />
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-text-tertiary text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task Card ───────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  isEditor: boolean;
}

function TaskCard({ task, onEdit, onDelete, isEditor }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  
  const isOverdue = task.dueDate && task.status !== 'done' && isPast(parseISO(task.dueDate));

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable={isEditor}
      onDragStart={handleDragStart}
      className={cn(
        'p-3 rounded-lg bg-surface border border-border cursor-pointer hover:border-brand-purple/50 transition-colors',
        isEditor && 'cursor-grab active:cursor-grabbing'
      )}
      onClick={onEdit}
    >
      {/* Title & Menu */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-text-primary text-sm line-clamp-2">
          {task.title}
        </h4>
        {isEditor && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary"
            >
              <MoreHorizontal size={14} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-6 bg-surface border border-border rounded-lg shadow-lg py-1 z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2 text-error"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-text-secondary mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* Priority */}
        <span className={cn(
          'text-xs px-1.5 py-0.5 rounded',
          priorityConfig.bgColor,
          priorityConfig.color
        )}>
          {priorityConfig.label}
        </span>

        {/* Trade Show */}
        {task.tradeShow && (
          <span className="text-xs text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded truncate max-w-[100px]">
            {task.tradeShow.name}
          </span>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <span className={cn(
            'text-xs flex items-center gap-1',
            isOverdue ? 'text-error' : 'text-text-tertiary'
          )}>
            <Clock size={12} />
            {format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Assignee */}
      {task.assignee && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
          <div className="w-5 h-5 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple text-[10px] font-medium">
            {task.assignee.fullName?.[0]?.toUpperCase() || task.assignee.email[0].toUpperCase()}
          </div>
          <span className="text-xs text-text-secondary truncate">
            {task.assignee.fullName || task.assignee.email}
          </span>
        </div>
      )}
    </motion.div>
  );
}
