'use client';

import { TradeShow, Attendee } from '@/types';
import { 
  totalEstimatedCost, totalServicesCost, estimatedHotelCost,
  parseJsonStringArray 
} from '@/types/computed';
import { formatCurrency, cn } from '@/lib/utils';
import { format, differenceInDays, parseISO, isAfter } from 'date-fns';
import { 
  MapPin, Calendar, Hash, Users, DollarSign, 
  Building, Hotel, Truck, Package, Clock, 
  Phone, Mail, ExternalLink, FileText, CheckCircle2, 
  AlertCircle, Zap, Wifi, Wrench, User, Copy,
  Navigation, Car, Plane
} from 'lucide-react';
import { VenueMap } from '@/components/ui/venue-map';
import { Button } from '@/components/ui/button';
import { useToastStore } from '@/store/toast-store';

interface ShowReadViewProps {
  show: TradeShow;
  attendees: Attendee[];
  onEdit?: () => void;
  canEdit?: boolean;
}

export function ShowReadView({ show, attendees, onEdit, canEdit }: ShowReadViewProps) {
  const toast = useToastStore();
  
  // Computed values
  const totalCost = totalEstimatedCost(show);
  const servicesCost = totalServicesCost(show);
  const hotelCost = estimatedHotelCost(show);
  const graphicsToShip = parseJsonStringArray(show.graphicsToShip);
  const packingItems = parseJsonStringArray(show.packingListItems);
  
  // Days until show
  const daysUntil = show.startDate 
    ? differenceInDays(parseISO(show.startDate), new Date())
    : null;
  const isUpcoming = daysUntil !== null && daysUntil >= 0;
  const isPast = daysUntil !== null && daysUntil < 0;
  
  // Format dates nicely
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };
  
  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // Open directions
  const openDirections = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Days Until */}
        {isUpcoming && daysUntil !== null && (
          <div className="bg-brand-purple/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-brand-purple">{daysUntil}</div>
            <div className="text-xs text-text-secondary mt-1">days to go</div>
          </div>
        )}
        {isPast && (
          <div className="bg-text-tertiary/10 rounded-xl p-4 text-center">
            <div className="text-lg font-semibold text-text-tertiary">Completed</div>
            <div className="text-xs text-text-secondary mt-1">{formatShortDate(show.endDate)}</div>
          </div>
        )}
        
        {/* Booth */}
        {show.boothNumber && (
          <div 
            className="bg-success/10 rounded-xl p-4 text-center cursor-pointer hover:bg-success/20 transition-colors"
            onClick={() => copyToClipboard(show.boothNumber!, 'Booth number')}
          >
            <div className="text-2xl font-bold text-success">#{show.boothNumber}</div>
            <div className="text-xs text-text-secondary mt-1">booth</div>
          </div>
        )}
        
        {/* Total Cost */}
        {totalCost > 0 && (
          <div className="bg-warning/10 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-warning">{formatCurrency(totalCost)}</div>
            <div className="text-xs text-text-secondary mt-1">total cost</div>
          </div>
        )}
        
        {/* Team Size */}
        {attendees.length > 0 && (
          <div className="bg-brand-cyan/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-brand-cyan">{attendees.length}</div>
            <div className="text-xs text-text-secondary mt-1">attending</div>
          </div>
        )}
      </div>

      {/* Key Dates Card */}
      <Card>
        <CardHeader icon={<Calendar size={18} />} title="Event Dates" />
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-20 text-xs text-text-tertiary uppercase tracking-wide pt-0.5">Show</div>
            <div className="flex-1">
              <div className="text-text-primary font-medium">
                {formatDate(show.startDate)}
                {show.endDate && show.endDate !== show.startDate && (
                  <> — {formatDate(show.endDate)}</>
                )}
              </div>
              {show.location && (
                <div className="text-sm text-text-secondary mt-0.5">{show.location}</div>
              )}
            </div>
          </div>
          
          {(show.moveInDate || show.moveOutDate) && (
            <>
              <hr className="border-border" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {show.moveInDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-20 text-xs text-text-tertiary uppercase tracking-wide pt-0.5">Move-In</div>
                    <div>
                      <div className="text-text-primary">{formatDate(show.moveInDate)}</div>
                      {show.moveInTime && (
                        <div className="text-sm text-text-secondary">{show.moveInTime}</div>
                      )}
                    </div>
                  </div>
                )}
                {show.moveOutDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-20 text-xs text-text-tertiary uppercase tracking-wide pt-0.5">Move-Out</div>
                    <div>
                      <div className="text-text-primary">{formatDate(show.moveOutDate)}</div>
                      {show.moveOutTime && (
                        <div className="text-sm text-text-secondary">{show.moveOutTime}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Venue & Hotel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Venue */}
        {(show.venueName || show.venueAddress) && (
          <Card>
            <CardHeader icon={<Building size={18} />} title="Venue" />
            <div className="space-y-3">
              {show.venueName && (
                <div className="text-text-primary font-medium">{show.venueName}</div>
              )}
              {show.venueAddress && (
                <div className="text-sm text-text-secondary">{show.venueAddress}</div>
              )}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openDirections(show.venueAddress || show.venueName || '')}
                >
                  <Navigation size={14} /> Directions
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        {/* Hotel */}
        {(show.hotelName || show.hotelAddress) && (
          <Card>
            <CardHeader icon={<Hotel size={18} />} title="Hotel" />
            <div className="space-y-3">
              {show.hotelName && (
                <div className="text-text-primary font-medium">{show.hotelName}</div>
              )}
              {show.hotelAddress && (
                <div className="text-sm text-text-secondary">{show.hotelAddress}</div>
              )}
              {show.hotelConfirmationNumber && (
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => copyToClipboard(show.hotelConfirmationNumber!, 'Confirmation')}
                >
                  <span className="text-xs text-text-tertiary">Conf:</span>
                  <span className="text-sm text-text-primary font-mono">{show.hotelConfirmationNumber}</span>
                  <Copy size={12} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              {show.hotelCostPerNight && (
                <div className="text-sm text-text-secondary">
                  {formatCurrency(show.hotelCostPerNight)}/night
                  {hotelCost > 0 && <span className="text-text-tertiary"> • Est. {formatCurrency(hotelCost)} total</span>}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openDirections(show.hotelAddress || show.hotelName || '')}
                >
                  <Navigation size={14} /> Directions
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Map */}
      {(show.venueAddress || show.hotelAddress) && (
        <Card noPadding>
          <VenueMap 
            venueAddress={show.venueAddress} 
            hotelAddress={show.hotelAddress}
            venueName={show.venueName}
            hotelName={show.hotelName}
          />
        </Card>
      )}

      {/* Booth & Setup */}
      {(show.boothNumber || show.boothSize || show.leadCaptureSystem) && (
        <Card>
          <CardHeader icon={<Package size={18} />} title="Booth Setup" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {show.boothNumber && (
              <InfoItem label="Booth #" value={show.boothNumber} />
            )}
            {show.boothSize && (
              <InfoItem label="Size" value={show.boothSize} />
            )}
            {show.leadCaptureSystem && (
              <InfoItem label="Lead Capture" value={show.leadCaptureSystem} />
            )}
          </div>
          
          {/* Services */}
          {(show.utilitiesBooked || show.laborBooked || show.electricalCost || show.internetCost) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-text-tertiary uppercase tracking-wide mb-3">Services</div>
              <div className="flex flex-wrap gap-2">
                {show.electricalCost && (
                  <ServiceBadge icon={<Zap size={12} />} label="Electrical" cost={show.electricalCost} />
                )}
                {show.internetCost && (
                  <ServiceBadge icon={<Wifi size={12} />} label="Internet" cost={show.internetCost} />
                )}
                {show.laborCost && (
                  <ServiceBadge icon={<Wrench size={12} />} label="Labor" cost={show.laborCost} />
                )}
                {show.standardServicesCost && (
                  <ServiceBadge icon={<Truck size={12} />} label="Drayage" cost={show.standardServicesCost} />
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Shipping */}
      {(show.trackingNumber || show.shippingInfo || show.shippingCutoff) && (
        <Card>
          <CardHeader icon={<Truck size={18} />} title="Shipping" />
          <div className="space-y-4">
            {show.trackingNumber && (
              <div 
                className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg cursor-pointer hover:bg-bg-secondary transition-colors"
                onClick={() => copyToClipboard(show.trackingNumber!, 'Tracking number')}
              >
                <Package size={16} className="text-brand-purple" />
                <div className="flex-1">
                  <div className="text-xs text-text-tertiary">Tracking Number</div>
                  <div className="text-sm text-text-primary font-mono">{show.trackingNumber}</div>
                </div>
                <Copy size={14} className="text-text-tertiary" />
              </div>
            )}
            
            {show.shippingCutoff && (
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-warning mt-0.5" />
                <div>
                  <div className="text-xs text-text-tertiary">Ship By</div>
                  <div className="text-sm text-text-primary">{formatDate(show.shippingCutoff)}</div>
                </div>
              </div>
            )}
            
            {show.shippingInfo && (
              <div className="text-sm text-text-secondary whitespace-pre-wrap">{show.shippingInfo}</div>
            )}
          </div>
        </Card>
      )}

      {/* Team */}
      {attendees.length > 0 && (
        <Card>
          <CardHeader icon={<Users size={18} />} title={`Team (${attendees.length})`} />
          <div className="space-y-3">
            {attendees.map((attendee) => (
              <div key={attendee.localId} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple text-sm font-medium">
                  {attendee.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary font-medium truncate">{attendee.name}</div>
                  {attendee.email && (
                    <div className="text-xs text-text-secondary truncate">{attendee.email}</div>
                  )}
                </div>
                {attendee.email && (
                  <a 
                    href={`mailto:${attendee.email}`}
                    className="p-2 text-text-tertiary hover:text-brand-purple transition-colors"
                  >
                    <Mail size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contact */}
      {(show.showContactName || show.showContactEmail || show.showContactPhone) && (
        <Card>
          <CardHeader icon={<User size={18} />} title="Show Contact" />
          <div className="space-y-2">
            {show.showContactName && (
              <div className="text-text-primary font-medium">{show.showContactName}</div>
            )}
            {show.showContactEmail && (
              <a 
                href={`mailto:${show.showContactEmail}`}
                className="flex items-center gap-2 text-sm text-brand-purple hover:underline"
              >
                <Mail size={14} />
                {show.showContactEmail}
              </a>
            )}
            {show.showContactPhone && (
              <a 
                href={`tel:${show.showContactPhone}`}
                className="flex items-center gap-2 text-sm text-brand-purple hover:underline"
              >
                <Phone size={14} />
                {show.showContactPhone}
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Budget Summary */}
      {totalCost > 0 && (
        <Card>
          <CardHeader icon={<DollarSign size={18} />} title="Budget" />
          <div className="space-y-3">
            {show.cost && (
              <BudgetRow label="Registration/Booth" amount={show.cost} />
            )}
            {servicesCost > 0 && (
              <BudgetRow label="Services" amount={servicesCost} />
            )}
            {show.shippingCost && (
              <BudgetRow label="Shipping" amount={show.shippingCost} />
            )}
            {hotelCost > 0 && (
              <BudgetRow label="Hotel (est.)" amount={hotelCost} />
            )}
            <hr className="border-border" />
            <BudgetRow label="Total" amount={totalCost} isTotal />
          </div>
        </Card>
      )}

      {/* Links */}
      {(show.showWebsite || show.eventPortalUrl || show.showAgendaUrl) && (
        <Card>
          <CardHeader icon={<ExternalLink size={18} />} title="Links" />
          <div className="space-y-2">
            {show.showWebsite && (
              <LinkRow label="Show Website" url={show.showWebsite} />
            )}
            {show.eventPortalUrl && (
              <LinkRow label="Exhibitor Portal" url={show.eventPortalUrl} />
            )}
            {show.showAgendaUrl && (
              <LinkRow label="Agenda" url={show.showAgendaUrl} />
            )}
          </div>
        </Card>
      )}

      {/* Notes */}
      {show.generalNotes && (
        <Card>
          <CardHeader icon={<FileText size={18} />} title="Notes" />
          <div 
            className="prose prose-sm max-w-none text-text-secondary whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: show.generalNotes }}
          />
        </Card>
      )}

      {/* Floating Edit Button - bottom left to avoid chat widget */}
      {canEdit && onEdit && (
        <div className="fixed bottom-6 left-6 z-40">
          <Button 
            variant="primary" 
            size="lg"
            onClick={onEdit}
            className="shadow-lg"
          >
            Edit Show
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function Card({ children, noPadding }: { children: React.ReactNode; noPadding?: boolean }) {
  return (
    <div className={cn(
      "bg-surface border border-border rounded-xl overflow-hidden",
      !noPadding && "p-4 sm:p-5"
    )}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-brand-purple">{icon}</span>
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{title}</h3>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-tertiary">{label}</div>
      <div className="text-sm text-text-primary font-medium">{value}</div>
    </div>
  );
}

function ServiceBadge({ icon, label, cost }: { icon: React.ReactNode; label: string; cost: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary rounded-lg">
      <span className="text-text-tertiary">{icon}</span>
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs text-text-primary font-medium">{formatCurrency(cost)}</span>
    </div>
  );
}

function BudgetRow({ label, amount, isTotal }: { label: string; amount: number; isTotal?: boolean }) {
  return (
    <div className={cn(
      "flex justify-between",
      isTotal && "font-semibold"
    )}>
      <span className={cn("text-sm", isTotal ? "text-text-primary" : "text-text-secondary")}>{label}</span>
      <span className={cn("text-sm", isTotal ? "text-text-primary" : "text-text-secondary")}>{formatCurrency(amount)}</span>
    </div>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-bg-tertiary transition-colors group"
    >
      <span className="text-sm text-text-primary">{label}</span>
      <ExternalLink size={14} className="text-text-tertiary group-hover:text-brand-purple transition-colors" />
    </a>
  );
}
