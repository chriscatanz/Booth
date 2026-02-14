'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { UserBadge } from '@/types/badges';

interface BadgeNotificationProps {
  badge: UserBadge;
  onDismiss: () => void;
}

export function BadgeNotification({ badge, onDismiss }: BadgeNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    // Auto dismiss after 5s
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(onDismiss, 300);
  };

  const badgeInfo = badge.badge;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[100] transition-all duration-300',
        visible && !leaving ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      )}
    >
      <div 
        className="bg-surface border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 p-4 flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform"
        onClick={handleDismiss}
      >
        {/* Badge icon with glow */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center animate-pulse">
            <span className="text-3xl">{badgeInfo?.icon}</span>
          </div>
          <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-xl" />
        </div>

        {/* Text */}
        <div>
          <p className="text-sm text-purple-400 font-medium">🎉 Badge Unlocked!</p>
          <p className="text-lg font-bold text-text-primary">{badgeInfo?.name}</p>
          <p className="text-sm text-text-secondary">{badgeInfo?.description}</p>
          <p className="text-xs text-purple-500 mt-1">+{badgeInfo?.points} points</p>
        </div>

        {/* Close hint */}
        <button 
          className="absolute top-2 right-2 text-text-secondary hover:text-text-primary"
          onClick={handleDismiss}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Container to manage multiple notifications
interface BadgeNotificationContainerProps {
  badges: UserBadge[];
  onClear: () => void;
}

export function BadgeNotificationContainer({ badges, onClear }: BadgeNotificationContainerProps) {
  const [queue, setQueue] = useState<UserBadge[]>([]);
  const [current, setCurrent] = useState<UserBadge | null>(null);

  useEffect(() => {
    if (badges.length > 0) {
      setQueue(prev => [...prev, ...badges]);
    }
  }, [badges]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [current, queue]);

  useEffect(() => {
    if (queue.length === 0 && !current) {
      onClear();
    }
  }, [queue, current, onClear]);

  if (!current) return null;

  return (
    <BadgeNotification
      badge={current}
      onDismiss={() => setCurrent(null)}
    />
  );
}
