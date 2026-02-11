'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useTradeShowStore } from '@/store/trade-show-store';
import { DataVisibilityGate } from '@/components/auth/data-visibility-gate';
import { ShieldX } from 'lucide-react';
import { BudgetTimeframe } from '@/types/enums';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency, formatCurrencyShort } from '@/lib/utils';
import { totalServicesCost, roiPercentage, totalCostForShow, hotelCostForShow, flightCostForShow } from '@/types/computed';
import {
  DollarSign, Calendar, BarChart3, UserCheck,
  Ticket, Package, Building2, Wrench, Users, Plane, TrendingUp, PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { parseISO, isValid, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format } from 'date-fns';

const PIE_COLORS = ['#A62B9F', '#59C8FA', '#1A7F37', '#BF8700', '#0969DA', '#CF222E', '#8250DF', '#57606A'];

export default function BudgetView() {
  const { shows, allAttendees } = useTradeShowStore();
  const [timeframe, setTimeframe] = useState<BudgetTimeframe>(BudgetTimeframe.Year);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const nowRef = useRef(new Date());
  const now = nowRef.current;

  const filteredShows = useMemo(() => {
    switch (timeframe) {
      case BudgetTimeframe.Quarter: {
        const qStart = startOfQuarter(now);
        const qEnd = endOfQuarter(now);
        return shows.filter(s => {
          if (!s.startDate) return false;
          const d = parseISO(s.startDate);
          return isValid(d) && d >= qStart && d <= qEnd;
        });
      }
      case BudgetTimeframe.Year: {
        const yStart = startOfYear(now);
        const yEnd = endOfYear(now);
        return shows.filter(s => {
          if (!s.startDate) return false;
          const d = parseISO(s.startDate);
          return isValid(d) && d >= yStart && d <= yEnd;
        });
      }
      case BudgetTimeframe.Custom: {
        if (!customStart || !customEnd) return shows;
        const s = parseISO(customStart);
        const e = parseISO(customEnd);
        return shows.filter(show => {
          if (!show.startDate) return false;
          const d = parseISO(show.startDate);
          return isValid(d) && d >= s && d <= e;
        });
      }
      default:
        return shows;
    }
  }, [shows, timeframe, customStart, customEnd, now]);

  const totalBudget = filteredShows.reduce((sum, s) => sum + totalCostForShow(s, allAttendees), 0);
  const totalBase = filteredShows.reduce((sum, s) => sum + (s.cost ?? 0), 0);
  const totalShipping = filteredShows.reduce((sum, s) => sum + (s.shippingCost ?? 0), 0);
  const totalHotel = filteredShows.reduce((sum, s) => sum + hotelCostForShow(s, allAttendees), 0);
  const totalServices = filteredShows.reduce((sum, s) => sum + totalServicesCost(s), 0);
  const totalFlights = filteredShows.reduce((sum, s) => sum + flightCostForShow(s, allAttendees), 0);
  const totalRevenue = filteredShows.reduce((sum, s) => sum + (s.revenueAttributed ?? 0), 0);
  const totalLeads = filteredShows.reduce((sum, s) => sum + (s.totalLeads ?? 0), 0);
  const avgCost = filteredShows.length > 0 ? totalBudget / filteredShows.length : 0;
  const avgCPL = totalLeads > 0 ? totalBudget / totalLeads : null;
  const avgROI = (() => {
    const rois = filteredShows.map(s => roiPercentage(s)).filter(r => r !== null) as number[];
    return rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : null;
  })();

  // Monthly data
  const monthlyData = useMemo(() => {
    const data: Record<string, number> = {};
    for (const show of filteredShows) {
      if (!show.startDate) continue;
      const d = parseISO(show.startDate);
      if (!isValid(d)) continue;
      const key = format(d, 'MMM yyyy');
      data[key] = (data[key] ?? 0) + totalCostForShow(show, allAttendees);
    }
    return Object.entries(data)
      .map(([month, cost]) => ({ month, cost }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredShows, allAttendees]);

  // Cost distribution (pie)
  const costByShow = useMemo(() =>
    filteredShows
      .map(s => ({ name: s.name, cost: totalCostForShow(s, allAttendees) }))
      .filter(s => s.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5),
  [filteredShows, allAttendees]);

  // Performance table
  const showPerformance = useMemo(() =>
    filteredShows
      .map(s => ({
        name: s.name,
        cost: totalCostForShow(s, allAttendees),
        services: totalServicesCost(s),
        leads: s.totalLeads ?? 0,
        cpl: s.totalLeads && s.totalLeads > 0 ? totalCostForShow(s, allAttendees) / s.totalLeads : null,
        roi: roiPercentage(s),
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10),
  [filteredShows, allAttendees]);

  return (
    <DataVisibilityGate 
      category="budget" 
      fallback={
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
          <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center mb-4">
            <ShieldX size={32} className="text-error" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Access Restricted</h2>
          <p className="text-text-secondary max-w-md">
            You don't have permission to view budget reports. Contact your organization admin if you need access.
          </p>
        </div>
      }
    >
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Budget Reports</h1>
          <p className="text-sm text-text-secondary">Track and analyze your trade show spending</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">Timeframe</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {Object.values(BudgetTimeframe).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${timeframe === tf ? 'bg-brand-purple text-white' : 'bg-surface text-text-secondary hover:bg-bg-tertiary'}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {timeframe === BudgetTimeframe.Custom && (
        <div className="flex items-center justify-end gap-4">
          <label className="text-sm text-text-secondary">
            From: <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="ml-1 rounded border border-border bg-bg-secondary px-2 py-1 text-sm" />
          </label>
          <label className="text-sm text-text-secondary">
            To: <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="ml-1 rounded border border-border bg-bg-secondary px-2 py-1 text-sm" />
          </label>
        </div>
      )}

      {/* Stats grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Spend" value={formatCurrency(totalBudget)} icon={DollarSign} color="#A62B9F" />
          <StatCard title="Shows" value={`${filteredShows.length}`} icon={Calendar} color="#59C8FA" />
          <StatCard title="Average Cost" value={formatCurrency(avgCost)} icon={BarChart3} color="#1A7F37" />
          <StatCard title="Avg Cost/Lead" value={avgCPL ? formatCurrency(avgCPL) : 'N/A'} icon={UserCheck} color="#CF222E" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Registration Costs" value={formatCurrency(totalBase)} icon={Ticket} color="#8250DF" />
          <StatCard title="Shipping Costs" value={formatCurrency(totalShipping)} icon={Package} color="#BF8700" />
          <StatCard title="Hotel Costs" value={formatCurrency(totalHotel)} icon={Building2} color="#0969DA" />
          <StatCard title="Services Costs" value={formatCurrency(totalServices)} icon={Wrench} color="#57606A" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Leads" value={`${totalLeads}`} icon={Users} color="#1F883D" />
          <StatCard title="Flight Costs" value={formatCurrency(totalFlights)} icon={Plane} color="#0969DA" />
          <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} color="#1A7F37" />
          <StatCard title="Avg ROI" value={avgROI !== null ? `${avgROI.toFixed(1)}%` : 'N/A'} icon={PieIcon} color={avgROI !== null && avgROI >= 0 ? '#1A7F37' : '#CF222E'} />
        </div>
      </div>

      {/* Charts */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-surface rounded-xl border border-border-subtle shadow-sm p-4 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Monthly Spending</h2>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-text-secondary text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                <YAxis tickFormatter={v => formatCurrencyShort(v)} tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="cost" fill="#A62B9F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="w-full lg:w-[350px] bg-surface rounded-xl border border-border-subtle shadow-sm p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Cost Distribution</h2>
          {costByShow.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-text-secondary text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={costByShow} dataKey="cost" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {costByShow.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Performance table */}
      <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Show Performance Breakdown</h2>
        {showPerformance.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">No shows with cost data</p>
        ) : (
          <>
            <div className="grid grid-cols-[30px_1fr_90px_80px_60px_90px_70px] gap-2 px-3 py-2 text-xs text-text-secondary font-medium">
              <span>#</span><span>Show Name</span><span className="text-right">Total Cost</span><span className="text-right">Services</span><span className="text-right">Leads</span><span className="text-right">Cost/Lead</span><span className="text-right">ROI</span>
            </div>
            <div className="space-y-1">
              {showPerformance.map((item, i) => (
                <div key={item.name} className="grid grid-cols-[30px_1fr_90px_80px_60px_90px_70px] gap-2 px-3 py-2.5 bg-bg-tertiary rounded-lg items-center">
                  <span className="w-7 h-7 rounded flex items-center justify-center bg-brand-purple text-white text-xs font-medium">{i + 1}</span>
                  <span className="text-sm font-medium text-text-primary truncate">{item.name}</span>
                  <span className="text-sm text-text-primary text-right">{formatCurrency(item.cost)}</span>
                  <span className="text-sm text-text-secondary text-right">{formatCurrency(item.services)}</span>
                  <span className="text-sm text-right" style={{ color: item.leads > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{item.leads > 0 ? item.leads : '-'}</span>
                  <span className="text-sm text-right" style={{ color: item.cpl ? '#CF222E' : 'var(--text-tertiary)' }}>{item.cpl ? formatCurrency(item.cpl) : '-'}</span>
                  <span className="text-sm text-right" style={{ color: item.roi !== null ? (item.roi >= 0 ? '#1A7F37' : '#CF222E') : 'var(--text-tertiary)' }}>
                    {item.roi !== null ? `${item.roi.toFixed(0)}%` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </DataVisibilityGate>
  );
}
