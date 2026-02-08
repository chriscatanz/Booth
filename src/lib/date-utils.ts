import { parseISO, format, isValid, differenceInDays, addYears } from 'date-fns';

// Parse a date string from Supabase (handles various formats)
export function parseSupabaseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;

  // Handle epoch sentinel values
  if (dateStr.startsWith('1969-12-31') || dateStr.startsWith('1970-01-01')) return null;

  const date = parseISO(dateStr);
  return isValid(date) ? date : null;
}

// Format a date for display
export function formatDate(dateStr: string | null): string {
  const date = parseSupabaseDate(dateStr);
  if (!date) return '';
  return format(date, 'MMM d, yyyy');
}

// Format a date for long display
export function formatDateLong(dateStr: string | null): string {
  const date = parseSupabaseDate(dateStr);
  if (!date) return '';
  return format(date, 'MMMM d, yyyy');
}

// Format for short display
export function formatDateShort(dateStr: string | null): string {
  const date = parseSupabaseDate(dateStr);
  if (!date) return '';
  return format(date, 'M/d/yy');
}

// Format date for DB (yyyy-MM-dd)
export function formatDateForDB(date: Date | null): string | null {
  if (!date || !isValid(date)) return null;
  return format(date, 'yyyy-MM-dd');
}

// Days until a date from today
export function daysUntil(dateStr: string | null): number | null {
  const date = parseSupabaseDate(dateStr);
  if (!date) return null;
  return differenceInDays(date, new Date());
}

// Human-readable "days away" text
export function daysAwayText(dateStr: string | null): string {
  const days = daysUntil(dateStr);
  if (days === null) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${Math.abs(days)}d ago`;
  return `${days}d`;
}

// Get month abbreviation from a date string
export function getMonthAbbrev(dateStr: string | null): string {
  const date = parseSupabaseDate(dateStr);
  if (!date) return '';
  return format(date, 'MMM').toUpperCase();
}

// Get day number from a date string
export function getDayNumber(dateStr: string | null): string {
  const date = parseSupabaseDate(dateStr);
  if (!date) return '';
  return format(date, 'd');
}

// Shift a date by one year (for duplicate show)
export function shiftDateByOneYear(dateStr: string | null): string | null {
  const date = parseSupabaseDate(dateStr);
  if (!date) return null;
  return formatDateForDB(addYears(date, 1));
}

// Format date range
export function formatDateRange(startStr: string | null, endStr: string | null): string {
  const start = parseSupabaseDate(startStr);
  const end = parseSupabaseDate(endStr);
  if (!start) return '';
  if (!end || start.getTime() === end.getTime()) return format(start, 'MMM d, yyyy');
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
}
