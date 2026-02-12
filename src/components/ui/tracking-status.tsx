'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, RefreshCw, Truck, CheckCircle, AlertCircle, Clock,
  ChevronDown, ChevronUp, MapPin,
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { getTrackingStatus, getStatusColor, getStatusLabel, TrackingStatus } from '@/services/shippo-service';
import { format, parseISO } from 'date-fns';

interface TrackingStatusDisplayProps {
  trackingNumber: string | null;
  status: string | null;
  statusDetails: string | null;
  eta: string | null;
  lastUpdated: string | null;
  onStatusUpdate: (status: TrackingStatus) => void;
  disabled?: boolean;
}

export function TrackingStatusDisplay({
  trackingNumber,
  status,
  statusDetails,
  eta,
  lastUpdated,
  onStatusUpdate,
  disabled,
}: TrackingStatusDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState<TrackingStatus['trackingHistory']>([]);

  const handleRefresh = async () => {
    if (!trackingNumber) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getTrackingStatus(trackingNumber);
      if (result) {
        onStatusUpdate(result);
        setTrackingHistory(result.trackingHistory || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking');
    } finally {
      setIsLoading(false);
    }
  };

  if (!trackingNumber) {
    return (
      <div className="flex items-center gap-2 text-text-tertiary text-sm">
        <Package size={14} />
        <span>Enter a tracking number to see status</span>
      </div>
    );
  }

  const statusColorClass = status ? getStatusColor(status) : 'text-secondary';
  const statusLabel = status ? getStatusLabel(status) : 'Unknown';

  const StatusIcon = () => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle size={16} className="text-success" />;
      case 'TRANSIT':
      case 'IN_TRANSIT':
        return <Truck size={16} className="text-brand-cyan" />;
      case 'PRE_TRANSIT':
        return <Clock size={16} className="text-warning" />;
      case 'FAILURE':
      case 'RETURNED':
        return <AlertCircle size={16} className="text-error" />;
      default:
        return <Package size={16} className="text-text-tertiary" />;
    }
  };

  return (
    <div className="space-y-3">
      {/* Status display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            status === 'DELIVERED' ? 'bg-success/10' :
            status === 'TRANSIT' || status === 'IN_TRANSIT' ? 'bg-brand-cyan/10' :
            status === 'PRE_TRANSIT' ? 'bg-warning/10' :
            status === 'FAILURE' || status === 'RETURNED' ? 'bg-error/10' :
            'bg-bg-tertiary'
          )}>
            <StatusIcon />
          </div>
          <div>
            <p className={cn(
              'text-sm font-medium',
              status === 'DELIVERED' ? 'text-success' :
              status === 'TRANSIT' || status === 'IN_TRANSIT' ? 'text-brand-cyan' :
              status === 'PRE_TRANSIT' ? 'text-warning' :
              status === 'FAILURE' || status === 'RETURNED' ? 'text-error' :
              'text-text-primary'
            )}>
              {statusLabel}
            </p>
            {statusDetails && (
              <p className="text-xs text-text-secondary">{statusDetails}</p>
            )}
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={disabled || isLoading}
          title="Refresh tracking"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* ETA and last updated */}
      <div className="flex flex-wrap gap-4 text-xs text-text-tertiary">
        {eta && (
          <span>ETA: {format(parseISO(eta), 'MMM d, yyyy')}</span>
        )}
        {lastUpdated && (
          <span>Updated: {format(parseISO(lastUpdated), 'MMM d, h:mm a')}</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {/* Tracking history toggle */}
      {trackingHistory.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showHistory ? 'Hide' : 'Show'} tracking history ({trackingHistory.length})
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2 pl-2 border-l-2 border-border">
                  {trackingHistory.map((event, i) => (
                    <div key={i} className="pl-3 py-1">
                      <p className="text-xs font-medium text-text-primary">{event.statusDetails}</p>
                      <div className="flex gap-3 text-xs text-text-tertiary">
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {event.location}
                          </span>
                        )}
                        <span>{format(parseISO(event.date), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
