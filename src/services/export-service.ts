/**
 * export-service: Per-show download utilities.
 * Handles single-show CSV export and ICS calendar file generation.
 * Used by: detail-view (download show data), export-field-selector (choose CSV fields).
 * For bulk/org-level data export, see data-export-service.ts
 */

import { TradeShow } from '@/types';
import { ExportField } from '@/types/enums';
import { escapeCSV, stripHtml } from '@/lib/utils';
import { formatDateShort } from '@/lib/date-utils';
import { format, addDays, parseISO, isValid } from 'date-fns';

// ─── ICS Calendar Export ─────────────────────────────────────────────────────

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateICS(shows: TradeShow[]): string {
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Booth//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ].join('\r\n') + '\r\n';

  for (const show of shows) {
    if (!show.startDate) continue;
    const start = parseISO(show.startDate);
    if (!isValid(start)) continue;

    const end = show.endDate ? parseISO(show.endDate) : start;
    const endPlusOne = addDays(isValid(end) ? end : start, 1);

    const uid = `${show.id}-${Math.floor(Date.now() / 1000)}@tradeshowmanager`;
    const dtstamp = format(new Date(), "yyyyMMdd'T'HHmmss");
    const dtstart = format(start, 'yyyyMMdd');
    const dtend = format(endPlusOne, 'yyyyMMdd');

    let description = '';
    if (show.boothNumber) description += `Booth: ${show.boothNumber}\\n`;
    if (show.cost) description += `Cost: $${show.cost.toFixed(2)}\\n`;
    if (show.hotelName) description += `Hotel: ${show.hotelName}\\n`;
    if (show.generalNotes) description += `Notes: ${stripHtml(show.generalNotes)}`;

    ics += [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${escapeICS(show.name)}`,
      `LOCATION:${escapeICS(show.location ?? '')}`,
      `DESCRIPTION:${escapeICS(description)}`,
      'END:VEVENT',
    ].join('\r\n') + '\r\n';
  }

  ics += 'END:VCALENDAR';
  return ics;
}

export function downloadICS(shows: TradeShow[]): void {
  const content = generateICS(shows);
  downloadFile(content, 'trade_shows.ics', 'text/calendar');
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

function getFieldValue(show: TradeShow, field: ExportField): string {
  switch (field) {
    case ExportField.Name: return show.name;
    case ExportField.Location: return show.location ?? '';
    case ExportField.StartDate: return formatDateShort(show.startDate);
    case ExportField.EndDate: return formatDateShort(show.endDate);
    case ExportField.BoothNumber: return show.boothNumber ?? '';
    case ExportField.Cost: return show.cost?.toFixed(2) ?? '';
    case ExportField.RegistrationConfirmed: return show.registrationConfirmed ? 'Yes' : 'No';
    case ExportField.HotelName: return show.hotelName ?? '';
    case ExportField.HotelConfirmed: return show.hotelConfirmed ? 'Yes' : 'No';
    case ExportField.HotelCostPerNight: return show.hotelCostPerNight?.toFixed(2) ?? '';
    case ExportField.ShippingCutoff: return formatDateShort(show.shippingCutoff);
    case ExportField.ShippingCost: return show.shippingCost?.toFixed(2) ?? '';
    case ExportField.TrackingNumber: return show.trackingNumber ?? '';
    case ExportField.ManagementCompany: return show.managementCompany ?? '';
    case ExportField.ShowContactName: return show.showContactName ?? '';
    case ExportField.ShowContactEmail: return show.showContactEmail ?? '';
    case ExportField.TotalLeads: return show.totalLeads?.toString() ?? '';
    case ExportField.TotalAttending: return show.totalAttending?.toString() ?? '';
    case ExportField.ShowStatus: return show.showStatus ?? '';
    case ExportField.QualifiedLeads: return show.qualifiedLeads?.toString() ?? '';
    case ExportField.MeetingsBooked: return show.meetingsBooked?.toString() ?? '';
    case ExportField.DealsWon: return show.dealsWon?.toString() ?? '';
    case ExportField.RevenueAttributed: return show.revenueAttributed?.toFixed(2) ?? '';
    case ExportField.GeneralNotes: return stripHtml(show.generalNotes ?? '');
    default: return '';
  }
}

export function generateCSV(shows: TradeShow[], fields: ExportField[]): string {
  const header = fields.map(f => f).join(',');
  const rows = shows.map(show =>
    fields.map(field => escapeCSV(getFieldValue(show, field))).join(',')
  );
  return '\uFEFF' + header + '\n' + rows.join('\n');
}

export function downloadCSV(shows: TradeShow[], fields: ExportField[], fileName: string = 'trade_shows'): void {
  const content = generateCSV(shows, fields);
  downloadFile(content, `${fileName}.csv`, 'text/csv;charset=utf-8');
}

// ─── Email Draft Generation ──────────────────────────────────────────────────

export function generateEmailDraft(show: TradeShow): { subject: string; body: string } {
  const subject = `Trade Show: ${show.name} - ${formatDateShort(show.startDate)}`;
  
  const lines: string[] = [
    `Hi team,`,
    ``,
    `Here are the details for our upcoming trade show:`,
    ``,
    `**${show.name}**`,
  ];

  if (show.location) lines.push(`📍 Location: ${show.location}`);
  if (show.startDate) {
    const dateRange = show.endDate 
      ? `${formatDateShort(show.startDate)} - ${formatDateShort(show.endDate)}`
      : formatDateShort(show.startDate);
    lines.push(`📅 Dates: ${dateRange}`);
  }
  if (show.boothNumber) lines.push(`🎪 Booth: ${show.boothNumber}${show.boothSize ? ` (${show.boothSize})` : ''}`);
  if (show.hotelName) {
    lines.push(`🏨 Hotel: ${show.hotelName}`);
    if (show.hotelAddress) lines.push(`   ${show.hotelAddress}`);
  }

  lines.push(``);

  if (show.shippingCutoff) {
    lines.push(`📦 Shipping deadline: ${formatDateShort(show.shippingCutoff)}`);
  }
  if (show.trackingNumber) {
    lines.push(`📬 Tracking: ${show.trackingNumber}`);
  }

  if (show.showAgendaUrl || show.eventPortalUrl) {
    lines.push(``);
    lines.push(`**Links:**`);
    if (show.showAgendaUrl) lines.push(`- Agenda: ${show.showAgendaUrl}`);
    if (show.eventPortalUrl) lines.push(`- Event Portal: ${show.eventPortalUrl}`);
  }

  if (show.showContactName || show.showContactEmail) {
    lines.push(``);
    lines.push(`**Show Contact:**`);
    if (show.showContactName) lines.push(`- ${show.showContactName}`);
    if (show.showContactEmail) lines.push(`- ${show.showContactEmail}`);
  }

  if (show.generalNotes) {
    lines.push(``);
    lines.push(`**Notes:**`);
    lines.push(stripHtml(show.generalNotes));
  }

  lines.push(``);
  lines.push(`Let me know if you have any questions!`);

  return {
    subject,
    body: lines.join('\n'),
  };
}

export function openMailto(show: TradeShow): void {
  const { subject, body } = generateEmailDraft(show);
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto, '_blank');
}

// ─── Download Helper ─────────────────────────────────────────────────────────

function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
