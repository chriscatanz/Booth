/**
 * Shippo Tracking Service
 * Fetches package tracking status from Shippo API
 */

import { supabase } from '@/lib/supabase';

export interface TrackingStatus {
  status: string; // UNKNOWN, PRE_TRANSIT, TRANSIT, DELIVERED, RETURNED, FAILURE
  statusDetails: string;
  eta: string | null;
  carrier: string;
  trackingNumber: string;
  lastUpdated: string;
  trackingHistory: TrackingEvent[];
}

export interface TrackingEvent {
  status: string;
  statusDetails: string;
  location: string | null;
  date: string;
}

// Carrier detection patterns
const CARRIER_PATTERNS: { carrier: string; patterns: RegExp[] }[] = [
  { carrier: 'usps', patterns: [/^[0-9]{20,22}$/, /^94\d{20}$/, /^92\d{20}$/] },
  { carrier: 'ups', patterns: [/^1Z[A-Z0-9]{16}$/i, /^T\d{10}$/] },
  { carrier: 'fedex', patterns: [/^\d{12}$/, /^\d{15}$/, /^\d{20}$/] },
  { carrier: 'dhl', patterns: [/^\d{10}$/, /^[A-Z]{3}\d{7}$/i] },
];

export function detectCarrier(trackingNumber: string): string | null {
  const cleaned = trackingNumber.replace(/\s/g, '').toUpperCase();
  
  for (const { carrier, patterns } of CARRIER_PATTERNS) {
    if (patterns.some(p => p.test(cleaned))) {
      return carrier;
    }
  }
  
  return null;
}

/**
 * Fetch tracking status from Shippo
 */
export async function getTrackingStatus(
  trackingNumber: string,
  carrier?: string
): Promise<TrackingStatus | null> {
  const detectedCarrier = carrier || detectCarrier(trackingNumber);
  
  if (!detectedCarrier) {
    throw new Error('Could not detect carrier. Please specify carrier manually.');
  }

  // Get auth session for API call
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`/api/tracking/${encodeURIComponent(trackingNumber)}?carrier=${detectedCarrier}`, {
    credentials: 'include',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tracking status');
  }

  return response.json();
}

/**
 * Get status badge color based on tracking status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'success';
    case 'TRANSIT':
    case 'IN_TRANSIT':
      return 'brand-cyan';
    case 'PRE_TRANSIT':
      return 'warning';
    case 'RETURNED':
    case 'FAILURE':
      return 'error';
    default:
      return 'text-secondary';
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'Delivered';
    case 'TRANSIT':
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'PRE_TRANSIT':
      return 'Label Created';
    case 'RETURNED':
      return 'Returned';
    case 'FAILURE':
      return 'Delivery Failed';
    case 'UNKNOWN':
    default:
      return 'Unknown';
  }
}
