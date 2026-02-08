'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as activityService from '@/services/activity-service';
import { ActivityItem, ActivityType, ACTIVITY_TYPE_CONFIG, REACTION_EMOJIS } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Activity, MessageSquare, ThumbsUp, Plus, Edit, Trash2,
  CheckSquare, CheckCircle, UserPlus, Mail, Package, Upload,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  Plus, Edit, Trash2, CheckSquare, CheckCircle, UserPlus, Mail, Package, Upload, MessageSquare,
};

export default function ActivityView() {
  const { organization, user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivity();
  }, [organization?.id]);

  async function loadActivity() {
    if (!organization?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await activityService.fetchActivityFeed(organization.id, { limit: 50 });
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    }
    
    setIsLoading(false);
  }

  const handleReaction = async (activityId: string, emoji: string) => {
    if (!user?.id) return;
    
    try {
      await activityService.addReaction(activityId, user.id, emoji);
      // Reload to get updated counts
      loadActivity();
    } catch (err) {
      console.error('Failed to add reaction:', err);
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
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Activity className="text-brand-purple" />
          Activity Feed
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Recent updates from your team
        </p>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-error-bg text-error text-sm">
            {error}
          </div>
        )}

        {activities.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            No activity yet. Actions by your team will appear here.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onReaction={(emoji) => handleReaction(activity.id, emoji)}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity Card ───────────────────────────────────────────────────────────

interface ActivityCardProps {
  activity: ActivityItem;
  onReaction: (emoji: string) => void;
  currentUserId?: string;
}

function ActivityCard({ activity, onReaction, currentUserId }: ActivityCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const config = ACTIVITY_TYPE_CONFIG[activity.type];
  const Icon = ICON_MAP[config.icon] || Activity;

  return (
    <div className="px-6 py-4 hover:bg-bg-tertiary/50 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {activity.actor?.avatarUrl ? (
            <img
              src={activity.actor.avatarUrl}
              alt={activity.actor.fullName || ''}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center">
              <span className="text-brand-purple font-medium">
                {activity.actor?.fullName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm">
                <span className="font-medium text-text-primary">
                  {activity.actor?.fullName || activity.actor?.email || 'Someone'}
                </span>
                <span className="text-text-secondary"> {config.verb} </span>
                <span className="font-medium text-text-primary">{activity.title}</span>
              </p>
              
              {activity.description && (
                <p className="text-sm text-text-secondary mt-1">{activity.description}</p>
              )}
              
              {activity.tradeShow && (
                <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                  <ChevronRight size={12} />
                  {activity.tradeShow.name}
                </p>
              )}
            </div>

            <div className={cn('p-2 rounded-lg', `bg-${config.color.replace('text-', '')}/10`)}>
              <Icon size={16} className={config.color} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-text-tertiary">
              {formatDistanceToNow(parseISO(activity.createdAt), { addSuffix: true })}
            </span>

            {/* Reactions */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="text-xs text-text-tertiary hover:text-text-secondary flex items-center gap-1"
              >
                <ThumbsUp size={12} />
                {activity.reactionCount || 0}
              </button>
              
              {showReactions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowReactions(false)} />
                  <div className="absolute left-0 top-6 bg-surface border border-border rounded-lg shadow-lg p-2 flex gap-1 z-20">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { onReaction(emoji); setShowReactions(false); }}
                        className="w-8 h-8 rounded hover:bg-bg-tertiary text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="text-xs text-text-tertiary hover:text-text-secondary flex items-center gap-1">
              <MessageSquare size={12} />
              {activity.commentCount || 0}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
