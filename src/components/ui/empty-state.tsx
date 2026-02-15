'use client';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { 
  Calendar, Package, Users, FileText, CheckSquare, 
  DollarSign, Sparkles, Bell, Truck, ClipboardList 
} from 'lucide-react';

type EmptyStateType = 
  | 'shows' 
  | 'tasks' 
  | 'team' 
  | 'documents' 
  | 'budget'
  | 'notifications'
  | 'kits'
  | 'activity'
  | 'generic';

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: React.ComponentType<{ size?: number; className?: string }> | React.ReactNode;
  title?: string;
  description?: string;
  message?: string; // Alias for description
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const illustrations: Record<EmptyStateType, { icon: React.ReactNode; color: string }> = {
  shows: { 
    icon: <Calendar size={48} strokeWidth={1.5} />, 
    color: 'text-brand-purple' 
  },
  tasks: { 
    icon: <CheckSquare size={48} strokeWidth={1.5} />, 
    color: 'text-brand-cyan' 
  },
  team: { 
    icon: <Users size={48} strokeWidth={1.5} />, 
    color: 'text-success' 
  },
  documents: { 
    icon: <FileText size={48} strokeWidth={1.5} />, 
    color: 'text-warning' 
  },
  budget: { 
    icon: <DollarSign size={48} strokeWidth={1.5} />, 
    color: 'text-success' 
  },
  notifications: { 
    icon: <Bell size={48} strokeWidth={1.5} />, 
    color: 'text-brand-purple' 
  },
  kits: { 
    icon: <Package size={48} strokeWidth={1.5} />, 
    color: 'text-brand-cyan' 
  },
  activity: { 
    icon: <ClipboardList size={48} strokeWidth={1.5} />, 
    color: 'text-text-tertiary' 
  },
  generic: { 
    icon: <Sparkles size={48} strokeWidth={1.5} />, 
    color: 'text-text-tertiary' 
  },
};

const defaultContent: Record<EmptyStateType, { title: string; description: string; actionLabel?: string }> = {
  shows: {
    title: 'No shows yet',
    description: 'Create your first trade show to start tracking logistics, budgets, and team assignments.',
    actionLabel: 'Create Show',
  },
  tasks: {
    title: 'No tasks yet',
    description: 'Tasks help you stay organized. Create tasks for booth setup, shipping deadlines, and follow-ups.',
    actionLabel: 'Add Task',
  },
  team: {
    title: 'No team members assigned',
    description: 'Add team members to coordinate who\'s attending each show.',
    actionLabel: 'Add Attendee',
  },
  documents: {
    title: 'No documents uploaded',
    description: 'Upload contracts, floor plans, or exhibitor manuals to keep everything in one place.',
    actionLabel: 'Upload Document',
  },
  budget: {
    title: 'No budget data yet',
    description: 'Start tracking costs by adding booth fees, shipping, and travel expenses to your shows.',
  },
  notifications: {
    title: 'All caught up!',
    description: 'You\'ll see deadline reminders and important updates here.',
  },
  kits: {
    title: 'No booth kits configured',
    description: 'Create booth kits to track your display inventory and auto-assign to shows.',
    actionLabel: 'Create Kit',
  },
  activity: {
    title: 'No recent activity',
    description: 'Activity from you and your team will appear here.',
  },
  generic: {
    title: 'Nothing here yet',
    description: 'Get started by adding some data.',
  },
};

export function EmptyState({ 
  type = 'generic', 
  icon,
  title, 
  description,
  message,
  actionLabel, 
  onAction,
  className 
}: EmptyStateProps) {
  const illustration = illustrations[type];
  const defaults = defaultContent[type];
  
  const displayTitle = title || defaults.title;
  const displayDescription = description || message || defaults.description;
  const displayAction = actionLabel || defaults.actionLabel;
  
  // Render custom icon if provided
  const renderIcon = () => {
    if (icon) {
      // If it's a component (like Lucide icon), render it
      if (typeof icon === 'function') {
        const IconComponent = icon;
        return <IconComponent size={48} className="text-text-tertiary" />;
      }
      // If it's already a ReactNode, return it
      return icon;
    }
    return illustration.icon;
  };
  
  const iconColor = icon ? 'text-text-tertiary' : illustration.color;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )}>
      {/* Illustration */}
      <div className={cn(
        'w-20 h-20 rounded-full flex items-center justify-center mb-4',
        'bg-gradient-to-br from-bg-tertiary to-bg-secondary'
      )}>
        <span className={iconColor}>
          {renderIcon()}
        </span>
      </div>
      
      {/* Text */}
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {displayTitle}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        {displayDescription}
      </p>
      
      {/* Action */}
      {displayAction && onAction && (
        <Button variant="primary" onClick={onAction}>
          {displayAction}
        </Button>
      )}
    </div>
  );
}
