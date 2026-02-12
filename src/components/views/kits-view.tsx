'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useBoothKits, 
  useKitAvailability, 
  useKitAssignments,
} from '@/hooks/use-booth-kits';
import { useAuthStore } from '@/store/auth-store';
import {
  BoothKit,
  KitAssignment,
  KitAvailability,
  CreateKitInput,
  KIT_TYPE_LABELS,
  KIT_STATUS_LABELS,
  KIT_STATUS_COLORS,
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
} from '@/types/booth-kits';
import type { KitType } from '@/types/booth-kits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Plus, Package, Box, Search, Truck, Calendar,
  Edit, Trash2, X, Sparkles,
  CheckCircle, MapPin
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { KitModal } from '@/components/kits/kit-modal';
import { AutoAssignModal } from '@/components/kits/auto-assign-modal';

export default function KitsView() {
  const { isEditor } = useAuthStore();
  const { kits, loading: kitsLoading, createKit, updateKit, deleteKit, refresh: refreshKits } = useBoothKits();
  const { availability, loading: availLoading, refresh: refreshAvailability } = useKitAvailability();
  const { assignments, refresh: refreshAssignments } = useKitAssignments();
  
  // Refresh all kit data
  const refreshAll = async () => {
    await Promise.all([refreshKits(), refreshAvailability(), refreshAssignments()]);
  };
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<KitType | 'all'>('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKit, setEditingKit] = useState<BoothKit | null>(null);
  const [selectedKit, setSelectedKit] = useState<KitAvailability | null>(null);
  const [showAutoAssign, setShowAutoAssign] = useState(false);

  const loading = kitsLoading || availLoading;

  // Filter kits
  const filteredKits = availability.filter(kit => {
    if (filterType !== 'all' && kit.kitType !== filterType) return false;
    if (searchText && !kit.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // Get kit's upcoming assignments
  const getKitAssignments = (kitId: string) => {
    return assignments
      .filter(a => a.kitId === kitId && a.status !== 'returned' && a.status !== 'cancelled')
      .sort((a, b) => {
        const dateA = a.tradeshow?.startDate || '';
        const dateB = b.tradeshow?.startDate || '';
        return dateA.localeCompare(dateB);
      });
  };

  const handleKitCreated = async (input: CreateKitInput) => {
    await createKit(input);
    setShowCreateModal(false);
    await refreshAll();
  };

  const handleKitUpdated = async (kitId: string, input: Partial<CreateKitInput>) => {
    await updateKit(kitId, input);
    setEditingKit(null);
    await refreshAll();
  };

  const handleDeleteKit = async (kitId: string) => {
    if (!confirm('Delete this kit? This will also remove all assignments.')) return;
    await deleteKit(kitId);
    setSelectedKit(null);
    await refreshAll();
  };

  if (loading && !availability.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full max-w-[1600px] mx-auto w-full">
      {/* Main List */}
      <div className={cn(
        "flex-1 p-6 overflow-y-auto",
        selectedKit && "border-r border-border"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Booth Kits</h1>
            <p className="text-text-secondary text-sm mt-1">
              Manage your booth inventory and track assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAutoAssign(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Auto-Assign
            </Button>
            {isEditor && (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Kit
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Search kits..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1 bg-bg-tertiary rounded-lg p-1">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                filterType === 'all' 
                  ? "bg-surface text-text-primary shadow-sm" 
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              All
            </button>
            {Object.entries(KIT_TYPE_LABELS).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setFilterType(type as KitType)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  filterType === type 
                    ? "bg-surface text-text-primary shadow-sm" 
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Available</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {availability.filter(k => k.status === 'available').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Calendar className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Assigned</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {availability.filter(k => k.status === 'assigned').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Truck className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">In Transit</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {availability.filter(k => k.status === 'in_transit').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-purple/10 rounded-lg">
                <MapPin className="h-5 w-5 text-brand-purple" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">At Shows</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {availability.filter(k => k.status === 'at_show').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kits Grid */}
        {filteredKits.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-lg border border-border">
            <Package className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary mb-2">No booth kits found</p>
            {isEditor && (
              <Button variant="outline" onClick={() => setShowCreateModal(true)} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Kit
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredKits.map((kit) => (
                <motion.div
                  key={kit.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "bg-surface rounded-lg border border-border p-4 cursor-pointer hover:border-brand-primary/50 transition-colors",
                    selectedKit?.id === kit.id && "border-brand-primary ring-1 ring-brand-primary"
                  )}
                  onClick={() => setSelectedKit(kit)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-bg-tertiary rounded-lg">
                        <Box className="h-5 w-5 text-text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary">{kit.name}</h3>
                        <p className="text-sm text-text-tertiary">
                          {KIT_TYPE_LABELS[kit.kitType]}
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${KIT_STATUS_COLORS[kit.status]}20`,
                        color: KIT_STATUS_COLORS[kit.status],
                      }}
                    >
                      {KIT_STATUS_LABELS[kit.status]}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{kit.currentLocation || 'Unknown'}</span>
                  </div>

                  {/* Next Assignment */}
                  {kit.nextAssignmentShowName ? (
                    <div className="bg-bg-tertiary rounded-lg p-3">
                      <p className="text-xs text-text-tertiary mb-1">Next Assignment</p>
                      <p className="text-sm text-text-primary font-medium truncate">
                        {kit.nextAssignmentShowName}
                      </p>
                      {kit.nextAssignmentDate && (
                        <p className="text-xs text-text-secondary mt-1">
                          {format(parseISO(kit.nextAssignmentDate), 'MMM d, yyyy')}
                          <span className="text-text-tertiary ml-1">
                            ({differenceInDays(parseISO(kit.nextAssignmentDate), new Date())} days)
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-bg-tertiary rounded-lg p-3">
                      <p className="text-sm text-text-tertiary">No upcoming assignments</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedKit && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-background overflow-hidden flex flex-col border-l border-border"
          >
            <KitDetailPanel
              kit={selectedKit}
              assignments={getKitAssignments(selectedKit.id)}
              fullKit={kits.find(k => k.id === selectedKit.id)}
              onClose={() => setSelectedKit(null)}
              onEdit={(kit) => {
                const fullKit = kits.find(k => k.id === kit.id);
                if (fullKit) setEditingKit(fullKit);
              }}
              onDelete={() => handleDeleteKit(selectedKit.id)}
              isEditor={isEditor}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showCreateModal && (
        <KitModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleKitCreated}
        />
      )}

      {editingKit && (
        <KitModal
          kit={editingKit}
          onClose={() => setEditingKit(null)}
          onSave={(input) => handleKitUpdated(editingKit.id, input)}
        />
      )}

      {showAutoAssign && (
        <AutoAssignModal
          onClose={() => setShowAutoAssign(false)}
          onApplied={async () => {
            setShowAutoAssign(false);
            await refreshAll();
          }}
        />
      )}
    </div>
  );
}

// ─── Detail Panel Component ──────────────────────────────────────────────────

function KitDetailPanel({
  kit,
  assignments,
  fullKit,
  onClose,
  onEdit,
  onDelete,
  isEditor,
}: {
  kit: KitAvailability;
  assignments: KitAssignment[];
  fullKit?: BoothKit;
  onClose: () => void;
  onEdit: (kit: KitAvailability) => void;
  onDelete: () => void;
  isEditor: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary">{kit.name}</h2>
        <div className="flex items-center gap-2">
          {isEditor && (
            <>
              <button
                onClick={() => onEdit(kit)}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4 text-text-secondary" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 text-error" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status */}
        <div>
          <span
            className="px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${KIT_STATUS_COLORS[kit.status]}20`,
              color: KIT_STATUS_COLORS[kit.status],
            }}
          >
            {KIT_STATUS_LABELS[kit.status]}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Type</span>
            <span className="text-text-primary">{KIT_TYPE_LABELS[kit.kitType]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Current Location</span>
            <span className="text-text-primary">{kit.currentLocation || 'Unknown'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Ship Time</span>
            <span className="text-text-primary">{kit.defaultShipDays} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Return Time</span>
            <span className="text-text-primary">{kit.defaultReturnDays} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Available From</span>
            <span className="text-text-primary">
              {format(parseISO(kit.availableFrom), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Description */}
        {fullKit?.description && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Description</h3>
            <p className="text-sm text-text-primary">{fullKit.description}</p>
          </div>
        )}

        {/* Contents */}
        {fullKit?.contents && fullKit.contents.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Contents</h3>
            <ul className="space-y-1">
              {fullKit.contents.map((item, idx) => (
                <li key={idx} className="flex justify-between text-sm">
                  <span className="text-text-primary">{item.item}</span>
                  <span className="text-text-secondary">×{item.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Assignments */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Upcoming Assignments ({assignments.length})
          </h3>
          {assignments.length === 0 ? (
            <p className="text-sm text-text-tertiary">No upcoming assignments</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-bg-tertiary rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {assignment.tradeshow?.name || 'Unknown Show'}
                    </p>
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: `${ASSIGNMENT_STATUS_COLORS[assignment.status]}20`,
                        color: ASSIGNMENT_STATUS_COLORS[assignment.status],
                      }}
                    >
                      {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                    </span>
                  </div>
                  {assignment.tradeshow?.startDate && (
                    <p className="text-xs text-text-secondary">
                      {format(parseISO(assignment.tradeshow.startDate), 'MMM d')}
                      {assignment.tradeshow.endDate && (
                        <> – {format(parseISO(assignment.tradeshow.endDate), 'MMM d, yyyy')}</>
                      )}
                    </p>
                  )}
                  {assignment.tradeshow?.location && (
                    <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {assignment.tradeshow.location}
                    </p>
                  )}
                  {assignment.aiRecommended && (
                    <p className="text-xs text-brand-purple mt-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI Assigned
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {fullKit?.notes && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Notes</h3>
            <p className="text-sm text-text-primary">{fullKit.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
