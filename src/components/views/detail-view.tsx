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
import { FormSection } from '@/components/ui/form-section';
import { StatusBadge } from '@/components/ui/badge';
import { HotelMap } from '@/components/ui/hotel-map';
import { formatCurrency } from '@/lib/utils';
import { totalEstimatedCost, totalServicesCost, estimatedHotelCost, roiPercentage, costPerLead, costPerQualifiedLead, leadQualificationRate, dealCloseRate, revenuePerDeal, parseJsonStringArray } from '@/types/computed';
import { BOOTH_OPTIONS, GRAPHICS_OPTIONS, PACKING_LIST_OPTIONS, TABLECLOTH_OPTIONS, SHOW_STATUSES } from '@/lib/constants';
import {
  ArrowLeft, Save, Trash2, Copy, Info, Truck, Hotel,
  Users, Award, FileText, BarChart3, Plus, X, Package,
  Ticket, DollarSign, FileStack, Printer, CalendarPlus, Mail,
  Repeat, Upload, Clock,
} from 'lucide-react';
import { downloadICS, openMailto } from '@/services/export-service';
import { TemplateModal } from '@/components/ui/template-modal';
import { PackingListModal } from '@/components/ui/packing-list-modal';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { ActivityTimeline } from '@/components/ui/activity-timeline';
import { PermissionGate, usePermission } from '@/components/auth/permission-gate';

export default function DetailView() {
  const {
    selectedShow, updateSelectedShow, setSelectedShow,
    attendees, addAttendee, removeAttendee, updateAttendee,
    additionalFiles, refreshAdditionalFiles,
    isSaving, saveShow, deleteShow, duplicateShow, repeatYearly,
    validationErrors,
  } = useTradeShowStore();

  const toast = useToastStore();
  const { status: autosaveStatus, hasUnsavedChanges } = useAutosave({ debounceMs: 2500 });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPackingList, setShowPackingList] = useState(false);
  
  // Permission checks
  const canEdit = usePermission('editor');
  const canDelete = usePermission('admin');

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-gradient-to-r from-surface to-bg-secondary shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedShow(null)} 
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary shrink-0"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-text-primary truncate">{isNew ? 'New Trade Show' : show.name}</h1>
            <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
              {!isNew && <StatusBadge status={show.showStatus} />}
              <span className="hidden sm:inline">{estimated > 0 && `Est. Total: ${formatCurrency(estimated)}`}</span>
              {!isNew && <AutosaveIndicator status={autosaveStatus} hasUnsavedChanges={hasUnsavedChanges} />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 justify-end flex-wrap">
          {!isNew && (
            <>
              <Button variant="ghost" size="sm" onClick={() => downloadICS([show])} title="Add to Calendar">
                <CalendarPlus size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openMailto(show)} title="Email Details">
                <Mail size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowTemplateModal(true)} title="Save as Template">
                <FileStack size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={repeatYearly} title="Repeat Next Year">
                <Repeat size={14} />
              </Button>
              <PermissionGate requires="editor" hideOnly>
                <Button variant="ghost" size="sm" onClick={duplicateShow} title="Duplicate"><Copy size={14} /></Button>
              </PermissionGate>
              <PermissionGate requires="admin" hideOnly>
                <Button variant="destructive" size="sm" onClick={handleDelete} title="Delete"><Trash2 size={14} /></Button>
              </PermissionGate>
            </>
          )}
          <PermissionGate requires="editor" hideOnly>
            <Button variant="primary" size="md" onClick={handleSave} loading={isSaving}>
              <Save size={14} /> <span className="hidden sm:inline">Save</span>
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
            className="mx-6 mt-3 p-3 rounded-lg bg-error-bg border border-error/20 overflow-hidden"
          >
            <p className="text-sm font-medium text-error mb-1">Please fix the following:</p>
            <ul className="list-disc list-inside text-xs text-error space-y-0.5">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

        {/* 1. Basic Information - EXPANDED BY DEFAULT */}
        <FormSection title="Basic Information" icon={Info} defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Show Name *" value={show.name} onChange={e => updateSelectedShow({ name: e.target.value })} placeholder="Enter show name" />
            <Input label="Location" value={show.location ?? ''} onChange={e => updateSelectedShow({ location: e.target.value || null })} placeholder="City, State" />
            <DatePicker label="Start Date" value={show.startDate} onChange={v => updateSelectedShow({ startDate: v })} />
            <DatePicker label="End Date" value={show.endDate} onChange={v => updateSelectedShow({ endDate: v })} />
            <Select
              label="Show Status"
              value={show.showStatus ?? ''}
              onChange={e => updateSelectedShow({ showStatus: e.target.value || null })}
              options={SHOW_STATUSES.map(s => ({ value: s, label: s }))}
              placeholder="Select status"
            />
            <Input label="Management Company" value={show.managementCompany ?? ''} onChange={e => updateSelectedShow({ managementCompany: e.target.value || null })} />
          </div>
          <RichTextEditor label="General Notes" value={show.generalNotes} onChange={v => updateSelectedShow({ generalNotes: v || null })} placeholder="Notes about this show..." />
        </FormSection>

        {/* 2. Booth & Registration */}
        <FormSection title="Booth & Registration" icon={Ticket} defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Booth Number" value={show.boothNumber ?? ''} onChange={e => updateSelectedShow({ boothNumber: e.target.value || null })} />
            <Input label="Booth Size" value={show.boothSize ?? ''} onChange={e => updateSelectedShow({ boothSize: e.target.value || null })} placeholder="e.g., 10x10" />
            <Input label="Registration Cost" type="number" value={show.cost?.toString() ?? ''} onChange={e => updateSelectedShow({ cost: e.target.value ? parseFloat(e.target.value) : null })} />
            <Input label="Attendees Included" type="number" value={show.attendeesIncluded?.toString() ?? ''} onChange={e => updateSelectedShow({ attendeesIncluded: e.target.value ? parseInt(e.target.value) : null })} />
          </div>
          <div className="space-y-2 pt-2">
            <Checkbox label="Registration Confirmed" checked={show.registrationConfirmed ?? false} onChange={v => updateSelectedShow({ registrationConfirmed: v })} />
            <Checkbox label="Attendee List Received" checked={show.attendeeListReceived ?? false} onChange={v => updateSelectedShow({ attendeeListReceived: v })} />
          </div>
        </FormSection>

        {/* 3. Attendees & Travel */}
        <FormSection title={`Attendees & Travel (${attendees.length})`} icon={Users} defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input label="Total Attending" type="number" value={show.totalAttending?.toString() ?? ''} onChange={e => updateSelectedShow({ totalAttending: e.target.value ? parseInt(e.target.value) : null })} />
          </div>
          {attendees.map((att) => (
            <motion.div 
              key={att.localId} 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 items-start p-3 bg-bg-tertiary rounded-lg"
            >
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Input label="Name" value={att.name ?? ''} onChange={e => updateAttendee(att.localId, { name: e.target.value || null })} placeholder="Full name" />
                <Input label="Email" value={att.email ?? ''} onChange={e => updateAttendee(att.localId, { email: e.target.value || null })} placeholder="email@example.com" />
                <Input label="Flight Cost" type="number" value={att.flightCost?.toString() ?? ''} onChange={e => updateAttendee(att.localId, { flightCost: e.target.value ? parseFloat(e.target.value) : null })} />
                <DatePicker label="Arrival" value={att.arrivalDate} onChange={v => updateAttendee(att.localId, { arrivalDate: v })} />
                <DatePicker label="Departure" value={att.departureDate} onChange={v => updateAttendee(att.localId, { departureDate: v })} />
                <Input label="Flight Confirmation" value={att.flightConfirmation ?? ''} onChange={e => updateAttendee(att.localId, { flightConfirmation: e.target.value || null })} placeholder="Confirmation #" />
              </div>
              <button onClick={() => removeAttendee(att.localId)} className="p-1.5 rounded hover:bg-error/10 text-error mt-5">
                <X size={16} />
              </button>
            </motion.div>
          ))}
          <Button variant="outline" size="sm" onClick={addAttendee}><Plus size={14} /> Add Attendee</Button>
        </FormSection>

        {/* 4. Hotel */}
        <FormSection title="Hotel" icon={Hotel} defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Hotel Name" value={show.hotelName ?? ''} onChange={e => updateSelectedShow({ hotelName: e.target.value || null })} />
            <Input label="Hotel Address" value={show.hotelAddress ?? ''} onChange={e => updateSelectedShow({ hotelAddress: e.target.value || null })} />
            <Input label="Cost Per Night" type="number" value={show.hotelCostPerNight?.toString() ?? ''} onChange={e => updateSelectedShow({ hotelCostPerNight: e.target.value ? parseFloat(e.target.value) : null })} />
            <Input label="Confirmation Number" value={show.hotelConfirmationNumber ?? ''} onChange={e => updateSelectedShow({ hotelConfirmationNumber: e.target.value || null })} placeholder="e.g., 12345ABC" />
          </div>
          <Checkbox label="Hotel Confirmed" checked={show.hotelConfirmed ?? false} onChange={v => updateSelectedShow({ hotelConfirmed: v })} />
          {estimatedHotelCost(show) > 0 && (
            <p className="text-xs text-text-secondary">Estimated Hotel Cost: {formatCurrency(estimatedHotelCost(show))}</p>
          )}
          <HotelMap hotelName={show.hotelName} hotelAddress={show.hotelAddress} showLocation={show.location} />
        </FormSection>

        {/* 5. Shipping & Logistics */}
        <FormSection title="Shipping & Logistics" icon={Truck} defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Shipping Info" value={show.shippingInfo ?? ''} onChange={e => updateSelectedShow({ shippingInfo: e.target.value || null })} />
            <Input label="Tracking Number" value={show.trackingNumber ?? ''} onChange={e => updateSelectedShow({ trackingNumber: e.target.value || null })} />
            <Input label="Shipping Cost" type="number" value={show.shippingCost?.toString() ?? ''} onChange={e => updateSelectedShow({ shippingCost: e.target.value ? parseFloat(e.target.value) : null })} />
            <DatePicker label="Shipping Cutoff" value={show.shippingCutoff} onChange={v => updateSelectedShow({ shippingCutoff: v })} />
          </div>
          <div className="flex gap-4">
            <Checkbox label="Ship to Site" checked={show.shipToSite ?? false} onChange={v => updateSelectedShow({ shipToSite: v })} />
            <Checkbox label="Ship to Warehouse" checked={show.shipToWarehouse ?? false} onChange={v => updateSelectedShow({ shipToWarehouse: v })} />
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-text-secondary mb-2">Booth Items to Ship</p>
            <div className="flex flex-wrap gap-2">
              {BOOTH_OPTIONS.map(opt => (
                <Checkbox key={opt} label={opt} checked={parseJsonStringArray(show.boothToShip).includes(opt)} onChange={() => toggleJsonArrayItem('boothToShip', opt)} />
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-text-secondary mb-2">Graphics to Ship</p>
            <div className="flex flex-wrap gap-2">
              {GRAPHICS_OPTIONS.map(opt => (
                <Checkbox key={opt} label={opt} checked={parseJsonStringArray(show.graphicsToShip).includes(opt)} onChange={() => toggleJsonArrayItem('graphicsToShip', opt)} />
              ))}
            </div>
          </div>
        </FormSection>

        {/* 6. On-Site Services */}
        <FormSection title="On-Site Services" icon={Package} defaultOpen={false}>
          <div className="flex gap-4 mb-3">
            <Checkbox label="Utilities Booked" checked={show.utilitiesBooked ?? false} onChange={v => updateSelectedShow({ utilitiesBooked: v })} />
            <Checkbox label="Labor Booked" checked={show.laborBooked ?? false} onChange={v => updateSelectedShow({ laborBooked: v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Utilities Details" value={show.utilitiesDetails ?? ''} onChange={e => updateSelectedShow({ utilitiesDetails: e.target.value || null })} />
            <Input label="Labor Details" value={show.laborDetails ?? ''} onChange={e => updateSelectedShow({ laborDetails: e.target.value || null })} />
            <Input label="Electrical Cost" type="number" value={show.electricalCost?.toString() ?? ''} onChange={e => updateSelectedShow({ electricalCost: e.target.value ? parseFloat(e.target.value) : null })} />
            <Input label="Labor Cost" type="number" value={show.laborCost?.toString() ?? ''} onChange={e => updateSelectedShow({ laborCost: e.target.value ? parseFloat(e.target.value) : null })} />
            <Input label="Internet Cost" type="number" value={show.internetCost?.toString() ?? ''} onChange={e => updateSelectedShow({ internetCost: e.target.value ? parseFloat(e.target.value) : null })} />
            <Input label="Standard Services Cost" type="number" value={show.standardServicesCost?.toString() ?? ''} onChange={e => updateSelectedShow({ standardServicesCost: e.target.value ? parseFloat(e.target.value) : null })} />
          </div>
          {totalServicesCost(show) > 0 && (
            <p className="text-sm font-medium text-text-secondary pt-2">Total Services: {formatCurrency(totalServicesCost(show))}</p>
          )}
        </FormSection>

        {/* 7. Event Details & Contacts */}
        <FormSection title="Event Details & Contacts" icon={Award} defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Show Contact Name" value={show.showContactName ?? ''} onChange={e => updateSelectedShow({ showContactName: e.target.value || null })} />
            <Input label="Show Contact Email" value={show.showContactEmail ?? ''} onChange={e => updateSelectedShow({ showContactEmail: e.target.value || null })} />
            <Input label="Show Agenda URL" value={show.showAgendaUrl ?? ''} onChange={e => updateSelectedShow({ showAgendaUrl: e.target.value || null })} placeholder="https://" />
            <Input label="Event Portal URL" value={show.eventPortalUrl ?? ''} onChange={e => updateSelectedShow({ eventPortalUrl: e.target.value || null })} placeholder="https://" />
          </div>
          <div className="space-y-3 pt-2">
            <Toggle label="Has Speaking Engagement" enabled={show.hasSpeakingEngagement ?? false} onChange={v => updateSelectedShow({ hasSpeakingEngagement: v })} />
            {show.hasSpeakingEngagement && (
              <Textarea label="Speaking Details" value={show.speakingDetails ?? ''} onChange={e => updateSelectedShow({ speakingDetails: e.target.value || null })} />
            )}
            <Textarea label="Sponsorship Details" value={show.sponsorshipDetails ?? ''} onChange={e => updateSelectedShow({ sponsorshipDetails: e.target.value || null })} />
            <Toggle label="Has Event App" enabled={show.hasEventApp ?? false} onChange={v => updateSelectedShow({ hasEventApp: v })} />
            {show.hasEventApp && (
              <Input label="Event App Notes" value={show.eventAppNotes ?? ''} onChange={e => updateSelectedShow({ eventAppNotes: e.target.value || null })} />
            )}
          </div>
        </FormSection>

        {/* 8. Packing List */}
        <FormSection title="Packing List" icon={FileText} defaultOpen={false}>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Standard Items</p>
            <div className="flex flex-wrap gap-2">
              {PACKING_LIST_OPTIONS.map(opt => (
                <Checkbox key={opt} label={opt} checked={parseJsonStringArray(show.packingListItems).includes(opt)} onChange={() => toggleJsonArrayItem('packingListItems', opt)} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <Toggle label="Swag Items" enabled={show.swagItemsEnabled ?? false} onChange={v => updateSelectedShow({ swagItemsEnabled: v })} />
              {show.swagItemsEnabled && <Input label="Swag Description" value={show.swagItemsDescription ?? ''} onChange={e => updateSelectedShow({ swagItemsDescription: e.target.value || null })} className="mt-2" />}
            </div>
            <div>
              <Toggle label="Giveaway Item" enabled={show.giveawayItemEnabled ?? false} onChange={v => updateSelectedShow({ giveawayItemEnabled: v })} />
              {show.giveawayItemEnabled && <Input label="Giveaway Description" value={show.giveawayItemDescription ?? ''} onChange={e => updateSelectedShow({ giveawayItemDescription: e.target.value || null })} className="mt-2" />}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Input label="Power Strip Count" type="number" value={show.powerStripCount?.toString() ?? ''} onChange={e => updateSelectedShow({ powerStripCount: e.target.value ? parseInt(e.target.value) : null })} placeholder="1-4" />
            <Select
              label="Tablecloth Type"
              value={show.tableclothType ?? ''}
              onChange={e => updateSelectedShow({ tableclothType: e.target.value || null })}
              options={TABLECLOTH_OPTIONS.map(t => ({ value: t, label: t }))}
              placeholder="Select type"
            />
          </div>
          <Textarea label="Additional Items" value={show.packingListMisc ?? ''} onChange={e => updateSelectedShow({ packingListMisc: e.target.value || null })} placeholder="Other items to pack..." />
          
          <Button variant="outline" size="sm" onClick={() => setShowPackingList(true)} className="mt-3">
            <Printer size={14} /> Generate Packing List
          </Button>
        </FormSection>

        {/* 9. Budget Summary */}
        <FormSection title="Budget Summary" icon={DollarSign} defaultOpen={false}
          badge={estimated > 0 ? <span className="text-xs font-medium text-brand-purple">{formatCurrency(estimated)}</span> : undefined}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 bg-bg-tertiary rounded">
              <span className="text-text-secondary">Registration</span>
              <span className="font-medium">{formatCurrency(show.cost ?? 0)}</span>
            </div>
            <div className="flex justify-between p-2 bg-bg-tertiary rounded">
              <span className="text-text-secondary">Shipping</span>
              <span className="font-medium">{formatCurrency(show.shippingCost ?? 0)}</span>
            </div>
            <div className="flex justify-between p-2 bg-bg-tertiary rounded">
              <span className="text-text-secondary">Services</span>
              <span className="font-medium">{formatCurrency(totalServicesCost(show))}</span>
            </div>
            <div className="flex justify-between p-2 bg-bg-tertiary rounded">
              <span className="text-text-secondary">Hotel (Est.)</span>
              <span className="font-medium">{formatCurrency(estimatedHotelCost(show))}</span>
            </div>
          </div>
          <div className="flex justify-between p-3 bg-brand-purple/10 rounded-lg mt-2">
            <span className="font-semibold text-text-primary">Estimated Total</span>
            <span className="font-bold text-brand-purple text-lg">{formatCurrency(estimated)}</span>
          </div>
        </FormSection>

        {/* 10. Post-Show ROI */}
        <FormSection title="Post-Show ROI" icon={BarChart3} defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Total Leads" type="number" value={show.totalLeads?.toString() ?? ''} onChange={e => updateSelectedShow({ totalLeads: e.target.value ? parseInt(e.target.value) : null })} />
            <Input label="Qualified Leads" type="number" value={show.qualifiedLeads?.toString() ?? ''} onChange={e => updateSelectedShow({ qualifiedLeads: e.target.value ? parseInt(e.target.value) : null })} />
            <Input label="Meetings Booked" type="number" value={show.meetingsBooked?.toString() ?? ''} onChange={e => updateSelectedShow({ meetingsBooked: e.target.value ? parseInt(e.target.value) : null })} />
            <Input label="Deals Won" type="number" value={show.dealsWon?.toString() ?? ''} onChange={e => updateSelectedShow({ dealsWon: e.target.value ? parseInt(e.target.value) : null })} />
            <Input label="Revenue Attributed" type="number" value={show.revenueAttributed?.toString() ?? ''} onChange={e => updateSelectedShow({ revenueAttributed: e.target.value ? parseFloat(e.target.value) : null })} />
          </div>
          
          {/* Calculated Metrics */}
          {(show.totalLeads || show.revenueAttributed) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {costPerLead(show) !== null && (
                <div className="flex justify-between p-2 bg-bg-tertiary rounded">
                  <span className="text-xs text-text-secondary">Cost per Lead</span>
                  <span className="text-sm font-medium text-error">{formatCurrency(costPerLead(show)!)}</span>
                </div>
              )}
              {costPerQualifiedLead(show) !== null && (
                <div className="flex justify-between p-2 bg-bg-tertiary rounded">
                  <span className="text-xs text-text-secondary">Cost per Qualified Lead</span>
                  <span className="text-sm font-medium text-error">{formatCurrency(costPerQualifiedLead(show)!)}</span>
                </div>
              )}
              {leadQualificationRate(show) !== null && (
                <div className="flex justify-between p-2 bg-bg-tertiary rounded">
                  <span className="text-xs text-text-secondary">Lead Qualification Rate</span>
                  <span className="text-sm font-medium">{leadQualificationRate(show)!.toFixed(1)}%</span>
                </div>
              )}
              {dealCloseRate(show) !== null && (
                <div className="flex justify-between p-2 bg-bg-tertiary rounded">
                  <span className="text-xs text-text-secondary">Deal Close Rate</span>
                  <span className="text-sm font-medium text-success">{dealCloseRate(show)!.toFixed(1)}%</span>
                </div>
              )}
              {revenuePerDeal(show) !== null && (
                <div className="flex justify-between p-2 bg-bg-tertiary rounded">
                  <span className="text-xs text-text-secondary">Revenue per Deal</span>
                  <span className="text-sm font-medium text-success">{formatCurrency(revenuePerDeal(show)!)}</span>
                </div>
              )}
            </div>
          )}
          
          {roi !== null && (
            <div className={`p-3 rounded-lg mt-2 ${roi >= 0 ? 'bg-success-bg' : 'bg-error-bg'}`}>
              <span className={`text-lg font-bold ${roi >= 0 ? 'text-success' : 'text-error'}`}>
                ROI: {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
              </span>
            </div>
          )}
          <RichTextEditor label="Post-Show Notes" value={show.postShowNotes} onChange={v => updateSelectedShow({ postShowNotes: v || null })} placeholder="Takeaways, lessons learned..." />
        </FormSection>

        {/* Documents & Files */}
        <FormSection title={`Documents${additionalFiles.length > 0 ? ` (${additionalFiles.length})` : ''}`} icon={Upload} defaultOpen={false}>
          <FileUploadZone
            tradeshowId={show.id}
            files={additionalFiles}
            onFilesChange={refreshAdditionalFiles}
            disabled={isNew}
          />
          {isNew && (
            <p className="text-xs text-text-tertiary mt-2">Save the show first to upload files</p>
          )}
        </FormSection>

        {/* Activity Timeline */}
        <FormSection title="Activity & Notes" icon={Clock} defaultOpen={false}>
          <ActivityTimeline tradeshowId={show.id} />
        </FormSection>
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <TemplateModal
            mode="save"
            onClose={() => setShowTemplateModal(false)}
            onSaved={() => toast.success('Template saved!')}
          />
        )}
      </AnimatePresence>

      {/* Packing List Modal */}
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
