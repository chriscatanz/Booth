'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useTradeShowStore } from '@/store/trade-show-store';
import * as taskService from '@/services/task-service';
import * as authService from '@/services/auth-service';
import { Task, TaskStatus, TaskPriority, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// cn is available but unused currently
import {
  X, Save, Trash2, AlertCircle, Calendar, User, Flag, Briefcase
} from 'lucide-react';
import { OrganizationMember } from '@/types/auth';

interface TaskModalProps {
  task?: Task | null;
  defaultStatus?: TaskStatus;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: () => void;
}

export function TaskModal({ task, defaultStatus = 'todo', onClose, onSave, onDelete }: TaskModalProps) {
  const { organization, user } = useAuthStore();
  const shows = useTradeShowStore(s => s.shows);
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId || '');
  const [tradeShowId, setTradeShowId] = useState<string>(task?.tradeShowId?.toString() || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load org members for assignee dropdown
  useEffect(() => {
    async function loadMembers() {
      if (!organization?.id) return;
      try {
        const data = await authService.fetchOrganizationMembers(organization.id);
        setMembers(data);
      } catch (err) {
        console.error('Failed to load members:', err);
      }
    }
    loadMembers();
  }, [organization?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organization?.id || !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      let savedTask: Task;
      
      if (task) {
        // Update existing
        savedTask = await taskService.updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
        });
      } else {
        // Create new
        savedTask = await taskService.createTask(organization.id, user.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          tradeShowId: tradeShowId ? parseInt(tradeShowId, 10) : undefined,
          assigneeId: assigneeId || undefined,
          priority,
          dueDate: dueDate || undefined,
        });
      }
      
      onSave(savedTask);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    }

    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;
    
    setIsDeleting(true);
    try {
      await taskService.deleteTask(task.id);
      onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-surface rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface">
          <h2 className="text-lg font-semibold text-text-primary">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50 resize-none"
            />
          </div>

          {/* Status & Priority row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                <Flag size={14} className="inline mr-1" />
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
              >
                {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
              >
                {Object.entries(TASK_PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Trade Show (only for new tasks) */}
          {!task && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                <Briefcase size={14} className="inline mr-1" />
                Trade Show (optional)
              </label>
              <select
                value={tradeShowId}
                onChange={(e) => setTradeShowId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
              >
                <option value="">No specific show</option>
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>{show.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              <User size={14} className="inline mr-1" />
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user?.fullName || member.user?.email}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              <Calendar size={14} className="inline mr-1" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {task && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                loading={isDeleting}
                className="text-error hover:text-error"
              >
                <Trash2 size={14} /> Delete
              </Button>
            ) : (
              <div />
            )}
            
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isLoading}>
                <Save size={14} /> {task ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
