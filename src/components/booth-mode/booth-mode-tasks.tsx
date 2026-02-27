'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Calendar, User, Loader2, ClipboardList } from 'lucide-react';
import { fetchTasks, updateTask } from '@/services/task-service';
import { useAuthStore } from '@/store/auth-store';
import { useToastStore } from '@/store/toast-store';
import { Task } from '@/types/tasks';
import { TradeShow } from '@/types';
import { format, parseISO } from 'date-fns';

interface BoothModeTasksProps {
  show: TradeShow;
}

export function BoothModeTasks({ show }: BoothModeTasksProps) {
  const { organization } = useAuthStore();
  const toast = useToastStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      if (!organization?.id) return;
      setLoading(true);
      try {
        const data = await fetchTasks(organization.id, { tradeShowId: show.id });
        setTasks(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load tasks';
        toast.error('Error', msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [show.id, organization?.id, toast]);

  const handleToggle = async (task: Task) => {
    if (completing.has(task.id)) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    setCompleting(prev => new Set(prev).add(task.id));
    try {
      const updated = await updateTask(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      toast.error('Error', msg);
    } finally {
      setCompleting(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <ClipboardList size={32} className="text-white/20 mb-3" />
        <p className="text-white/50 text-sm">No tasks for this show</p>
      </div>
    );
  }

  const todo = tasks.filter(t => t.status !== 'done');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div className="p-4 space-y-4">
      {todo.length > 0 && (
        <div className="space-y-2">
          {todo.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              completing={completing.has(task.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/30 uppercase tracking-wider px-1">
            Completed ({done.length})
          </p>
          {done.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              completing={completing.has(task.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  completing: boolean;
  onToggle: (task: Task) => void;
}

function TaskRow({ task, completing, onToggle }: TaskRowProps) {
  const isDone = task.status === 'done';

  return (
    <button
      onClick={() => onToggle(task)}
      className="w-full rounded-xl bg-white/5 border border-white/10 p-3 flex items-start gap-3 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex-shrink-0 mt-0.5">
        {completing ? (
          <Loader2 size={20} className="animate-spin text-white/40" />
        ) : isDone ? (
          <CheckCircle2 size={20} className="text-green-400" />
        ) : (
          <Circle size={20} className="text-white/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${isDone ? 'line-through text-white/30' : 'text-white'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Calendar size={11} />
              {format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.assignee?.fullName && (
            <span className="flex items-center gap-1 text-xs text-white/40">
              <User size={11} />
              {task.assignee.fullName}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
