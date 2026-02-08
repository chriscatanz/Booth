import { TradeShow, Attendee } from '@/types';
import { parseISO, isValid, isBefore } from 'date-fns';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function validateRequired(value: string | null | undefined, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
}

function validateLength(value: string | null | undefined, fieldName: string, min?: number, max?: number): string | null {
  if (!value) {
    if (min && min > 0) return `${fieldName} is required`;
    return null;
  }
  const trimmed = value.trim();
  if (min && trimmed.length < min) return `${fieldName} must be at least ${min} characters`;
  if (max && trimmed.length > max) return `${fieldName} must be no more than ${max} characters`;
  return null;
}

function validateEmail(value: string | null | undefined, fieldName: string = 'Email'): string | null {
  if (!value || !value.trim()) return null;
  if (!EMAIL_REGEX.test(value)) return `${fieldName} is not a valid email address`;
  return null;
}

function validateURL(value: string | null | undefined, fieldName: string = 'URL'): string | null {
  if (!value || !value.trim()) return null;
  try {
    new URL(value);
  } catch {
    return `${fieldName} is not a valid URL`;
  }
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return `${fieldName} is not a valid URL`;
  }
  return null;
}

function validatePositiveNumber(value: number | null | undefined, fieldName: string): string | null {
  if (value === null || value === undefined) return null;
  if (value < 0) return `${fieldName} must be a positive number`;
  return null;
}

export function validateTradeShow(show: TradeShow): ValidationResult {
  const errors: string[] = [];

  // Required: name
  const nameErr = validateRequired(show.name, 'Trade Show Name');
  if (nameErr) errors.push(nameErr);

  // Name length
  const nameLenErr = validateLength(show.name, 'Trade Show Name', 2, 200);
  if (nameLenErr && !nameErr) errors.push(nameLenErr);

  // Location length
  const locErr = validateLength(show.location, 'Location', undefined, 200);
  if (locErr) errors.push(locErr);

  // Date range
  if (show.startDate && show.endDate) {
    const start = parseISO(show.startDate);
    const end = parseISO(show.endDate);
    if (isValid(start) && isValid(end) && isBefore(end, start)) {
      errors.push('End Date cannot be before Start Date');
    }
  }

  // Shipping cutoff before start
  if (show.startDate && show.shippingCutoff) {
    const start = parseISO(show.startDate);
    const cutoff = parseISO(show.shippingCutoff);
    if (isValid(start) && isValid(cutoff) && isBefore(start, cutoff)) {
      errors.push('Shipping cutoff must be before the show start date');
    }
  }

  // Cost validations
  const costErr = validatePositiveNumber(show.cost, 'Total Cost');
  if (costErr) errors.push(costErr);
  const shipErr = validatePositiveNumber(show.shippingCost, 'Shipping Cost');
  if (shipErr) errors.push(shipErr);
  const hotelErr = validatePositiveNumber(show.hotelCostPerNight, 'Hotel Cost Per Night');
  if (hotelErr) errors.push(hotelErr);

  // URL validations
  const agendaErr = validateURL(show.showAgendaUrl, 'Show Agenda URL');
  if (agendaErr) errors.push(agendaErr);
  const portalErr = validateURL(show.eventPortalUrl, 'Event Portal URL');
  if (portalErr) errors.push(portalErr);

  // Email validation
  const emailErr = validateEmail(show.showContactEmail, 'Show Contact Email');
  if (emailErr) errors.push(emailErr);

  return { isValid: errors.length === 0, errors };
}

export function validateAttendee(attendee: Attendee): ValidationResult {
  const errors: string[] = [];

  const nameErr = validateRequired(attendee.name, 'Attendee Name');
  if (nameErr) errors.push(nameErr);

  const emailErr = validateEmail(attendee.email, 'Attendee Email');
  if (emailErr) errors.push(emailErr);

  if (attendee.arrivalDate && attendee.departureDate) {
    const arrival = parseISO(attendee.arrivalDate);
    const departure = parseISO(attendee.departureDate);
    if (isValid(arrival) && isValid(departure) && isBefore(departure, arrival)) {
      errors.push('Departure Date cannot be before Arrival Date');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAttendees(attendees: Attendee[]): { index: number; result: ValidationResult }[] {
  return attendees
    .map((att, index) => ({ index, result: validateAttendee(att) }))
    .filter(item => !item.result.isValid);
}
