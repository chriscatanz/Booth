'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useAuthStore } from '@/store/auth-store';
// useFilteredShows available for future use
import { DataVisibilityGate } from '@/components/auth/data-visibility-gate';
import { ViewMode, AlertType, AlertPriority } from '@/types/enums';
import { TradeShow } from '@/types';
import { StatCard } from '@/components/ui/stat-card';
import { CompletionBadge } from '@/components/ui/completion-badge';
import { SkeletonCard, SkeletonListItem } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { getMonthAbbrev, getDayNumber } from '@/lib/date-utils';
import { daysUntilShow } from '@/types/computed';
import {
  Calendar, Clock, CalendarDays, DollarSign, AlertTriangle,
  CheckCircle, CalendarClock, Plus, BarChart3, CalendarPlus,
  ChevronRight, Package, UserPlus, Building2, SquareDashed, Zap, Truck,
} from 'lucide-react';
import { ShippingTimeline } from '@/components/ui/shipping-timeline';
import { parseISO, isValid, isSameMonth, addDays, addMonths, format } from 'date-fns';

interface ShowAlert {
  show: TradeShow;
  type: AlertType;
  title: string;
  priority: AlertPriority;
  daysUntilDeadline?: number;
}

interface DashboardViewProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function DashboardView({ onViewModeChange }: DashboardViewProps) {
  // Use Zustand selectors to prevent unnecessary re-renders
  const shows = useTradeShowStore((state) => state.shows);
  const selectShow = useTradeShowStore((state) => state.selectShow);
  const createNewShow = useTradeShowStore((state) => state.createNewShow);
  const loadShows = useTradeShowStore((state) => state.loadShows);
  const isLoading = useTradeShowStore((state) => state.isLoading);
  const organization = useAuthStore((state) => state.organization);
  // Stable reference for current time (refreshes on component mount)
  const [now] = useState(() => new Date());
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  
  // Get shipping buffer from org settings (default 7 days)
  const shippingBufferDays = (organization?.settings?.shippingBufferDays as number) || 7;

  const upcomingShows = useMemo(() =>
    shows.filter(s => {
      if (!s.startDate) return false;
      const d = parseISO(s.startDate);
      return isValid(d) && d >= now;
    }).sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '')),
  [shows, now]);

  const showsThisMonth = useMemo(() =>
    shows.filter(s => {
      if (!s.startDate) return false;
      const d = parseISO(s.startDate);
      return isValid(d) && isSameMonth(d, now);
    }),
  [shows, now]);

  const showsNext30 = useMemo(() =>
    upcomingShows.filter(s => {
      const days = daysUntilShow(s);
      return days !== null && days <= 30;
    }),
  [upcomingShows]);

  const totalBudget = useMemo(() => shows.reduce((sum, s) => sum + (s.cost ?? 0), 0), [shows]);
  const upcomingBudget = useMemo(() => upcomingShows.reduce((sum, s) => sum + (s.cost ?? 0), 0), [upcomingShows]);

  // Alerts
  const alerts = useMemo(() => {
    const list: ShowAlert[] = [];
    const thirtyDaysOut = addDays(now, 30);
    const fourteenDaysOut = addDays(now, 14);
    const twentyOneDaysOut = addDays(now, 21);

    for (const show of upcomingShows) {
      const start = show.startDate ? parseISO(show.startDate) : null;

      if (show.registrationConfirmed !== true && start && start <= thirtyDaysOut) {
        const daysUntilShow = start ? Math.ceil((start.getTime() - now.getTime()) / 86400000) : null;
        list.push({ 
          show, 
          type: AlertType.RegistrationNeeded, 
          title: 'Registration needed', 
          priority: AlertPriority.High,
          daysUntilDeadline: daysUntilShow || undefined
        });
      }

      if (show.shippingCutoff) {
        const cutoff = parseISO(show.shippingCutoff);
        if (isValid(cutoff)) {
          const daysToCutoff = Math.ceil((cutoff.getTime() - now.getTime()) / 86400000);
          if (daysToCutoff >= 0 && daysToCutoff <= 7) {
            list.push({
              show, type: AlertType.ShippingDeadline,
              title: daysToCutoff === 0 ? 'Shipping deadline today!' : `Shipping in ${daysToCutoff} days`,
              priority: daysToCutoff <= 3 ? AlertPriority.High : AlertPriority.Medium,
              daysUntilDeadline: daysToCutoff,
            });
          }
        }
      }

      if (show.hotelConfirmed !== true && show.hotelName && start && start <= fourteenDaysOut) {
        const daysUntilShow = start ? Math.ceil((start.getTime() - now.getTime()) / 86400000) : null;
        list.push({ 
          show, 
          type: AlertType.HotelNotConfirmed, 
          title: 'Hotel not confirmed', 
          priority: AlertPriority.Medium,
          daysUntilDeadline: daysUntilShow || undefined
        });
      }

      if ((!show.boothToShip || show.boothToShip === '[]') && start && start <= twentyOneDaysOut) {
        const daysUntilShow = start ? Math.ceil((start.getTime() - now.getTime()) / 86400000) : null;
        list.push({ 
          show, 
          type: AlertType.NoBoothSelected, 
          title: 'No booth selected', 
          priority: AlertPriority.Low,
          daysUntilDeadline: daysUntilShow || undefined
        });
      }
    }

    // Enhanced sorting: Priority first (High → Medium → Low), then by days until deadline (soonest first)
    return list.sort((a, b) => {
      // Sort by priority first (higher priority first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Within same priority, sort by days until deadline (soonest first)
      const aDays = a.daysUntilDeadline ?? Infinity;
      const bDays = b.daysUntilDeadline ?? Infinity;
      return aDays - bDays;
    });
  }, [upcomingShows, now]);

  // Timeline months
  const timelineMonths = useMemo(() =>
    [0, 1, 2].map(i => addMonths(now, i)),
  [now]);

  const alertIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.RegistrationNeeded: return <UserPlus size={16} />;
      case AlertType.ShippingDeadline: return <Package size={16} />;
      case AlertType.HotelNotConfirmed: return <Building2 size={16} />;
      case AlertType.NoBoothSelected: return <SquareDashed size={16} />;
    }
  };

  const getAlertStyling = (priority: AlertPriority, type: AlertType, days?: number) => {
    switch (priority) {
      case AlertPriority.High:
        return {
          color: '#CF222E',
          backgroundColor: '#CF222E1A',
          borderColor: '#CF222E33',
          textColor: '#CF222E',
          pulseClass: 'animate-pulse',
          badgeClass: 'bg-red-500 text-white'
        };
      case AlertPriority.Medium:
        return {
          color: '#BF8700',
          backgroundColor: '#BF87001A',
          borderColor: '#BF870033',
          textColor: '#BF8700',
          pulseClass: '',
          badgeClass: 'bg-amber-500 text-white'
        };
      case AlertPriority.Low:
      default:
        return {
          color: '#656D76',
          backgroundColor: '#656D761A',
          borderColor: '#656D7633',
          textColor: '#656D76',
          pulseClass: '',
          badgeClass: 'bg-gray-500 text-white'
        };
    }
  };

  const alertColor = (type: AlertType, days?: number) => {
    switch (type) {
      case AlertType.RegistrationNeeded: return '#CF222E';
      case AlertType.ShippingDeadline: return (days !== undefined && days <= 3) ? '#CF222E' : '#BF8700';
      case AlertType.HotelNotConfirmed: return '#BF8700';
      case AlertType.NoBoothSelected: return '#656D76';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">{format(now, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Button onClick={() => loadShows()} loading={isLoading} size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard title="Total Shows" value={`${shows.length}`} subtitle="All time" icon={Calendar} color="#A62B9F" />
            <StatCard title="Upcoming" value={`${upcomingShows.length}`} subtitle={`${showsNext30.length} in next 30 days`} icon={Clock} color="#59C8FA" />
            <StatCard title="This Month" value={`${showsThisMonth.length}`} subtitle={format(now, 'MMMM')} icon={CalendarDays} color="#1A7F37" />
            <DataVisibilityGate category="budget" fallback={<div />}>
              <StatCard title="Total Budget" value={formatCurrency(totalBudget)} subtitle={`${formatCurrency(upcomingBudget)} upcoming`} icon={DollarSign} color="#BF8700" />
            </DataVisibilityGate>
          </>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Alerts */}
          <div className="bg-surface rounded-2xl border border-border-subtle shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-warning" />
              <h2 className="text-sm font-semibold text-text-primary">Needs Attention</h2>
              {alerts.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-medium">{alerts.length}</span>
              )}
            </div>
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success-bg">
                <CheckCircle size={24} className="text-success" />
                <div>
                  <p className="text-sm font-medium text-text-primary">All caught up!</p>
                  <p className="text-xs text-text-secondary">No urgent items need your attention</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {(showAllAlerts ? alerts : alerts.slice(0, 6)).map((alert, i) => {
                  const styling = getAlertStyling(alert.priority, alert.type, alert.daysUntilDeadline);
                  return (
                    <button 
                      key={i} 
                      onClick={() => selectShow(alert.show)} 
                      className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-all duration-200 text-left border border-transparent hover:border-border-subtle ${styling.pulseClass}`}
                      style={{ 
                        borderLeftColor: styling.color, 
                        borderLeftWidth: '3px',
                        backgroundColor: alert.priority === AlertPriority.High ? styling.backgroundColor : undefined
                      }}
                    >
                      <div 
                        className={`p-1.5 rounded relative ${alert.priority === AlertPriority.High ? 'animate-pulse' : ''}`} 
                        style={{ backgroundColor: styling.backgroundColor, color: styling.color }}
                      >
                        {alert.priority === AlertPriority.High && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        )}
                        {alertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary truncate">{alert.show.name}</p>
                          {alert.priority === AlertPriority.High && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-500 text-white">
                              HIGH
                            </span>
                          )}
                          {alert.priority === AlertPriority.Medium && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500 text-white">
                              MED
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: styling.textColor }}>{alert.title}</p>
                        {alert.daysUntilDeadline !== undefined && alert.daysUntilDeadline <= 7 && (
                          <p className="text-[10px] mt-0.5 text-text-secondary">
                            {alert.daysUntilDeadline === 0 ? 'Due today' : `${alert.daysUntilDeadline} days remaining`}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-border-strong" />
                    </button>
                  );
                })}
                {alerts.length > 6 && !showAllAlerts && (
                  <button 
                    onClick={() => setShowAllAlerts(true)}
                    className="w-full text-center py-2 text-xs font-medium text-brand-purple hover:text-brand-purple-dark transition-colors hover:bg-brand-purple/5 rounded-lg"
                  >
                    View all {alerts.length} alerts
                  </button>
                )}
                {showAllAlerts && alerts.length > 6 && (
                  <button 
                    onClick={() => setShowAllAlerts(false)}
                    className="w-full text-center py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors hover:bg-bg-tertiary rounded-lg"
                  >
                    Show less
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upcoming shows */}
          <div className="bg-surface rounded-2xl border border-border-subtle shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock size={16} className="text-brand-purple" />
              <h2 className="text-sm font-semibold text-text-primary">Upcoming Shows</h2>
            </div>
            {isLoading ? (
              <div className="space-y-1">
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
              </div>
            ) : upcomingShows.length === 0 ? (
              <div className="text-center py-8">
                <CalendarPlus size={32} className="mx-auto text-border-strong mb-2" />
                <p className="text-sm text-text-secondary">No upcoming shows</p>
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingShows.slice(0, 5).map(show => {
                  const days = daysUntilShow(show);
                  return (
                    <button key={show.id} onClick={() => selectShow(show)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors text-left">
                      <div className="w-12 h-12 flex flex-col items-center justify-center rounded-lg bg-brand-purple/10">
                        <span className="text-[10px] font-bold text-brand-purple">{getMonthAbbrev(show.startDate)}</span>
                        <span className="text-lg font-bold text-text-primary leading-none">{getDayNumber(show.startDate)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-text-primary truncate flex-1">{show.name}</p>
                          <CompletionBadge show={show} size="sm" />
                        </div>
                        {show.location && <p className="text-xs text-text-secondary truncate">{show.location}</p>}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${days !== null && days <= 7 ? 'bg-error-bg text-error' : 'bg-bg-tertiary text-text-secondary'}`}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                      </span>
                      <ChevronRight size={14} className="text-border-strong" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Timeline */}
          <div className="bg-surface rounded-2xl border border-border-subtle shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-brand-cyan" />
              <h2 className="text-sm font-semibold text-text-primary">Next 90 Days</h2>
            </div>
            <div className="space-y-3">
              {timelineMonths.map(month => {
                const monthShows = upcomingShows.filter(s => {
                  if (!s.startDate) return false;
                  const d = parseISO(s.startDate);
                  return isValid(d) && isSameMonth(d, month);
                });
                return (
                  <div key={month.toISOString()} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-8">{format(month, 'MMM')}</span>
                    <div className="flex-1">
                      {monthShows.length === 0 ? (
                        <div className="h-2 rounded-sm bg-border-subtle" />
                      ) : (
                        <div className="flex gap-1">
                          {monthShows.slice(0, 5).map(s => (
                            <div key={s.id} className="h-2 flex-1 rounded-sm bg-brand-purple" />
                          ))}
                          {monthShows.length > 5 && <span className="text-[9px] text-text-secondary">+{monthShows.length - 5}</span>}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs w-5 text-right ${monthShows.length > 0 ? 'text-brand-purple font-medium' : 'text-border-strong'}`}>{monthShows.length}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface rounded-2xl border border-border-subtle shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-warning" />
              <h2 className="text-sm font-semibold text-text-primary">Quick Actions</h2>
            </div>
            <div className="space-y-1">
              <button onClick={createNewShow} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors">
                <div className="p-1.5 rounded" style={{ backgroundColor: '#A62B9F1A', color: '#A62B9F' }}>
                  <Plus size={16} />
                </div>
                <span className="text-sm font-medium text-text-primary">New Trade Show</span>
                <ChevronRight size={14} className="ml-auto text-border-strong" />
              </button>
              <button onClick={() => onViewModeChange(ViewMode.Calendar)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors">
                <div className="p-1.5 rounded" style={{ backgroundColor: '#59C8FA1A', color: '#59C8FA' }}>
                  <Calendar size={16} />
                </div>
                <span className="text-sm font-medium text-text-primary">View Calendar</span>
                <ChevronRight size={14} className="ml-auto text-border-strong" />
              </button>
              <DataVisibilityGate category="budget">
                <button onClick={() => onViewModeChange(ViewMode.Budget)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors">
                  <div className="p-1.5 rounded" style={{ backgroundColor: '#BF87001A', color: '#BF8700' }}>
                    <BarChart3 size={16} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">Budget Reports</span>
                  <ChevronRight size={14} className="ml-auto text-border-strong" />
                </button>
              </DataVisibilityGate>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Timeline */}
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Truck size={16} className="text-brand-cyan" />
          <h2 className="text-sm font-semibold text-text-primary">Shipping Timeline</h2>
        </div>
        <ShippingTimeline shows={shows} onSelectShow={selectShow} daysToShow={45} shippingBufferDays={shippingBufferDays} />
      </div>
    </div>
  );
}
