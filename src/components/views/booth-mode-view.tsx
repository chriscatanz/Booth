'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Hotel, Calendar, Users, FileText, 
  Navigation, MessageSquare, Clock,
  X, Copy, Check
} from 'lucide-react';
import { TradeShow } from '@/types';
import { format, differenceInDays, isWithinInterval, parseISO } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface TeamMember {
  id: string;
  name: string;
  phone?: string;
  title?: string;
  role: string; // from junction table
}

interface BoothModeViewProps {
  show: TradeShow;
  onExit: () => void;
}

export function BoothModeView({ show, onExit }: BoothModeViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'info' | 'agenda' | 'notes'>('info');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const today = new Date();
  const startDate = show.startDate ? parseISO(show.startDate) : null;
  const endDate = show.endDate ? parseISO(show.endDate) : null;
  
  const isLive = startDate && endDate && isWithinInterval(today, { start: startDate, end: endDate });
  const daysUntil = startDate ? differenceInDays(startDate, today) : null;

  // Fetch team members for this show
  useEffect(() => {
    async function loadTeamMembers() {
      const supabase = createClient();
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
          .map(d => ({
            id: (d.team_member as { id: string }).id,
            name: (d.team_member as { name: string }).name,
            phone: (d.team_member as { phone?: string }).phone,
            title: (d.team_member as { title?: string }).title,
            role: d.role || 'support',
          }));
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

  // Build full addresses
  const venueAddress = show.venueAddress || '';
  const hotelAddress = show.hotelAddress || '';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-brand-purple/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-brand-pink/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-shrink-0 px-4 pt-12 pb-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isLive && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30 mb-2"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-400">LIVE NOW</span>
                </motion.div>
              )}
              {!isLive && daysUntil !== null && daysUntil > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 mb-2">
                  <Clock size={12} className="text-white/60" />
                  <span className="text-xs font-medium text-white/60">{daysUntil} days away</span>
                </div>
              )}
              <h1 className="text-2xl font-bold text-white leading-tight">{show.name}</h1>
              {startDate && endDate && (
                <p className="text-white/50 text-sm mt-1">
                  {format(startDate, 'MMM d')} – {format(endDate, 'd, yyyy')}
                </p>
              )}
            </div>
            <button
              onClick={onExit}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-white/70" />
            </button>
          </div>

          {/* Booth Number - Hero Element */}
          {show.boothNumber && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-brand-purple/30 to-brand-pink/30 border border-white/10 backdrop-blur-sm"
            >
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
            </motion.div>
          )}
        </motion.header>

        {/* Tab Navigation */}
        <motion.nav 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-shrink-0 px-4 mb-4"
        >
          <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
            {[
              { id: 'info', label: 'Info', icon: MapPin },
              { id: 'agenda', label: 'Agenda', icon: Calendar },
              { id: 'notes', label: 'Notes', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as typeof activeSection)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeSection === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.nav>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <AnimatePresence mode="wait">
            {activeSection === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
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
                    <button
                      onClick={() => openMaps(venueAddress)}
                      className="w-full flex items-center justify-center gap-2 py-3 border-t border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Navigation size={16} className="text-blue-400" />
                      <span className="text-sm font-medium text-white/80">Get Directions</span>
                    </button>
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
                    <button
                      onClick={() => openMaps(hotelAddress)}
                      className="w-full flex items-center justify-center gap-2 py-3 border-t border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Navigation size={16} className="text-amber-400" />
                      <span className="text-sm font-medium text-white/80">Get Directions</span>
                    </button>
                  )}
                </div>

                {/* Map Preview */}
                {(venueAddress || hotelAddress) && (
                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <div className="aspect-[16/10] bg-white/5 relative">
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${encodeURIComponent(hotelAddress || venueAddress)}&destination=${encodeURIComponent(venueAddress || hotelAddress)}&mode=driving`}
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
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
                      {teamMembers.map((member) => (
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
            )}

            {activeSection === 'agenda' && (
              <motion.div
                key="agenda"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {show.agendaContent ? (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div 
                      className="prose prose-invert prose-sm max-w-none text-white/80"
                      dangerouslySetInnerHTML={{ __html: show.agendaContent }}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                    <Calendar size={32} className="text-white/20 mx-auto mb-3" />
                    <p className="text-white/50">No agenda added yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {show.generalNotes ? (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div 
                      className="prose prose-invert prose-sm max-w-none text-white/80"
                      dangerouslySetInnerHTML={{ __html: show.generalNotes }}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                    <FileText size={32} className="text-white/20 mx-auto mb-3" />
                    <p className="text-white/50">No notes added yet</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Safe Area Spacer */}
        <div className="flex-shrink-0 h-6" />
      </div>
    </motion.div>
  );
}
