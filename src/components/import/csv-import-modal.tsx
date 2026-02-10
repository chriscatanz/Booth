'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useToastStore } from '@/store/toast-store';
import { createTradeShow, saveAttendees } from '@/services/supabase-service';
import { TradeShow, Attendee } from '@/types';
import {
  parseCSV,
  autoDetectMappings,
  generatePreview,
  ColumnMapping,
  ImportPreview,
  MAPPABLE_SHOW_FIELDS,
  MAPPABLE_ATTENDEE_FIELDS,
} from '@/services/data-import-service';
import {
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  AlertTriangle,
  Check,
  X,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';

interface CSVImportModalProps {
  onClose: () => void;
  onImported?: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function CSVImportModal({ onClose, onImported }: CSVImportModalProps) {
  const { shows, loadShows } = useTradeShowStore();
  const toast = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ shows: number; attendees: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);

      if (parsed.headers.length === 0) {
        toast.error('CSV file is empty or invalid');
        return;
      }

      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMappings(autoDetectMappings(parsed.headers));
      setStep('mapping');
    };
    reader.readAsText(file);
  }, [toast]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Update mapping for a column
  const updateMapping = (index: number, targetField: string | null, fieldType: 'show' | 'attendee' | 'skip') => {
    setMappings(prev => {
      const next = [...prev];
      next[index] = { ...next[index], targetField, fieldType };
      return next;
    });
  };

  // Generate preview
  const handleGeneratePreview = () => {
    const preview = generatePreview({ headers, rows }, mappings);
    setPreview(preview);
    setStep('preview');
  };

  // Execute import
  const handleImport = async () => {
    if (!preview) return;

    setStep('importing');
    setImportProgress(0);

    const total = preview.shows.length + (preview.attendees.length > 0 ? 1 : 0); // Attendees batched per show
    let completed = 0;
    let showsImported = 0;
    let attendeesImported = 0;
    const showIdMap: Record<number, number> = {}; // Maps preview index to actual show ID

    try {
      // Import shows
      for (let i = 0; i < preview.shows.length; i++) {
        const showData = preview.shows[i];
        
        // Check for existing show with same name
        const existingShow = shows.find(s => s.name === showData.name);
        if (existingShow) {
          showIdMap[i] = existingShow.id;
          // Skip creating, but still allow attendees to be added
        } else {
          // Build full TradeShow object with defaults
          const newShowData: TradeShow = {
            id: 0, // Will be assigned by DB
            name: showData.name || 'Unnamed Show',
            location: showData.location || null,
            startDate: showData.startDate || null,
            endDate: showData.endDate || null,
            boothNumber: showData.boothNumber || null,
            boothSize: showData.boothSize || null,
            cost: showData.cost || null,
            attendeesIncluded: null,
            totalAttending: showData.totalAttending || null,
            totalLeads: showData.totalLeads || null,
            managementCompany: showData.managementCompany || null,
            eventType: showData.eventType || null,
            virtualPlatform: null,
            virtualPlatformUrl: null,
            virtualBoothUrl: null,
            registrationConfirmed: showData.registrationConfirmed || false,
            attendeeListReceived: false,
            shippingInfo: null,
            trackingNumber: showData.trackingNumber || null,
            shippingCost: showData.shippingCost || null,
            shipToSite: null,
            shipToWarehouse: null,
            shippingCutoff: showData.shippingCutoff || null,
            shippingLabelPath: null,
            boothToShip: null,
            graphicsToShip: null,
            utilitiesBooked: false,
            utilitiesDetails: null,
            laborBooked: false,
            laborDetails: null,
            electricalCost: showData.electricalCost || null,
            laborCost: showData.laborCost || null,
            internetCost: showData.internetCost || null,
            standardServicesCost: showData.standardServicesCost || null,
            hasSpeakingEngagement: false,
            speakingDetails: null,
            sponsorshipDetails: null,
            hotelName: showData.hotelName || null,
            hotelAddress: null,
            hotelConfirmed: showData.hotelConfirmed || false,
            hotelCostPerNight: showData.hotelCostPerNight || null,
            hotelConfirmationNumber: null,
            hotelConfirmationPath: null,
            showAgendaUrl: null,
            showAgendaPdfPath: null,
            eventPortalUrl: null,
            hasEventApp: false,
            eventAppNotes: null,
            showContactName: showData.showContactName || null,
            showContactEmail: showData.showContactEmail || null,
            packingListItems: null,
            swagItemsEnabled: false,
            swagItemsDescription: null,
            giveawayItemEnabled: false,
            giveawayItemDescription: null,
            powerStripCount: null,
            tableclothType: null,
            packingListMisc: null,
            vendorPacketPath: null,
            generalNotes: showData.generalNotes || null,
            showStatus: showData.showStatus || 'Planning',
            qualifiedLeads: showData.qualifiedLeads || null,
            meetingsBooked: showData.meetingsBooked || null,
            dealsWon: showData.dealsWon || null,
            revenueAttributed: showData.revenueAttributed || null,
            postShowNotes: null,
            isTemplate: false,
            organizationId: null,
            createdBy: null,
            createdAt: null,
            updatedAt: null,
          };

          const createdShow = await createTradeShow(newShowData);
          showIdMap[i] = createdShow.id;
          showsImported++;
        }
        
        completed++;
        setImportProgress(Math.round((completed / total) * 100));
      }

      // Import attendees - group by show
      const attendeesByShow: Record<number, Partial<Attendee>[]> = {};
      for (const { showIndex, attendee } of preview.attendees) {
        const showId = showIdMap[showIndex];
        if (showId && (attendee.name || attendee.email)) {
          if (!attendeesByShow[showId]) attendeesByShow[showId] = [];
          attendeesByShow[showId].push(attendee);
        }
      }

      // Save attendees per show
      for (const [showIdStr, atts] of Object.entries(attendeesByShow)) {
        const showId = parseInt(showIdStr);
        const attendeeRecords: Attendee[] = atts.map(att => ({
          dbId: null,
          tradeshowId: showId,
          name: att.name || null,
          email: att.email || null,
          arrivalDate: att.arrivalDate || null,
          departureDate: att.departureDate || null,
          flightCost: att.flightCost || null,
          flightConfirmation: att.flightConfirmation || null,
          localId: crypto.randomUUID(),
        }));
        await saveAttendees(attendeeRecords, showId);
        attendeesImported += attendeeRecords.length;
      }

      // Reload shows to reflect new data
      await loadShows();

      setImportResult({ shows: showsImported, attendees: attendeesImported });
      setStep('complete');
      toast.success(`Imported ${showsImported} shows${attendeesImported > 0 ? ` and ${attendeesImported} attendees` : ''}`);
      onImported?.();
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStep('preview');
    }
  };

  // Get mapped field count
  const mappedShowFields = mappings.filter(m => m.fieldType === 'show' && m.targetField).length;
  const mappedAttendeeFields = mappings.filter(m => m.fieldType === 'attendee' && m.targetField).length;

  return (
    <Dialog open onClose={onClose} title="Import Shows from CSV" size="xl">
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-text-secondary">
                Upload a CSV file with your trade show data. Column headers will be auto-mapped.
              </p>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-brand-purple bg-brand-purple/5'
                    : 'border-border hover:border-brand-purple/50 hover:bg-bg-tertiary'
                  }
                `}
              >
                <Upload size={40} className={`mx-auto mb-3 ${isDragging ? 'text-brand-purple' : 'text-text-tertiary'}`} />
                <p className="text-sm font-medium text-text-primary mb-1">
                  Drop CSV file here or click to browse
                </p>
                <p className="text-xs text-text-tertiary">
                  Supports standard CSV format with headers
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              <div className="bg-bg-tertiary rounded-lg p-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">Expected Format</h4>
                <p className="text-xs text-text-secondary mb-2">
                  First row should contain column headers. We&apos;ll auto-detect common fields like:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Name', 'Location', 'Start Date', 'End Date', 'Booth Number', 'Cost', 'Hotel', 'Status'].map(field => (
                    <span key={field} className="px-2 py-0.5 bg-surface rounded text-xs text-text-secondary">
                      {field}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  Attendee columns (Attendee Name, Attendee Email, etc.) will also be detected.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">
                    <FileSpreadsheet size={14} className="inline mr-1" />
                    <strong className="text-text-primary">{fileName}</strong> — {rows.length} rows
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {mappedShowFields} show fields mapped
                    {mappedAttendeeFields > 0 && `, ${mappedAttendeeFields} attendee fields`}
                  </p>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-bg-tertiary px-3 py-2 border-b border-border">
                  <div className="grid grid-cols-3 gap-4 text-xs font-medium text-text-secondary">
                    <span>CSV Column</span>
                    <span>Maps To</span>
                    <span>Sample Data</span>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                  {mappings.map((mapping, index) => (
                    <div key={index} className="px-3 py-2 grid grid-cols-3 gap-4 items-center hover:bg-bg-tertiary/50">
                      <span className="text-sm text-text-primary truncate" title={mapping.csvColumn}>
                        {mapping.csvColumn}
                      </span>
                      <select
                        value={mapping.targetField ? `${mapping.fieldType}:${mapping.targetField}` : 'skip'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'skip') {
                            updateMapping(index, null, 'skip');
                          } else {
                            const [type, field] = val.split(':');
                            updateMapping(index, field, type as 'show' | 'attendee');
                          }
                        }}
                        className="text-sm bg-surface border border-border rounded px-2 py-1 text-text-primary"
                      >
                        <option value="skip">— Skip —</option>
                        <optgroup label="Show Fields">
                          {MAPPABLE_SHOW_FIELDS.map(f => (
                            <option key={f.value} value={`show:${f.value}`}>{f.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Attendee Fields">
                          {MAPPABLE_ATTENDEE_FIELDS.map(f => (
                            <option key={f.value} value={`attendee:${f.value}`}>{f.label}</option>
                          ))}
                        </optgroup>
                      </select>
                      <span className="text-xs text-text-tertiary truncate" title={rows[0]?.[index]}>
                        {rows[0]?.[index] || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                  <ChevronLeft size={14} /> Back
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGeneratePreview}
                  disabled={mappedShowFields === 0}
                >
                  Preview Import <ChevronRight size={14} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && preview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-tertiary rounded-lg p-4 flex items-center gap-3">
                  <div className="p-2 bg-brand-purple/10 rounded-lg">
                    <MapPin size={20} className="text-brand-purple" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{preview.shows.length}</p>
                    <p className="text-xs text-text-secondary">Shows to import</p>
                  </div>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{preview.attendees.length}</p>
                    <p className="text-xs text-text-secondary">Attendees to add</p>
                  </div>
                </div>
              </div>

              {/* Warnings & Errors */}
              {(preview.errors.length > 0 || preview.warnings.length > 0) && (
                <div className="space-y-2">
                  {preview.errors.map((err, i) => (
                    <div key={`err-${i}`} className="flex items-start gap-2 text-sm text-error bg-error/10 rounded-lg px-3 py-2">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      {err}
                    </div>
                  ))}
                  {preview.warnings.map((warn, i) => (
                    <div key={`warn-${i}`} className="flex items-start gap-2 text-sm text-warning bg-warning/10 rounded-lg px-3 py-2">
                      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                      {warn}
                    </div>
                  ))}
                </div>
              )}

              {/* Shows Preview */}
              {preview.shows.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-bg-tertiary px-3 py-2 border-b border-border">
                    <span className="text-xs font-medium text-text-secondary">Shows Preview (first 5)</span>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
                    {preview.shows.slice(0, 5).map((show, i) => (
                      <div key={i} className="px-3 py-2 flex items-center justify-between hover:bg-bg-tertiary/50">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{show.name}</p>
                          <p className="text-xs text-text-tertiary">
                            {show.location || 'No location'}
                            {show.startDate && ` • ${show.startDate}`}
                          </p>
                        </div>
                        {shows.find(s => s.name === show.name) && (
                          <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded">
                            Exists
                          </span>
                        )}
                      </div>
                    ))}
                    {preview.shows.length > 5 && (
                      <div className="px-3 py-2 text-xs text-text-tertiary text-center">
                        + {preview.shows.length - 5} more shows
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep('mapping')}>
                  <ChevronLeft size={14} /> Back
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleImport}
                  disabled={preview.shows.length === 0 || preview.errors.length > 0}
                >
                  <Check size={14} /> Import {preview.shows.length} Shows
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 size={40} className="text-brand-purple animate-spin mb-4" />
              <p className="text-lg font-medium text-text-primary mb-2">Importing...</p>
              <div className="w-48 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-purple transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-text-tertiary mt-2">{importProgress}%</p>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && importResult && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="p-4 bg-success/10 rounded-full mb-4">
                <Check size={40} className="text-success" />
              </div>
              <p className="text-lg font-medium text-text-primary mb-2">Import Complete!</p>
              <p className="text-sm text-text-secondary mb-6">
                Successfully imported {importResult.shows} show{importResult.shows !== 1 ? 's' : ''}
                {importResult.attendees > 0 && ` and ${importResult.attendees} attendee${importResult.attendees !== 1 ? 's' : ''}`}
              </p>
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Dialog>
  );
}
