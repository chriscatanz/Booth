'use client';

import React, { useState, useEffect } from 'react';
import { Users, Mail, Loader2 } from 'lucide-react';
import { fetchAttendees } from '@/services/supabase-service';
import { useToastStore } from '@/store/toast-store';
import { Attendee } from '@/types';

interface BoothModeTeamProps {
  showId: number;
}

export function BoothModeTeam({ showId }: BoothModeTeamProps) {
  const toast = useToastStore();
  const [team, setTeam] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchAttendees(showId);
        setTeam(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load team';
        toast.error('Error', msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  if (team.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <Users size={32} className="text-white/20 mb-3" />
        <p className="text-white/50 text-sm">No team members listed for this show</p>
      </div>
    );
  }

  function getInitials(name: string | null): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  return (
    <div className="p-4 space-y-2">
      {team.map(member => (
        <div
          key={member.localId}
          className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {getInitials(member.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {member.name ?? 'Unknown'}
            </p>
            {member.email && (
              <p className="text-xs text-white/40 truncate mt-0.5">{member.email}</p>
            )}
          </div>
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 transition-colors flex-shrink-0"
              aria-label="Send email"
            >
              <Mail size={16} className="text-white/60" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
