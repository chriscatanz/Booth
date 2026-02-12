'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TradeShow } from '@/types';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateRange } from '@/lib/date-utils';
import { daysUntilShow, totalEstimatedCost, roiPercentage } from '@/types/computed';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  MapPin, Calendar, Hash, DollarSign, TrendingUp, 
  Users, Target, CheckCircle, AlertCircle,
} from 'lucide-react';

interface DetailHeroProps {
  show: TradeShow;
  onStatusChange?: (status: string) => void;
  canEdit?: boolean;
}

export function DetailHero({ show }: DetailHeroProps) {
  const days = daysUntilShow(show);
  const estimated = totalEstimatedCost(show);
  const roi = roiPercentage(show);

  // Quick status indicators
  const alerts: { icon: React.ElementType; label: string; status: 'success' | 'warning' | 'error' }[] = [];
  
  if (!show.registrationConfirmed) {
    alerts.push({ icon: AlertCircle, label: 'Registration pending', status: 'warning' });
  }
  if (!show.hotelConfirmed && show.startDate) {
    alerts.push({ icon: AlertCircle, label: 'Hotel not confirmed', status: 'warning' });
  }
  if (show.registrationConfirmed) {
    alerts.push({ icon: CheckCircle, label: 'Registered', status: 'success' });
  }

  return (
    <div className="bg-gradient-to-br from-surface via-surface to-bg-secondary border-b border-border">
      <div className="px-6 py-4">
        {/* Row 1: Title + Status Badge */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <h1 className="text-xl font-bold text-text-primary truncate">
            {show.name || 'Untitled Show'}
          </h1>
          {show.showStatus && (
            <StatusBadge status={show.showStatus} size="sm" />
          )}
        </div>

        {/* Row 2: Meta info + Progress bar + Stats (all inline) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Location & Dates & Booth */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
            {show.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-text-tertiary" />
                {show.location}
              </span>
            )}
            {show.startDate && (
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-text-tertiary" />
                {formatDateRange(show.startDate, show.endDate)}
              </span>
            )}
            {show.boothNumber && (
              <span className="flex items-center gap-1">
                <Hash size={13} className="text-text-tertiary" />
                Booth {show.boothNumber}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-4 bg-border" />

          {/* Days countdown (compact) */}
          {days !== null && days >= 0 && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, 100 - (days / 90) * 100))}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full',
                    days <= 7 ? 'bg-error' : days <= 14 ? 'bg-warning' : 'bg-brand-cyan'
                  )}
                />
              </div>
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                days <= 7 ? 'text-error' : days <= 14 ? 'text-warning' : 'text-text-secondary'
              )}>
                {days === 0 ? 'Today!' : `${days}d`}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="hidden sm:block w-px h-4 bg-border" />

          {/* Quick Stats (inline) */}
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-text-secondary">
              <DollarSign size={13} className="text-text-tertiary" />
              <span className="font-medium text-text-primary">{formatCurrency(estimated)}</span>
            </span>

            {roi !== null && (
              <span className={cn(
                'flex items-center gap-1',
                roi >= 100 ? 'text-success' : roi >= 0 ? 'text-warning' : 'text-error'
              )}>
                <TrendingUp size={13} />
                <span className="font-medium">{roi.toFixed(0)}%</span>
              </span>
            )}

            {show.totalLeads !== null && (
              <span className="flex items-center gap-1 text-text-secondary">
                <Target size={13} className="text-text-tertiary" />
                <span className="font-medium text-text-primary">{show.totalLeads}</span>
              </span>
            )}

            {(show.totalAttending ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-text-secondary">
                <Users size={13} className="text-text-tertiary" />
                <span className="font-medium text-text-primary">{show.totalAttending}</span>
              </span>
            )}
          </div>

          {/* Divider */}
          {alerts.length > 0 && <div className="hidden sm:block w-px h-4 bg-border" />}

          {/* Alert badges (inline) */}
          {alerts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {alerts.map((alert, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    alert.status === 'success' && 'bg-success/10 text-success',
                    alert.status === 'warning' && 'bg-warning/10 text-warning',
                    alert.status === 'error' && 'bg-error/10 text-error',
                  )}
                >
                  <alert.icon size={10} />
                  {alert.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
