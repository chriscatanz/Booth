'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Loader2, Check, AlertCircle, 
  Sparkles, X, Calendar, MapPin, DollarSign, 
  Building, Users, Clock, Globe, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useTradeShowStore } from '@/store/trade-show-store';
import { supabase } from '@/lib/supabase';

interface ExtractedShowData {
  name: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  boothNumber: string | null;
  boothSize: string | null;
  cost: number | null;
  eventType: 'in_person' | 'virtual' | 'hybrid' | null;
  managementCompany: string | null;
  venue: string | null;
  attendeesIncluded: number | null;
  earlyBirdDeadline: string | null;
  registrationDeadline: string | null;
  housingDeadline: string | null;
  serviceKitDeadline: string | null;
  shippingDeadline: string | null;
  showContactName: string | null;
  showContactEmail: string | null;
  showContactPhone: string | null;
  showWebsite: string | null;
  shippingInfo: string | null;
  warehouseAddress: string | null;
  notes: string | null;
  confidence: 'high' | 'medium' | 'low';
  extractedFields: string[];
}

interface OneClickShowProps {
  isOpen: boolean;
  onClose: () => void;
  onShowCreated?: (showId: number) => void;
}

type Step = 'upload' | 'extracting' | 'review' | 'creating' | 'success';

export function OneClickShow({ isOpen, onClose, onShowCreated }: OneClickShowProps) {
  const [step, setStep] = useState<Step>('upload');
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedShowData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdShowId, setCreatedShowId] = useState<number | null>(null);

  const organization = useAuthStore((s) => s.organization);
  const createNewShow = useTradeShowStore((s) => s.createNewShow);
  const updateSelectedShow = useTradeShowStore((s) => s.updateSelectedShow);
  const saveShow = useTradeShowStore((s) => s.saveShow);
  const selectedShow = useTradeShowStore((s) => s.selectedShow);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setFileName(file.name);

    // Check if it's a simple text file we can read directly
    const isTextFile = file.type === 'text/plain' || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.md');

    if (isTextFile) {
      const text = await file.text();
      setDocumentText(text);
      return;
    }

    // For PDF, DOCX, DOC, RTF - use server-side parsing
    const supportedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/rtf', 'application/rtf'];
    const supportedExts = ['.pdf', '.doc', '.docx', '.rtf'];
    
    const isSupported = supportedTypes.includes(file.type) || 
                        supportedExts.some(ext => file.name.toLowerCase().endsWith(ext));

    if (isSupported) {
      try {
        const formData = new FormData();
        formData.append('files', file);

        // Get auth token for API request
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/documents/parse', {
          method: 'POST',
          body: formData,
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to parse file');
        }

        const data = await response.json();
        const doc = data.documents?.[0];
        
        if (doc?.error) {
          throw new Error(doc.error);
        }
        
        if (doc?.text) {
          setDocumentText(doc.text);
        } else {
          throw new Error('No text extracted from file');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
      return;
    }

    // Fallback: try to read as text
    try {
      const text = await file.text();
      setDocumentText(text);
    } catch {
      setError('Could not read file. Please paste the content directly.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleExtract = async () => {
    if (!documentText.trim() || !organization?.id) return;

    setStep('extracting');
    setError(null);

    try {
      // Get auth token for API request
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/ai/extract-show', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentText: documentText.trim(),
          orgId: organization.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      setExtractedData(data.data);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract show data');
      setStep('upload');
    }
  };

  const handleCreateShow = async () => {
    if (!extractedData?.name) {
      setError('Show name is required');
      return;
    }

    setStep('creating');
    setError(null);

    try {
      // Create a new empty show
      createNewShow();
      
      // Update it with extracted data - map to actual TradeShow fields
      // Build notes from deadlines that don't have dedicated fields
      const deadlineNotes: string[] = [];
      if (extractedData.earlyBirdDeadline) deadlineNotes.push(`Early Bird Deadline: ${extractedData.earlyBirdDeadline}`);
      if (extractedData.registrationDeadline) deadlineNotes.push(`Registration Deadline: ${extractedData.registrationDeadline}`);
      if (extractedData.housingDeadline) deadlineNotes.push(`Housing Deadline: ${extractedData.housingDeadline}`);
      if (extractedData.serviceKitDeadline) deadlineNotes.push(`Service Kit Deadline: ${extractedData.serviceKitDeadline}`);
      if (extractedData.shippingDeadline) deadlineNotes.push(`Shipping Deadline: ${extractedData.shippingDeadline}`);
      
      const combinedNotes = [
        extractedData.notes,
        deadlineNotes.length > 0 ? `\n\n**Extracted Deadlines:**\n${deadlineNotes.join('\n')}` : '',
        extractedData.warehouseAddress ? `\n\n**Warehouse Address:**\n${extractedData.warehouseAddress}` : '',
        extractedData.showContactPhone ? `\n\n**Show Contact Phone:** ${extractedData.showContactPhone}` : '',
      ].filter(Boolean).join('');

      // Validate eventType - must be one of the allowed values
      const validEventTypes = ['in_person', 'virtual', 'hybrid'];
      const eventType = extractedData.eventType && validEventTypes.includes(extractedData.eventType) 
        ? extractedData.eventType 
        : 'in_person'; // Default to in_person

      // Validate cost is a number
      const cost = typeof extractedData.cost === 'number' ? extractedData.cost : null;

      // Validate attendeesIncluded is a number
      const attendeesIncluded = typeof extractedData.attendeesIncluded === 'number' 
        ? extractedData.attendeesIncluded 
        : null;

      const showData: Record<string, unknown> = {
        name: extractedData.name,
        location: extractedData.location,
        startDate: extractedData.startDate,
        endDate: extractedData.endDate,
        boothNumber: extractedData.boothNumber,
        boothSize: extractedData.boothSize,
        cost,
        eventType,
        managementCompany: extractedData.managementCompany,
        attendeesIncluded,
        eventPortalUrl: extractedData.showWebsite,
        shippingInfo: extractedData.shippingInfo,
        generalNotes: combinedNotes || null,
        // Contact info
        showContactName: extractedData.showContactName,
        showContactEmail: extractedData.showContactEmail,
      };

      // Filter out null values
      const filteredData = Object.fromEntries(
        Object.entries(showData).filter(([, v]) => v !== null && v !== undefined)
      );

      updateSelectedShow(filteredData);
      
      // Save to database
      const saved = await saveShow();
      if (!saved) {
        throw new Error('Failed to save show');
      }

      // Get the ID of the newly created show
      const newShowId = selectedShow?.id || 0;
      setCreatedShowId(newShowId);
      setStep('success');
      onShowCreated?.(newShowId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create show');
      setStep('review');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setDocumentText('');
    setFileName(null);
    setExtractedData(null);
    setError(null);
    setCreatedShowId(null);
    onClose();
  };

  const handleEditField = (field: keyof ExtractedShowData, value: string | number | null) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[85vh] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">One Click Show</h2>
                <p className="text-xs text-text-tertiary">AI-powered show creation</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Upload Step */}
            {step === 'upload' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Upload an exhibitor prospectus, contract, or show information document. 
                  AI will extract all the details and create your show.
                </p>

                {/* Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
                    'border-border hover:border-brand-purple hover:bg-brand-purple/5'
                  )}
                >
                  <Upload size={40} className="mx-auto text-text-tertiary mb-4" />
                  <p className="text-sm text-text-primary mb-2">
                    Drag & drop a file or{' '}
                    <label className="text-brand-purple cursor-pointer hover:underline">
                      browse
                      <input
                        type="file"
                        className="hidden"
                        accept=".txt,.pdf,.doc,.docx,.rtf,.md"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Supports PDF, DOCX, DOC, RTF, TXT, and MD files
                  </p>
                </div>

                {fileName && (
                  <div className="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg">
                    <FileText size={18} className="text-brand-purple" />
                    <span className="text-sm text-text-primary flex-1 truncate">{fileName}</span>
                    <Check size={16} className="text-success" />
                  </div>
                )}

                {/* Or paste text */}
                <div className="relative">
                  <div className="absolute inset-x-0 top-1/2 border-t border-border" />
                  <p className="relative text-center text-xs text-text-tertiary bg-surface px-4 inline-block mx-auto">
                    <span className="bg-surface px-2">or paste document text</span>
                  </p>
                </div>

                <textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="Paste exhibitor prospectus, contract, or show details here..."
                  className={cn(
                    'w-full h-40 p-4 rounded-xl border border-border bg-bg-secondary',
                    'text-sm text-text-primary placeholder:text-text-tertiary',
                    'focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple',
                    'resize-none'
                  )}
                />

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-error/10 rounded-lg text-error text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleExtract}
                  disabled={!documentText.trim()}
                  className="w-full"
                >
                  <Sparkles size={16} className="mr-2" />
                  Extract Show Details
                </Button>
              </div>
            )}

            {/* Extracting Step */}
            {step === 'extracting' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={48} className="text-brand-purple animate-spin mb-4" />
                <p className="text-text-primary font-medium">Analyzing document...</p>
                <p className="text-sm text-text-tertiary mt-1">This may take a few seconds</p>
              </div>
            )}

            {/* Review Step */}
            {step === 'review' && extractedData && (
              <div className="space-y-4">
                {/* Confidence Badge */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    Review extracted information
                  </p>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    extractedData.confidence === 'high' && 'bg-success/10 text-success',
                    extractedData.confidence === 'medium' && 'bg-warning/10 text-warning',
                    extractedData.confidence === 'low' && 'bg-error/10 text-error'
                  )}>
                    {extractedData.confidence} confidence
                  </span>
                </div>

                {/* Extracted Fields */}
                <div className="space-y-3">
                  {/* Show Name */}
                  <FieldRow
                    icon={<Building size={16} />}
                    label="Show Name"
                    value={extractedData.name}
                    onChange={(v) => handleEditField('name', v)}
                    required
                  />

                  {/* Location & Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <FieldRow
                      icon={<MapPin size={16} />}
                      label="Location"
                      value={extractedData.location}
                      onChange={(v) => handleEditField('location', v)}
                    />
                    <FieldRow
                      icon={<Calendar size={16} />}
                      label="Dates"
                      value={extractedData.startDate && extractedData.endDate 
                        ? `${extractedData.startDate} - ${extractedData.endDate}`
                        : extractedData.startDate}
                      onChange={() => {}} // Dates need special handling
                      readonly
                    />
                  </div>

                  {/* Booth & Cost */}
                  <div className="grid grid-cols-2 gap-3">
                    <FieldRow
                      icon={<Building size={16} />}
                      label="Booth"
                      value={[extractedData.boothNumber, extractedData.boothSize].filter(Boolean).join(' • ')}
                      onChange={() => {}}
                      readonly
                    />
                    <FieldRow
                      icon={<DollarSign size={16} />}
                      label="Cost"
                      value={extractedData.cost?.toLocaleString()}
                      onChange={(v) => handleEditField('cost', v ? parseFloat(v.replace(/,/g, '')) : null)}
                    />
                  </div>

                  {/* Company & Attendees */}
                  <div className="grid grid-cols-2 gap-3">
                    <FieldRow
                      icon={<Building size={16} />}
                      label="Management Co."
                      value={extractedData.managementCompany}
                      onChange={(v) => handleEditField('managementCompany', v)}
                    />
                    <FieldRow
                      icon={<Users size={16} />}
                      label="Badges Included"
                      value={extractedData.attendeesIncluded?.toString()}
                      onChange={(v) => handleEditField('attendeesIncluded', v ? parseInt(v) : null)}
                    />
                  </div>

                  {/* Website */}
                  {extractedData.showWebsite && (
                    <FieldRow
                      icon={<Globe size={16} />}
                      label="Website"
                      value={extractedData.showWebsite}
                      onChange={(v) => handleEditField('showWebsite', v)}
                    />
                  )}

                  {/* Deadlines */}
                  {(extractedData.registrationDeadline || extractedData.housingDeadline || extractedData.shippingDeadline) && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-text-tertiary mb-2 flex items-center gap-1">
                        <Clock size={12} /> DEADLINES
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {extractedData.earlyBirdDeadline && (
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">Early Bird:</span>
                            <span className="text-text-primary">{extractedData.earlyBirdDeadline}</span>
                          </div>
                        )}
                        {extractedData.registrationDeadline && (
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">Registration:</span>
                            <span className="text-text-primary">{extractedData.registrationDeadline}</span>
                          </div>
                        )}
                        {extractedData.housingDeadline && (
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">Housing:</span>
                            <span className="text-text-primary">{extractedData.housingDeadline}</span>
                          </div>
                        )}
                        {extractedData.shippingDeadline && (
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">Shipping:</span>
                            <span className="text-text-primary">{extractedData.shippingDeadline}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {extractedData.notes && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-text-tertiary mb-1">Additional Notes</p>
                      <p className="text-sm text-text-secondary">{extractedData.notes}</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-error/10 rounded-lg text-error text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleCreateShow} className="flex-1">
                    Create Show
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Creating Step */}
            {step === 'creating' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={48} className="text-brand-purple animate-spin mb-4" />
                <p className="text-text-primary font-medium">Creating show...</p>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <Check size={32} className="text-success" />
                </div>
                <p className="text-text-primary font-medium mb-1">Show Created!</p>
                <p className="text-sm text-text-secondary mb-6">
                  {extractedData?.name} has been added to your shows.
                </p>
                <Button onClick={handleClose}>
                  Done
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Field Row Component
function FieldRow({ 
  icon, 
  label, 
  value, 
  onChange, 
  required,
  readonly 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  required?: boolean;
  readonly?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    onChange(editValue || null);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg">
      <span className="text-text-tertiary">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-tertiary">{label}{required && '*'}</p>
        {isEditing && !readonly ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full bg-transparent text-sm text-text-primary focus:outline-none"
            autoFocus
          />
        ) : (
          <p 
            className={cn(
              'text-sm truncate',
              value ? 'text-text-primary' : 'text-text-tertiary italic',
              !readonly && 'cursor-pointer hover:text-brand-purple'
            )}
            onClick={() => !readonly && setIsEditing(true)}
          >
            {value || 'Not found'}
          </p>
        )}
      </div>
    </div>
  );
}
