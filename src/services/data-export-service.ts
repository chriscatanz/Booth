/**
 * Data Export Service
 * 
 * Allows users to export their data in various formats.
 * Supports: CSV, JSON
 */

import { TradeShow, Attendee } from '@/types';
import { formatDateRange } from '@/lib/date-utils';
import { totalEstimatedCost, costPerLead } from '@/types/computed';

// CSV escape helper
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Generate CSV from shows
export function exportShowsToCSV(shows: TradeShow[]): string {
  const headers = [
    'Name',
    'Location',
    'Start Date',
    'End Date',
    'Status',
    'Booth Number',
    'Booth Size',
    'Booth Cost',
    'Shipping Cost',
    'Electrical Cost',
    'Labor Cost',
    'Internet Cost',
    'Services Cost',
    'Hotel Cost/Night',
    'Total Estimated Cost',
    'Total Leads',
    'Qualified Leads',
    'Cost Per Lead',
    'Meetings Booked',
    'Deals Won',
    'Revenue Attributed',
    'Management Company',
    'Hotel Name',
    'Notes',
  ];

  const rows = shows.map(show => [
    escapeCSV(show.name),
    escapeCSV(show.location),
    escapeCSV(show.startDate),
    escapeCSV(show.endDate),
    escapeCSV(show.showStatus),
    escapeCSV(show.boothNumber),
    escapeCSV(show.boothSize),
    escapeCSV(show.cost),
    escapeCSV(show.shippingCost),
    escapeCSV(show.electricalCost),
    escapeCSV(show.laborCost),
    escapeCSV(show.internetCost),
    escapeCSV(show.standardServicesCost),
    escapeCSV(show.hotelCostPerNight),
    escapeCSV(totalEstimatedCost(show)),
    escapeCSV(show.totalLeads),
    escapeCSV(show.qualifiedLeads),
    escapeCSV(costPerLead(show)),
    escapeCSV(show.meetingsBooked),
    escapeCSV(show.dealsWon),
    escapeCSV(show.revenueAttributed),
    escapeCSV(show.managementCompany),
    escapeCSV(show.hotelName),
    escapeCSV(show.generalNotes?.replace(/\n/g, ' ')),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

// Generate CSV from attendees
export function exportAttendeesToCSV(attendees: Attendee[], showName?: string): string {
  const headers = [
    'Show',
    'Name',
    'Email',
    'Arrival Date',
    'Departure Date',
    'Flight Cost',
    'Flight Confirmation',
  ];

  const rows = attendees.map(att => [
    escapeCSV(showName || ''),
    escapeCSV(att.name),
    escapeCSV(att.email),
    escapeCSV(att.arrivalDate),
    escapeCSV(att.departureDate),
    escapeCSV(att.flightCost),
    escapeCSV(att.flightConfirmation),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

// Export all data as JSON
export function exportAllDataToJSON(shows: TradeShow[], attendees: Attendee[]): string {
  const data = {
    exportedAt: new Date().toISOString(),
    shows: shows.map(show => ({
      ...show,
      computed: {
        totalEstimatedCost: totalEstimatedCost(show),
        costPerLead: costPerLead(show),
      },
    })),
    attendees,
  };

  return JSON.stringify(data, null, 2);
}

// Download helper
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// High-level export functions
export function downloadShowsCSV(shows: TradeShow[]): void {
  const csv = exportShowsToCSV(shows);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(csv, `trade-shows-${date}.csv`, 'text/csv');
}

export function downloadAttendeesCSV(attendees: Attendee[], showName?: string): void {
  const csv = exportAttendeesToCSV(attendees, showName);
  const date = new Date().toISOString().split('T')[0];
  const suffix = showName ? `-${showName.toLowerCase().replace(/\s+/g, '-')}` : '';
  downloadFile(csv, `attendees${suffix}-${date}.csv`, 'text/csv');
}

export function downloadAllDataJSON(shows: TradeShow[], attendees: Attendee[]): void {
  const json = exportAllDataToJSON(shows, attendees);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(json, `trade-show-data-${date}.json`, 'application/json');
}
