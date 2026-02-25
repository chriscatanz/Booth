'use client';

import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { TradeShow, Attendee, AdditionalFile } from '@/types';
import { Task, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/types/tasks';
import { 
  totalEstimatedCost, totalServicesCost, estimatedHotelCost, flightCostForShow,
  parseJsonStringArray 
} from '@/types/computed';
import { formatCurrency, cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { 
  MapPin, Calendar, Users, DollarSign, 
  Building, FileText, CheckSquare, ExternalLink,
  Globe, User2, Briefcase, Truck, Package, Clock,
  Hotel, Plane, Mail, Phone, Copy, Navigation,
  Zap, Wifi, Wrench, Info, ClipboardList, Radio,
  RotateCcw, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VenueMap } from '@/components/ui/venue-map';
import { useToastStore } from '@/store/toast-store';

interface ShowReadViewProps {
  show: TradeShow;
  attendees: Attendee[];
  files?: AdditionalFile[];
  tasks?: Task[];
  taskCounts?: { completed: number; total: number };
  onEdit?: (currentTab: ReadTab) => void;
  canEdit?: boolean;
  activeTab?: ReadTab;
  onTabChange?: (tab: ReadTab) => void;
  carriers?: Array<{ id: string; name: string }>;
  laborCompanies?: Array<{ id: string; name: string }>;
}

type ReadTab = 'overview' | 'agenda' | 'booth' | 'logistics' | 'travel' | 'budget' | 'notes' | 'documents';

const TABS: { id: ReadTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Info size={16} /> },
  { id: 'agenda', label: 'Agenda', icon: <Calendar size={16} /> },
  { id: 'booth', label: 'Booth', icon: <Package size={16} /> },
  { id: 'logistics', label: 'Logistics', icon: <Truck size={16} /> },
  { id: 'travel', label: 'Travel', icon: <Plane size={16} /> },
  { id: 'budget', label: 'Budget', icon: <DollarSign size={16} /> },
  { id: 'notes', label: 'Notes & Tasks', icon: <FileText size={16} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
];

export function ShowReadView({ show, attendees, files = [], tasks = [], taskCounts, onEdit, canEdit, activeTab: controlledTab, onTabChange, carriers = [], laborCompanies = [] }: ShowReadViewProps) {
  const [internalTab, setInternalTab] = useState<ReadTab>('overview');
  
  // Use controlled tab if provided, otherwise use internal state
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;
  const toast = useToastStore();
  
  // Computed values
  const totalCost = totalEstimatedCost(show, attendees);
  const servicesCost = totalServicesCost(show);
  const hotelCost = estimatedHotelCost(show, attendees);
  const flightCost = flightCostForShow(show, attendees);
  const graphicsToShip = parseJsonStringArray(show.graphicsToShip);
  const boothToShip = parseJsonStringArray(show.boothToShip);
  const packingItems = parseJsonStringArray(show.packingListItems);
  
  // Days until show
  const daysUntil = show.startDate 
    ? differenceInDays(parseISO(show.startDate), new Date())
    : null;
  const isUpcoming = daysUntil !== null && daysUntil >= 0;
  
  // Task counts
  const taskCompleted = taskCounts?.completed || 0;
  const taskTotal = taskCounts?.total || 0;

  // Sanitize HTML content to prevent XSS
  const sanitizeHtml = (html: string | null) => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'hr', 'h1', 'h2', 'h3', 'h4'],
      ALLOWED_ATTR: [],
    });
  };

  // Memoize sanitized content
  const sanitizedAgenda = useMemo(() => sanitizeHtml(show.agendaContent), [show.agendaContent]);
  const sanitizedNotes = useMemo(() => sanitizeHtml(show.generalNotes), [show.generalNotes]);
  const sanitizedSpeaking = useMemo(() => sanitizeHtml(show.speakingDetails), [show.speakingDetails]);

  // Format dates
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const openDirections = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  // Tab counts for badges
  const getTabCount = (tab: ReadTab): number | undefined => {
    switch (tab) {
      case 'travel': return attendees.length || undefined;
      case 'notes': return tasks.length || undefined;
      case 'documents': return files.length || undefined;
      default: return undefined;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map(tab => {
              const count = getTabCount(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                    activeTab === tab.id
                      ? 'bg-brand-purple/10 text-brand-purple'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {count !== undefined && (
                    <span className={cn(
                      'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                      activeTab === tab.id ? 'bg-brand-purple/20' : 'bg-bg-tertiary'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Row: Show Info | Venue | Countdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardTitle icon={<Briefcase size={16} />} title="Show Information" />
                  <div className="space-y-3 mt-4">
                    {show.managementCompany && <InfoRow label="Organization" value={show.managementCompany} />}
                    {show.totalAttending && <InfoRow label="Expected Attendance" value={`${show.totalAttending.toLocaleString()}+`} />}
                    {show.eventType && <InfoRow label="Type" value={formatEventType(show.eventType)} />}
                    {show.showWebsite && (
                      <InfoRow label="Website" value={
                        <a href={show.showWebsite} target="_blank" rel="noopener noreferrer" className="text-brand-purple hover:underline flex items-center gap-1">
                          Visit site <ExternalLink size={12} />
                        </a>
                      } />
                    )}
                    {!show.managementCompany && !show.totalAttending && !show.showWebsite && (
                      <p className="text-sm text-text-tertiary italic">No show information added</p>
                    )}
                  </div>
                </Card>

                <Card>
                  <CardTitle icon={<Building size={16} />} title="Venue" />
                  <div className="space-y-3 mt-4">
                    {show.venueName && <InfoRow label="Location" value={show.venueName} />}
                    {show.venueAddress && <InfoRow label="Address" value={show.venueAddress} />}
                    {!show.venueName && show.location && <InfoRow label="Location" value={show.location} />}
                    
                    {/* Hotel Info */}
                    {(show.hotelName || show.hotelAddress) && (
                      <>
                        <hr className="border-border my-2" />
                        <div className="flex items-center gap-1.5 text-text-tertiary">
                          <Hotel size={14} />
                          <span className="text-xs font-medium uppercase tracking-wide">Hotel</span>
                        </div>
                        {show.hotelName && <InfoRow label="Name" value={show.hotelName} />}
                        {show.hotelAddress && <InfoRow label="Address" value={show.hotelAddress} />}
                      </>
                    )}
                    
                    {(show.venueAddress || show.venueName || show.location) && (
                      <Button variant="outline" size="sm" onClick={() => openDirections(show.venueAddress || show.venueName || show.location || '')} className="mt-2">
                        View Map
                      </Button>
                    )}
                  </div>
                </Card>

                <Card className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-brand-purple/5 to-brand-purple/10">
                  <div className="text-xs text-brand-purple font-medium uppercase tracking-wide mb-2">Countdown</div>
                  {isUpcoming && daysUntil !== null ? (
                    <>
                      <div className="text-6xl font-bold text-brand-purple">{daysUntil}</div>
                      <div className="text-text-secondary mt-1">days until show</div>
                    </>
                  ) : daysUntil !== null && daysUntil < 0 ? (
                    <>
                      <div className="text-3xl font-bold text-text-tertiary">Complete</div>
                      <div className="text-sm text-text-secondary mt-1">{Math.abs(daysUntil)} days ago</div>
                    </>
                  ) : (
                    <div className="text-3xl text-text-tertiary">—</div>
                  )}
                </Card>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard icon={<DollarSign size={16} className="text-success" />} title="Budget" mainValue={formatCurrency(totalCost)} subText="Total estimated" />
                <SummaryCard
                  icon={<Users size={16} className="text-brand-purple" />}
                  title="Team"
                  mainValue={attendees.length.toString()}
                  subText="attending"
                  detail={attendees.length > 0 ? (
                    <p className="text-xs text-text-tertiary leading-relaxed">
                      {attendees.slice(0, 3).map(a => a.name || 'Unnamed').join(', ')}
                      {attendees.length > 3 && ` +${attendees.length - 3} more`}
                    </p>
                  ) : undefined}
                />
                <SummaryCard icon={<FileText size={16} className="text-warning" />} title="Documents" mainValue={files.length.toString()} subText="files uploaded" />
                <SummaryCard icon={<CheckSquare size={16} className="text-brand-cyan" />} title="Tasks" mainValue={`${taskCompleted}/${taskTotal}`} subText="completed" />
              </div>

              {/* Event Dates */}
              <Card>
                <CardTitle icon={<Calendar size={16} />} title="Event Dates" />
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DateBlock label="Show Dates" primary={formatDate(show.startDate)} secondary={show.endDate && show.endDate !== show.startDate ? `to ${formatDate(show.endDate)}` : undefined} />
                  {show.moveInDate && <DateBlock label="Move-In" primary={formatDate(show.moveInDate)} secondary={show.moveInTime || undefined} />}
                  {show.moveOutDate && <DateBlock label="Move-Out" primary={formatDate(show.moveOutDate)} secondary={show.moveOutTime || undefined} />}
                  {show.shippingCutoff && <DateBlock label="Ship By" primary={formatDate(show.shippingCutoff)} highlight />}
                </div>
              </Card>

              {/* Map */}
              {(show.venueAddress || show.hotelAddress) && (
                <Card noPadding>
                  <VenueMap venueAddress={show.venueAddress} hotelAddress={show.hotelAddress} venueName={show.venueName} hotelName={show.hotelName} />
                </Card>
              )}
            </div>
          )}

          {/* AGENDA TAB */}
          {activeTab === 'agenda' && (
            <div className="space-y-6">
              {show.agendaContent ? (
                <Card>
                  <CardTitle icon={<Calendar size={16} />} title="Event Agenda" />
                  <div 
                    className="mt-4 text-sm text-text-secondary agenda-content"
                    style={{
                      lineHeight: '1.7',
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizedAgenda }} 
                  />
                  <style jsx global>{`
                    .agenda-content p { margin-bottom: 0.75rem; }
                    .agenda-content ul, .agenda-content ol { margin: 0.5rem 0 0.75rem 1.5rem; }
                    .agenda-content li { margin-bottom: 0.25rem; }
                    .agenda-content ul { list-style-type: disc; }
                    .agenda-content ol { list-style-type: decimal; }
                    .agenda-content strong { color: var(--text-primary); font-weight: 600; }
                    .agenda-content h1, .agenda-content h2, .agenda-content h3, .agenda-content h4 {
                      color: var(--text-primary);
                      font-weight: 600;
                      margin-top: 1rem;
                      margin-bottom: 0.5rem;
                    }
                    .agenda-content h1 { font-size: 1.25rem; }
                    .agenda-content h2 { font-size: 1.125rem; }
                    .agenda-content h3 { font-size: 1rem; }
                    .agenda-content br { display: block; content: ""; margin-top: 0.5rem; }
                  `}</style>
                </Card>
              ) : (
                <EmptyState icon={<Calendar size={32} />} message="No agenda content added yet" />
              )}
              
              {show.showAgendaUrl && (
                <Card>
                  <CardTitle icon={<ExternalLink size={16} />} title="Agenda Link" />
                  <a href={show.showAgendaUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-brand-purple hover:underline">
                    View full agenda <ExternalLink size={14} />
                  </a>
                </Card>
              )}

              {show.speakingDetails && (
                <Card>
                  <CardTitle icon={<User2 size={16} />} title="Speaking Engagement" />
                  <div className="mt-3 text-sm text-text-secondary whitespace-pre-wrap">{show.speakingDetails}</div>
                </Card>
              )}
            </div>
          )}

          {/* BOOTH TAB */}
          {activeTab === 'booth' && (
            <div className="space-y-6">
              <Card>
                <CardTitle icon={<Package size={16} />} title="Booth Details" />
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {show.boothNumber && <InfoBlock label="Booth #" value={show.boothNumber} copyable onCopy={() => copyToClipboard(show.boothNumber!, 'Booth number')} />}
                  {show.boothSize && <InfoBlock label="Size" value={show.boothSize} />}
                  {show.cost && <InfoBlock label="Booth Cost" value={formatCurrency(show.cost)} />}
                </div>
              </Card>

              {/* Services */}
              {(show.electricalCost || show.internetCost || show.laborCost || show.standardServicesCost) && (
                <Card>
                  <CardTitle icon={<Zap size={16} />} title="Services" />
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {show.electricalCost && <InfoBlock label="Electrical" value={formatCurrency(show.electricalCost)} icon={<Zap size={14} />} />}
                    {show.internetCost && <InfoBlock label="Internet" value={formatCurrency(show.internetCost)} icon={<Wifi size={14} />} />}
                    {show.laborCost && <InfoBlock label="Labor" value={formatCurrency(show.laborCost)} icon={<Wrench size={14} />} />}
                    {show.standardServicesCost && <InfoBlock label="Drayage" value={formatCurrency(show.standardServicesCost)} icon={<Truck size={14} />} />}
                  </div>
                </Card>
              )}

              {/* Lead Capture */}
              {show.leadCaptureSystem && (
                <Card>
                  <CardTitle icon={<Radio size={16} />} title="Lead Capture" />
                  <div className="mt-3">
                    <InfoBlock label="System" value={show.leadCaptureSystem} />
                  </div>
                </Card>
              )}

              {/* Packing List */}
              {packingItems.length > 0 && (
                <Card>
                  <CardTitle icon={<ClipboardList size={16} />} title="Packing List" />
                  <ul className="mt-3 space-y-1">
                    {packingItems.map((item, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          {/* LOGISTICS TAB */}
          {activeTab === 'logistics' && (
            <div className="space-y-6">
              {/* Outbound Shipping */}
              <Card>
                <CardTitle icon={<Truck size={16} />} title="Outbound Shipping" />
                <div className="mt-4 space-y-4">
                  {show.shippingCutoff && (
                    <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
                      <Clock size={18} className="text-warning" />
                      <div>
                        <div className="text-sm font-medium text-text-primary">Ship by {formatDate(show.shippingCutoff)}</div>
                        <div className="text-xs text-text-secondary">Warehouse arrival deadline</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {show.shippingCarrierId && carriers.find(c => c.id === show.shippingCarrierId) && (
                      <InfoBlock label="Carrier" value={carriers.find(c => c.id === show.shippingCarrierId)!.name} icon={<Truck size={14} />} />
                    )}
                    {show.trackingNumber && (
                      <InfoBlock label="Tracking #" value={show.trackingNumber} copyable onCopy={() => copyToClipboard(show.trackingNumber!, 'Tracking number')} />
                    )}
                    {show.shippingCost && <InfoBlock label="Cost" value={formatCurrency(show.shippingCost)} />}
                    {(show.shipToSite || show.shipToWarehouse) && (
                      <div>
                        <div className="text-xs text-text-tertiary mb-1.5">Ship To</div>
                        <div className="flex flex-wrap gap-2">
                          {show.shipToSite && <span className="text-xs px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple font-medium">Site</span>}
                          {show.shipToWarehouse && <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan font-medium">Warehouse</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {show.trackingStatus && (
                    <div className="p-3 bg-bg-tertiary rounded-lg">
                      <div className="text-xs text-text-tertiary mb-1">Status</div>
                      <div className="text-sm font-medium text-text-primary">{show.trackingStatus}</div>
                      {show.trackingStatusDetails && (
                        <div className="text-xs text-text-secondary mt-1">{show.trackingStatusDetails}</div>
                      )}
                    </div>
                  )}

                  {show.shippingInfo && (
                    <div className="text-sm text-text-secondary whitespace-pre-wrap">{show.shippingInfo}</div>
                  )}
                </div>
              </Card>

              {/* Return Shipping */}
              {(show.returnCarrierId || show.returnTrackingNumber || show.returnShippingCost || show.returnShipDate || show.returnDeliveryDate) && (
                <Card>
                  <CardTitle icon={<RotateCcw size={16} />} title="Return Shipping" />
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {show.returnCarrierId && carriers.find(c => c.id === show.returnCarrierId) && (
                      <InfoBlock label="Carrier" value={carriers.find(c => c.id === show.returnCarrierId)!.name} icon={<Truck size={14} />} />
                    )}
                    {show.returnTrackingNumber && (
                      <InfoBlock label="Tracking #" value={show.returnTrackingNumber} copyable onCopy={() => copyToClipboard(show.returnTrackingNumber!, 'Return tracking')} />
                    )}
                    {show.returnShippingCost && <InfoBlock label="Cost" value={formatCurrency(show.returnShippingCost)} />}
                    {show.returnShipDate && <InfoBlock label="Ship Date" value={formatDate(show.returnShipDate) || ''} />}
                    {show.returnDeliveryDate && <InfoBlock label="Expected Delivery" value={formatDate(show.returnDeliveryDate) || ''} />}
                  </div>
                </Card>
              )}

              {/* Move-In / Move-Out */}
              {(show.moveInDate || show.moveOutDate) && (
                <Card>
                  <CardTitle icon={<Navigation size={16} />} title="Move-In / Move-Out" />
                  <div className="mt-4 flex flex-wrap gap-4">
                    {show.moveInDate && <DateBlock label="Move-In" primary={formatDate(show.moveInDate)} secondary={show.moveInTime || undefined} />}
                    {show.moveOutDate && <DateBlock label="Move-Out" primary={formatDate(show.moveOutDate)} secondary={show.moveOutTime || undefined} />}
                  </div>
                </Card>
              )}

              {/* Booth to Ship */}
              {boothToShip.length > 0 && (
                <Card>
                  <CardTitle icon={<Package size={16} />} title="Booth Items to Ship" />
                  <ul className="mt-3 space-y-1">
                    {boothToShip.map((item, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Graphics to Ship */}
              {graphicsToShip.length > 0 && (
                <Card>
                  <CardTitle icon={<Package size={16} />} title="Graphics to Ship" />
                  <ul className="mt-3 space-y-1">
                    {graphicsToShip.map((item, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* On-Site Services */}
              {(show.utilitiesBooked || show.laborBooked || show.laborNotRequired || show.electricalCost || show.internetCost || show.laborCost || show.standardServicesCost || show.utilitiesDetails || show.laborCompanyId || show.laborDetails) && (
                <Card>
                  <CardTitle icon={<Wrench size={16} />} title="On-Site Services" />
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {show.utilitiesBooked && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium flex items-center gap-1"><Zap size={10} /> Utilities Booked</span>}
                      {show.laborBooked && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium flex items-center gap-1"><Wrench size={10} /> Labor Booked</span>}
                      {show.laborNotRequired && <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary font-medium">No Labor Needed</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {show.utilitiesDetails && <InfoBlock label="Utilities Details" value={show.utilitiesDetails} icon={<Zap size={14} />} />}
                      {show.laborCompanyId && laborCompanies.find(c => c.id === show.laborCompanyId) && (
                        <InfoBlock label="Labor / I&D Company" value={laborCompanies.find(c => c.id === show.laborCompanyId)!.name} icon={<Wrench size={14} />} />
                      )}
                      {show.electricalCost && <InfoBlock label="Electrical" value={formatCurrency(show.electricalCost)} icon={<Zap size={14} />} />}
                      {show.internetCost && <InfoBlock label="Internet" value={formatCurrency(show.internetCost)} icon={<Wifi size={14} />} />}
                      {show.laborCost && <InfoBlock label="Labor" value={formatCurrency(show.laborCost)} icon={<Wrench size={14} />} />}
                      {show.standardServicesCost && <InfoBlock label="Standard Services" value={formatCurrency(show.standardServicesCost)} />}
                    </div>
                    {show.laborDetails && <div className="text-sm text-text-secondary whitespace-pre-wrap">{show.laborDetails}</div>}
                  </div>
                </Card>
              )}

              {/* Lead Capture */}
              {(show.leadCaptureSystem || show.leadCaptureNotRequired) && (
                <Card>
                  <CardTitle icon={<Radio size={16} />} title="Lead Capture" />
                  <div className="mt-4">
                    {show.leadCaptureNotRequired ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary font-medium">No Lead Capture Needed</span>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {show.leadCaptureSystem && <InfoBlock label="System" value={show.leadCaptureSystem} />}
                        {show.leadCaptureCredentials && <InfoBlock label="Login" value={show.leadCaptureCredentials} />}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* TRAVEL TAB */}
          {activeTab === 'travel' && (
            <div className="space-y-6">
              {/* Hotel */}
              {(show.hotelName || show.hotelAddress) && (
                <Card>
                  <CardTitle icon={<Hotel size={16} />} title="Hotel" />
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {show.hotelName && <InfoBlock label="Hotel" value={show.hotelName} />}
                      {show.hotelAddress && <InfoBlock label="Address" value={show.hotelAddress} />}
                      {show.hotelConfirmationNumber && (
                        <InfoBlock 
                          label="Confirmation #" 
                          value={show.hotelConfirmationNumber} 
                          copyable 
                          onCopy={() => copyToClipboard(show.hotelConfirmationNumber!, 'Confirmation')} 
                        />
                      )}
                      {show.hotelCostPerNight && (
                        <InfoBlock label="Rate" value={`${formatCurrency(show.hotelCostPerNight)}/night`} />
                      )}
                    </div>
                    
                    {(show.hotelAddress || show.hotelName) && (
                      <Button variant="outline" size="sm" onClick={() => openDirections(show.hotelAddress || show.hotelName || '')}>
                        <Navigation size={14} /> Get Directions
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Team / Attendees */}
              <Card>
                <CardTitle icon={<Users size={16} />} title={`Team (${attendees.length})`} />
                {attendees.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {attendees.map((a) => (
                      <div key={a.localId} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple font-medium">
                          {a.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-text-primary truncate">{a.name || 'Unnamed'}</div>
                          {a.email && <div className="text-sm text-text-secondary truncate">{a.email}</div>}
                          {(a.arrivalDate || a.departureDate) && (
                            <div className="text-xs text-text-tertiary mt-1">
                              {a.arrivalDate && `Arrives: ${formatDate(a.arrivalDate)}`}
                              {a.arrivalDate && a.departureDate && ' • '}
                              {a.departureDate && `Departs: ${formatDate(a.departureDate)}`}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {a.email && (
                            <a href={`mailto:${a.email}`} className="p-2 text-text-tertiary hover:text-brand-purple">
                              <Mail size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-text-tertiary">No team members assigned</p>
                )}
              </Card>
            </div>
          )}

          {/* BUDGET TAB */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <Card>
                <CardTitle icon={<DollarSign size={16} />} title="Cost Breakdown" />
                <div className="mt-4 space-y-3">
                  {show.cost && <BudgetRow label="Registration / Booth" amount={show.cost} />}
                  {servicesCost > 0 && <BudgetRow label="Services (Electrical, Internet, Labor, Drayage)" amount={servicesCost} />}
                  {show.shippingCost && <BudgetRow label="Outbound Shipping" amount={show.shippingCost} />}
                  {show.returnShippingCost && <BudgetRow label="Return Shipping" amount={show.returnShippingCost} />}
                  {hotelCost > 0 && <BudgetRow label="Hotel (estimated)" amount={hotelCost} />}
                  {flightCost > 0 && <BudgetRow label="Flights (estimated)" amount={flightCost} />}
                  <hr className="border-border my-2" />
                  <BudgetRow label="Total Estimated" amount={totalCost} isTotal />
                </div>
              </Card>

              {/* ROI */}
              {(show.totalLeads || show.qualifiedLeads || show.revenueAttributed) && (
                <Card>
                  <CardTitle icon={<Briefcase size={16} />} title="ROI Metrics" />
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {show.totalLeads && <InfoBlock label="Total Leads" value={show.totalLeads.toString()} />}
                    {show.qualifiedLeads && <InfoBlock label="Qualified Leads" value={show.qualifiedLeads.toString()} />}
                    {show.meetingsBooked && <InfoBlock label="Meetings Booked" value={show.meetingsBooked.toString()} />}
                    {show.revenueAttributed && <InfoBlock label="Revenue" value={formatCurrency(show.revenueAttributed)} />}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* NOTES & TASKS TAB */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Tasks */}
              {tasks.length > 0 ? (
                <Card>
                  <CardTitle icon={<CheckSquare size={16} />} title={`Tasks (${taskCompleted}/${taskTotal})`} />
                  <div className="mt-4 space-y-2">
                    {tasks.map((task) => {
                      const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
                      const statusConfig = TASK_STATUS_CONFIG[task.status];
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary',
                            task.status === 'done' && 'opacity-60'
                          )}
                        >
                          <div className={cn('w-2 h-2 rounded-full', priorityConfig.color.replace('text-', 'bg-'))} />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm font-medium text-text-primary truncate',
                              task.status === 'done' && 'line-through'
                            )}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn('text-xs px-1.5 py-0.5 rounded', statusConfig.color.replace('text-', 'bg-').replace('-600', '-100'), statusConfig.color)}>
                                {statusConfig.label}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs text-text-tertiary">
                                  Due {format(parseISO(task.dueDate), 'MMM d')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ) : (
                <EmptyState icon={<CheckSquare size={32} />} message="No tasks for this show" />
              )}

              {/* Notes */}
              {show.generalNotes ? (
                <Card>
                  <CardTitle icon={<FileText size={16} />} title="Notes" />
                  <div 
                    className="mt-4 text-sm text-text-secondary agenda-content"
                    style={{ lineHeight: '1.7' }}
                    dangerouslySetInnerHTML={{ __html: sanitizedNotes }} 
                  />
                </Card>
              ) : (
                <EmptyState icon={<FileText size={32} />} message="No notes added yet" />
              )}

              {/* Show Contact */}
              {(show.showContactName || show.showContactEmail || show.showContactPhone) && (
                <Card>
                  <CardTitle icon={<User2 size={16} />} title="Show Contact" />
                  <div className="mt-4 space-y-2">
                    {show.showContactName && <div className="font-medium text-text-primary">{show.showContactName}</div>}
                    {show.showContactEmail && (
                      <a href={`mailto:${show.showContactEmail}`} className="flex items-center gap-2 text-sm text-brand-purple hover:underline">
                        <Mail size={14} /> {show.showContactEmail}
                      </a>
                    )}
                    {show.showContactPhone && (
                      <a href={`tel:${show.showContactPhone}`} className="flex items-center gap-2 text-sm text-brand-purple hover:underline">
                        <Phone size={14} /> {show.showContactPhone}
                      </a>
                    )}
                  </div>
                </Card>
              )}

              {/* Links */}
              {(show.showWebsite || show.eventPortalUrl || show.showAgendaUrl) && (
                <Card>
                  <CardTitle icon={<ExternalLink size={16} />} title="Links" />
                  <div className="mt-4 space-y-2">
                    {show.showWebsite && <LinkRow label="Show Website" url={show.showWebsite} />}
                    {show.eventPortalUrl && <LinkRow label="Exhibitor Portal" url={show.eventPortalUrl} />}
                    {show.showAgendaUrl && <LinkRow label="Agenda" url={show.showAgendaUrl} />}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {files.length > 0 ? (
                <Card>
                  <CardTitle icon={<FileText size={16} />} title={`Documents (${files.length})`} />
                  <div className="mt-4 space-y-2">
                    {files.map((file) => (
                      <a
                        key={file.localId}
                        href={file.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary hover:bg-bg-secondary transition-colors"
                      >
                        <span className="text-xl">{getFileIcon(file.fileType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{file.fileName}</p>
                        </div>
                        <ExternalLink size={14} className="text-text-tertiary" />
                      </a>
                    ))}
                  </div>
                </Card>
              ) : (
                <EmptyState icon={<FileText size={32} />} message="No documents uploaded" />
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function Card({ children, className, noPadding }: { children: React.ReactNode; className?: string; noPadding?: boolean }) {
  return (
    <div className={cn("bg-surface border border-border rounded-xl", !noPadding && "p-5", className)}>
      {children}
    </div>
  );
}

function CardTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-text-tertiary">
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-text-tertiary shrink-0">{label}</span>
      <span className="text-sm text-text-primary text-right">{value}</span>
    </div>
  );
}

function InfoBlock({ label, value, icon, copyable, onCopy }: { label: string; value: string; icon?: React.ReactNode; copyable?: boolean; onCopy?: () => void }) {
  return (
    <div className={cn("p-3 bg-bg-tertiary rounded-lg", copyable && "cursor-pointer hover:bg-bg-secondary")} onClick={copyable ? onCopy : undefined}>
      <div className="text-xs text-text-tertiary flex items-center gap-1">
        {icon}
        {label}
        {copyable && <Copy size={10} className="ml-1" />}
      </div>
      <div className="text-sm font-medium text-text-primary mt-1">{value}</div>
    </div>
  );
}

function DateBlock({ label, primary, secondary, highlight }: { label: string; primary: string | null; secondary?: string; highlight?: boolean }) {
  if (!primary) return null;
  return (
    <div className={cn("p-3 rounded-lg", highlight ? "bg-warning/10" : "bg-bg-tertiary")}>
      <div className={cn("text-xs uppercase tracking-wide", highlight ? "text-warning" : "text-text-tertiary")}>{label}</div>
      <div className={cn("text-sm font-medium mt-1", highlight ? "text-warning" : "text-text-primary")}>{primary}</div>
      {secondary && <div className="text-xs text-text-secondary">{secondary}</div>}
    </div>
  );
}

function SummaryCard({ icon, title, mainValue, subText, detail }: { icon: React.ReactNode; title: string; mainValue: string; subText: string; detail?: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">{title}</span></div>
      <div className="text-3xl font-bold text-text-primary mt-2">{mainValue}</div>
      <p className="text-sm text-text-secondary mt-1">{subText}</p>
      {detail && <div className="mt-2">{detail}</div>}
    </Card>
  );
}

function BudgetRow({ label, amount, isTotal }: { label: string; amount: number; isTotal?: boolean }) {
  return (
    <div className={cn("flex justify-between", isTotal && "font-semibold text-lg")}>
      <span className={cn(isTotal ? "text-text-primary" : "text-text-secondary")}>{label}</span>
      <span className={cn(isTotal ? "text-text-primary" : "text-text-secondary")}>{formatCurrency(amount)}</span>
    </div>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-bg-tertiary transition-colors group">
      <span className="text-sm text-text-primary">{label}</span>
      <ExternalLink size={14} className="text-text-tertiary group-hover:text-brand-purple" />
    </a>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
      {icon}
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}

function formatEventType(type: string): string {
  switch (type) {
    case 'in_person': return 'In-Person';
    case 'virtual': return 'Virtual';
    case 'hybrid': return 'Hybrid';
    default: return type;
  }
}

function getFileIcon(fileType: string | null): string {
  if (!fileType) return '📄';
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
  return '📄';
}
