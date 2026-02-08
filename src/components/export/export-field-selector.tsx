'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ExportField } from '@/types/enums';
import { TradeShow } from '@/types';
import { downloadCSV, downloadICS } from '@/services/export-service';
import { useToastStore } from '@/store/toast-store';
import { FileSpreadsheet, CalendarPlus, CheckSquare, XSquare } from 'lucide-react';

interface ExportFieldSelectorProps {
  shows: TradeShow[];
  onClose: () => void;
}

const allFields = Object.values(ExportField);

const fieldGroups: { label: string; fields: ExportField[] }[] = [
  {
    label: 'Basic Info',
    fields: [ExportField.Name, ExportField.Location, ExportField.StartDate, ExportField.EndDate, ExportField.BoothNumber, ExportField.Cost, ExportField.ShowStatus],
  },
  {
    label: 'Registration & Hotel',
    fields: [ExportField.RegistrationConfirmed, ExportField.HotelName, ExportField.HotelConfirmed, ExportField.HotelCostPerNight],
  },
  {
    label: 'Shipping & Logistics',
    fields: [ExportField.ShippingCutoff, ExportField.ShippingCost, ExportField.TrackingNumber, ExportField.ManagementCompany],
  },
  {
    label: 'Contacts',
    fields: [ExportField.ShowContactName, ExportField.ShowContactEmail],
  },
  {
    label: 'Post-Show / ROI',
    fields: [ExportField.TotalLeads, ExportField.TotalAttending, ExportField.QualifiedLeads, ExportField.MeetingsBooked, ExportField.DealsWon, ExportField.RevenueAttributed],
  },
  {
    label: 'Other',
    fields: [ExportField.GeneralNotes],
  },
];

export default function ExportFieldSelector({ shows, onClose }: ExportFieldSelectorProps) {
  const [selectedFields, setSelectedFields] = useState<Set<ExportField>>(new Set(allFields));
  const toast = useToastStore();

  const toggleField = (field: ExportField) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const selectAll = () => setSelectedFields(new Set(allFields));
  const selectNone = () => setSelectedFields(new Set());

  const handleExportCSV = () => {
    if (selectedFields.size === 0) {
      toast.warning('Select at least one field to export');
      return;
    }
    downloadCSV(shows, Array.from(selectedFields));
    toast.success(`Exported ${shows.length} shows to CSV`);
    onClose();
  };

  const handleExportICS = () => {
    downloadICS(shows);
    toast.success(`Exported ${shows.length} shows to Calendar`);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title="Export Shows" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Exporting <strong className="text-text-primary">{shows.length}</strong> show{shows.length !== 1 ? 's' : ''}.
          Select fields to include in the CSV, or export as a calendar file.
        </p>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="flex items-center gap-1 text-xs text-brand-purple hover:text-brand-purple-dark">
            <CheckSquare size={14} /> Select All
          </button>
          <span className="text-border-strong">|</span>
          <button onClick={selectNone} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary">
            <XSquare size={14} /> Select None
          </button>
          <span className="ml-auto text-xs text-text-tertiary">{selectedFields.size}/{allFields.length} selected</span>
        </div>

        {/* Field groups */}
        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1">
          {fieldGroups.map(group => (
            <div key={group.label}>
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{group.label}</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {group.fields.map(field => (
                  <Checkbox
                    key={field}
                    label={field}
                    checked={selectedFields.has(field)}
                    onChange={() => toggleField(field)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={handleExportICS}>
          <CalendarPlus size={14} /> Export Calendar (.ics)
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet size={14} /> Export CSV
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
