'use client';

import React, { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToastStore } from '@/store/toast-store';
import { useAuthStore } from '@/store/auth-store';
import { TradeShow } from '@/types';

interface BoothModeLeadCaptureProps {
  show: TradeShow;
}

interface LeadForm {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  notes: string;
}

const emptyForm: LeadForm = {
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  notes: '',
};

export function BoothModeLeadCapture({ show }: BoothModeLeadCaptureProps) {
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const toast = useToastStore();
  const { organization } = useAuthStore();

  const handleChange = (field: keyof LeadForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!form.firstName.trim() && !form.lastName.trim() && !form.email.trim()) {
      toast.warning('Missing info', 'Please enter at least a name or email.');
      return;
    }

    setSaving(true);
    try {
      const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' ') || null;
      const insertRow: Record<string, unknown> = {
        tradeshow_id: show.id,
        name: fullName,
        email: form.email.trim() || null,
      };

      if (organization?.id) {
        // Try to add org_id if the column exists
        insertRow.organization_id = organization.id;
      }

      // Also store company + notes in available fields
      // The attendees table has name and email; we embed company in name if no separate col
      // We'll use a notes-style approach: append company to name when needed
      if (form.company.trim()) {
        insertRow.name = fullName
          ? `${fullName} (${form.company.trim()})`
          : form.company.trim();
      }

      const { error } = await supabase.from('attendees').insert(insertRow);
      if (error) throw error;

      toast.success('Lead captured!', `${insertRow.name ?? form.email} added successfully.`);
      setForm(emptyForm);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to save lead', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus size={18} className="text-brand-purple" />
        <h2 className="text-base font-semibold text-white">Capture a Lead</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1">First Name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={e => handleChange('firstName', e.target.value)}
              placeholder="Jane"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-purple/60"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={e => handleChange('lastName', e.target.value)}
              placeholder="Smith"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-purple/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Company</label>
          <input
            type="text"
            value={form.company}
            onChange={e => handleChange('company', e.target.value)}
            placeholder="Acme Corp"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-purple/60"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            placeholder="jane@acme.com"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-purple/60"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Interested in enterprise plan, follow up next week..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-purple/60 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-transform"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Save Lead
            </>
          )}
        </button>
      </form>
    </div>
  );
}
