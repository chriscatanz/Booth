import { TradeShow } from '@/types';

export interface ShowCompleteness {
  percentage: number;
  completed: string[];
  missing: string[];
}

/**
 * Calculate the completeness of a trade show based on key completion fields
 * This implements the Zeigarnik Effect by highlighting incomplete tasks
 */
interface CompletenessOptions {
  /** Pass true when the show has at least one kit assigned in the kit_assignments table */
  hasKitAssignment?: boolean;
}

export function calculateShowCompleteness(show: TradeShow, options: CompletenessOptions = {}): ShowCompleteness {
  const tasks = [
    {
      id: 'basic_info',
      label: 'Basic Information',
      completed: !!(show.name && show.startDate && show.location && show.eventType)
    },
    {
      id: 'registration',
      label: 'Registration Confirmed',
      completed: show.registrationConfirmed === true
    },
    {
      id: 'booth_details',
      label: 'Booth Details',
      completed: !!(show.boothNumber && show.boothSizeId)
    },
    {
      id: 'hotel_booking',
      label: 'Hotel Booked',
      completed: show.hotelConfirmed === true
    },
    {
      id: 'booth_kit',
      label: 'Booth Kit Assigned',
      completed: options.hasKitAssignment === true
    },
    {
      id: 'shipping',
      label: 'Shipping Arranged',
      completed: !!(show.trackingNumber || show.shippingInfo)
    },
    {
      id: 'utilities',
      label: 'Utilities Booked',
      completed: show.utilitiesBooked === true
    },
    {
      id: 'labor',
      label: 'Labor Arranged',
      completed: show.laborBooked === true || show.laborNotRequired === true
    },
    {
      id: 'attendee_list',
      label: 'Attendee List Received',
      completed: show.attendeeListReceived === true
    },
    {
      id: 'lead_capture',
      label: 'Lead Capture System',
      completed: !!(show.leadCaptureSystemId && show.leadCaptureSystem) || show.leadCaptureNotRequired === true
    }
  ];

  const completed = tasks.filter(task => task.completed);
  const missing = tasks.filter(task => !task.completed);
  const percentage = Math.round((completed.length / tasks.length) * 100);

  return {
    percentage,
    completed: completed.map(task => task.label),
    missing: missing.map(task => task.label)
  };
}

/**
 * Get completion status message and color based on percentage
 */
export function getCompletionStatus(percentage: number): {
  message: string;
  colorClass: string;
  bgClass: string;
} {
  if (percentage >= 80) {
    return {
      message: 'Almost ready!',
      colorClass: 'text-success',
      bgClass: 'bg-success/10'
    };
  } else if (percentage >= 50) {
    return {
      message: 'In progress',
      colorClass: 'text-warning',
      bgClass: 'bg-warning/10'
    };
  } else {
    return {
      message: 'Needs attention',
      colorClass: 'text-error',
      bgClass: 'bg-error/10'
    };
  }
}