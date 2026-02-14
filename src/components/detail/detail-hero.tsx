'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TradeShow } from '@/types';
import { formatDateRange } from '@/lib/date-utils';
import { daysUntilShow, totalEstimatedCost, roiPercentage } from '@/types/computed';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  MapPin, Calendar, Hash, DollarSign, TrendingUp, 
  Users, Target, CheckCircle, AlertCircle,
  CalendarPlus, Mail, MoreHorizontal, Save, Download, FileStack, Repeat, Copy, Trash2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/auth/permission-gate';

interface DetailHeroProps {
  show: TradeShow;
  canEdit?: boolean;
  isNew?: boolean;
  isSaving?: boolean;
  onBack?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRepeatYearly?: () => void;
  onExportCSV?: () => void;
  onSaveTemplate?: () => void;
  onDownloadICS?: () => void;
  onEmailDetails?: () => void;
}

export function DetailHero({ 
  show, 
  canEdit,
  isNew,
  isSaving,
  onBack,
  onSave,
  onDelete,
  onDuplicate,
  onRepeatYearly,
  onExportCSV,
  onSaveTemplate,
  onDownloadICS,
  onEmailDetails,
}: DetailHeroProps) {
  const days = daysUntilShow(show);
  const estimated = totalEstimatedCost(show);
  const roi = roiPercentage(show);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Quick status indicators - show confirmed items as success badges
  const badges: { icon: React.ElementType; label: string; status: 'success' | 'warning' | 'neutral' }[] = [];
  
  // Registration
  if (show.registrationConfirmed) {
    badges.push({ icon: CheckCircle, label: 'Registered', status: 'success' });
  }
  
  // Hotel
  if (show.hotelConfirmed) {
    badges.push({ icon: CheckCircle, label: 'Hotel', status: 'success' });
  }
  
  // Utilities
  if (show.utilitiesBooked) {
    badges.push({ icon: CheckCircle, label: 'Utilities', status: 'success' });
  }
  
  // Labor
  if (show.laborBooked) {
    badges.push({ icon: CheckCircle, label: 'Labor', status: 'success' });
  }
  
  // Shipping/Tracking
  if (show.trackingNumber) {
    badges.push({ icon: CheckCircle, label: 'Shipped', status: 'success' });
  }
  
  // Attendee list
  if (show.attendeeListReceived) {
    badges.push({ icon: CheckCircle, label: 'Attendee List', status: 'success' });
  }

  // Keep alerts for warnings only
  const alerts = badges;

  return (
    <div className="bg-gradient-to-br from-surface via-surface to-bg-secondary border-b border-border">
      <div className="px-6 py-3">
        {/* Row 1: Back + Title + Action Buttons */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors shrink-0"
                title="Back to list"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-xl font-bold text-text-primary truncate">
              {show.name || 'Untitled Show'}
            </h1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {!isNew && (
              <>
                <Button variant="ghost" size="sm" onClick={onDownloadICS} title="Add to Calendar">
                  <CalendarPlus size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={onEmailDetails} title="Email Details">
                  <Mail size={14} />
                </Button>
                
                {/* More actions dropdown */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                  >
                    <MoreHorizontal size={14} />
                  </Button>
                  
                  {showActionsMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 z-20">
                        <button
                          onClick={() => { onExportCSV?.(); setShowActionsMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                        >
                          <Download size={14} /> Export CSV
                        </button>
                        <button
                          onClick={() => { onSaveTemplate?.(); setShowActionsMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                        >
                          <FileStack size={14} /> Save as Template
                        </button>
                        <button
                          onClick={() => { onRepeatYearly?.(); setShowActionsMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                        >
                          <Repeat size={14} /> Repeat Next Year
                        </button>
                        <PermissionGate requires="editor" hideOnly>
                          <button
                            onClick={() => { onDuplicate?.(); setShowActionsMenu(false); }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                          >
                            <Copy size={14} /> Duplicate
                          </button>
                        </PermissionGate>
                        <PermissionGate requires="admin" hideOnly>
                          <button
                            onClick={() => { onDelete?.(); setShowActionsMenu(false); }}
                            className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error/10 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </PermissionGate>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
            
            <PermissionGate requires="editor" hideOnly>
              <Button variant="primary" size="sm" onClick={onSave} loading={isSaving}>
                <Save size={14} /> Save
              </Button>
            </PermissionGate>
          </div>
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
                    alert.status === 'neutral' && 'bg-bg-tertiary text-text-secondary',
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
