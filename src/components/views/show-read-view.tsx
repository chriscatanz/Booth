'use client';

import { TradeShow, Attendee, AdditionalFile } from '@/types';
import { 
  totalEstimatedCost, 
  parseJsonStringArray 
} from '@/types/computed';
import { formatCurrency, cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { 
  MapPin, Calendar, Users, DollarSign, 
  Building, FileText, CheckSquare, ExternalLink,
  ArrowRight, Globe, User2, Briefcase, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShowReadViewProps {
  show: TradeShow;
  attendees: Attendee[];
  files?: AdditionalFile[];
  tasks?: { completed: number; total: number };
  onEdit?: () => void;
  canEdit?: boolean;
}

export function ShowReadView({ show, attendees, files = [], tasks, onEdit, canEdit }: ShowReadViewProps) {
  // Computed values
  const totalCost = totalEstimatedCost(show);
  const confirmedCost = (show.cost || 0) + (show.shippingCost || 0); // Rough estimate of confirmed
  const costProgress = totalCost > 0 ? Math.min(100, Math.round((confirmedCost / totalCost) * 100)) : 0;
  
  // Days until show
  const daysUntil = show.startDate 
    ? differenceInDays(parseISO(show.startDate), new Date())
    : null;
  const isUpcoming = daysUntil !== null && daysUntil >= 0;
  
  // Task progress
  const taskCompleted = tasks?.completed || 0;
  const taskTotal = tasks?.total || 0;
  const taskProgress = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;

  // Open map for venue
  const openMap = () => {
    const address = show.venueAddress || show.venueName || show.location;
    if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Row: Show Info | Venue | Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Show Information Card */}
        <Card className="md:col-span-1">
          <CardTitle icon={<Briefcase size={16} />} title="Show Information" />
          <div className="space-y-3 mt-4">
            {show.managementCompany && (
              <InfoRow label="Organization" value={show.managementCompany} />
            )}
            {show.totalAttending && show.totalAttending > 0 && (
              <InfoRow label="Expected Attendance" value={`${show.totalAttending.toLocaleString()}+`} />
            )}
            {show.eventType && (
              <InfoRow label="Type" value={formatEventType(show.eventType)} />
            )}
            {show.showWebsite && (
              <InfoRow 
                label="Website" 
                value={
                  <a 
                    href={show.showWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-purple hover:underline flex items-center gap-1"
                  >
                    {new URL(show.showWebsite).hostname.replace('www.', '')}
                    <ExternalLink size={12} />
                  </a>
                } 
              />
            )}
            {!show.managementCompany && !show.totalAttending && !show.showWebsite && (
              <p className="text-sm text-text-tertiary italic">No show information added yet</p>
            )}
          </div>
        </Card>

        {/* Venue Card */}
        <Card className="md:col-span-1">
          <CardTitle icon={<Building size={16} />} title="Venue" />
          <div className="space-y-3 mt-4">
            {show.venueName && (
              <InfoRow label="Location" value={show.venueName} />
            )}
            {show.venueAddress && (
              <>
                <InfoRow label="Address" value={show.venueAddress.split(',')[0]} />
                {show.venueAddress.includes(',') && (
                  <InfoRow label="City, State" value={show.venueAddress.split(',').slice(1).join(',').trim()} />
                )}
              </>
            )}
            {!show.venueName && show.location && (
              <InfoRow label="Location" value={show.location} />
            )}
            {(show.venueAddress || show.venueName || show.location) && (
              <Button variant="outline" size="sm" onClick={openMap} className="mt-2">
                View Map
              </Button>
            )}
            {!show.venueName && !show.venueAddress && !show.location && (
              <p className="text-sm text-text-tertiary italic">No venue information added yet</p>
            )}
          </div>
        </Card>

        {/* Countdown Card */}
        <Card className="md:col-span-1 flex flex-col items-center justify-center text-center bg-gradient-to-br from-brand-purple/5 to-brand-purple/10">
          <div className="text-xs text-brand-purple font-medium uppercase tracking-wide mb-2">Countdown</div>
          {isUpcoming && daysUntil !== null ? (
            <>
              <div className="text-6xl font-bold text-brand-purple">{daysUntil}</div>
              <div className="text-text-secondary mt-1">days until show</div>
            </>
          ) : daysUntil !== null && daysUntil < 0 ? (
            <>
              <div className="text-4xl font-bold text-text-tertiary">Complete</div>
              <div className="text-text-secondary mt-1">Show ended {Math.abs(daysUntil)} days ago</div>
            </>
          ) : (
            <>
              <div className="text-4xl font-bold text-text-tertiary">—</div>
              <div className="text-text-secondary mt-1">No date set</div>
            </>
          )}
        </Card>
      </div>

      {/* Bottom Row: Budget | Team | Documents | Tasks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Budget Card */}
        <SummaryCard
          icon={<DollarSign size={16} className="text-success" />}
          title="Budget"
          mainValue={formatCurrency(totalCost)}
          subText="Total estimated cost"
          progress={costProgress}
          progressColor="bg-success"
          footer={confirmedCost > 0 ? `${formatCurrency(confirmedCost)} confirmed` : undefined}
        />

        {/* Team Card */}
        <SummaryCard
          icon={<Users size={16} className="text-brand-purple" />}
          title="Team"
          customContent={
            <div className="mt-2">
              {attendees.length > 0 ? (
                <>
                  <div className="flex -space-x-2 mb-2">
                    {attendees.slice(0, 3).map((a, i) => (
                      <div 
                        key={a.localId}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-white text-sm font-medium border-2 border-surface"
                        style={{ zIndex: 3 - i }}
                      >
                        {a.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    ))}
                    {attendees.length > 3 && (
                      <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-secondary text-xs font-medium border-2 border-surface">
                        +{attendees.length - 3}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{attendees.length} team member{attendees.length !== 1 ? 's' : ''} assigned</p>
                </>
              ) : (
                <p className="text-sm text-text-tertiary">No team assigned</p>
              )}
            </div>
          }
        />

        {/* Documents Card */}
        <SummaryCard
          icon={<FileText size={16} className="text-warning" />}
          title="Documents"
          mainValue={files.length.toString()}
          subText="Files uploaded"
          linkText={files.length > 0 ? "View all →" : undefined}
        />

        {/* Tasks Card */}
        <SummaryCard
          icon={<CheckSquare size={16} className="text-brand-cyan" />}
          title="Tasks"
          mainValue={`${taskCompleted} / ${taskTotal}`}
          subText="Tasks completed"
          progress={taskProgress}
          progressColor="bg-brand-cyan"
          footer={taskTotal > 0 ? `${taskProgress}% complete` : undefined}
        />
      </div>

      {/* Show Contact */}
      {(show.showContactName || show.showContactEmail || show.showContactPhone) && (
        <Card>
          <CardTitle icon={<User2 size={16} />} title="Show Contact" />
          <div className="flex flex-wrap items-center gap-4 mt-3">
            {show.showContactName && (
              <span className="text-text-primary font-medium">{show.showContactName}</span>
            )}
            {show.showContactEmail && (
              <a href={`mailto:${show.showContactEmail}`} className="text-sm text-brand-purple hover:underline">
                {show.showContactEmail}
              </a>
            )}
            {show.showContactPhone && (
              <a href={`tel:${show.showContactPhone}`} className="text-sm text-brand-purple hover:underline">
                {show.showContactPhone}
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Notes Preview */}
      {show.generalNotes && (
        <Card>
          <CardTitle icon={<FileText size={16} />} title="Notes" />
          <div 
            className="mt-3 text-sm text-text-secondary line-clamp-4 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: show.generalNotes }}
          />
        </Card>
      )}

      {/* Floating Edit Button */}
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

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "bg-surface border border-border rounded-xl p-5",
      className
    )}>
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

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  mainValue?: string;
  subText?: string;
  progress?: number;
  progressColor?: string;
  footer?: string;
  linkText?: string;
  customContent?: React.ReactNode;
}

function SummaryCard({ 
  icon, title, mainValue, subText, progress, progressColor, footer, linkText, customContent 
}: SummaryCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">{title}</span>
      </div>
      
      {customContent || (
        <>
          {mainValue && (
            <div className="text-3xl font-bold text-text-primary mt-2">{mainValue}</div>
          )}
          {subText && (
            <p className="text-sm text-text-secondary mt-1">{subText}</p>
          )}
        </>
      )}
      
      {progress !== undefined && progress > 0 && (
        <div className="mt-3 h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all", progressColor || "bg-brand-purple")}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {footer && (
        <p className="text-xs text-text-tertiary mt-2">{footer}</p>
      )}
      
      {linkText && (
        <button className="text-sm text-brand-purple hover:underline mt-2 flex items-center gap-1">
          {linkText}
        </button>
      )}
    </Card>
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
