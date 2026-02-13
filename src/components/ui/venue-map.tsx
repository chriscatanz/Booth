'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface VenueMapProps {
  venueName?: string | null;
  venueAddress?: string | null;
  hotelName?: string | null;
  hotelAddress?: string | null;
  showLocation?: string | null;
}

export function VenueMap({ venueName, venueAddress, hotelName, hotelAddress, showLocation }: VenueMapProps) {
  // Build search queries
  const venueQuery = venueAddress || (venueName && showLocation ? `${venueName}, ${showLocation}` : venueName) || null;
  const hotelQuery = hotelAddress || (hotelName && showLocation ? `${hotelName}, ${showLocation}` : hotelName) || null;

  // Determine what to show
  const hasBothLocations = venueQuery && hotelQuery;
  const primaryQuery = venueQuery || hotelQuery;

  // Build Google Maps embed URL (no API key required for basic embeds)
  const getEmbedUrl = () => {
    if (hasBothLocations) {
      // Show directions from hotel to venue
      return `https://www.google.com/maps?q=&saddr=${encodeURIComponent(hotelQuery!)}&daddr=${encodeURIComponent(venueQuery!)}&output=embed`;
    } else if (primaryQuery) {
      // Show single location
      return `https://www.google.com/maps?q=${encodeURIComponent(primaryQuery)}&output=embed`;
    }
    return null;
  };

  // Open directions in Google Maps
  const getDirections = () => {
    if (hotelQuery && venueQuery) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(hotelQuery)}&destination=${encodeURIComponent(venueQuery)}`,
        '_blank'
      );
    } else if (primaryQuery) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(primaryQuery)}`, '_blank');
    }
  };

  // Open location in Google Maps
  const openInMaps = () => {
    if (primaryQuery) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryQuery)}`, '_blank');
    }
  };

  const embedUrl = getEmbedUrl();

  // Nothing to show
  if (!primaryQuery) {
    return (
      <div className="mt-3 p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
        <div className="flex items-center gap-2 text-text-tertiary">
          <MapPin size={16} />
          <span className="text-sm">Enter a venue or hotel address to view map</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="mt-3"
    >
      <div className="rounded-lg overflow-hidden border border-border-subtle">
        {/* Legend */}
        {hasBothLocations && (
          <div className="px-3 py-2 bg-bg-tertiary border-b border-border-subtle flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-text-secondary">Hotel (start)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-text-secondary">Venue (end)</span>
            </div>
          </div>
        )}

        {/* Google Maps iframe */}
        <div className="relative h-[220px] bg-bg-tertiary">
          {embedUrl && (
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Map"
            />
          )}
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 p-2 bg-surface border-t border-border-subtle"
        >
          <button
            onClick={openInMaps}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors"
          >
            <ExternalLink size={12} />
            Open in Maps
          </button>
          <button
            onClick={getDirections}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-purple hover:bg-brand-purple/10 rounded-md transition-colors"
          >
            <Navigation size={12} />
            {hasBothLocations ? 'Hotel → Venue' : 'Get Directions'}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
