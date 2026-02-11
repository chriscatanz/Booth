'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  BoothKit,
  KitAssignment,
  KitAvailability,
  CreateKitInput,
  UpdateKitInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AutoAssignResult,
  AutoAssignSuggestion,
  KitType,
} from '@/types/booth-kits';
import * as boothKitService from '@/services/booth-kit-service';

// ─── Booth Kits Hook ─────────────────────────────────────────────────────────

export function useBoothKits() {
  const { user, organization } = useAuthStore();
  const [kits, setKits] = useState<BoothKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = organization?.id;

  const loadKits = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await boothKitService.fetchKits(orgId);
      setKits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kits');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  const createKit = async (input: CreateKitInput): Promise<BoothKit> => {
    if (!orgId || !user?.id) throw new Error('Not authenticated');
    const kit = await boothKitService.createKit(orgId, user.id, input);
    setKits((prev) => [...prev, kit]);
    return kit;
  };

  const updateKit = async (kitId: string, input: UpdateKitInput): Promise<BoothKit> => {
    const kit = await boothKitService.updateKit(kitId, input);
    setKits((prev) => prev.map((k) => (k.id === kitId ? kit : k)));
    return kit;
  };

  const deleteKit = async (kitId: string): Promise<void> => {
    await boothKitService.deleteKit(kitId);
    setKits((prev) => prev.filter((k) => k.id !== kitId));
  };

  return {
    kits,
    loading,
    error,
    refresh: loadKits,
    createKit,
    updateKit,
    deleteKit,
  };
}

// ─── Kit Availability Hook ───────────────────────────────────────────────────

export function useKitAvailability() {
  const { organization } = useAuthStore();
  const [availability, setAvailability] = useState<KitAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = organization?.id;

  const loadAvailability = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await boothKitService.fetchKitAvailability(orgId);
      setAvailability(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  return {
    availability,
    loading,
    error,
    refresh: loadAvailability,
  };
}

// ─── Kit Assignments Hook ────────────────────────────────────────────────────

export function useKitAssignments(filters?: {
  kitId?: string;
  tradeshowId?: number;
}) {
  const { user, organization } = useAuthStore();
  const [assignments, setAssignments] = useState<KitAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = organization?.id;

  const loadAssignments = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await boothKitService.fetchAssignments(orgId, filters);
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [orgId, filters]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const createAssignment = async (input: CreateAssignmentInput): Promise<KitAssignment> => {
    if (!orgId || !user?.id) throw new Error('Not authenticated');
    const assignment = await boothKitService.createAssignment(orgId, user.id, input);
    setAssignments((prev) => [assignment, ...prev]);
    return assignment;
  };

  const updateAssignment = async (
    assignmentId: string,
    input: UpdateAssignmentInput
  ): Promise<KitAssignment> => {
    const assignment = await boothKitService.updateAssignment(assignmentId, input);
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? assignment : a))
    );
    return assignment;
  };

  const deleteAssignment = async (assignmentId: string): Promise<void> => {
    await boothKitService.deleteAssignment(assignmentId);
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  return {
    assignments,
    loading,
    error,
    refresh: loadAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}

// ─── Show-Specific Assignments Hook ──────────────────────────────────────────

export function useShowKitAssignments(tradeshowId: number | null) {
  const { user, organization } = useAuthStore();
  const [assignments, setAssignments] = useState<KitAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgId = organization?.id;

  const loadAssignments = useCallback(async () => {
    if (!tradeshowId) {
      setAssignments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await boothKitService.fetchAssignmentsByShow(tradeshowId);
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [tradeshowId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const assignKit = async (kitId: string, options?: Partial<CreateAssignmentInput>): Promise<KitAssignment> => {
    if (!orgId || !user?.id || !tradeshowId) throw new Error('Not authenticated');
    const assignment = await boothKitService.createAssignment(orgId, user.id, {
      kitId,
      tradeshowId,
      ...options,
    });
    setAssignments((prev) => [assignment, ...prev]);
    return assignment;
  };

  const updateAssignment = async (
    assignmentId: string,
    input: UpdateAssignmentInput
  ): Promise<KitAssignment> => {
    const assignment = await boothKitService.updateAssignment(assignmentId, input);
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? assignment : a))
    );
    return assignment;
  };

  const removeAssignment = async (assignmentId: string): Promise<void> => {
    await boothKitService.deleteAssignment(assignmentId);
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  return {
    assignments,
    loading,
    error,
    refresh: loadAssignments,
    assignKit,
    updateAssignment,
    removeAssignment,
  };
}

// ─── Auto-Assignment Hook ────────────────────────────────────────────────────

export function useAutoAssign() {
  const { user, organization } = useAuthStore();
  const [suggestions, setSuggestions] = useState<AutoAssignResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgId = organization?.id;

  const runAutoAssign = async (options?: {
    tradeshowIds?: number[];
    preferredKitTypes?: KitType[];
    bufferDays?: number;
  }): Promise<AutoAssignResult> => {
    if (!orgId) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      const result = await boothKitService.autoAssignKits(orgId, options);
      setSuggestions(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Auto-assign failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const applyAll = async (): Promise<KitAssignment[]> => {
    if (!orgId || !user?.id || !suggestions?.suggestions.length) {
      throw new Error('No suggestions to apply');
    }
    setApplying(true);
    setError(null);
    try {
      const assignments = await boothKitService.applyAutoAssignments(
        orgId,
        user.id,
        suggestions.suggestions
      );
      setSuggestions(null);
      return assignments;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply assignments';
      setError(message);
      throw err;
    } finally {
      setApplying(false);
    }
  };

  const applySelected = async (selectedSuggestions: AutoAssignSuggestion[]): Promise<KitAssignment[]> => {
    if (!orgId || !user?.id || !selectedSuggestions.length) {
      throw new Error('No suggestions to apply');
    }
    setApplying(true);
    setError(null);
    try {
      const assignments = await boothKitService.applyAutoAssignments(
        orgId,
        user.id,
        selectedSuggestions
      );
      // Remove applied suggestions from state
      setSuggestions((prev) =>
        prev
          ? {
              ...prev,
              suggestions: prev.suggestions.filter(
                (s) => !selectedSuggestions.some((sel) => sel.tradeshowId === s.tradeshowId)
              ),
            }
          : null
      );
      return assignments;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply assignments';
      setError(message);
      throw err;
    } finally {
      setApplying(false);
    }
  };

  const clearSuggestions = () => setSuggestions(null);

  return {
    suggestions,
    loading,
    applying,
    error,
    runAutoAssign,
    applyAll,
    applySelected,
    clearSuggestions,
  };
}

// ─── Conflict Check Hook ─────────────────────────────────────────────────────

export function useKitConflictCheck() {
  const [checking, setChecking] = useState(false);

  const checkAvailability = async (
    kitId: string,
    startDate: string,
    endDate: string,
    excludeAssignmentId?: string
  ): Promise<boolean> => {
    setChecking(true);
    try {
      return await boothKitService.checkKitAvailability(
        kitId,
        startDate,
        endDate,
        excludeAssignmentId
      );
    } finally {
      setChecking(false);
    }
  };

  const getConflicts = async (
    kitId: string,
    startDate: string,
    endDate: string,
    bufferDays?: number
  ) => {
    setChecking(true);
    try {
      return await boothKitService.getKitConflicts(kitId, startDate, endDate, bufferDays);
    } finally {
      setChecking(false);
    }
  };

  return {
    checking,
    checkAvailability,
    getConflicts,
  };
}
