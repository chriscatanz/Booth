'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAutoAssign } from '@/hooks/use-booth-kits';
import {
  AutoAssignSuggestion,
  KIT_TYPE_LABELS,
} from '@/types/booth-kits';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  X, Sparkles, CheckCircle, AlertTriangle, ArrowRight,
  Calendar, Package, Loader2, Check, AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AutoAssignModalProps {
  onClose: () => void;
  onApplied: () => void;
}

export function AutoAssignModal({ onClose, onApplied }: AutoAssignModalProps) {
  const {
    suggestions,
    loading,
    applying,
    error,
    runAutoAssign,
    applyAll,
    applySelected,
    clearSuggestions,
  } = useAutoAssign();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bufferDays, setBufferDays] = useState(7);
  const [hasRun, setHasRun] = useState(false);

  const handleRunAutoAssign = async () => {
    await runAutoAssign({ bufferDays });
    setHasRun(true);
  };

  useEffect(() => {
    if (suggestions?.suggestions) {
      setSelectedIds(new Set(suggestions.suggestions.map(s => s.tradeshowId)));
    }
  }, [suggestions]);

  const toggleSelection = (tradeshowId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(tradeshowId)) {
        next.delete(tradeshowId);
      } else {
        next.add(tradeshowId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!suggestions) return;
    if (selectedIds.size === suggestions.suggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestions.suggestions.map(s => s.tradeshowId)));
    }
  };

  const handleApply = async () => {
    if (!suggestions) return;
    
    const selected = suggestions.suggestions.filter(s => selectedIds.has(s.tradeshowId));
    if (selected.length === 0) return;

    if (selected.length === suggestions.suggestions.length) {
      await applyAll();
    } else {
      await applySelected(selected);
    }
    onApplied();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.5) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Auto-Assign Kits</h2>
              <p className="text-sm text-zinc-400">
                AI-powered kit assignment recommendations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasRun ? (
            // Initial State
            <div className="text-center py-12">
              <div className="p-4 bg-purple-500/10 rounded-full w-fit mx-auto mb-4">
                <Sparkles className="h-12 w-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Smart Kit Assignment
              </h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Analyze your upcoming trade shows and automatically suggest the best kit 
                for each event based on dates, kit availability, and shipping logistics.
              </p>

              {/* Options */}
              <div className="bg-zinc-800/50 rounded-lg p-4 max-w-xs mx-auto mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2 text-left">
                  Buffer Days Between Shows
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={3}
                    max={14}
                    value={bufferDays}
                    onChange={(e) => setBufferDays(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-12">{bufferDays} days</span>
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-left">
                  Minimum gap for shipping + return before next show
                </p>
              </div>

              <Button
                onClick={handleRunAutoAssign}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Run Auto-Assign
                  </>
                )}
              </Button>
            </div>
          ) : loading ? (
            // Loading State
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
                <p className="text-zinc-400">Analyzing schedule and kit availability...</p>
              </div>
            </div>
          ) : error ? (
            // Error State
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={handleRunAutoAssign}>
                Try Again
              </Button>
            </div>
          ) : suggestions ? (
            // Results
            <div className="space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4" />
                  {suggestions.suggestions.length} shows can be assigned
                </div>
                {suggestions.unassignable.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    {suggestions.unassignable.length} shows cannot be assigned
                  </div>
                )}
              </div>

              {/* Warnings */}
              {suggestions.warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <h4 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings
                  </h4>
                  <ul className="space-y-1">
                    {suggestions.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-amber-300">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.suggestions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">Suggested Assignments</h4>
                    <button
                      onClick={toggleAll}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {selectedIds.size === suggestions.suggestions.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {suggestions.suggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.tradeshowId}
                        suggestion={suggestion}
                        selected={selectedIds.has(suggestion.tradeshowId)}
                        onToggle={() => toggleSelection(suggestion.tradeshowId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Unassignable */}
              {suggestions.unassignable.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-3">
                    Cannot Be Assigned
                  </h4>
                  <div className="space-y-2">
                    {suggestions.unassignable.map((item) => (
                      <div
                        key={item.tradeshowId}
                        className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white">{item.tradeshowName}</span>
                          <span className="text-sm text-red-400">{item.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {hasRun && suggestions && suggestions.suggestions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
            <p className="text-sm text-zinc-400">
              {selectedIds.size} of {suggestions.suggestions.length} selected
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  clearSuggestions();
                  setHasRun(false);
                }}
              >
                Start Over
              </Button>
              <Button
                onClick={handleApply}
                disabled={selectedIds.size === 0 || applying}
                className="gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Apply {selectedIds.size} Assignment{selectedIds.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Suggestion Card Component ───────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  selected,
  onToggle,
}: {
  suggestion: AutoAssignSuggestion;
  selected: boolean;
  onToggle: () => void;
}) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400 bg-green-500/10';
    if (confidence >= 0.5) return 'text-yellow-400 bg-yellow-500/10';
    return 'text-orange-400 bg-orange-500/10';
  };

  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
        selected
          ? "bg-blue-500/10 border-blue-500"
          : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600"
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
          selected
            ? "bg-blue-500 border-blue-500"
            : "border-zinc-600"
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>

      {/* Show Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white truncate">
            {suggestion.tradeshowName}
          </span>
          <span className={cn("text-xs px-2 py-0.5 rounded-full", getConfidenceColor(suggestion.confidence))}>
            {Math.round(suggestion.confidence * 100)}% match
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(parseISO(suggestion.startDate), 'MMM d')} – {format(parseISO(suggestion.endDate), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 text-zinc-500 flex-shrink-0" />

      {/* Kit Info */}
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-zinc-400" />
          <span className="font-medium text-white">{suggestion.suggestedKitName}</span>
        </div>
        <p className="text-xs text-zinc-500">
          {KIT_TYPE_LABELS[suggestion.suggestedKitType]}
        </p>
      </div>
    </div>
  );
}
