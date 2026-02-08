'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, ExternalLink, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the map to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface HotelMapProps {
  hotelName?: string | null;
  hotelAddress?: string | null;
  showLocation?: string | null;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export function HotelMap({ hotelName, hotelAddress, showLocation }: HotelMapProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Build search query from hotel address or name + show location
  const searchQuery = hotelAddress || (hotelName && showLocation ? `${hotelName}, ${showLocation}` : null);

  useEffect(() => {
    if (!searchQuery) {
      setCoordinates(null);
      setError(null);
      return;
    }

    const geocodeAddress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use OpenStreetMap Nominatim for free geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
          {
            headers: {
              'User-Agent': 'TradeShowManager/1.0',
            },
          }
        );

        if (!response.ok) throw new Error('Geocoding failed');

        const data = await response.json();

        if (data && data.length > 0) {
          setCoordinates({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        } else {
          setError('Location not found');
        }
      } catch (err) {
        setError('Could not load map');
        console.error('Geocoding error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the geocoding request
    const timeoutId = setTimeout(geocodeAddress, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load Leaflet CSS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
      
      // Fix for default marker icon
      setTimeout(() => setIsMapReady(true), 100);
    }
  }, []);

  const openInMaps = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const getDirections = () => {
    if (searchQuery) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(searchQuery)}`;
      window.open(url, '_blank');
    }
  };

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
        {/* Map container */}
        <div className="relative h-[200px] bg-bg-tertiary">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-bg-tertiary z-10"
              >
                <div className="flex items-center gap-2 text-text-secondary">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Loading map...</span>
                </div>
              </motion.div>
            )}

            {error && !isLoading && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-bg-tertiary z-10"
              >
                <div className="flex flex-col items-center gap-2 text-text-tertiary">
                  <MapPin size={24} />
                  <span className="text-sm">{error}</span>
                </div>
              </motion.div>
            )}

            {coordinates && isMapReady && !isLoading && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full w-full"
              >
                <MapContainer
                  center={[coordinates.lat, coordinates.lng]}
                  zoom={15}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[coordinates.lat, coordinates.lng]}>
                    <Popup>
                      <div className="text-sm">
                        <strong>{hotelName || 'Hotel'}</strong>
                        {hotelAddress && <p className="text-xs mt-1">{hotelAddress}</p>}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        {coordinates && (
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
        )}
      </div>
    </motion.div>
  );
}
