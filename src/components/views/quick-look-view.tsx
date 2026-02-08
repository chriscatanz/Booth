'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useFilteredShows } from '@/hooks/use-filtered-shows';
import { useTradeShowStore } from '@/store/trade-show-store';
import { StatusBadge, CountdownBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { formatDateRange } from '@/lib/date-utils';
import { totalEstimatedCost, daysUntilShow } from '@/types/computed';
import { LayoutGrid, MapPin, Calendar, DollarSign, Users, Hotel, Mic, Package, CheckCircle, Clock, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

export default function QuickLookView() {
  const shows = useFilteredShows();
  const { selectShow, allAttendees } = useTradeShowStore();

  if (shows.length === 0) {
    return <EmptyState icon={LayoutGrid} title="No shows found" description="Try adjusting your filters or create a new show." />;
  }

  return (
    <div className="p-6">
      <motion.h1 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-text-primary tracking-tight mb-6"
      >
        Quick Look
      </motion.h1>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {shows.map((show, index) => {
          const days = daysUntilShow(show);
          const totalCost = totalEstimatedCost(show);
          const showAttendees = allAttendees.filter(a => a.tradeshowId === show.id);

          return (
            <motion.button
              key={show.id}
              variants={cardVariants}
              whileHover={{ 
                y: -6, 
                boxShadow: '0 20px 40px rgba(166, 43, 159, 0.15)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectShow(show)}
              className="relative text-left bg-surface rounded-2xl border border-border-subtle shadow-sm p-5 transition-all space-y-3 overflow-hidden group shine"
            >
              {/* Gradient accent on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 via-transparent to-brand-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-purple via-brand-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Header */}
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-brand-purple transition-colors">{show.name}</h3>
                  {show.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-text-tertiary shrink-0" />
                      <span className="text-xs text-text-secondary truncate">{show.location}</span>
                    </div>
                  )}
                </div>
                <StatusBadge status={show.showStatus} />
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-text-tertiary" />
                <span className="text-xs text-text-secondary">{formatDateRange(show.startDate, show.endDate)}</span>
                {days !== null && days >= 0 && days <= 30 && (
                  <div className="ml-auto">
                    <CountdownBadge days={days} />
                  </div>
                )}
              </div>

              {/* Quick stats row */}
              <div className="relative flex items-center gap-3 text-xs text-text-secondary">
                {totalCost > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign size={12} className="text-brand-purple" />
                    <span className="font-medium">{formatCurrency(totalCost)}</span>
                  </div>
                )}
              </div>

              {/* Attendees */}
              {showAttendees.length > 0 && (
                <div className="relative flex items-center gap-2">
                  <Users size={12} className="text-brand-cyan shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {showAttendees.slice(0, 4).map((attendee) => (
                      <span 
                        key={attendee.localId} 
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan"
                      >
                        {attendee.name}
                      </span>
                    ))}
                    {showAttendees.length > 4 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">
                        +{showAttendees.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Status badges */}
              <div className="relative flex flex-wrap gap-1.5">
                {/* Registration */}
                <span className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg',
                  show.registrationConfirmed 
                    ? 'bg-success/10 text-success' 
                    : 'bg-warning/10 text-warning'
                )}>
                  <CheckCircle size={10} />
                  Reg {show.registrationConfirmed ? '✓' : 'Pending'}
                </span>

                {/* Hotel */}
                {show.hotelName && (
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg',
                    show.hotelConfirmed 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  )}>
                    <Hotel size={10} />
                    Hotel {show.hotelConfirmed ? '✓' : 'Pending'}
                  </span>
                )}

                {/* Speaking Engagement */}
                {show.hasSpeakingEngagement && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-brand-purple/10 text-brand-purple">
                    <Mic size={10} />
                    Speaking
                  </span>
                )}

                {/* Booth Number */}
                {show.boothNumber && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-brand-cyan/10 text-brand-cyan">
                    <Package size={10} />
                    #{show.boothNumber}
                  </span>
                )}

                {/* Shipping */}
                {show.shippingCutoff && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-info/10 text-info">
                    <Truck size={10} />
                    Ship by {new Date(show.shippingCutoff).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}

                {/* Utilities Booked */}
                {show.utilitiesBooked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-success/10 text-success">
                    ⚡ Utilities
                  </span>
                )}

                {/* Labor Booked */}
                {show.laborBooked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-success/10 text-success">
                    👷 Labor
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
