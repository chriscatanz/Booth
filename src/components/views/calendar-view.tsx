'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useToastStore } from '@/store/toast-store';
import { TradeShow } from '@/types';
import { formatDateRange } from '@/lib/date-utils';
import { daysUntilShow } from '@/types/computed';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  isSameMonth, isSameDay, isWithinInterval, parseISO, isValid, format, differenceInDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, MapPin, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as api from '@/services/supabase-service';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Stable color from show ID
function showColor(show: TradeShow): string {
  const colors = ['#A62B9F', '#59C8FA', '#1A7F37', '#BF8700', '#0969DA', '#CF222E', '#8250DF'];
  return colors[show.id % colors.length];
}

export default function CalendarView() {
  const { shows, selectShow, loadShows } = useTradeShowStore();
  const toast = useToastStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggedShow, setDraggedShow] = useState<TradeShow | null>(null);
  const [dropTarget, setDropTarget] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Build grid of days
  const days = useMemo(() => {
    const result: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      result.push(day);
      day = addDays(day, 1);
    }
    return result;
  }, [calendarStart, calendarEnd]);

  // Shows in the current month view
  const showsForDay = useCallback((date: Date): TradeShow[] => {
    return shows.filter(show => {
      if (!show.startDate) return false;
      const start = parseISO(show.startDate);
      if (!isValid(start)) return false;
      const end = show.endDate ? parseISO(show.endDate) : start;
      const endDate = isValid(end) ? end : start;
      return isWithinInterval(date, { start, end: endDate }) || isSameDay(date, start);
    });
  }, [shows]);

  const selectedDateShows = selectedDate ? showsForDay(selectedDate) : [];

  // Upcoming shows for side panel when no date selected
  const upcomingShows = useMemo(() =>
    shows.filter(s => {
      const d = daysUntilShow(s);
      return d !== null && d >= 0;
    }).sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '')).slice(0, 5),
  [shows]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, show: TradeShow) => {
    setDraggedShow(show);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', show.id.toString());
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dropTarget || !isSameDay(dropTarget, date)) {
      setDropTarget(date);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedShow) return;

    const oldStartDate = draggedShow.startDate ? parseISO(draggedShow.startDate) : null;
    if (!oldStartDate || !isValid(oldStartDate)) {
      toast.error('Show has no start date');
      setDraggedShow(null);
      return;
    }

    // Calculate the difference and shift both start and end dates
    const daysDiff = differenceInDays(targetDate, oldStartDate);
    if (daysDiff === 0) {
      setDraggedShow(null);
      return;
    }

    const newStartDate = format(targetDate, 'yyyy-MM-dd');
    let newEndDate: string | null = null;
    
    if (draggedShow.endDate) {
      const oldEndDate = parseISO(draggedShow.endDate);
      if (isValid(oldEndDate)) {
        newEndDate = format(addDays(oldEndDate, daysDiff), 'yyyy-MM-dd');
      }
    }

    // Also shift shipping cutoff if it exists
    let newShippingCutoff: string | null = null;
    if (draggedShow.shippingCutoff) {
      const oldCutoff = parseISO(draggedShow.shippingCutoff);
      if (isValid(oldCutoff)) {
        newShippingCutoff = format(addDays(oldCutoff, daysDiff), 'yyyy-MM-dd');
      }
    }

    try {
      await api.updateTradeShow({
        ...draggedShow,
        startDate: newStartDate,
        endDate: newEndDate,
        shippingCutoff: newShippingCutoff,
      });
      await loadShows();
      toast.success(`Moved "${draggedShow.name}" to ${format(targetDate, 'MMM d')}`);
    } catch {
      toast.error('Failed to reschedule show');
    }

    setDraggedShow(null);
  };

  const handleDragEnd = () => {
    setDraggedShow(null);
    setDropTarget(null);
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 h-full overflow-auto">
      {/* Calendar Grid */}
      <div className="flex-1 min-w-0">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-text-primary">{format(currentMonth, 'MMMM yyyy')}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 rounded-lg text-sm font-medium text-brand-purple hover:bg-brand-purple/10">
              Today
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Drag hint */}
        {draggedShow && (
          <div className="mb-2 px-3 py-1.5 bg-brand-purple/10 rounded-lg text-xs text-brand-purple">
            Dragging: <strong>{draggedShow.name}</strong> — drop on a date to reschedule
          </div>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-text-secondary py-2">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-border-subtle rounded-lg overflow-hidden">
          {days.map((day, idx) => {
            const dayShows = showsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDropTarget = dropTarget && isSameDay(dropTarget, day);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                className={cn(
                  'min-h-[80px] p-1.5 text-left transition-colors cursor-pointer',
                  isCurrentMonth ? 'bg-surface hover:bg-bg-tertiary' : 'bg-bg-secondary',
                  isSelected && 'ring-2 ring-brand-purple ring-inset',
                  isDropTarget && 'ring-2 ring-brand-cyan ring-inset bg-brand-cyan/5',
                )}
              >
                <span className={cn(
                  'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs',
                  isToday ? 'bg-brand-purple text-white font-bold' : isCurrentMonth ? 'text-text-primary' : 'text-text-tertiary'
                )}>
                  {format(day, 'd')}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayShows.slice(0, 3).map(show => {
                    const isFirstDay = show.startDate && isSameDay(parseISO(show.startDate), day);
                    return (
                      <div
                        key={show.id}
                        draggable={isFirstDay || false}
                        onDragStart={(e) => isFirstDay && handleDragStart(e, show)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => { e.stopPropagation(); selectShow(show); }}
                        className={cn(
                          'text-[10px] leading-tight truncate px-1 py-0.5 rounded flex items-center gap-0.5',
                          isFirstDay && 'cursor-grab active:cursor-grabbing',
                          draggedShow?.id === show.id && 'opacity-50',
                        )}
                        style={{ backgroundColor: `${showColor(show)}20`, color: showColor(show) }}
                      >
                        {isFirstDay && <GripVertical size={8} className="shrink-0 opacity-50" />}
                        <span className="truncate">{show.name}</span>
                      </div>
                    );
                  })}
                  {dayShows.length > 3 && (
                    <span className="text-[9px] text-text-tertiary pl-1">+{dayShows.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full lg:w-72 lg:shrink-0">
        <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-4 sticky top-6">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Upcoming Shows'}
          </h2>

          {selectedDate && selectedDateShows.length === 0 && (
            <p className="text-xs text-text-secondary py-4 text-center">No shows on this date</p>
          )}

          {(selectedDate ? selectedDateShows : upcomingShows).map(show => (
            <button
              key={show.id}
              onClick={() => selectShow(show)}
              className="w-full text-left p-3 rounded-lg hover:bg-bg-tertiary transition-colors mb-1"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: showColor(show) }} />
                <p className="text-sm font-medium text-text-primary truncate">{show.name}</p>
              </div>
              {show.location && (
                <div className="flex items-center gap-1 ml-4">
                  <MapPin size={10} className="text-text-tertiary" />
                  <span className="text-xs text-text-secondary">{show.location}</span>
                </div>
              )}
              <p className="text-xs text-text-tertiary ml-4 mt-0.5">
                {formatDateRange(show.startDate, show.endDate)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
