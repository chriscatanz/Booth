'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTradeShowStore } from '@/store/trade-show-store';
import { 
  downloadShowsCSV, 
  downloadAttendeesCSV, 
  downloadAllDataJSON 
} from '@/services/data-export-service';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileJson, Check, Loader2 } from 'lucide-react';

export function DataExport() {
  const { shows, allAttendees } = useTradeShowStore();
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string | null>(null);

  const handleExport = async (type: 'csv' | 'attendees' | 'json') => {
    setExporting(type);
    
    // Small delay for UX
    await new Promise(r => setTimeout(r, 300));

    switch (type) {
      case 'csv':
        downloadShowsCSV(shows);
        break;
      case 'attendees':
        downloadAttendeesCSV(allAttendees);
        break;
      case 'json':
        downloadAllDataJSON(shows, allAttendees);
        break;
    }

    setExporting(null);
    setExported(type);
    setTimeout(() => setExported(null), 2000);
  };

  const ExportButton = ({ 
    type, 
    label, 
    icon: Icon, 
    description 
  }: { 
    type: 'csv' | 'attendees' | 'json'; 
    label: string; 
    icon: React.ElementType; 
    description: string;
  }) => (
    <button
      onClick={() => handleExport(type)}
      disabled={exporting !== null}
      className="flex items-start gap-3 p-4 rounded-lg bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors text-left w-full disabled:opacity-50"
    >
      <div className="p-2 rounded-lg bg-surface">
        {exporting === type ? (
          <Loader2 size={20} className="text-brand-purple animate-spin" />
        ) : exported === type ? (
          <Check size={20} className="text-success" />
        ) : (
          <Icon size={20} className="text-brand-purple" />
        )}
      </div>
      <div>
        <p className="font-medium text-text-primary">{label}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1">Export Your Data</h3>
        <p className="text-xs text-text-secondary mb-4">
          Download your trade show data in various formats. Your data belongs to you.
        </p>
      </div>

      <div className="space-y-2">
        <ExportButton
          type="csv"
          label="Trade Shows (CSV)"
          icon={FileSpreadsheet}
          description={`Export all ${shows.length} shows as a spreadsheet`}
        />

        <ExportButton
          type="attendees"
          label="Attendees (CSV)"
          icon={FileSpreadsheet}
          description={`Export all ${allAttendees.length} attendees as a spreadsheet`}
        />

        <ExportButton
          type="json"
          label="Complete Backup (JSON)"
          icon={FileJson}
          description="Full data export for backup or migration"
        />
      </div>

      <p className="text-xs text-text-tertiary">
        Exports include all data from your organization.
      </p>
    </div>
  );
}
