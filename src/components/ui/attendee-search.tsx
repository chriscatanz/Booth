'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Attendee } from '@/types';

interface AttendeeSearchProps {
  allAttendees: Attendee[];
  onSelect: (attendee: Partial<Attendee>) => void;
  onAddNew: () => void;
  excludeIds?: number[];  // Attendee IDs already on this show
  placeholder?: string;
}

export function AttendeeSearch({ 
  allAttendees, 
  onSelect, 
  onAddNew,
  excludeIds = [],
  placeholder = "Search previous attendees or add new..."
}: AttendeeSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Deduplicate attendees by email (prefer most recent)
  const uniqueAttendees = useMemo(() => {
    const byEmail = new Map<string, Attendee>();
    
    // Sort by dbId desc (newer first), then dedupe by email
    const sorted = [...allAttendees].sort((a, b) => (b.dbId || 0) - (a.dbId || 0));
    
    for (const att of sorted) {
      const key = att.email?.toLowerCase() || att.name?.toLowerCase() || '';
      if (key && !byEmail.has(key)) {
        byEmail.set(key, att);
      }
    }
    
    return Array.from(byEmail.values());
  }, [allAttendees]);

  // Filter attendees based on search
  const filteredAttendees = useMemo(() => {
    if (!search.trim()) return uniqueAttendees.slice(0, 10); // Show recent 10 when no search
    
    const q = search.toLowerCase();
    return uniqueAttendees.filter(att => 
      (att.name?.toLowerCase().includes(q) || att.email?.toLowerCase().includes(q)) &&
      !excludeIds.includes(att.dbId || 0)
    ).slice(0, 15);
  }, [uniqueAttendees, search, excludeIds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (att: Attendee) => {
    // Pass just the reusable fields (not show-specific ones like dates/flights)
    onSelect({
      name: att.name,
      email: att.email,
    });
    setSearch('');
    setIsOpen(false);
  };

  const handleAddNew = () => {
    onAddNew();
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto"
          >
            {/* Add New option - always at top */}
            <button
              onClick={handleAddNew}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary text-left border-b border-border"
            >
              <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center">
                <Plus size={16} className="text-brand-purple" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Add New Attendee</p>
                <p className="text-xs text-text-tertiary">Create a new attendee from scratch</p>
              </div>
            </button>

            {/* Previous attendees */}
            {filteredAttendees.length > 0 && (
              <div className="py-1">
                <p className="px-4 py-1.5 text-xs font-medium text-text-tertiary uppercase">
                  Previous Attendees
                </p>
                {filteredAttendees.map((att) => {
                  const isExcluded = excludeIds.includes(att.dbId || 0);
                  return (
                    <button
                      key={att.dbId || att.email || att.name}
                      onClick={() => !isExcluded && handleSelect(att)}
                      disabled={isExcluded}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left",
                        isExcluded 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:bg-bg-tertiary"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <User size={16} className="text-text-tertiary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {att.name || 'Unnamed'}
                        </p>
                        {att.email && (
                          <p className="text-xs text-text-tertiary truncate">{att.email}</p>
                        )}
                      </div>
                      {isExcluded && (
                        <div className="flex items-center gap-1 text-xs text-text-tertiary">
                          <Check size={12} />
                          Added
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredAttendees.length === 0 && search && (
              <div className="px-4 py-6 text-center text-text-tertiary text-sm">
                No previous attendees match &quot;{search}&quot;
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
