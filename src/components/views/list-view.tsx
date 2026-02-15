'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFilteredShows } from '@/hooks/use-filtered-shows';
import { useTradeShowStore } from '@/store/trade-show-store';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { SkeletonListItem } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { totalEstimatedCost } from '@/types/computed';
import { SortDirection } from '@/types/enums';
import { SHOW_STATUSES } from '@/lib/constants';
import { TradeShow } from '@/types';
import { List, ArrowUpDown, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompletionBadge } from '@/components/ui/completion-badge';
import * as api from '@/services/supabase-service';

type SortKey = 'name' | 'location' | 'startDate' | 'cost' | 'status';

// Inline edit cell for status
function InlineStatusEdit({ 
  show, 
  onSave 
}: { 
  show: TradeShow;
  onSave: (showId: number, status: string | null) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(show.showStatus ?? '');
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    await onSave(show.id, value || null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(show.showStatus ?? '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        className="hover:ring-2 hover:ring-brand-purple/30 rounded transition-all"
        title="Click to edit"
      >
        <StatusBadge status={show.showStatus} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <select
        ref={selectRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') handleCancel();
        }}
        className="text-xs py-1 px-1.5 rounded border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
      >
        <option value="">None</option>
        {SHOW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={handleSave} className="p-0.5 rounded hover:bg-success/10 text-success">
        <Check size={14} />
      </button>
      <button onClick={handleCancel} className="p-0.5 rounded hover:bg-error/10 text-error">
        <X size={14} />
      </button>
    </div>
  );
}

// Inline edit cell for date
function InlineDateEdit({ 
  show, 
  onSave 
}: { 
  show: TradeShow;
  onSave: (showId: number, date: string | null) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(show.startDate ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    await onSave(show.id, value || null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(show.startDate ?? '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        className="text-sm text-text-secondary hover:text-brand-purple hover:underline transition-colors"
        title="Click to edit"
      >
        {formatDate(show.startDate)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') handleCancel();
        }}
        className="text-xs py-1 px-1.5 rounded border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand-purple/50 w-[120px]"
      />
      <button onClick={handleSave} className="p-0.5 rounded hover:bg-success/10 text-success">
        <Check size={14} />
      </button>
      <button onClick={handleCancel} className="p-0.5 rounded hover:bg-error/10 text-error">
        <X size={14} />
      </button>
    </div>
  );
}

export default function ListView() {
  const shows = useFilteredShows();
  const { selectShow, selectedShowIds, toggleShowSelection, clearSelection, deleteSelectedShows, loadShows, isLoading } = useTradeShowStore();
  const [sortKey, setSortKey] = useState<SortKey>('startDate');
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.Asc);

  const sorted = useMemo(() => {
    const list = [...shows];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'location': cmp = (a.location ?? '').localeCompare(b.location ?? ''); break;
        case 'startDate': cmp = (a.startDate ?? '').localeCompare(b.startDate ?? ''); break;
        case 'cost': cmp = (totalEstimatedCost(a)) - (totalEstimatedCost(b)); break;
        case 'status': cmp = (a.showStatus ?? '').localeCompare(b.showStatus ?? ''); break;
      }
      return sortDir === SortDirection.Asc ? cmp : -cmp;
    });
    return list;
  }, [shows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc);
    } else {
      setSortKey(key);
      setSortDir(SortDirection.Asc);
    }
  };

  const handleInlineStatusSave = async (showId: number, status: string | null) => {
    const show = shows.find(s => s.id === showId);
    if (!show) return;
    await api.updateTradeShow({ ...show, showStatus: status });
    loadShows();
  };

  const handleInlineDateSave = async (showId: number, date: string | null) => {
    const show = shows.find(s => s.id === showId);
    if (!show) return;
    await api.updateTradeShow({ ...show, startDate: date });
    loadShows();
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary">
      {label}
      <ArrowUpDown size={12} className={sortKey === field ? 'text-brand-purple' : 'text-text-tertiary'} />
    </button>
  );

  if (shows.length === 0) {
    return <EmptyState icon={List} title="No shows found" description="Try adjusting your filters or create a new show." />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">List View</h1>
        {selectedShowIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">{selectedShowIds.size} selected</span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
            <Button variant="destructive" size="sm" onClick={deleteSelectedShows}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_100px_90px] sm:grid-cols-[40px_1fr_120px_100px_100px_90px] lg:grid-cols-[40px_1fr_150px_120px_100px_100px_80px_90px] gap-2 px-4 py-3 border-b border-border bg-bg-tertiary">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedShowIds.size === sorted.length && sorted.length > 0}
              onChange={e => {
                if (e.target.checked) sorted.forEach(s => toggleShowSelection(s.id));
                else clearSelection();
              }}
              className="w-4 h-4 rounded border-border text-brand-purple"
            />
          </div>
          <SortHeader label="Name" field="name" />
          <span className="hidden lg:block"><SortHeader label="Location" field="location" /></span>
          <span className="hidden sm:block"><SortHeader label="Start Date" field="startDate" /></span>
          <span className="hidden sm:block"><SortHeader label="Cost" field="cost" /></span>
          <SortHeader label="Status" field="status" />
          <span className="hidden lg:block text-xs font-medium text-text-secondary">Reg.</span>
          <span className="text-xs font-medium text-text-secondary">Progress</span>
        </div>

        {/* Rows */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-4 py-3 border-b border-border-subtle">
              <SkeletonListItem />
            </div>
          ))
        ) : (
          sorted.map(show => (
            <div
              key={show.id}
              className={cn(
                'grid grid-cols-[40px_1fr_100px_90px] sm:grid-cols-[40px_1fr_120px_100px_100px_90px] lg:grid-cols-[40px_1fr_150px_120px_100px_100px_80px_90px] gap-2 px-4 py-3 border-b border-border-subtle hover:bg-bg-tertiary cursor-pointer transition-colors',
                selectedShowIds.has(show.id) && 'bg-brand-purple/5'
              )}
            >
              <div className="flex items-center" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedShowIds.has(show.id)}
                  onChange={() => toggleShowSelection(show.id)}
                  className="w-4 h-4 rounded border-border text-brand-purple"
                />
              </div>
              <button onClick={() => selectShow(show)} className="text-left min-w-0">
                <p className="text-sm font-medium text-text-primary truncate hover:text-brand-purple">{show.name}</p>
                <p className="text-xs text-text-secondary truncate sm:hidden">{show.location}</p>
              </button>
              <span className="hidden lg:block text-sm text-text-secondary truncate self-center">{show.location ?? '-'}</span>
              <div className="hidden sm:block self-center">
                <InlineDateEdit show={show} onSave={handleInlineDateSave} />
              </div>
              <span className="hidden sm:block text-sm text-text-primary self-center">{show.cost ? formatCurrency(show.cost) : '-'}</span>
              <div className="self-center">
                <InlineStatusEdit show={show} onSave={handleInlineStatusSave} />
              </div>
              <span className={cn('hidden lg:block text-xs font-medium self-center', show.registrationConfirmed ? 'text-success' : 'text-warning')}>
                {show.registrationConfirmed ? 'Yes' : 'No'}
              </span>
              <div className="self-center">
                <CompletionBadge show={show} size="sm" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
