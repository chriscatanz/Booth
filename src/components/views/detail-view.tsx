'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeShowStore } from '@/store/trade-show-store';
import * as taskService from '@/services/task-service';
import { Task } from '@/types/tasks';
import { useToastStore } from '@/store/toast-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AutosaveIndicator } from '@/components/ui/autosave-indicator';
import { useAutosave } from '@/hooks/use-autosave';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Toggle } from '@/components/ui/toggle';
import { DatePicker } from '@/components/ui/date-picker';
import { VenueMap } from '@/components/ui/venue-map';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  totalEstimatedCost, totalServicesCost, estimatedHotelCost, roiPercentage, 
  costPerLead, leadQualificationRate, dealCloseRate, 
  parseJsonStringArray 
} from '@/types/computed';
import { SHOW_STATUSES } from '@/lib/constants';
import { useCustomLists } from '@/hooks/use-custom-lists';
import { DetailHero, DetailTabs, DetailTabPanel, TabSection, type DetailTab } from '@/components/detail';
import {
  Truck, Hotel, Users, X, Package,
  Printer, Upload,
  Link, FileUp, Sparkles, Loader2, ExternalLink, FileText,
} from 'lucide-react';
import { downloadICS, openMailto, downloadCSV } from '@/services/export-service';
import { ExportField } from '@/types/enums';
import { TemplateModal } from '@/components/ui/template-modal';
import { PackingListModal } from '@/components/ui/packing-list-modal';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { ActivityTimeline } from '@/components/ui/activity-timeline';
import { PermissionGate, usePermission } from '@/components/auth/permission-gate';
import { DataVisibilityGate } from '@/components/auth/data-visibility-gate';
import { TaskList } from '@/components/tasks';
import { AttendeeSearch } from '@/components/ui/attendee-search';
import { Attendee } from '@/types';
import { KitAssignmentSection } from '@/components/kits/kit-assignment-section';
import { TrackingStatusDisplay } from '@/components/ui/tracking-status';
import { LookupSelect } from '@/components/ui/lookup-select';
import { useLookups } from '@/hooks/use-lookups';
import { supabase } from '@/lib/supabase';
import * as aiService from '@/services/ai-service';
import * as lookupService from '@/services/lookup-service';
import { ShowReadView } from './show-read-view';
import { Eye, Pencil } from 'lucide-react';

export default function DetailView() {
  const {
    selectedShow, setSelectedShow, updateSelectedShow,
    attendees, addAttendee, removeAttendee, updateAttendee,
    allAttendees,
    additionalFiles, refreshAdditionalFiles,
    isSaving, saveShow, deleteShow, duplicateShow, repeatYearly,
    validationErrors,
  } = useTradeShowStore();

  const toast = useToastStore();
  const { organization } = useAuthStore();
  const { status: autosaveStatus, hasUnsavedChanges } = useAutosave({ debounceMs: 5000 });
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPackingList, setShowPackingList] = useState(false);
  
  // Agenda tab state
  const [agendaMode, setAgendaMode] = useState<'manual' | 'url' | 'ai'>('manual');
  const [isExtractingAgenda, setIsExtractingAgenda] = useState(false);
  const [agendaFile, setAgendaFile] = useState<File | null>(null);
  const agendaFileInputRef = useRef<HTMLInputElement>(null);
  
  const canEdit = usePermission('editor');
  const { graphicsOptions, packingListOptions, tableclothOptions } = useCustomLists();
  const { lookups, refreshCategory } = useLookups();
  
  // View mode: 'read' for clean consumption, 'edit' for form editing
  // Everyone defaults to read mode for cleaner consumption; editors can toggle to edit
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read');
  
  // Tasks for read view
  const [showTasks, setShowTasks] = useState<Task[]>([]);
  const [taskCounts, setTaskCounts] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  
  // Read-only mode for viewers
  const readOnly = !canEdit;
  
  // Fetch tasks when show changes
  useEffect(() => {
    if (selectedShow && selectedShow.id > 0) {
      // Fetch counts for badge
      taskService.fetchShowTaskCounts(selectedShow.id)
        .then(setTaskCounts)
        .catch(() => setTaskCounts({ completed: 0, total: 0 }));
      // Fetch actual tasks for read view
      taskService.fetchTasksByShow(selectedShow.id)
        .then(setShowTasks)
        .catch(() => setShowTasks([]));
    }
  }, [selectedShow?.id]);

  if (!selectedShow) return null;

  const show = selectedShow;
  const isNew = show.id === 0;
  const estimated = totalEstimatedCost(show);
  const roi = roiPercentage(show);
  
  // Effective view mode: new shows always edit, viewers always read
  const effectiveViewMode = isNew ? 'edit' : (!canEdit ? 'read' : viewMode);

  const handleSave = async () => {
    const success = await saveShow();
    if (success) toast.success('Show saved successfully');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this show? This action cannot be undone.')) return;
    await deleteShow();
    toast.success('Show deleted');
  };

  const toggleJsonArrayItem = (field: 'graphicsToShip' | 'packingListItems', item: string) => {
    const current = parseJsonStringArray(show[field]);
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateSelectedShow({ [field]: JSON.stringify(updated) });
  };

  // Agenda AI extraction
  const handleAgendaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAgendaFile(file);
  };

  const handleExtractAgenda = async () => {
    if (!agendaFile || !organization?.id) return;
    
    setIsExtractingAgenda(true);
    try {
      // Parse document first
      const formData = new FormData();
      formData.append('files', agendaFile);
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const parseResponse = await fetch('/api/documents/parse', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse document');
      }

      const parseData = await parseResponse.json();
      const documentText = parseData.documents?.[0]?.text || '';
      
      if (!documentText) {
        throw new Error('Could not extract text from document');
      }

      // Now extract agenda using AI
      const prompt = `Extract the event agenda/schedule from this document and format it as clean HTML.

Document:
${documentText}

Requirements:
- Use <h3> for day headers (e.g., "Monday, March 1")
- Use <h4> for session categories or time blocks
- Use <ul> and <li> for lists of sessions, items, or activities
- Use <p> for descriptions or notes
- Use <strong> for times and important info
- Include speakers, locations, and room numbers when available
- Group related sessions logically
- Keep it scannable and well-organized

Return ONLY the HTML content, no markdown, no code fences.`;

      const result = await aiService.generateContent({
        type: 'checklist',
        context: { customPrompt: prompt }
      });

      updateSelectedShow({ agendaContent: result });
      toast.success('Agenda extracted successfully!');
      setAgendaFile(null);
      if (agendaFileInputRef.current) {
        agendaFileInputRef.current.value = '';
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to extract agenda');
    } finally {
      setIsExtractingAgenda(false);
    }
  };

  // Tab counts for badges
  const tabCounts = {
    travel: attendees.length,
    notes: additionalFiles.length,
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-background"
    >
      {/* Hero Header with integrated action buttons */}
      <DetailHero 
        show={show} 
        canEdit={canEdit}
        isNew={isNew}
        isSaving={isSaving}
        onBack={() => setSelectedShow(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        onDuplicate={duplicateShow}
        onRepeatYearly={repeatYearly}
        onExportCSV={() => downloadCSV([show], Object.values(ExportField), show.name.replace(/[^a-z0-9]/gi, '_'))}
        onSaveTemplate={() => setShowTemplateModal(true)}
        onDownloadICS={() => downloadICS([show])}
        onEmailDetails={() => openMailto(show)}
      />

      {/* View Mode Toggle + Autosave indicator */}
      {!isNew && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-border bg-surface">
          {/* View Mode Toggle - only for editors */}
          {canEdit ? (
            <div className="flex items-center gap-1 p-1 bg-bg-tertiary rounded-lg">
              <button
                onClick={() => setViewMode('read')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  effectiveViewMode === 'read' 
                    ? 'bg-surface text-text-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Eye size={14} />
                <span className="hidden sm:inline">View</span>
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  effectiveViewMode === 'edit' 
                    ? 'bg-surface text-text-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Pencil size={14} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
              <Eye size={14} />
              <span>View Only</span>
            </div>
          )}
          
          {/* Autosave indicator */}
          <AutosaveIndicator status={autosaveStatus} hasUnsavedChanges={hasUnsavedChanges} />
        </div>
      )}

      {/* Validation errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && effectiveViewMode === 'edit' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mx-6 mt-3 p-3 rounded-lg bg-error-bg border border-error/20"
          >
            <p className="text-sm font-medium text-error mb-1">Please fix the following:</p>
            <ul className="list-disc list-inside text-xs text-error space-y-0.5">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* READ MODE */}
      {effectiveViewMode === 'read' && (
        <div className="flex-1 overflow-y-auto">
          <ShowReadView 
            show={show}
            attendees={attendees}
            files={additionalFiles}
            tasks={showTasks}
            taskCounts={taskCounts}
            canEdit={canEdit}
            onEdit={() => setViewMode('edit')}
          />
        </div>
      )}

      {/* EDIT MODE - Tabs and Form */}
      {effectiveViewMode === 'edit' && (
        <>
          {/* Tabs */}
          <DetailTabs activeTab={activeTab} onTabChange={setActiveTab} tabCounts={tabCounts} />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ═══════════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <DetailTabPanel id="overview" activeTab={activeTab}>
          <div className="space-y-6">
            {/* Basic Information */}
            <TabSection title="Basic Information" defaultOpen>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Show Name *" value={show.name} onChange={e => updateSelectedShow({ name: e.target.value })} placeholder="Enter show name" disabled={readOnly} />
                <Input label="Location" value={show.location ?? ''} onChange={e => updateSelectedShow({ location: e.target.value || null })} placeholder="City, State" disabled={readOnly} />
                <DatePicker label="Start Date" value={show.startDate} onChange={v => updateSelectedShow({ startDate: v })} disabled={readOnly} />
                <DatePicker label="End Date" value={show.endDate} onChange={v => updateSelectedShow({ endDate: v })} disabled={readOnly} />
                <Select
                  label="Show Status"
                  value={show.showStatus ?? ''}
                  onChange={e => updateSelectedShow({ showStatus: e.target.value || null })}
                  options={SHOW_STATUSES.map(s => ({ value: s, label: s }))}
                  placeholder="Select status"
                  disabled={readOnly}
                />
                <LookupSelect
                  label="Management Company"
                  help="The organization or association running this event (e.g., CUNA, State League)"
                  value={show.managementCompanyId}
                  onChange={v => {
                    const company = lookups.managementCompanies.find(c => c.id === v);
                    updateSelectedShow({ 
                      managementCompanyId: v,
                      managementCompany: company?.name || null 
                    });
                  }}
                  options={lookups.managementCompanies.map(c => ({ id: c.id, name: c.name, subtitle: c.companyType }))}
                  placeholder="Select company..."
                  disabled={readOnly}
                  onCreateNew={async () => {
                    const name = prompt('Enter company name:');
                    if (name && organization?.id) {
                      const newCompany = await lookupService.createManagementCompany(organization.id, { name });
                      await refreshCategory('managementCompanies');
                      updateSelectedShow({ managementCompanyId: newCompany.id, managementCompany: newCompany.name });
                    }
                  }}
                  createLabel="Add new company"
                />
                <Select
                  label="Event Type"
                  value={show.eventType ?? 'in_person'}
                  onChange={e => updateSelectedShow({ eventType: e.target.value as 'in_person' | 'virtual' | 'hybrid' })}
                  options={[
                    { value: 'in_person', label: 'In-Person' },
                    { value: 'virtual', label: 'Virtual' },
                    { value: 'hybrid', label: 'Hybrid' },
                  ]}
                  disabled={readOnly}
                />
              </div>
              
              {(show.eventType === 'virtual' || show.eventType === 'hybrid') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 rounded-lg bg-brand-cyan/5 border border-brand-cyan/20">
                  <LookupSelect
                    label="Virtual Platform"
                    value={show.virtualPlatformId}
                    onChange={v => {
                      const platform = lookups.virtualPlatforms.find(p => p.id === v);
                      updateSelectedShow({ 
                        virtualPlatformId: v,
                        virtualPlatform: platform?.name || null 
                      });
                    }}
                    options={lookups.virtualPlatforms.map(p => ({ id: p.id, name: p.name }))}
                    placeholder="Select platform..."
                    disabled={readOnly}
                    onCreateNew={async () => {
                      const name = prompt('Enter platform name:');
                      if (name && organization?.id) {
                        const newPlatform = await lookupService.createVirtualPlatform(organization.id, { name });
                        await refreshCategory('virtualPlatforms');
                        updateSelectedShow({ virtualPlatformId: newPlatform.id, virtualPlatform: newPlatform.name });
                      }
                    }}
                    createLabel="Add new platform"
                  />
                  <Input label="Platform URL" value={show.virtualPlatformUrl ?? ''} onChange={e => updateSelectedShow({ virtualPlatformUrl: e.target.value || null })} placeholder="https://..." disabled={readOnly} />
                  <Input label="Virtual Booth URL" value={show.virtualBoothUrl ?? ''} onChange={e => updateSelectedShow({ virtualBoothUrl: e.target.value || null })} placeholder="Your booth page URL" className="sm:col-span-2" disabled={readOnly} />
                </div>
              )}
            </TabSection>

            {/* Venue Location */}
            <TabSection title="Venue Location">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LookupSelect
                  label="Venue"
                  value={show.venueId}
                  onChange={v => {
                    const venue = lookups.venues.find(ven => ven.id === v);
                    updateSelectedShow({ 
                      venueId: v,
                      venueName: venue?.name || null,
                      venueAddress: venue ? `${venue.address || ''}, ${venue.city || ''}, ${venue.state || ''}`.replace(/^, |, $/g, '') : null
                    });
                  }}
                  options={lookups.venues.map(v => ({ id: v.id, name: v.name, subtitle: v.city ? `${v.city}, ${v.state}` : undefined }))}
                  placeholder="Select venue..."
                  disabled={readOnly}
                  onCreateNew={async () => {
                    const name = prompt('Enter venue name:');
                    if (name && organization?.id) {
                      const newVenue = await lookupService.createVenue(organization.id, { name });
                      await refreshCategory('venues');
                      updateSelectedShow({ venueId: newVenue.id, venueName: newVenue.name });
                    }
                  }}
                  createLabel="Add new venue"
                />
                <Input label="Venue Address" value={show.venueAddress ?? ''} onChange={e => updateSelectedShow({ venueAddress: e.target.value || null })} placeholder="Full address" disabled={readOnly} />
              </div>
              <VenueMap 
                venueName={show.venueName}
                venueAddress={show.venueAddress}
                hotelName={show.hotelName}
                hotelAddress={show.hotelAddress}
                showLocation={show.location}
              />
              {(show.hotelAddress || show.hotelName) && show.venueAddress && show.venueAddress !== show.hotelAddress && (
                <p className="text-xs text-text-tertiary mt-2">
                  Map shows both venue and hotel locations. Click &quot;Hotel → Venue&quot; for walking/driving directions.
                </p>
              )}
            </TabSection>

            {/* Event Contacts */}
            <DataVisibilityGate category="contacts">
              <TabSection title="Event Contacts">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Show Contact Name" value={show.showContactName ?? ''} onChange={e => updateSelectedShow({ showContactName: e.target.value || null })} disabled={readOnly} />
                  <Input label="Show Contact Email" value={show.showContactEmail ?? ''} onChange={e => updateSelectedShow({ showContactEmail: e.target.value || null })} disabled={readOnly} />
                  <Input label="Event Portal URL" value={show.eventPortalUrl ?? ''} onChange={e => updateSelectedShow({ eventPortalUrl: e.target.value || null })} placeholder="https://" disabled={readOnly} />
                </div>
              </TabSection>
            </DataVisibilityGate>
          </div>
        </DetailTabPanel>

        {/* ═══════════════════════════════════════════════════════════════════
            AGENDA TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <DetailTabPanel id="agenda" activeTab={activeTab}>
          <div className="space-y-6">
            <TabSection title="Event Agenda" defaultOpen>
              {/* Mode selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAgendaMode('manual')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    agendaMode === 'manual' 
                      ? 'bg-brand-purple text-white' 
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                  }`}
                >
                  <FileText size={16} />
                  Manual Entry
                </button>
                <button
                  onClick={() => setAgendaMode('url')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    agendaMode === 'url' 
                      ? 'bg-brand-purple text-white' 
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                  }`}
                >
                  <Link size={16} />
                  Link to URL
                </button>
                <button
                  onClick={() => setAgendaMode('ai')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    agendaMode === 'ai' 
                      ? 'bg-brand-purple text-white' 
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                  }`}
                >
                  <Sparkles size={16} />
                  AI Extract
                </button>
              </div>

              {/* Manual Entry Mode */}
              {agendaMode === 'manual' && (
                <div>
                  <RichTextEditor 
                    label="Agenda Content" 
                    value={show.agendaContent} 
                    onChange={v => updateSelectedShow({ agendaContent: v || null })} 
                    placeholder="Enter the event schedule, sessions, speakers, and times..."
                    readOnly={readOnly}
                  />
                </div>
              )}

              {/* URL Mode */}
              {agendaMode === 'url' && (
                <div className="space-y-4">
                  <Input 
                    label="Agenda URL" 
                    value={show.showAgendaUrl ?? ''} 
                    onChange={e => updateSelectedShow({ showAgendaUrl: e.target.value || null })} 
                    placeholder="https://eventsite.com/agenda"
                    disabled={readOnly}
                  />
                  {show.showAgendaUrl && (
                    <a 
                      href={show.showAgendaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-brand-purple hover:underline"
                    >
                      <ExternalLink size={14} />
                      View Agenda
                    </a>
                  )}
                </div>
              )}

              {/* AI Extract Mode */}
              {agendaMode === 'ai' && (
                <div className="space-y-4">
                  <p className="text-sm text-text-secondary">
                    Upload a document (PDF, DOC, or TXT) containing the event agenda and we&apos;ll extract it using AI.
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <input
                      ref={agendaFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                      onChange={handleAgendaFileSelect}
                      className="hidden"
                      disabled={readOnly}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => agendaFileInputRef.current?.click()}
                      disabled={readOnly}
                    >
                      <FileUp size={14} />
                      {agendaFile ? agendaFile.name : 'Select Document'}
                    </Button>
                    
                    {agendaFile && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handleExtractAgenda}
                        loading={isExtractingAgenda}
                        disabled={readOnly}
                      >
                        {isExtractingAgenda ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Extract Agenda
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Show extracted content */}
                  {show.agendaContent && (
                    <div className="mt-4">
                      <RichTextEditor 
                        label="Extracted Agenda" 
                        value={show.agendaContent} 
                        onChange={v => updateSelectedShow({ agendaContent: v || null })} 
                        placeholder="Extracted agenda will appear here..."
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                </div>
              )}
            </TabSection>

            {/* General Notes (moved from Overview) */}
            <DataVisibilityGate category="notes">
              <TabSection title="General Notes">
                <RichTextEditor 
                  label="" 
                  value={show.generalNotes} 
                  onChange={v => updateSelectedShow({ generalNotes: v || null })} 
                  placeholder="Notes about this show..."
                  readOnly={readOnly}
                />
              </TabSection>
            </DataVisibilityGate>
          </div>
        </DetailTabPanel>

        {/* ═══════════════════════════════════════════════════════════════════
            BOOTH TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <DetailTabPanel id="booth" activeTab={activeTab}>
          <div className="space-y-6">
            {/* Booth Details */}
            <TabSection title="Booth Details" defaultOpen>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Booth Number" value={show.boothNumber ?? ''} onChange={e => updateSelectedShow({ boothNumber: e.target.value || null })} disabled={readOnly} />
                <LookupSelect
                  label="Booth Size"
                  value={show.boothSizeId}
                  onChange={v => {
                    const size = lookups.boothSizes.find(s => s.id === v);
                    updateSelectedShow({ 
                      boothSizeId: v,
                      boothSize: size?.name || null 
                    });
                  }}
                  options={lookups.boothSizes.map(s => ({ id: s.id, name: s.name, subtitle: s.sqFootage ? `${s.sqFootage} sq ft` : undefined }))}
                  placeholder="Select size..."
                  disabled={readOnly}
                  onCreateNew={async () => {
                    const name = prompt('Enter booth size (e.g., 10x10 Inline):');
                    if (name && organization?.id) {
                      const newSize = await lookupService.createBoothSize(organization.id, { name });
                      await refreshCategory('boothSizes');
                      updateSelectedShow({ boothSizeId: newSize.id, boothSize: newSize.name });
                    }
                  }}
                  createLabel="Add new size"
                />
              </div>
            </TabSection>

            {/* Registration */}
            <TabSection title="Registration">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataVisibilityGate category="budget">
                  <Input label="Registration Cost" type="number" value={show.cost?.toString() ?? ''} onChange={e => updateSelectedShow({ cost: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                </DataVisibilityGate>
                <DataVisibilityGate category="attendees">
                  <Input label="Attendees Included" type="number" value={show.attendeesIncluded?.toString() ?? ''} onChange={e => updateSelectedShow({ attendeesIncluded: e.target.value ? parseInt(e.target.value) : null })} disabled={readOnly} />
                </DataVisibilityGate>
              </div>
              <div className="flex gap-6 pt-4">
                <Checkbox label="Registration Confirmed" checked={show.registrationConfirmed ?? false} onChange={v => updateSelectedShow({ registrationConfirmed: v })} disabled={readOnly} />
                <DataVisibilityGate category="attendees">
                  <Checkbox label="Attendee List Received" checked={show.attendeeListReceived ?? false} onChange={v => updateSelectedShow({ attendeeListReceived: v })} disabled={readOnly} />
                </DataVisibilityGate>
              </div>
            </TabSection>

            {/* Speaking & Sponsorship */}
            <DataVisibilityGate category="notes">
              <TabSection title="Speaking & Sponsorship">
                <div className="space-y-4">
                  <Toggle label="Has Speaking Engagement" enabled={show.hasSpeakingEngagement ?? false} onChange={v => updateSelectedShow({ hasSpeakingEngagement: v })} disabled={readOnly} />
                  {show.hasSpeakingEngagement && (
                    <Textarea label="Speaking Details" value={show.speakingDetails ?? ''} onChange={e => updateSelectedShow({ speakingDetails: e.target.value || null })} disabled={readOnly} />
                  )}
                  <Textarea label="Sponsorship Details" value={show.sponsorshipDetails ?? ''} onChange={e => updateSelectedShow({ sponsorshipDetails: e.target.value || null })} disabled={readOnly} />
                </div>
              </TabSection>
            </DataVisibilityGate>
          </div>
        </DetailTabPanel>

        {/* ═══════════════════════════════════════════════════════════════════
            LOGISTICS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <DetailTabPanel id="logistics" activeTab={activeTab}>
          <DataVisibilityGate category="logistics" fallback={<div className="p-6 text-center text-text-secondary">You don&apos;t have access to logistics information.</div>}>
          <div className="space-y-6">
            {/* Shipping */}
            <TabSection title="Shipping" icon={Truck} defaultOpen>
              {/* Outbound Shipping */}
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Outbound</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LookupSelect
                  label="Shipping Carrier"
                  value={show.shippingCarrierId}
                  onChange={v => updateSelectedShow({ shippingCarrierId: v })}
                  options={lookups.shippingCarriers.map(c => ({ id: c.id, name: c.name, subtitle: c.carrierType }))}
                  placeholder="Select carrier..."
                  disabled={readOnly}
                  onCreateNew={async () => {
                    const name = prompt('Enter carrier name:');
                    if (name && organization?.id) {
                      const newCarrier = await lookupService.createShippingCarrier(organization.id, { name });
                      await refreshCategory('shippingCarriers');
                      updateSelectedShow({ shippingCarrierId: newCarrier.id });
                    }
                  }}
                  createLabel="Add new carrier"
                />
                <Input label="Tracking Number" value={show.trackingNumber ?? ''} onChange={e => updateSelectedShow({ trackingNumber: e.target.value || null })} disabled={readOnly} />
                <DataVisibilityGate category="budget">
                  <Input label="Shipping Cost" type="number" value={show.shippingCost?.toString() ?? ''} onChange={e => updateSelectedShow({ shippingCost: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                </DataVisibilityGate>
                <DatePicker label="Shipping Cutoff" value={show.shippingCutoff} onChange={v => updateSelectedShow({ shippingCutoff: v })} disabled={readOnly} />
                <Input label="Shipping Notes" value={show.shippingInfo ?? ''} onChange={e => updateSelectedShow({ shippingInfo: e.target.value || null })} placeholder="Instructions, warehouse address..." className="sm:col-span-2" disabled={readOnly} />
              </div>

              {/* Tracking Status */}
              {show.trackingNumber && (
                <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
                  <TrackingStatusDisplay
                    trackingNumber={show.trackingNumber}
                    status={show.trackingStatus}
                    statusDetails={show.trackingStatusDetails}
                    eta={show.trackingEta}
                    lastUpdated={show.trackingLastUpdated}
                    onStatusUpdate={(result) => {
                      updateSelectedShow({
                        trackingStatus: result.status,
                        trackingStatusDetails: result.statusDetails,
                        trackingEta: result.eta,
                        trackingLastUpdated: result.lastUpdated,
                      });
                    }}
                    disabled={readOnly}
                  />
                </div>
              )}

              {/* Return Shipping */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Return Shipping</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <LookupSelect
                    label="Return Carrier"
                    value={show.returnCarrierId}
                    onChange={v => updateSelectedShow({ returnCarrierId: v })}
                    options={lookups.shippingCarriers.map(c => ({ id: c.id, name: c.name, subtitle: c.carrierType }))}
                    placeholder="Select carrier..."
                    disabled={readOnly}
                    onCreateNew={async () => {
                      const name = prompt('Enter carrier name:');
                      if (name && organization?.id) {
                        const newCarrier = await lookupService.createShippingCarrier(organization.id, { name });
                        await refreshCategory('shippingCarriers');
                        updateSelectedShow({ returnCarrierId: newCarrier.id });
                      }
                    }}
                    createLabel="Add new carrier"
                  />
                  <Input label="Return Tracking Number" value={show.returnTrackingNumber ?? ''} onChange={e => updateSelectedShow({ returnTrackingNumber: e.target.value || null })} disabled={readOnly} />
                  <DataVisibilityGate category="budget">
                    <Input label="Return Shipping Cost" type="number" value={show.returnShippingCost?.toString() ?? ''} onChange={e => updateSelectedShow({ returnShippingCost: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                  </DataVisibilityGate>
                  <DatePicker label="Return Ship Date" value={show.returnShipDate} onChange={v => updateSelectedShow({ returnShipDate: v })} disabled={readOnly} />
                  <DatePicker label="Expected Delivery" value={show.returnDeliveryDate} onChange={v => updateSelectedShow({ returnDeliveryDate: v })} disabled={readOnly} />
                </div>
              </div>

              <div className="flex gap-6 pt-4">
                <Checkbox label="Ship to Site" checked={show.shipToSite ?? false} onChange={v => updateSelectedShow({ shipToSite: v })} disabled={readOnly} />
                <Checkbox label="Ship to Warehouse" checked={show.shipToWarehouse ?? false} onChange={v => updateSelectedShow({ shipToWarehouse: v })} disabled={readOnly} />
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-text-secondary mb-2">Graphics to Ship</p>
                <div className="flex flex-wrap gap-3">
                  {graphicsOptions.map(opt => (
                    <Checkbox key={opt} label={opt} checked={parseJsonStringArray(show.graphicsToShip).includes(opt)} onChange={() => toggleJsonArrayItem('graphicsToShip', opt)} disabled={readOnly} />
                  ))}
                </div>
              </div>

              {/* Kit Assignments */}
              {show.id > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <KitAssignmentSection
                    tradeshowId={show.id}
                    showStartDate={show.startDate}
                    showEndDate={show.endDate}
                  />
                </div>
              )}
            </TabSection>

            {/* Move-in / Move-out */}
            <TabSection title="Move-in / Move-out">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DatePicker label="Move-in Date" value={show.moveInDate} onChange={v => updateSelectedShow({ moveInDate: v })} disabled={readOnly} />
                <Input label="Move-in Time" value={show.moveInTime ?? ''} onChange={e => updateSelectedShow({ moveInTime: e.target.value || null })} placeholder="e.g., 2:00 PM - 4:00 PM" disabled={readOnly} />
                <DatePicker label="Move-out Date" value={show.moveOutDate} onChange={v => updateSelectedShow({ moveOutDate: v })} disabled={readOnly} />
                <Input label="Move-out Time" value={show.moveOutTime ?? ''} onChange={e => updateSelectedShow({ moveOutTime: e.target.value || null })} placeholder="e.g., 12:00 PM - 2:00 PM" disabled={readOnly} />
              </div>
            </TabSection>

            {/* Lead Capture */}
            <TabSection title="Lead Capture">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LookupSelect
                  label="Lead Capture System"
                  value={show.leadCaptureSystemId}
                  onChange={v => {
                    const system = lookups.leadCaptureSystems.find(s => s.id === v);
                    updateSelectedShow({ 
                      leadCaptureSystemId: v,
                      leadCaptureSystem: system?.name || null 
                    });
                  }}
                  options={lookups.leadCaptureSystems.map(s => ({ id: s.id, name: s.name }))}
                  placeholder="Select system..."
                  disabled={readOnly}
                  onCreateNew={async () => {
                    const name = prompt('Enter system name:');
                    if (name && organization?.id) {
                      const newSystem = await lookupService.createLeadCaptureSystem(organization.id, { name });
                      await refreshCategory('leadCaptureSystems');
                      updateSelectedShow({ leadCaptureSystemId: newSystem.id, leadCaptureSystem: newSystem.name });
                    }
                  }}
                  createLabel="Add new system"
                />
                <Input label="Login Credentials" type="password" value={show.leadCaptureCredentials ?? ''} onChange={e => updateSelectedShow({ leadCaptureCredentials: e.target.value || null })} placeholder="Username / Password" disabled={readOnly} />
              </div>
            </TabSection>

            {/* On-Site Services */}
            <TabSection title="On-Site Services" icon={Package}>
              <div className="flex gap-6 mb-4">
                <Checkbox label="Utilities Booked" checked={show.utilitiesBooked ?? false} onChange={v => updateSelectedShow({ utilitiesBooked: v })} disabled={readOnly} />
                <Checkbox label="Labor Booked" checked={show.laborBooked ?? false} onChange={v => updateSelectedShow({ laborBooked: v })} disabled={readOnly} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Utilities Details" value={show.utilitiesDetails ?? ''} onChange={e => updateSelectedShow({ utilitiesDetails: e.target.value || null })} disabled={readOnly} />
                <LookupSelect
                  label="Labor / I&D Company"
                  value={show.laborCompanyId}
                  onChange={v => updateSelectedShow({ laborCompanyId: v })}
                  options={lookups.laborCompanies.map(c => ({ id: c.id, name: c.name, subtitle: c.serviceRegions || undefined }))}
                  placeholder="Select company..."
                  disabled={readOnly}
                  onCreateNew={async () => {
                    const name = prompt('Enter company name:');
                    if (name && organization?.id) {
                      const newCompany = await lookupService.createLaborCompany(organization.id, { name });
                      await refreshCategory('laborCompanies');
                      updateSelectedShow({ laborCompanyId: newCompany.id });
                    }
                  }}
                  createLabel="Add new company"
                />
                <Input label="Labor Details" value={show.laborDetails ?? ''} onChange={e => updateSelectedShow({ laborDetails: e.target.value || null })} className="sm:col-span-2" disabled={readOnly} />
                <DataVisibilityGate category="budget">
                  <Input label="Electrical Cost" type="number" value={show.electricalCost?.toString() ?? ''} onChange={e => updateSelectedShow({ electricalCost: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                </DataVisibilityGate>
                <DataVisibilityGate category="budget">
                  <Input label="Labor Cost" type="number" value={show.laborCost?.toString() ?? ''} onChange={e => updateSelectedShow({ laborCost: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                </DataVisibilityGate>
                <DataVisibilityGate category="budget">
                  <Input label="Internet Cost" type="number" value={show.internetCost?.toString() ?? ''} onChange={e => updateSelectedShow({ internetCost: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                </DataVisibilityGate>
                <DataVisibilityGate category="budget">
                  <Input label="Standard Services Cost" type="number" value={show.standardServicesCost?.toString() ?? ''} onChange={e => updateSelectedShow({ standardServicesCost: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                </DataVisibilityGate>
              </div>
              <DataVisibilityGate category="budget">
                {totalServicesCost(show) > 0 && (
                  <div className="mt-4 p-3 bg-bg-tertiary rounded-lg flex justify-between">
                    <span className="font-medium text-text-secondary">Total Services</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(totalServicesCost(show))}</span>
                  </div>
                )}
              </DataVisibilityGate>
            </TabSection>

            {/* Packing List */}
            <TabSection title="Packing List">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">Standard Items</p>
                <div className="flex flex-wrap gap-3">
                  {packingListOptions.map(opt => (
                    <Checkbox key={opt} label={opt} checked={parseJsonStringArray(show.packingListItems).includes(opt)} onChange={() => toggleJsonArrayItem('packingListItems', opt)} disabled={readOnly} />
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  <Toggle label="Swag Items" enabled={show.swagItemsEnabled ?? false} onChange={v => updateSelectedShow({ swagItemsEnabled: v })} disabled={readOnly} />
                  {show.swagItemsEnabled && <Input label="Swag Description" value={show.swagItemsDescription ?? ''} onChange={e => updateSelectedShow({ swagItemsDescription: e.target.value || null })} disabled={readOnly} />}
                </div>
                <div className="space-y-3">
                  <Toggle label="Giveaway Item" enabled={show.giveawayItemEnabled ?? false} onChange={v => updateSelectedShow({ giveawayItemEnabled: v })} disabled={readOnly} />
                  {show.giveawayItemEnabled && <Input label="Giveaway Description" value={show.giveawayItemDescription ?? ''} onChange={e => updateSelectedShow({ giveawayItemDescription: e.target.value || null })} disabled={readOnly} />}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input label="Power Strip Count" type="number" value={show.powerStripCount?.toString() ?? ''} onChange={e => updateSelectedShow({ powerStripCount: e.target.value ? parseInt(e.target.value) : null })} disabled={readOnly} />
                <Select
                  label="Tablecloth Type"
                  value={show.tableclothType ?? ''}
                  onChange={e => updateSelectedShow({ tableclothType: e.target.value || null })}
                  options={tableclothOptions.map(t => ({ value: t, label: t }))}
                  placeholder="Select type"
                  disabled={readOnly}
                />
              </div>
              
              <Textarea label="Additional Items" value={show.packingListMisc ?? ''} onChange={e => updateSelectedShow({ packingListMisc: e.target.value || null })} placeholder="Other items to pack..." className="mt-4" disabled={readOnly} />
              
              <Button variant="outline" size="sm" onClick={() => setShowPackingList(true)} className="mt-4">
                <Printer size={14} /> Generate Packing List
              </Button>
            </TabSection>
          </div>
          </DataVisibilityGate>
        </DetailTabPanel>

        {/* ═══════════════════════════════════════════════════════════════════
            TRAVEL TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <DetailTabPanel id="travel" activeTab={activeTab}>
          <DataVisibilityGate category="travel" fallback={<div className="p-6 text-center text-text-secondary">You don&apos;t have access to travel information.</div>}>
          <div className="space-y-6">
            {/* Attendees */}
            <DataVisibilityGate category="attendees">
              <TabSection title={`Team Attendees (${attendees.length})`} icon={Users} defaultOpen>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Input label="Total Attending" type="number" value={show.totalAttending?.toString() ?? ''} onChange={e => updateSelectedShow({ totalAttending: e.target.value ? parseInt(e.target.value) : null })} disabled={readOnly} />
                </div>
                
                <div className="space-y-3">
                  {attendees.map((att) => (
                    <motion.div 
                      key={att.localId} 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 items-start p-4 bg-bg-tertiary rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <Input label="Name" value={att.name ?? ''} onChange={e => updateAttendee(att.localId, { name: e.target.value || null })} placeholder="Full name" disabled={readOnly} />
                        <Input label="Email" value={att.email ?? ''} onChange={e => updateAttendee(att.localId, { email: e.target.value || null })} placeholder="email@example.com" disabled={readOnly} />
                        <DataVisibilityGate category="budget">
                          <Input label="Flight Cost" type="number" value={att.flightCost?.toString() ?? ''} onChange={e => updateAttendee(att.localId, { flightCost: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                        </DataVisibilityGate>
                        <DatePicker label="Arrival" value={att.arrivalDate} onChange={v => updateAttendee(att.localId, { arrivalDate: v })} disabled={readOnly} />
                        <DatePicker label="Departure" value={att.departureDate} onChange={v => updateAttendee(att.localId, { departureDate: v })} disabled={readOnly} />
                        <Input label="Flight Confirmation" value={att.flightConfirmation ?? ''} onChange={e => updateAttendee(att.localId, { flightConfirmation: e.target.value || null })} disabled={readOnly} />
                      </div>
                      {!readOnly && (
                        <button onClick={() => removeAttendee(att.localId)} className="p-2 rounded-lg hover:bg-error/10 text-error mt-5">
                          <X size={16} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Searchable attendee selector */}
                {!readOnly && (
                  <div className="mt-4">
                    <AttendeeSearch
                      allAttendees={allAttendees}
                      excludeIds={attendees.map(a => a.dbId).filter((id): id is number => id !== null && id !== undefined)}
                      onSelect={(selected: Partial<Attendee>) => {
                        addAttendee();
                        const newAttendees = useTradeShowStore.getState().attendees;
                        const newAtt = newAttendees[newAttendees.length - 1];
                        if (newAtt) {
                          updateAttendee(newAtt.localId, {
                            name: selected.name || null,
                            email: selected.email || null,
                          });
                        }
                      }}
                      onAddNew={addAttendee}
                    />
                  </div>
                )}
              </TabSection>
            </DataVisibilityGate>

            {/* Hotel */}
            <TabSection title="Hotel" icon={Hotel}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LookupSelect
                  label="Hotel"
                  value={show.hotelId}
                  onChange={v => {
                    const hotel = lookups.hotels.find(h => h.id === v);
                    updateSelectedShow({ 
                      hotelId: v,
                      hotelName: hotel?.name || null,
                      hotelAddress: hotel ? `${hotel.address || ''}, ${hotel.city || ''}, ${hotel.state || ''}`.replace(/^, |, $/g, '') : null,
                      hotelCostPerNight: hotel?.corporateRate || show.hotelCostPerNight
                    });
                  }}
                  options={lookups.hotels.map(h => ({ id: h.id, name: h.name, subtitle: h.city ? `${h.city}, ${h.state}` : h.brand || undefined }))}
                  placeholder="Select hotel..."
                  disabled={readOnly}
                  onCreateNew={async () => {
                    const name = prompt('Enter hotel name:');
                    if (name && organization?.id) {
                      const newHotel = await lookupService.createHotel(organization.id, { name });
                      await refreshCategory('hotels');
                      updateSelectedShow({ hotelId: newHotel.id, hotelName: newHotel.name });
                    }
                  }}
                  createLabel="Add new hotel"
                />
                <Input label="Hotel Address" value={show.hotelAddress ?? ''} onChange={e => updateSelectedShow({ hotelAddress: e.target.value || null })} disabled={readOnly} />
                <DataVisibilityGate category="budget">
                  <Input label="Cost Per Night" type="number" value={show.hotelCostPerNight?.toString() ?? ''} onChange={e => updateSelectedShow({ hotelCostPerNight: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                </DataVisibilityGate>
                <Input label="Confirmation Number" value={show.hotelConfirmationNumber ?? ''} onChange={e => updateSelectedShow({ hotelConfirmationNumber: e.target.value || null })} disabled={readOnly} />
              </div>
              <div className="pt-4">
                <Checkbox label="Hotel Confirmed" checked={show.hotelConfirmed ?? false} onChange={v => updateSelectedShow({ hotelConfirmed: v })} disabled={readOnly} />
              </div>
              <DataVisibilityGate category="budget">
                {estimatedHotelCost(show) > 0 && (
                  <p className="text-sm text-text-secondary mt-3">Estimated Hotel Cost: {formatCurrency(estimatedHotelCost(show))}</p>
                )}
              </DataVisibilityGate>
              <div className="mt-4">
                <VenueMap hotelName={show.hotelName} hotelAddress={show.hotelAddress} showLocation={show.location} />
              </div>
            </TabSection>
          </div>
          </DataVisibilityGate>
        </DetailTabPanel>

        {/* ═══════════════════════════════════════════════════════════════════
            BUDGET TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <DetailTabPanel id="budget" activeTab={activeTab}>
          <DataVisibilityGate category="budget" fallback={<div className="p-6 text-center text-text-secondary">You don&apos;t have access to budget information.</div>}>
          <div className="space-y-6">
            {/* Budget Summary */}
            <TabSection title="Budget Summary" defaultOpen>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <span className="text-xs text-text-tertiary">Registration</span>
                  <p className="text-lg font-semibold text-text-primary mt-1">{formatCurrency(show.cost ?? 0)}</p>
                </div>
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <span className="text-xs text-text-tertiary">Shipping</span>
                  <p className="text-lg font-semibold text-text-primary mt-1">{formatCurrency(show.shippingCost ?? 0)}</p>
                </div>
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <span className="text-xs text-text-tertiary">Services</span>
                  <p className="text-lg font-semibold text-text-primary mt-1">{formatCurrency(totalServicesCost(show))}</p>
                </div>
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <span className="text-xs text-text-tertiary">Hotel (Est.)</span>
                  <p className="text-lg font-semibold text-text-primary mt-1">{formatCurrency(estimatedHotelCost(show))}</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-brand-purple/10 rounded-xl flex justify-between items-center">
                <span className="font-semibold text-text-primary">Estimated Total</span>
                <span className="text-2xl font-bold text-brand-purple">{formatCurrency(estimated)}</span>
              </div>
            </TabSection>

            {/* Post-Show ROI */}
            <DataVisibilityGate category="leads">
              <TabSection title="Post-Show ROI">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Total Leads" type="number" value={show.totalLeads?.toString() ?? ''} onChange={e => updateSelectedShow({ totalLeads: e.target.value ? parseInt(e.target.value) : null })} disabled={readOnly} />
                  <Input label="Qualified Leads" type="number" value={show.qualifiedLeads?.toString() ?? ''} onChange={e => updateSelectedShow({ qualifiedLeads: e.target.value ? parseInt(e.target.value) : null })} disabled={readOnly} />
                  <Input label="Meetings Booked" type="number" value={show.meetingsBooked?.toString() ?? ''} onChange={e => updateSelectedShow({ meetingsBooked: e.target.value ? parseInt(e.target.value) : null })} disabled={readOnly} />
                  <Input label="Deals Won" type="number" value={show.dealsWon?.toString() ?? ''} onChange={e => updateSelectedShow({ dealsWon: e.target.value ? parseInt(e.target.value) : null })} disabled={readOnly} />
                  <Input label="Revenue Attributed" type="number" value={show.revenueAttributed?.toString() ?? ''} onChange={e => updateSelectedShow({ revenueAttributed: e.target.value ? parseFloat(e.target.value) : null })} className="sm:col-span-2" disabled={readOnly} />
                </div>
                
                {(show.totalLeads || show.revenueAttributed) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {costPerLead(show) !== null && (
                      <div className="p-3 bg-bg-tertiary rounded-lg">
                        <span className="text-xs text-text-tertiary">Cost per Lead</span>
                        <p className="text-sm font-semibold text-error mt-1">{formatCurrency(costPerLead(show)!)}</p>
                      </div>
                    )}
                    {leadQualificationRate(show) !== null && (
                      <div className="p-3 bg-bg-tertiary rounded-lg">
                        <span className="text-xs text-text-tertiary">Qualification Rate</span>
                        <p className="text-sm font-semibold text-text-primary mt-1">{leadQualificationRate(show)!.toFixed(1)}%</p>
                      </div>
                    )}
                    {dealCloseRate(show) !== null && (
                      <div className="p-3 bg-bg-tertiary rounded-lg">
                        <span className="text-xs text-text-tertiary">Deal Close Rate</span>
                        <p className="text-sm font-semibold text-success mt-1">{dealCloseRate(show)!.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                )}
                
                {roi !== null && (
                  <div className={`p-4 rounded-xl mt-4 ${roi >= 0 ? 'bg-success/10' : 'bg-error/10'}`}>
                    <span className={`text-2xl font-bold ${roi >= 0 ? 'text-success' : 'text-error'}`}>
                      ROI: {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                    </span>
                  </div>
                )}
                
                <DataVisibilityGate category="notes">
                  <div className="mt-4">
                    <RichTextEditor label="Post-Show Notes" value={show.postShowNotes} onChange={v => updateSelectedShow({ postShowNotes: v || null })} placeholder="Takeaways, lessons learned..." readOnly={readOnly} />
                  </div>
                </DataVisibilityGate>
              </TabSection>
            </DataVisibilityGate>
          </div>
          </DataVisibilityGate>
        </DetailTabPanel>

        {/* ═══════════════════════════════════════════════════════════════════
            NOTES & TASKS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <DetailTabPanel id="notes" activeTab={activeTab}>
          <div className="space-y-6">
            {/* Tasks */}
            <DataVisibilityGate category="tasks">
              <TabSection title="Tasks" defaultOpen>
                <TaskList tradeShowId={show.id} readOnly={readOnly} />
              </TabSection>
            </DataVisibilityGate>

            {/* Documents */}
            <DataVisibilityGate category="documents">
              <TabSection title={`Documents${additionalFiles.length > 0 ? ` (${additionalFiles.length})` : ''}`} icon={Upload}>
                <FileUploadZone
                  tradeshowId={show.id}
                  files={additionalFiles}
                  onFilesChange={refreshAdditionalFiles}
                  disabled={isNew || readOnly}
                />
                {isNew && (
                  <p className="text-xs text-text-tertiary mt-2">Save the show first to upload files</p>
                )}
              </TabSection>
            </DataVisibilityGate>

            {/* Activity Timeline */}
            <DataVisibilityGate category="notes">
              <TabSection title="Activity & Notes">
                <ActivityTimeline tradeshowId={show.id} readOnly={readOnly} />
              </TabSection>
            </DataVisibilityGate>
          </div>
        </DetailTabPanel>
      </div>
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showTemplateModal && (
          <TemplateModal
            mode="save"
            onClose={() => setShowTemplateModal(false)}
            onSaved={() => toast.success('Template saved!')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPackingList && (
          <PackingListModal
            show={show}
            attendees={attendees}
            onClose={() => setShowPackingList(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
