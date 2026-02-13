'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface HotelMapProps {
  hotelName?: string | null;
  hotelAddress?: string | null;
  showLocation?: string | null;
}

export function HotelMap({ hotelName, hotelAddress, showLocation }: HotelMapProps) {
  // Build search query from hotel address or name + show location
  const searchQuery = hotelAddress || (hotelName && showLocation ? `${hotelName}, ${showLocation}` : hotelName) || null;

  // Build Google Maps embed URL (no API key required for basic embeds)
  const getEmbedUrl = () => {
    if (searchQuery) {
      return `https://www.google.com/maps?q=${encodeURIComponent(searchQuery)}&output=embed`;
    }
    return null;
  };

  const openInMaps = () => {
    if (searchQuery) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  const getDirections = () => {
    if (searchQuery) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  const embedUrl = getEmbedUrl();

  // Don't render if no address
  if (!searchQuery) {
    return (
      <div className="mt-3 p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
        <div className="flex items-center gap-2 text-text-tertiary">
          <MapPin size={16} />
          <span className="text-sm">Enter a hotel address to view map</span>
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
        {/* Google Maps iframe */}
        <div className="relative h-[200px] bg-bg-tertiary">
          {embedUrl && (
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hotel Map"
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
            Get Directions
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
