'use client';

import React from 'react';
import { Package, ExternalLink } from 'lucide-react';
import { Button } from './button';

interface TrackingStatusDisplayProps {
  trackingNumber: string | null;
  carrier?: string | null;
  disabled?: boolean;
  // Keep these for backward compatibility but they're no longer used
  status?: string | null;
  statusDetails?: string | null;
  eta?: string | null;
  lastUpdated?: string | null;
  onStatusUpdate?: (status: unknown) => void;
}

// Generate tracking URL for each carrier
function getCarrierTrackingUrl(trackingNumber: string, carrier?: string | null): string {
  const cleanNumber = trackingNumber.replace(/\s+/g, '');
  const carrierLower = (carrier || detectCarrier(cleanNumber))?.toLowerCase();
  
  switch (carrierLower) {
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${cleanNumber}`;
    case 'ups':
      return `https://www.ups.com/track?tracknum=${cleanNumber}`;
    case 'usps':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${cleanNumber}`;
    case 'dhl':
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${cleanNumber}`;
    default:
      // Google search fallback
      return `https://www.google.com/search?q=track+package+${cleanNumber}`;
  }
}

// Simple carrier detection based on tracking number format
function detectCarrier(trackingNumber: string): string | null {
  const cleaned = trackingNumber.replace(/\s/g, '').toUpperCase();
  
  // FedEx: 12, 15, or 20 digits
  if (/^\d{12}$/.test(cleaned) || /^\d{15}$/.test(cleaned) || /^\d{20}$/.test(cleaned)) {
    return 'fedex';
  }
  
  // UPS: starts with 1Z
  if (/^1Z[A-Z0-9]{16}$/i.test(cleaned)) {
    return 'ups';
  }
  
  // USPS: 20-22 digits or starts with 94/92
  if (/^[0-9]{20,22}$/.test(cleaned) || /^94\d{20}$/.test(cleaned) || /^92\d{20}$/.test(cleaned)) {
    return 'usps';
  }
  
  // DHL: 10 digits or 3 letters + 7 digits
  if (/^\d{10}$/.test(cleaned) || /^[A-Z]{3}\d{7}$/i.test(cleaned)) {
    return 'dhl';
  }
  
  return null;
}

function getCarrierName(carrier?: string | null): string {
  switch (carrier?.toLowerCase()) {
    case 'fedex': return 'FedEx';
    case 'ups': return 'UPS';
    case 'usps': return 'USPS';
    case 'dhl': return 'DHL';
    default: return 'Carrier';
  }
}

export function TrackingStatusDisplay({
  trackingNumber,
  carrier,
  disabled,
}: TrackingStatusDisplayProps) {
  if (!trackingNumber) {
    return (
      <div className="flex items-center gap-2 text-text-tertiary text-sm">
        <Package size={14} />
        <span>Enter a tracking number to track your shipment</span>
      </div>
    );
  }

  const detectedCarrier = carrier || detectCarrier(trackingNumber);
  const carrierName = getCarrierName(detectedCarrier);
  const trackingUrl = getCarrierTrackingUrl(trackingNumber, detectedCarrier);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-purple/10">
            <Package size={16} className="text-brand-purple" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {trackingNumber}
            </p>
            <p className="text-xs text-text-secondary">
              {carrierName} {detectedCarrier ? '' : '(carrier not detected)'}
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open(trackingUrl, '_blank')}
          disabled={disabled}
        >
          <ExternalLink size={14} />
          Track on {carrierName}
        </Button>
      </div>
    </div>
  );
}
