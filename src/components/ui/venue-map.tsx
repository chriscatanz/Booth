'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, ExternalLink, Navigation, Building2, Hotel } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import map components to avoid SSR issues
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

interface VenueMapProps {
  venueName?: string | null;
  venueAddress?: string | null;
  hotelName?: string | null;
  hotelAddress?: string | null;
  showLocation?: string | null; // City, State fallback
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationData {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
}

export function VenueMap({ venueName, venueAddress, hotelName, hotelAddress, showLocation }: VenueMapProps) {
  const [venueData, setVenueData] = useState<LocationData>({ coords: null, loading: false, error: null });
  const [hotelData, setHotelData] = useState<LocationData>({ coords: null, loading: false, error: null });
  const [isMapReady, setIsMapReady] = useState(false);

  // Build search queries
  const venueQuery = venueAddress || (venueName && showLocation ? `${venueName}, ${showLocation}` : null);
  const hotelQuery = hotelAddress || (hotelName && showLocation ? `${hotelName}, ${showLocation}` : null);

  // Geocode a single address
  const geocodeAddress = async (query: string): Promise<Coordinates | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'User-Agent': 'Booth/1.0' } }
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return null;
    } catch {
      return null;
    }
  };

  // Geocode venue
  useEffect(() => {
    if (!venueQuery) {
      setVenueData({ coords: null, loading: false, error: null });
      return;
    }
    setVenueData(prev => ({ ...prev, loading: true, error: null }));
    const timeoutId = setTimeout(async () => {
      const coords = await geocodeAddress(venueQuery);
      setVenueData({
        coords,
        loading: false,
        error: coords ? null : 'Venue not found',
      });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [venueQuery]);

  // Geocode hotel
  useEffect(() => {
    if (!hotelQuery) {
      setHotelData({ coords: null, loading: false, error: null });
      return;
    }
    setHotelData(prev => ({ ...prev, loading: true, error: null }));
    const timeoutId = setTimeout(async () => {
      const coords = await geocodeAddress(hotelQuery);
      setHotelData({
        coords,
        loading: false,
        error: coords ? null : 'Hotel not found',
      });
    }, 600); // Slight offset to avoid rate limiting
    return () => clearTimeout(timeoutId);
  }, [hotelQuery]);

  // Load Leaflet CSS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
      setTimeout(() => setIsMapReady(true), 100);
    }
  }, []);

  // Calculate map center and bounds
  const mapConfig = useMemo(() => {
    const points: Coordinates[] = [];
    if (venueData.coords) points.push(venueData.coords);
    if (hotelData.coords) points.push(hotelData.coords);

    if (points.length === 0) return null;

    if (points.length === 1) {
      return { center: points[0], zoom: 15 };
    }

    // Calculate center between two points
    const center: Coordinates = {
      lat: (points[0].lat + points[1].lat) / 2,
      lng: (points[0].lng + points[1].lng) / 2,
    };

    // Calculate distance to determine zoom
    const latDiff = Math.abs(points[0].lat - points[1].lat);
    const lngDiff = Math.abs(points[0].lng - points[1].lng);
    const maxDiff = Math.max(latDiff, lngDiff);

    // Adjust zoom based on distance
    let zoom = 15;
    if (maxDiff > 0.1) zoom = 12;
    else if (maxDiff > 0.05) zoom = 13;
    else if (maxDiff > 0.02) zoom = 14;

    return { center, zoom };
  }, [venueData.coords, hotelData.coords]);

  // Check if both locations are different
  const hasBothLocations = venueData.coords && hotelData.coords;
  const sameLocation = hasBothLocations && 
    Math.abs(venueData.coords!.lat - hotelData.coords!.lat) < 0.0001 &&
    Math.abs(venueData.coords!.lng - hotelData.coords!.lng) < 0.0001;

  const isLoading = venueData.loading || hotelData.loading;
  const hasAnyLocation = venueData.coords || hotelData.coords;

  // Open venue in maps
  const openVenueInMaps = () => {
    if (venueData.coords) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${venueData.coords.lat},${venueData.coords.lng}`, '_blank');
    }
  };

  // Get directions from hotel to venue
  const getDirections = () => {
    if (hotelQuery && venueQuery) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(hotelQuery)}&destination=${encodeURIComponent(venueQuery)}`,
        '_blank'
      );
    } else if (venueQuery) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueQuery)}`, '_blank');
    }
  };

  // Nothing to show
  if (!venueQuery && !hotelQuery) {
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
        {hasBothLocations && !sameLocation && (
          <div className="px-3 py-2 bg-bg-tertiary border-b border-border-subtle flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-brand-purple" />
              <span className="text-text-secondary">Venue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-brand-cyan" />
              <span className="text-text-secondary">Hotel</span>
            </div>
          </div>
        )}

        {/* Map container */}
        <div className="relative h-[220px] bg-bg-tertiary">
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

            {!isLoading && !hasAnyLocation && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-bg-tertiary z-10"
              >
                <div className="flex flex-col items-center gap-2 text-text-tertiary">
                  <MapPin size={24} />
                  <span className="text-sm">Location not found</span>
                </div>
              </motion.div>
            )}

            {mapConfig && isMapReady && !isLoading && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full w-full"
              >
                <MapContainer
                  center={[mapConfig.center.lat, mapConfig.center.lng]}
                  zoom={mapConfig.zoom}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Venue marker */}
                  {venueData.coords && (
                    <Marker position={[venueData.coords.lat, venueData.coords.lng]}>
                      <Popup>
                        <div className="text-sm">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Building2 size={14} className="text-brand-purple" />
                            <span>{venueName || 'Conference Venue'}</span>
                          </div>
                          {venueAddress && <p className="text-xs mt-1 text-text-secondary">{venueAddress}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Hotel marker (only if different from venue) */}
                  {hotelData.coords && !sameLocation && (
                    <Marker position={[hotelData.coords.lat, hotelData.coords.lng]}>
                      <Popup>
                        <div className="text-sm">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Hotel size={14} className="text-brand-cyan" />
                            <span>{hotelName || 'Hotel'}</span>
                          </div>
                          {hotelAddress && <p className="text-xs mt-1 text-text-secondary">{hotelAddress}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        {hasAnyLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 p-2 bg-surface border-t border-border-subtle"
          >
            {venueData.coords && (
              <button
                onClick={openVenueInMaps}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors"
              >
                <ExternalLink size={12} />
                Open in Maps
              </button>
            )}
            {(venueQuery || hotelQuery) && (
              <button
                onClick={getDirections}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-purple hover:bg-brand-purple/10 rounded-md transition-colors"
              >
                <Navigation size={12} />
                {hasBothLocations && !sameLocation ? 'Hotel → Venue' : 'Get Directions'}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
