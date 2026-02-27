'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Hotel, Navigation, Car, Copy, Check, MessageSquare, Users,
} from 'lucide-react';
import { TradeShow } from '@/types';
import { supabase } from '@/lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  phone?: string;
  title?: string;
  role: string;
}

interface BoothModeInfoProps {
  show: TradeShow;
}

export function BoothModeInfo({ show }: BoothModeInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const venueAddress = show.venueAddress || '';
  const hotelAddress = show.hotelAddress || '';

  useEffect(() => {
    async function loadTeamMembers() {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('tradeshow_team_members')
        .select(`
          role,
          team_member:team_members (
            id,
            name,
            phone,
            title
          )
        `)
        .eq('tradeshow_id', show.id);

      if (!error && data) {
        const members: TeamMember[] = data
          .filter(d => d.team_member)
          .map(d => {
            const tm = d.team_member as unknown as { id: string; name: string; phone?: string; title?: string };
            return {
              id: tm.id,
              name: tm.name,
              phone: tm.phone,
              title: tm.title,
              role: d.role || 'support',
            };
          });
        setTeamMembers(members);
      }
    }
    loadTeamMembers();
  }, [show.id]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://maps.google.com/maps?q=${encoded}`, '_blank');
  };

  const openUber = (address: string, name?: string) => {
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'User-Agent': 'Booth App' } }
    )
      .then(res => res.json())
      .then((results: Array<{ lat: string; lon: string }>) => {
        if (results && results[0]) {
          const { lat, lon } = results[0];
          const encoded = encodeURIComponent(address);
          const nickname = encodeURIComponent(name || address.split(',')[0]);
          const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lon}&dropoff[nickname]=${nickname}&dropoff[formatted_address]=${encoded}`;
          window.location.href = uberUrl;
        } else {
          window.location.href = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
        }
      })
      .catch(() => {
        window.location.href = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 space-y-4"
    >
      {/* Booth Number */}
      {show.boothNumber && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-purple/30 to-brand-pink/30 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Booth</p>
              <p className="text-4xl font-bold text-white mt-0.5">{show.boothNumber}</p>
            </div>
            <button
              onClick={() => copyToClipboard(show.boothNumber!, 'booth')}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              {copiedField === 'booth' ? (
                <Check size={20} className="text-green-400" />
              ) : (
                <Copy size={20} className="text-white/70" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Venue Card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20">
              <MapPin size={20} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Venue</p>
              <p className="text-white font-semibold mt-0.5 truncate">{show.venueName || 'Not set'}</p>
              {venueAddress && (
                <p className="text-white/50 text-sm mt-0.5 truncate">{venueAddress}</p>
              )}
            </div>
          </div>
        </div>
        {venueAddress && (
          <div className="flex border-t border-white/10">
            <button
              onClick={() => openMaps(venueAddress)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Navigation size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-white/80">Directions</span>
            </button>
            <button
              onClick={() => openUber(venueAddress, show.venueName || undefined)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 transition-colors border-l border-white/10"
            >
              <Car size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-white/80">Uber</span>
            </button>
          </div>
        )}
      </div>

      {/* Hotel Card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <Hotel size={20} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Hotel</p>
              <p className="text-white font-semibold mt-0.5 truncate">{show.hotelName || 'Not set'}</p>
              {hotelAddress && (
                <p className="text-white/50 text-sm mt-0.5 truncate">{hotelAddress}</p>
              )}
              {show.hotelConfirmationNumber && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-white/40">Confirmation:</span>
                  <span className="text-xs font-mono text-white/70">{show.hotelConfirmationNumber}</span>
                  <button
                    onClick={() => copyToClipboard(show.hotelConfirmationNumber!, 'confirmation')}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedField === 'confirmation' ? (
                      <Check size={12} className="text-green-400" />
                    ) : (
                      <Copy size={12} className="text-white/50" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {hotelAddress && (
          <div className="flex border-t border-white/10">
            <button
              onClick={() => openMaps(hotelAddress)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Navigation size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-white/80">Directions</span>
            </button>
            <button
              onClick={() => openUber(hotelAddress, show.hotelName || undefined)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 transition-colors border-l border-white/10"
            >
              <Car size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-white/80">Uber</span>
            </button>
          </div>
        )}
      </div>

      {/* Map Preview */}
      {(venueAddress || hotelAddress) && (
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <div className="aspect-[16/10] bg-white/5 relative">
            {venueAddress && hotelAddress ? (
              <iframe
                src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${encodeURIComponent(hotelAddress)}&destination=${encodeURIComponent(venueAddress)}&mode=driving&zoom=14`}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(venueAddress || hotelAddress)}&zoom=15`}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        </div>
      )}

      {/* Team Section */}
      {teamMembers.length > 0 && (
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-white/50" />
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Team at Show</p>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {teamMembers.map(member => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {member.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{member.name}</p>
                    {member.role && (
                      <p className="text-white/50 text-xs capitalize">{member.role}</p>
                    )}
                  </div>
                </div>
                {member.phone && (
                  <a
                    href={`sms:${member.phone}`}
                    className="p-2.5 rounded-xl bg-green-500/20 hover:bg-green-500/30 transition-colors"
                  >
                    <MessageSquare size={18} className="text-green-400" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show Contact */}
      {show.showContactName && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Show Contact</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{show.showContactName}</p>
              {show.showContactEmail && (
                <p className="text-white/50 text-sm">{show.showContactEmail}</p>
              )}
            </div>
            {show.showContactPhone && (
              <a
                href={`sms:${show.showContactPhone}`}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <MessageSquare size={18} className="text-white/70" />
              </a>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
