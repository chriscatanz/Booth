'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShowKitAssignments, useBoothKits, useKitConflictCheck } from '@/hooks/use-booth-kits';
import { usePermission } from '@/components/auth/permission-gate';
import {
  KitAssignment,
  BoothKit,
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
  KIT_TYPE_LABELS,
  AssignmentStatus,
} from '@/types/booth-kits';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import {
  Box, Plus, X, Truck, Calendar, Package, AlertTriangle,
  ChevronDown, ChevronUp, Check, Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface KitAssignmentSectionProps {
  tradeshowId: number;
  showStartDate?: string | null;
  showEndDate?: string | null;
}

export function KitAssignmentSection({
  tradeshowId,
  showStartDate,
  showEndDate,
}: KitAssignmentSectionProps) {
  const canEdit = usePermission('editor');
  const {
    assignments,
    loading,
    assignKit,
    updateAssignment,
    removeAssignment,
  } = useShowKitAssignments(tradeshowId);
  const { kits } = useBoothKits();
  const { checking, checkAvailability, getConflicts } = useKitConflictCheck();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Get available kits (not already assigned to this show)
  const assignedKitIds = new Set(assignments.map(a => a.kitId));
  const availableKits = kits.filter(k => !assignedKitIds.has(k.id));

  const handleKitSelect = async (kitId: string) => {
    setSelectedKitId(kitId);
    setConflicts([]);

    if (kitId && showStartDate && showEndDate) {
      const conflictList = await getConflicts(kitId, showStartDate, showEndDate);
      if (conflictList.length > 0) {
        setConflicts(
          conflictList.map(
            c => `Conflicts with "${c.tradeshowName}" (${c.startDate} - ${c.endDate})`
          )
        );
      }
    }
  };

  const handleAssignKit = async () => {
    if (!selectedKitId) return;

    setSaving(true);
    try {
      await assignKit(selectedKitId);
      setSelectedKitId('');
      setShowAddForm(false);
      setConflicts([]);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (assignmentId: string, status: AssignmentStatus) => {
    await updateAssignment(assignmentId, { status });
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this kit assignment?')) return;
    await removeAssignment(assignmentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">
            Booth Kits ({assignments.length})
          </span>
        </div>
        {canEdit && availableKits.length > 0 && !showAddForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Assign Kit
          </Button>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-bg-tertiary rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">
                Assign a Kit
              </span>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedKitId('');
                  setConflicts([]);
                }}
                className="p-1 hover:bg-surface rounded"
              >
                <X className="h-4 w-4 text-text-secondary" />
              </button>
            </div>

            <Select
              value={selectedKitId}
              onChange={(e) => handleKitSelect(e.target.value)}
              options={[
                { value: '', label: 'Select a kit...' },
                ...availableKits.map(kit => ({
                  value: kit.id,
                  label: `${kit.name} (${KIT_TYPE_LABELS[kit.kitType]})`,
                })),
              ]}
            />

            {conflicts.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-warning mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Scheduling Conflicts</span>
                </div>
                <ul className="text-xs text-warning space-y-0.5">
                  {conflicts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedKitId('');
                  setConflicts([]);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAssignKit}
                disabled={!selectedKitId || saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Assign Kit'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignments List */}
      {assignments.length === 0 && !showAddForm ? (
        <p className="text-sm text-text-secondary text-center py-4">
          No booth kits assigned to this show
        </p>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              expanded={expandedAssignment === assignment.id}
              onToggleExpand={() =>
                setExpandedAssignment(
                  expandedAssignment === assignment.id ? null : assignment.id
                )
              }
              onStatusChange={(status) => handleStatusChange(assignment.id, status)}
              onRemove={() => handleRemoveAssignment(assignment.id)}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Assignment Card Component ───────────────────────────────────────────────

function AssignmentCard({
  assignment,
  expanded,
  onToggleExpand,
  onStatusChange,
  onRemove,
  canEdit,
}: {
  assignment: KitAssignment;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: AssignmentStatus) => void;
  onRemove: () => void;
  canEdit: boolean;
}) {
  const statusOptions: AssignmentStatus[] = [
    'planned',
    'confirmed',
    'shipped',
    'at_venue',
    'returned',
    'cancelled',
  ];

  return (
    <motion.div
      layout
      className="bg-bg-tertiary rounded-lg border border-border overflow-hidden"
    >
      {/* Header */}
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-3">
          <Package className="h-4 w-4 text-text-secondary" />
          <div>
            <span className="font-medium text-text-primary">
              {assignment.kit?.name || 'Unknown Kit'}
            </span>
            {assignment.kit?.kitType && (
              <span className="text-xs text-text-secondary ml-2">
                ({KIT_TYPE_LABELS[assignment.kit.kitType]})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${ASSIGNMENT_STATUS_COLORS[assignment.status]}20`,
              color: ASSIGNMENT_STATUS_COLORS[assignment.status],
            }}
          >
            {ASSIGNMENT_STATUS_LABELS[assignment.status]}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-secondary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              {/* Status Change */}
              {canEdit && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Update Status
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => onStatusChange(status)}
                        className={cn(
                          'px-2 py-1 text-xs rounded transition-colors',
                          assignment.status === status
                            ? 'bg-brand-primary text-white'
                            : 'bg-surface text-text-secondary hover:bg-bg-tertiary'
                        )}
                      >
                        {ASSIGNMENT_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-text-secondary">Ship Date:</span>
                  <span className="text-text-primary ml-2">
                    {assignment.shipDate
                      ? format(parseISO(assignment.shipDate), 'MMM d, yyyy')
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Return:</span>
                  <span className="text-text-primary ml-2">
                    {assignment.returnArrivalDate
                      ? format(parseISO(assignment.returnArrivalDate), 'MMM d, yyyy')
                      : '—'}
                  </span>
                </div>
                {assignment.outboundTracking && (
                  <div className="col-span-2">
                    <span className="text-text-secondary">Outbound Tracking:</span>
                    <span className="text-text-primary ml-2 font-mono text-xs">
                      {assignment.outboundTracking}
                    </span>
                  </div>
                )}
                {assignment.returnTracking && (
                  <div className="col-span-2">
                    <span className="text-text-secondary">Return Tracking:</span>
                    <span className="text-text-primary ml-2 font-mono text-xs">
                      {assignment.returnTracking}
                    </span>
                  </div>
                )}
              </div>

              {/* AI Info */}
              {assignment.aiRecommended && (
                <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-lg p-2 text-xs">
                  <span className="text-brand-purple font-medium">AI Recommended</span>
                  {assignment.aiRecommendationReason && (
                    <p className="text-brand-purple/80 mt-0.5">
                      {assignment.aiRecommendationReason}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              {assignment.notes && (
                <div>
                  <span className="text-xs text-text-secondary">Notes:</span>
                  <p className="text-sm text-text-primary mt-0.5">{assignment.notes}</p>
                </div>
              )}

              {/* Remove */}
              {canEdit && (
                <div className="pt-2 border-t border-border">
                  <button
                    onClick={onRemove}
                    className="text-xs text-error hover:underline"
                  >
                    Remove Assignment
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
