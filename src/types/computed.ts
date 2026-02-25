import { TradeShow, Attendee } from './index';
import { differenceInDays, parseISO, isValid } from 'date-fns';

// Parse a JSON string array from Supabase text column
export function parseJsonStringArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Total booth services cost (electrical + labor + internet + standard)
export function totalServicesCost(show: TradeShow): number {
  return (show.electricalCost ?? 0) +
    (show.laborCost ?? 0) +
    (show.internetCost ?? 0) +
    (show.standardServicesCost ?? 0);
}

// Estimated hotel cost based on show dates
export function estimatedHotelCost(show: TradeShow, attendees?: Attendee[]): number {
  const costPerNight = show.hotelCostPerNight;
  if (!costPerNight || costPerNight <= 0) return 0;

  // Default nights from show dates
  let defaultNights = 1;
  if (show.startDate && show.endDate) {
    const start = parseISO(show.startDate);
    const end = parseISO(show.endDate);
    if (isValid(start) && isValid(end)) {
      defaultNights = Math.max(1, differenceInDays(end, start));
    }
  }

  // If attendees provided, sum each person's actual stay duration
  const showAttendees = attendees?.filter(a => a.tradeshowId === show.id) ?? [];
  if (showAttendees.length > 0) {
    let total = 0;
    for (const a of showAttendees) {
      let nights = defaultNights;
      if (a.arrivalDate && a.departureDate) {
        const arrival = parseISO(a.arrivalDate);
        const departure = parseISO(a.departureDate);
        if (isValid(arrival) && isValid(departure)) {
          nights = Math.max(1, differenceInDays(departure, arrival));
        }
      }
      total += nights * costPerNight;
    }
    return total;
  }

  // Fallback: no attendees — estimate using show duration only (single-room estimate)
  return defaultNights * costPerNight;
}

// Total estimated cost for the show
export function totalEstimatedCost(show: TradeShow, attendees?: Attendee[]): number {
  return (show.cost ?? 0) +
    (show.shippingCost ?? 0) +
    totalServicesCost(show) +
    estimatedHotelCost(show, attendees);
}

// Cost per lead (uses estimated total cost - hotel based on show dates)
export function costPerLead(show: TradeShow): number | null {
  const leads = show.totalLeads;
  if (!leads || leads <= 0) return null;
  const total = totalEstimatedCost(show);
  if (total <= 0) return null;
  return total / leads;
}

// Cost per qualified lead
export function costPerQualifiedLead(show: TradeShow): number | null {
  const qualifiedLeads = show.qualifiedLeads;
  if (!qualifiedLeads || qualifiedLeads <= 0) return null;
  const total = totalEstimatedCost(show);
  if (total <= 0) return null;
  return total / qualifiedLeads;
}

// Lead qualification rate
export function leadQualificationRate(show: TradeShow): number | null {
  const totalLeads = show.totalLeads;
  const qualifiedLeads = show.qualifiedLeads;
  if (!totalLeads || totalLeads <= 0 || !qualifiedLeads) return null;
  return (qualifiedLeads / totalLeads) * 100;
}

// Meetings per qualified lead
export function meetingsPerQualifiedLead(show: TradeShow): number | null {
  const qualifiedLeads = show.qualifiedLeads;
  const meetings = show.meetingsBooked;
  if (!qualifiedLeads || qualifiedLeads <= 0 || !meetings) return null;
  return meetings / qualifiedLeads;
}

// Deal close rate (deals won / meetings booked)
export function dealCloseRate(show: TradeShow): number | null {
  const meetings = show.meetingsBooked;
  const deals = show.dealsWon;
  if (!meetings || meetings <= 0 || !deals) return null;
  return (deals / meetings) * 100;
}

// Revenue per deal
export function revenuePerDeal(show: TradeShow): number | null {
  const deals = show.dealsWon;
  const revenue = show.revenueAttributed;
  if (!deals || deals <= 0 || !revenue) return null;
  return revenue / deals;
}

// ROI percentage
export function roiPercentage(show: TradeShow): number | null {
  const revenue = show.revenueAttributed;
  if (!revenue || revenue <= 0) return null;
  const total = totalEstimatedCost(show);
  if (total <= 0) return null;
  return ((revenue - total) / total) * 100;
}

// Days until the show starts (negative = past)
export function daysUntilShow(show: TradeShow): number | null {
  if (!show.startDate) return null;
  const start = parseISO(show.startDate);
  if (!isValid(start)) return null;
  return differenceInDays(start, new Date());
}

// Whether the show needs attention
export function needsAttention(show: TradeShow): boolean {
  return show.registrationConfirmed !== true ||
    show.hotelConfirmed !== true ||
    (show.startDate !== null && show.shippingCutoff === null);
}

// Whether the show is upcoming
export function isUpcoming(show: TradeShow): boolean {
  const days = daysUntilShow(show);
  return days !== null && days >= 0;
}

// Whether the show is happening soon (within 30 days)
export function isHappeningSoon(show: TradeShow): boolean {
  const days = daysUntilShow(show);
  return days !== null && days >= 0 && days <= 30;
}

// Whether shipping cutoff is approaching (within 7 days)
export function shippingCutoffApproaching(show: TradeShow): boolean {
  if (!show.shippingCutoff) return false;
  const cutoff = parseISO(show.shippingCutoff);
  if (!isValid(cutoff)) return false;
  const days = differenceInDays(cutoff, new Date());
  return days >= 0 && days <= 7;
}

// Hotel cost based on attendees and show dates (for budget view)
export function hotelCostForShow(show: TradeShow, attendees: Attendee[]): number {
  const costPerNight = show.hotelCostPerNight;
  if (!costPerNight || costPerNight <= 0) return 0;

  const showAttendees = attendees.filter(a => a.tradeshowId === show.id);
  if (showAttendees.length === 0) return 0;

  // Default nights from show dates
  let defaultNights = 1;
  if (show.startDate && show.endDate) {
    const start = parseISO(show.startDate);
    const end = parseISO(show.endDate);
    if (isValid(start) && isValid(end)) {
      defaultNights = Math.max(1, differenceInDays(end, start));
    }
  }

  let totalCost = 0;
  for (const attendee of showAttendees) {
    let nights = defaultNights;
    if (attendee.arrivalDate && attendee.departureDate) {
      const arrival = parseISO(attendee.arrivalDate);
      const departure = parseISO(attendee.departureDate);
      if (isValid(arrival) && isValid(departure)) {
        nights = Math.max(1, differenceInDays(departure, arrival));
      }
    }
    totalCost += nights * costPerNight;
  }

  return totalCost;
}

// Flight cost for a show
export function flightCostForShow(show: TradeShow, attendees: Attendee[]): number {
  return attendees
    .filter(a => a.tradeshowId === show.id)
    .reduce((sum, a) => sum + (a.flightCost ?? 0), 0);
}

// Total cost for a show (base + shipping + hotel + services + flights)
export function totalCostForShow(show: TradeShow, attendees: Attendee[]): number {
  return (show.cost ?? 0) +
    (show.shippingCost ?? 0) +
    hotelCostForShow(show, attendees) +
    totalServicesCost(show) +
    flightCostForShow(show, attendees);
}
