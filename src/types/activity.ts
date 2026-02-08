// Activity Feed Types

export type ActivityType = 
  | 'show_created' | 'show_updated' | 'show_deleted'
  | 'task_created' | 'task_completed' | 'task_assigned'
  | 'member_joined' | 'member_invited'
  | 'asset_reserved' | 'asset_returned'
  | 'comment_added' | 'file_uploaded';

export interface ActivityItem {
  id: string;
  organizationId: string;
  
  type: ActivityType;
  actorId: string | null;
  
  // Related entities
  tradeShowId: string | null;
  taskId: string | null;
  assetId: string | null;
  
  // Content
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  
  createdAt: string;
  
  // Joined data
  actor?: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  tradeShow?: {
    id: string;
    name: string;
  };
  
  // Reactions and comments
  reactions?: ActivityReaction[];
  comments?: ActivityComment[];
  reactionCount?: number;
  commentCount?: number;
}

export interface ActivityReaction {
  id: string;
  activityId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  
  user?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface ActivityComment {
  id: string;
  activityId: string;
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

// Activity type configuration
export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { 
  icon: string; 
  color: string;
  verb: string;
}> = {
  show_created: { icon: 'Plus', color: 'text-success', verb: 'created' },
  show_updated: { icon: 'Edit', color: 'text-brand-purple', verb: 'updated' },
  show_deleted: { icon: 'Trash2', color: 'text-error', verb: 'deleted' },
  task_created: { icon: 'CheckSquare', color: 'text-brand-cyan', verb: 'created task' },
  task_completed: { icon: 'CheckCircle', color: 'text-success', verb: 'completed' },
  task_assigned: { icon: 'UserPlus', color: 'text-brand-purple', verb: 'assigned' },
  member_joined: { icon: 'UserPlus', color: 'text-success', verb: 'joined' },
  member_invited: { icon: 'Mail', color: 'text-brand-cyan', verb: 'invited' },
  asset_reserved: { icon: 'Package', color: 'text-warning', verb: 'reserved' },
  asset_returned: { icon: 'PackageCheck', color: 'text-success', verb: 'returned' },
  comment_added: { icon: 'MessageSquare', color: 'text-text-secondary', verb: 'commented on' },
  file_uploaded: { icon: 'Upload', color: 'text-brand-cyan', verb: 'uploaded' },
};

// Common reaction emojis
export const REACTION_EMOJIS = ['👍', '❤️', '🎉', '👀', '🚀', '💪'];
