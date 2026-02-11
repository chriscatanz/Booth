'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useToastStore } from '@/store/toast-store';
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
import { HotelMap } from '@/components/ui/hotel-map';
import { formatCurrency } from '@/lib/utils';
import { 
  totalEstimatedCost, totalServicesCost, estimatedHotelCost, roiPercentage, 
  costPerLead, costPerQualifiedLead, leadQualificationRate, dealCloseRate, 
  revenuePerDeal, parseJsonStringArray 
} from '@/types/computed';
import { SHOW_STATUSES } from '@/lib/constants';
import { useCustomLists } from '@/hooks/use-custom-lists';
import { DetailHero, DetailTabs, DetailTabPanel, TabSection, type DetailTab } from '@/components/detail';
import {
  Save, Trash2, Copy, Truck, Hotel, Users, Award, Plus, X, Package,
  FileStack, Printer, CalendarPlus, Mail, Repeat, Upload, MoreHorizontal, Download,
} from 'lucide-react';
import { downloadICS, openMailto, downloadCSV } from '@/services/export-service';
import { ExportField } from '@/types/enums';
import { TemplateModal } from '@/components/ui/template-modal';
import { PackingListModal } from '@/components/ui/packing-list-modal';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { ActivityTimeline } from '@/components/ui/activity-timeline';
import { PermissionGate, usePermission } from '@/components/auth/permission-gate';
import { DataVisibilityGate } from '@/components/auth/data-visibility-gate';
import { useDataVisibility } from '@/hooks/use-data-visibility';
import { TaskList } from '@/components/tasks';
import { AttendeeSearch } from '@/components/ui/attendee-search';
import { Attendee } from '@/types';
import { KitAssignmentSection } from '@/components/kits/kit-assignment-section';

export default function DetailView() {
  const {
    selectedShow, updateSelectedShow, setSelectedShow,
    attendees, addAttendee, removeAttendee, updateAttendee,
    allAttendees,
    additionalFiles, refreshAdditionalFiles,
    isSaving, saveShow, deleteShow, duplicateShow, repeatYearly,
    validationErrors,
  } = useTradeShowStore();

  const toast = useToastStore();
  const { status: autosaveStatus, hasUnsavedChanges } = useAutosave({ debounceMs: 2500 });
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPackingList, setShowPackingList] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  const canEdit = usePermission('editor');
  const canDelete = usePermission('admin');
  const { canSeeCategory } = useDataVisibility();
  const { boothOptions, graphicsOptions, packingListOptions, tableclothOptions } = useCustomLists();
  
  // Read-only mode for viewers
  const readOnly = !canEdit;

  if (!selectedShow) return null;

  const show = selectedShow;
  const isNew = show.id === 0;
  const estimated = totalEstimatedCost(show);
  const roi = roiPercentage(show);

  const handleSave = async () => {
    const success = await saveShow();
    if (success) toast.success('Show saved successfully');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this show? This action cannot be undone.')) return;
    await deleteShow();
    toast.success('Show deleted');
  };

  const toggleJsonArrayItem = (field: 'boothToShip' | 'graphicsToShip' | 'packingListItems', item: string) => {
    const current = parseJsonStringArray(show[field]);
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateSelectedShow({ [field]: JSON.stringify(updated) });
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
      {/* Hero Header */}
      <DetailHero show={show} canEdit={canEdit} />

      {/* Action Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          {!isNew && <AutosaveIndicator status={autosaveStatus} hasUnsavedChanges={hasUnsavedChanges} />}
        </div>
        
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              {/* Quick actions - always visible */}
              <Button variant="ghost" size="sm" onClick={() => downloadICS([show])} title="Add to Calendar">
                <CalendarPlus size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openMailto(show)} title="Email Details">
                <Mail size={14} />
              </Button>
              
              {/* More actions dropdown */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                >
                  <MoreHorizontal size={14} />
                </Button>
                
                {showActionsMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 z-20">
                      <button
                        onClick={() => { 
                          downloadCSV([show], Object.values(ExportField), show.name.replace(/[^a-z0-9]/gi, '_')); 
                          setShowActionsMenu(false); 
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                      >
                        <Download size={14} /> Export CSV
                      </button>
                      <button
                        onClick={() => { setShowTemplateModal(true); setShowActionsMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                      >
                        <FileStack size={14} /> Save as Template
                      </button>
                      <button
                        onClick={() => { repeatYearly(); setShowActionsMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                      >
                        <Repeat size={14} /> Repeat Next Year
                      </button>
                      <PermissionGate requires="editor" hideOnly>
                        <button
                          onClick={() => { duplicateShow(); setShowActionsMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center gap-2"
                        >
                          <Copy size={14} /> Duplicate
                        </button>
                      </PermissionGate>
                      <PermissionGate requires="admin" hideOnly>
                        <button
                          onClick={() => { handleDelete(); setShowActionsMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error/10 flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </PermissionGate>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          
          <PermissionGate requires="editor" hideOnly>
            <Button variant="primary" size="md" onClick={handleSave} loading={isSaving}>
              <Save size={14} /> Save
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Validation errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
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

      {/* Tabs */}
      <DetailTabs activeTab={activeTab} onTabChange={setActiveTab} tabCounts={tabCounts} />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* OVERVIEW TAB */}
        <DetailTabPanel id="overview" activeTab={activeTab}>
          <div className="space-y-6">
            {/* Basic Information */}
            <TabSection title="Basic Information">
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
                <Input label="Management Company" value={show.managementCompany ?? ''} onChange={e => updateSelectedShow({ managementCompany: e.target.value || null })} disabled={readOnly} />
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
                  <Input label="Virtual Platform" value={show.virtualPlatform ?? ''} onChange={e => updateSelectedShow({ virtualPlatform: e.target.value || null })} placeholder="e.g., Zoom, Hopin" disabled={readOnly} />
                  <Input label="Platform URL" value={show.virtualPlatformUrl ?? ''} onChange={e => updateSelectedShow({ virtualPlatformUrl: e.target.value || null })} placeholder="https://..." disabled={readOnly} />
                  <Input label="Virtual Booth URL" value={show.virtualBoothUrl ?? ''} onChange={e => updateSelectedShow({ virtualBoothUrl: e.target.value || null })} placeholder="Your booth page URL" className="sm:col-span-2" disabled={readOnly} />
                </div>
              )}
              
              <DataVisibilityGate category="notes">
                <div className="mt-4">
                  <RichTextEditor label="General Notes" value={show.generalNotes} onChange={v => updateSelectedShow({ generalNotes: v || null })} placeholder="Notes about this show..." readOnly={readOnly} />
                </div>
              </DataVisibilityGate>
            </TabSection>

            {/* Booth & Registration */}
            <TabSection title="Booth & Registration">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Booth Number" value={show.boothNumber ?? ''} onChange={e => updateSelectedShow({ boothNumber: e.target.value || null })} disabled={readOnly} />
                <Input label="Booth Size" value={show.boothSize ?? ''} onChange={e => updateSelectedShow({ boothSize: e.target.value || null })} placeholder="e.g., 10x10" disabled={readOnly} />
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

            {/* Event Details & Contacts */}
            <TabSection title="Event Details & Contacts">
              <DataVisibilityGate category="contacts">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Show Contact Name" value={show.showContactName ?? ''} onChange={e => updateSelectedShow({ showContactName: e.target.value || null })} disabled={readOnly} />
                  <Input label="Show Contact Email" value={show.showContactEmail ?? ''} onChange={e => updateSelectedShow({ showContactEmail: e.target.value || null })} disabled={readOnly} />
                  <Input label="Show Agenda URL" value={show.showAgendaUrl ?? ''} onChange={e => updateSelectedShow({ showAgendaUrl: e.target.value || null })} placeholder="https://" disabled={readOnly} />
                  <Input label="Event Portal URL" value={show.eventPortalUrl ?? ''} onChange={e => updateSelectedShow({ eventPortalUrl: e.target.value || null })} placeholder="https://" disabled={readOnly} />
                </div>
              </DataVisibilityGate>
              <DataVisibilityGate category="notes">
                <div className="space-y-4 pt-4">
                  <Toggle label="Has Speaking Engagement" enabled={show.hasSpeakingEngagement ?? false} onChange={v => updateSelectedShow({ hasSpeakingEngagement: v })} disabled={readOnly} />
                  {show.hasSpeakingEngagement && (
                    <Textarea label="Speaking Details" value={show.speakingDetails ?? ''} onChange={e => updateSelectedShow({ speakingDetails: e.target.value || null })} disabled={readOnly} />
                  )}
                  <Textarea label="Sponsorship Details" value={show.sponsorshipDetails ?? ''} onChange={e => updateSelectedShow({ sponsorshipDetails: e.target.value || null })} disabled={readOnly} />
                </div>
              </DataVisibilityGate>
            </TabSection>
          </div>
        </DetailTabPanel>

        {/* LOGISTICS TAB */}
        <DetailTabPanel id="logistics" activeTab={activeTab}>
          <DataVisibilityGate category="logistics" fallback={<div className="p-6 text-center text-text-secondary">You don't have access to logistics information.</div>}>
          <div className="space-y-6">
            {/* Shipping */}
            <TabSection title="Shipping" icon={Truck}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Shipping Info" value={show.shippingInfo ?? ''} onChange={e => updateSelectedShow({ shippingInfo: e.target.value || null })} disabled={readOnly} />
                <Input label="Tracking Number" value={show.trackingNumber ?? ''} onChange={e => updateSelectedShow({ trackingNumber: e.target.value || null })} disabled={readOnly} />
                <DataVisibilityGate category="budget">
                  <Input label="Shipping Cost" type="number" value={show.shippingCost?.toString() ?? ''} onChange={e => updateSelectedShow({ shippingCost: e.target.value ? parseFloat(e.target.value) : null })} disabled={readOnly} />
                </DataVisibilityGate>
                <DatePicker label="Shipping Cutoff" value={show.shippingCutoff} onChange={v => updateSelectedShow({ shippingCutoff: v })} disabled={readOnly} />
              </div>
              <div className="flex gap-6 pt-4">
                <Checkbox label="Ship to Site" checked={show.shipToSite ?? false} onChange={v => updateSelectedShow({ shipToSite: v })} disabled={readOnly} />
                <Checkbox label="Ship to Warehouse" checked={show.shipToWarehouse ?? false} onChange={v => updateSelectedShow({ shipToWarehouse: v })} disabled={readOnly} />
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-text-secondary mb-2">Booth Items to Ship</p>
                <div className="flex flex-wrap gap-3">
                  {boothOptions.map(opt => (
                    <Checkbox key={opt} label={opt} checked={parseJsonStringArray(show.boothToShip).includes(opt)} onChange={() => toggleJsonArrayItem('boothToShip', opt)} disabled={readOnly} />
                  ))}
                </div>
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

            {/* On-Site Services */}
            <TabSection title="On-Site Services" icon={Package}>
              <div className="flex gap-6 mb-4">
                <Checkbox label="Utilities Booked" checked={show.utilitiesBooked ?? false} onChange={v => updateSelectedShow({ utilitiesBooked: v })} disabled={readOnly} />
                <Checkbox label="Labor Booked" checked={show.laborBooked ?? false} onChange={v => updateSelectedShow({ laborBooked: v })} disabled={readOnly} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Utilities Details" value={show.utilitiesDetails ?? ''} onChange={e => updateSelectedShow({ utilitiesDetails: e.target.value || null })} disabled={readOnly} />
                <Input label="Labor Details" value={show.laborDetails ?? ''} onChange={e => updateSelectedShow({ laborDetails: e.target.value || null })} disabled={readOnly} />
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

        {/* TRAVEL TAB */}
        <DetailTabPanel id="travel" activeTab={activeTab}>
          <DataVisibilityGate category="travel" fallback={<div className="p-6 text-center text-text-secondary">You don't have access to travel information.</div>}>
          <div className="space-y-6">
            {/* Attendees */}
            <DataVisibilityGate category="attendees">
              <TabSection title={`Attendees (${attendees.length})`} icon={Users}>
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
                        // Add new attendee pre-filled with selected data
                        addAttendee();
                        // Get the newly added attendee (last one) and update it
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
                <Input label="Hotel Name" value={show.hotelName ?? ''} onChange={e => updateSelectedShow({ hotelName: e.target.value || null })} disabled={readOnly} />
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
                <HotelMap hotelName={show.hotelName} hotelAddress={show.hotelAddress} showLocation={show.location} />
              </div>
            </TabSection>
          </div>
          </DataVisibilityGate>
        </DetailTabPanel>

        {/* BUDGET TAB */}
        <DetailTabPanel id="budget" activeTab={activeTab}>
          <DataVisibilityGate category="budget" fallback={<div className="p-6 text-center text-text-secondary">You don't have access to budget information.</div>}>
          <div className="space-y-6">
            {/* Budget Summary */}
            <TabSection title="Budget Summary">
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

        {/* NOTES & TASKS TAB */}
        <DetailTabPanel id="notes" activeTab={activeTab}>
          <div className="space-y-6">
            {/* Tasks */}
            <DataVisibilityGate category="tasks">
              <TabSection title="Tasks">
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
