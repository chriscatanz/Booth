'use client';

import React, { useMemo } from 'react';
import { TradeShow } from '@/types';
import { parseISO, isValid, differenceInDays, format, addDays, startOfDay, subDays, max } from 'date-fns';
import { Package, AlertTriangle, Check, Truck, Warehouse, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingTimelineProps {
  shows: TradeShow[];
  onSelectShow: (show: TradeShow) => void;
  daysToShow?: number;
  shippingBufferDays?: number; // Days before cutoff to ship (default 7)
}

export function ShippingTimeline({ shows, onSelectShow, daysToShow = 45, shippingBufferDays = 7 }: ShippingTimelineProps) {
  const today = startOfDay(new Date());

  // Filter shows that are upcoming (with or without shipping cutoffs)
  const relevantShows = useMemo(() => {
    return shows
      .filter(show => {
        // Must have a start date
        if (!show.startDate) return false;
        const startDate = parseISO(show.startDate);
        if (!isValid(startDate)) return false;
        
        // Check if show is within range (based on start date or shipping cutoff)
        const daysUntilStart = differenceInDays(startDate, today);
        
        if (show.shippingCutoff) {
          const cutoff = parseISO(show.shippingCutoff);
          if (isValid(cutoff)) {
            const daysUntilCutoff = differenceInDays(cutoff, today);
            // Show if cutoff is recent past or upcoming
            if (daysUntilCutoff >= -7 && daysUntilCutoff <= daysToShow + 14) return true;
          }
        }
        
        // Also show if start date is upcoming
        return daysUntilStart >= -7 && daysUntilStart <= daysToShow + 14;
      })
      .sort((a, b) => {
        // Sort by shipping cutoff if available, otherwise by start date
        const aDate = a.shippingCutoff || a.startDate || '';
        const bDate = b.shippingCutoff || b.startDate || '';
        return aDate.localeCompare(bDate);
      });
  }, [shows, today, daysToShow]);

  // Calculate the actual days needed based on all events
  const actualDaysToShow = useMemo(() => {
    let maxDays = daysToShow;
    
    relevantShows.forEach(show => {
      if (show.startDate) {
        const startDate = parseISO(show.startDate);
        if (isValid(startDate)) {
          const daysUntil = differenceInDays(startDate, today);
          if (daysUntil > maxDays && daysUntil <= daysToShow + 30) {
            maxDays = daysUntil + 2; // Add padding after show start
          }
        }
      }
    });
    
    return maxDays;
  }, [relevantShows, today, daysToShow]);

  // Generate day columns
  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i <= actualDaysToShow; i++) {
      result.push(addDays(today, i));
    }
    return result;
  }, [today, actualDaysToShow]);

  // Week markers
  const weekMarkers = useMemo(() => {
    return days.filter((_, i) => i % 7 === 0).map(d => ({
      date: d,
      index: differenceInDays(d, today),
    }));
  }, [days, today]);

  if (relevantShows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-text-secondary">
        <Truck size={32} className="mb-2 text-text-tertiary" />
        <p className="text-sm">No upcoming shows in the next {daysToShow} days</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Header with day numbers */}
      <div className="flex min-w-max">
        <div className="w-48 shrink-0 px-3 py-2 border-b border-border text-xs font-medium text-text-secondary">
          Show
        </div>
        <div className="flex-1 flex">
          {days.map((day, i) => {
            const isToday = i === 0;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={i}
                className={cn(
                  'w-6 shrink-0 text-center border-b border-border text-[10px]',
                  isToday && 'bg-brand-purple/10 font-bold text-brand-purple',
                  isWeekend && !isToday && 'bg-bg-tertiary/50',
                )}
              >
                <div className="py-1">{format(day, 'd')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month labels */}
      <div className="flex min-w-max border-b border-border">
        <div className="w-48 shrink-0" />
        <div className="flex-1 flex">
          {weekMarkers.map(({ date, index }) => (
            <div
              key={index}
              className="text-[9px] text-text-tertiary px-1"
              style={{ marginLeft: index * 24 }}
            >
              {format(date, 'MMM d')}
            </div>
          ))}
        </div>
      </div>

      {/* Show rows */}
      {relevantShows.map(show => {
        const hasCutoff = show.shippingCutoff && isValid(parseISO(show.shippingCutoff));
        const cutoff = hasCutoff ? parseISO(show.shippingCutoff!) : null;
        const shipBy = cutoff ? subDays(cutoff, shippingBufferDays) : null;
        const showStart = show.startDate ? parseISO(show.startDate) : null;
        
        const daysUntilCutoff = cutoff ? differenceInDays(cutoff, today) : null;
        const daysUntilShipBy = shipBy ? differenceInDays(shipBy, today) : null;
        const daysUntilShow = showStart && isValid(showStart) ? differenceInDays(showStart, today) : null;

        const isShipByPast = daysUntilShipBy !== null && daysUntilShipBy < 0;
        const isShipByUrgent = daysUntilShipBy !== null && daysUntilShipBy >= 0 && daysUntilShipBy <= 3;
        const isShipByWarning = daysUntilShipBy !== null && daysUntilShipBy > 3 && daysUntilShipBy <= 7;

        return (
          <div key={show.id} className="flex min-w-max hover:bg-bg-tertiary/50 transition-colors">
            <button
              onClick={() => onSelectShow(show)}
              className="w-48 shrink-0 px-3 py-2 border-b border-border text-left truncate text-sm text-text-primary hover:text-brand-purple"
            >
              {show.name}
            </button>
            <div className="flex-1 flex relative border-b border-border">
              {/* Background grid */}
              {days.map((day, i) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={cn(
                      'w-6 shrink-0 border-r border-border-subtle',
                      isWeekend && 'bg-bg-tertiary/30',
                    )}
                  />
                );
              })}

              {/* Show start marker */}
              {daysUntilShow !== null && daysUntilShow >= 0 && daysUntilShow <= actualDaysToShow && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-cyan flex items-center justify-center z-10"
                  style={{ left: daysUntilShow * 24 + 4 }}
                  title={`Show starts: ${format(showStart!, 'MMM d')}`}
                >
                  <Check size={10} className="text-white" />
                </div>
              )}

              {/* Ship By marker (when to actually send it) */}
              {daysUntilShipBy !== null && shipBy && daysUntilShipBy >= 0 && daysUntilShipBy <= actualDaysToShow && (
                <div
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center z-10',
                    isShipByUrgent && 'bg-error',
                    isShipByWarning && 'bg-warning',
                    !isShipByUrgent && !isShipByWarning && 'bg-success',
                  )}
                  style={{ left: daysUntilShipBy * 24 + 2 }}
                  title={`📦 Ship by: ${format(shipBy, 'MMM d')} (${daysUntilShipBy === 0 ? 'TODAY' : `${daysUntilShipBy}d`})`}
                >
                  <Truck size={12} className="text-white" />
                </div>
              )}

              {/* Warehouse Arrival marker (the cutoff date) */}
              {daysUntilCutoff !== null && cutoff && daysUntilCutoff >= 0 && daysUntilCutoff <= actualDaysToShow && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center z-10 bg-brand-purple"
                  style={{ left: daysUntilCutoff * 24 + 2 }}
                  title={`🏭 Arrive by: ${format(cutoff, 'MMM d')} (${daysUntilCutoff === 0 ? 'TODAY' : `${daysUntilCutoff}d`})`}
                >
                  <Warehouse size={12} className="text-white" />
                </div>
              )}

              {/* Past ship-by indicator */}
              {isShipByPast && shipBy && daysUntilCutoff !== null && daysUntilCutoff >= 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 left-1 flex items-center gap-1 text-warning"
                  title={`Ship by was ${format(shipBy, 'MMM d')} - ship ASAP!`}
                >
                  <AlertTriangle size={14} />
                  <span className="text-[10px] font-medium">Ship now!</span>
                </div>
              )}

              {/* Past cutoff indicator */}
              {daysUntilCutoff !== null && cutoff && daysUntilCutoff < 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 left-1 flex items-center gap-1 text-error"
                  title={`Warehouse deadline was ${format(cutoff, 'MMM d')}`}
                >
                  <AlertTriangle size={14} />
                  <span className="text-[10px] font-medium">Overdue</span>
                </div>
              )}

              {/* No shipping info indicator - just show date */}
              {!hasCutoff && daysUntilShow !== null && daysUntilShow >= 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 left-1 flex items-center gap-1 text-text-tertiary"
                  title="No shipping deadline set"
                >
                  <CalendarDays size={14} />
                  <span className="text-[10px]">No shipping info</span>
                </div>
              )}

              {/* Line connecting ship-by to arrival to show */}
              {daysUntilShipBy !== null && daysUntilCutoff !== null && daysUntilShipBy >= 0 && daysUntilCutoff <= actualDaysToShow && daysUntilCutoff > daysUntilShipBy && (
                <div
                  className="absolute top-1/2 h-0.5 bg-border-strong/30"
                  style={{
                    left: daysUntilShipBy * 24 + 24,
                    width: (daysUntilCutoff - daysUntilShipBy - 1) * 24,
                  }}
                />
              )}
              {daysUntilCutoff !== null && daysUntilCutoff >= 0 && daysUntilShow !== null && daysUntilShow > daysUntilCutoff && daysUntilShow <= actualDaysToShow && (
                <div
                  className="absolute top-1/2 h-0.5 bg-border-strong/30"
                  style={{
                    left: daysUntilCutoff * 24 + 24,
                    width: (daysUntilShow - daysUntilCutoff - 1) * 24,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 px-3 text-xs text-text-secondary">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-error flex items-center justify-center">
            <Truck size={10} className="text-white" />
          </div>
          <span>Ship ≤3 days</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-warning flex items-center justify-center">
            <Truck size={10} className="text-white" />
          </div>
          <span>Ship 4-7 days</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-success flex items-center justify-center">
            <Truck size={10} className="text-white" />
          </div>
          <span>Ship &gt;7 days</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-brand-purple flex items-center justify-center">
            <Warehouse size={10} className="text-white" />
          </div>
          <span>Arrive by</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-brand-cyan flex items-center justify-center">
            <Check size={10} className="text-white" />
          </div>
          <span>Show starts</span>
        </div>
      </div>
    </div>
  );
}
