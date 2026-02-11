'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTradeShowStore } from '@/store/trade-show-store';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions {
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutosave({ debounceMs = 2000, enabled = true }: UseAutosaveOptions = {}) {
  const selectedShow = useTradeShowStore(s => s.selectedShow);
  const attendees = useTradeShowStore(s => s.attendees);
  const saveShow = useTradeShowStore(s => s.saveShow);
  const isSaving = useTradeShowStore(s => s.isSaving);
  
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Track the previous values to detect changes
  const prevShowRef = useRef<string | null>(null);
  const prevAttendeesRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Serialize for comparison (excluding timestamps)
  const serializeShow = useCallback(() => {
    if (!selectedShow) return null;
    const { createdAt, updatedAt, ...rest } = selectedShow;
    void createdAt; void updatedAt; // intentionally unused
    return JSON.stringify(rest);
  }, [selectedShow]);

  const serializeAttendees = useCallback(() => {
    // Exclude localId since it gets regenerated on fetch from DB
    return JSON.stringify(attendees.map(({ localId, ...rest }) => { void localId; return rest; }));
  }, [attendees]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  // Detect changes and trigger autosave
  useEffect(() => {
    if (!enabled || !selectedShow || selectedShow.id === 0) {
      // Don't autosave new shows that haven't been saved yet
      return;
    }

    const currentShow = serializeShow();
    const currentAttendees = serializeAttendees();

    // Initialize refs on first render
    if (prevShowRef.current === null) {
      prevShowRef.current = currentShow;
      prevAttendeesRef.current = currentAttendees;
      return;
    }

    // Check if anything changed
    const showChanged = currentShow !== prevShowRef.current;
    const attendeesChanged = currentAttendees !== prevAttendeesRef.current;

    if (showChanged || attendeesChanged) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new debounced save
      timeoutRef.current = setTimeout(async () => {
        setStatus('saving');
        const success = await saveShow();
        
        if (success) {
          setStatus('saved');
          setHasUnsavedChanges(false);
          prevShowRef.current = serializeShow();
          prevAttendeesRef.current = serializeAttendees();
          
          // Reset to idle after showing "saved" briefly
          savedTimeoutRef.current = setTimeout(() => {
            setStatus('idle');
          }, 2000);
        } else {
          setStatus('error');
        }
      }, debounceMs);
    }
  }, [selectedShow, attendees, enabled, debounceMs, saveShow, serializeShow, serializeAttendees]);

  // Reset when selecting a different show
  useEffect(() => {
    prevShowRef.current = null;
    prevAttendeesRef.current = null;
    setStatus('idle');
    setHasUnsavedChanges(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [selectedShow?.id]);

  // Update status when external save is happening
  useEffect(() => {
    if (isSaving && status !== 'saving') {
      setStatus('saving');
    }
  }, [isSaving, status]);

  return {
    status,
    hasUnsavedChanges,
    isAutosaveEnabled: enabled,
  };
}
