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

export function DetailHero({ show, onStatusChange, canEdit }: DetailHeroProps) {
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
      {/* Main hero content */}
      <div className="px-6 py-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Left: Title & Key Info */}
          <div className="space-y-3 min-w-0 flex-1">
            {/* Title row */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-text-primary truncate">
                  {show.name || 'Untitled Show'}
                </h1>
                
                {/* Location & Dates */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-secondary">
                  {show.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-text-tertiary" />
                      {show.location}
                    </span>
                  )}
                  {show.startDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-text-tertiary" />
                      {formatDateRange(show.startDate, show.endDate)}
                    </span>
                  )}
                  {show.boothNumber && (
                    <span className="flex items-center gap-1.5">
                      <Hash size={14} className="text-text-tertiary" />
                      Booth {show.boothNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              {show.showStatus && (
                <div className="shrink-0">
                  <StatusBadge status={show.showStatus} size="lg" />
                </div>
              )}
            </div>

            {/* Days countdown bar */}
            {days !== null && days >= 0 && (
              <div className="max-w-md">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-tertiary">
                    {days === 0 ? 'Today!' : `${days} days away`}
                  </span>
                  {days <= 30 && (
                    <span className={cn(
                      'font-medium',
                      days <= 7 ? 'text-error' : days <= 14 ? 'text-warning' : 'text-brand-cyan'
                    )}>
                      {days <= 7 ? 'Coming up soon!' : days <= 14 ? 'Two weeks out' : 'On track'}
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
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
              </div>
            )}
          </div>

          {/* Right: Quick Stats */}
          <div className="flex flex-wrap gap-3 lg:gap-4">
            {/* Estimated Cost */}
            <div className="bg-bg-tertiary/50 rounded-xl px-4 py-3 min-w-[120px]">
              <div className="flex items-center gap-2 text-text-tertiary text-xs mb-1">
                <DollarSign size={12} />
                <span>Est. Cost</span>
              </div>
              <p className="text-lg font-semibold text-text-primary">
                {formatCurrency(estimated)}
              </p>
            </div>

            {/* ROI (if we have metrics) */}
            {roi !== null && (
              <div className="bg-bg-tertiary/50 rounded-xl px-4 py-3 min-w-[120px]">
                <div className="flex items-center gap-2 text-text-tertiary text-xs mb-1">
                  <TrendingUp size={12} />
                  <span>ROI</span>
                </div>
                <p className={cn(
                  'text-lg font-semibold',
                  roi >= 100 ? 'text-success' : roi >= 0 ? 'text-warning' : 'text-error'
                )}>
                  {roi.toFixed(0)}%
                </p>
              </div>
            )}

            {/* Leads (if tracked) */}
            {show.totalLeads !== null && (
              <div className="bg-bg-tertiary/50 rounded-xl px-4 py-3 min-w-[120px]">
                <div className="flex items-center gap-2 text-text-tertiary text-xs mb-1">
                  <Target size={12} />
                  <span>Leads</span>
                </div>
                <p className="text-lg font-semibold text-text-primary">
                  {show.totalLeads}
                </p>
              </div>
            )}

            {/* Attendees */}
            {(show.totalAttending ?? 0) > 0 && (
              <div className="bg-bg-tertiary/50 rounded-xl px-4 py-3 min-w-[120px]">
                <div className="flex items-center gap-2 text-text-tertiary text-xs mb-1">
                  <Users size={12} />
                  <span>Attending</span>
                </div>
                <p className="text-lg font-semibold text-text-primary">
                  {show.totalAttending}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Alert badges */}
        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {alerts.map((alert, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  alert.status === 'success' && 'bg-success/10 text-success',
                  alert.status === 'warning' && 'bg-warning/10 text-warning',
                  alert.status === 'error' && 'bg-error/10 text-error',
                )}
              >
                <alert.icon size={12} />
                {alert.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
