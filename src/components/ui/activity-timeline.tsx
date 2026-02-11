'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityEntry } from '@/types';
import { Clock, MessageSquare, FileUp, RefreshCw, PlusCircle, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO, isValid, format } from 'date-fns';
import * as api from '@/services/supabase-service';
import { Button } from './button';

interface ActivityTimelineProps {
  tradeshowId: number;
  readOnly?: boolean;
}

export function ActivityTimeline({ tradeshowId, readOnly = false }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    const data = await api.fetchActivities(tradeshowId);
    setActivities(data);
    setIsLoading(false);
  }, [tradeshowId]);

  useEffect(() => {
    if (tradeshowId > 0) {
      loadActivities();
    }
  }, [tradeshowId, loadActivities]);

  const handleAddNote = async () => {
    if (!newNote.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    const entry = await api.addNote(tradeshowId, newNote.trim());
    if (entry) {
      setActivities([entry, ...activities]);
    }
    setNewNote('');
    setIsSubmitting(false);
  };

  const getActivityIcon = (type: ActivityEntry['activityType']) => {
    switch (type) {
      case 'note':
        return <MessageSquare size={14} className="text-brand-purple" />;
      case 'status_change':
        return <RefreshCw size={14} className="text-brand-cyan" />;
      case 'file_upload':
        return <FileUp size={14} className="text-success" />;
      case 'created':
        return <PlusCircle size={14} className="text-success" />;
      case 'update':
      default:
        return <Clock size={14} className="text-text-tertiary" />;
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = parseISO(dateStr);
    if (!isValid(date)) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    
    if (diff < dayMs) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (diff < 7 * dayMs) {
      return format(date, 'EEEE \'at\' h:mm a');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  if (tradeshowId <= 0) {
    return (
      <p className="text-sm text-text-tertiary text-center py-4">
        Save the show to start tracking activity
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add note input - hidden in read-only mode */}
      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border focus:outline-none focus:ring-2 focus:ring-brand-purple/50 text-text-primary placeholder:text-text-tertiary"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddNote}
            disabled={!newNote.trim() || isSubmitting}
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-text-tertiary" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-4">
          No activity yet. Add a note to get started.
        </p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
          
          <div className="space-y-3">
            <AnimatePresence>
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.localId}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex gap-3 pl-1"
                >
                  {/* Icon */}
                  <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center z-10">
                    {getActivityIcon(activity.activityType)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-3">
                    <p className="text-sm text-text-primary">{activity.description}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
