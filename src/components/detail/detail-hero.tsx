'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TradeShow } from '@/types';
import { formatDateRange } from '@/lib/date-utils';
import { daysUntilShow, totalEstimatedCost, roiPercentage } from '@/types/computed';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  MapPin, Calendar, Hash, DollarSign, TrendingUp, 
  Users, Target, CheckCircle, AlertCircle,
  CalendarPlus, Mail, MoreHorizontal, Save, Download, FileStack, Repeat, Copy, Trash2,
  ArrowLeft, Eye, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/auth/permission-gate';
import { CompletionBadge, CompletionProgress } from '@/components/ui/completion-badge';
import { DropdownPortal } from '@/components/ui/dropdown-portal';
import { calculateShowCompleteness } from '@/lib/show-completeness';
import { fetchAssignmentsByShow } from '@/services/booth-kit-service';

interface DetailHeroProps {
  show: TradeShow;
  canEdit?: boolean;
  isNew?: boolean;
  isSaving?: boolean;
  viewMode?: 'read' | 'edit';
  onViewModeChange?: (mode: 'read' | 'edit') => void;
  onBack?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRepeatYearly?: () => void;
  onExportCSV?: () => void;
  onSaveTemplate?: () => void;
  onDownloadICS?: () => void;
  onEmailDetails?: () => void;
  onTabChange?: (tab: string) => void;
}

export function DetailHero({ 
  show, 
  canEdit,
  isNew,
  isSaving,
  viewMode,
  onViewModeChange,
  onBack,
  onSave,
  onDelete,
  onDuplicate,
  onRepeatYearly,
  onExportCSV,
  onSaveTemplate,
  onDownloadICS,
  onEmailDetails,
  onTabChange,
}: DetailHeroProps) {
  const days = daysUntilShow(show);
  const estimated = totalEstimatedCost(show);
  const roi = roiPercentage(show);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);
  const [showSetupChecklist, setShowSetupChecklist] = useState(false);
  const setupButtonRef = useRef<HTMLButtonElement>(null);
  const setupDropdownRef = useRef<HTMLDivElement>(null);

  // Map missing items to their relevant tab
  const MISSING_TAB_MAP: Record<string, string> = {
    'Basic Information': 'overview',
    'Registration Confirmed': 'overview',
    'Booth Details': 'booth',
    'Hotel Booked': 'travel',
    'Booth Kit Assigned': 'booth',
    'Shipping Arranged': 'logistics',
    'Utilities Booked': 'logistics',
    'Labor Arranged': 'logistics',
    'Attendee List Received': 'travel',
    'Lead Capture System': 'logistics',
  };
  const [hasKitAssignment, setHasKitAssignment] = useState(false);
  useEffect(() => {
    if (show.id && show.id > 0) {
      fetchAssignmentsByShow(show.id).then(a => setHasKitAssignment(a.length > 0)).catch(() => {});
    }
  }, [show.id]);

  const completeness = calculateShowCompleteness(show, { hasKitAssignment });

  // Memoize badges to prevent unnecessary re-renders
  const badges = useMemo(() => {
    const result: { icon: React.ElementType; label: string; status: 'success' | 'warning' | 'neutral' }[] = [];
    
    // Registration
    if (show.registrationConfirmed) {
      result.push({ icon: CheckCircle, label: 'Registered', status: 'success' });
    }
    
    // Hotel
    if (show.hotelConfirmed) {
      result.push({ icon: CheckCircle, label: 'Hotel', status: 'success' });
    }
    
    // Utilities
    if (show.utilitiesBooked) {
      result.push({ icon: CheckCircle, label: 'Utilities', status: 'success' });
    }
    
    // Labor
    if (show.laborBooked) {
      result.push({ icon: CheckCircle, label: 'Labor', status: 'success' });
    }
    
    // Shipping/Tracking
    if (show.trackingNumber) {
      result.push({ icon: CheckCircle, label: 'Shipped', status: 'success' });
    }
    
    // Attendee list
    if (show.attendeeListReceived) {
      result.push({ icon: CheckCircle, label: 'Attendee List', status: 'success' });
    }
    
    return result;
  }, [
    show.registrationConfirmed, 
    show.hotelConfirmed, 
    show.utilitiesBooked, 
    show.laborBooked, 
    show.trackingNumber, 
    show.attendeeListReceived
  ]);

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
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-bold text-text-primary truncate">
                {show.name || 'Untitled Show'}
              </h1>
              <CompletionBadge show={show} size="md" showMessage />
            </div>
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
                
                {/* Complete Setup CTA for incomplete shows — hidden on mobile (too crowded) */}
                {completeness.percentage < 100 && (
                  <div className="relative hidden sm:block">
                    <Button
                      ref={setupButtonRef}
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowSetupChecklist(!showSetupChecklist)}
                      title={`${completeness.missing.length} items remaining`}
                    >
                      <CheckCircle size={14} /> Complete Setup
                    </Button>
                    <DropdownPortal
                      isOpen={showSetupChecklist}
                      triggerRef={setupButtonRef}
                      dropdownRef={setupDropdownRef}
                      onClose={() => setShowSetupChecklist(false)}
                      align="right"
                      className="w-80 bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-text-primary">Setup Checklist</p>
                        <p className="text-xs text-text-tertiary mt-0.5">{completeness.percentage}% complete · {completeness.missing.length} remaining</p>
                        <div className="mt-2 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                          <div className="h-full bg-brand-purple rounded-full transition-all" style={{ width: `${completeness.percentage}%` }} />
                        </div>
                      </div>
                      <div className="py-1.5 max-h-72 overflow-y-auto">
                        {completeness.completed.map(item => (
                          <div key={item} className="flex items-center gap-3 px-4 py-2.5">
                            <CheckCircle size={14} className="text-success flex-shrink-0" />
                            <span className="text-sm text-text-tertiary line-through">{item}</span>
                          </div>
                        ))}
                        {completeness.missing.map(item => (
                          <button
                            key={item}
                            onClick={() => {
                              const tab = MISSING_TAB_MAP[item];
                              if (tab && onTabChange) onTabChange(tab);
                              setShowSetupChecklist(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-tertiary text-left group"
                          >
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-border-strong flex-shrink-0 group-hover:border-brand-purple transition-colors" />
                            <span className="text-sm text-text-primary group-hover:text-brand-purple transition-colors">{item}</span>
                          </button>
                        ))}
                      </div>
                    </DropdownPortal>
                  </div>
                )}
                
                {/* More actions dropdown */}
                <div className="relative">
                  <Button
                    ref={actionsButtonRef}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                  >
                    <MoreHorizontal size={14} />
                  </Button>

                  <DropdownPortal
                    isOpen={showActionsMenu}
                    triggerRef={actionsButtonRef}
                    dropdownRef={actionsDropdownRef}
                    onClose={() => setShowActionsMenu(false)}
                    align="right"
                    className="w-48 bg-surface border border-border rounded-lg shadow-lg py-1"
                  >
                      <div>
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
                  </DropdownPortal>
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

        {/* Show completion progress + View/Edit toggle */}
        {!isNew && (completeness.percentage < 100 || onViewModeChange) && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <div className="flex items-center justify-between gap-4">
              {/* Completion progress (left) */}
              {completeness.percentage < 100 ? (
                <div className="flex-1 max-w-md">
                  <CompletionProgress show={show} />
                </div>
              ) : (
                <div />
              )}
              
              {/* View/Edit toggle (right) */}
              {onViewModeChange && (
                canEdit ? (
                  <div className="flex items-center gap-1 p-1 bg-bg-tertiary rounded-lg shrink-0">
                    <button
                      onClick={() => onViewModeChange('read')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                        viewMode === 'read' 
                          ? 'bg-surface text-text-primary shadow-sm' 
                          : 'text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <Eye size={14} />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => onViewModeChange('edit')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                        viewMode === 'edit' 
                          ? 'bg-surface text-text-primary shadow-sm' 
                          : 'text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <Pencil size={14} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-text-tertiary shrink-0">
                    <Eye size={14} />
                    <span>View Only</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
