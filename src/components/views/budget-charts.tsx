'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatCurrency, formatCurrencyShort } from '@/lib/utils';

const PIE_COLORS = ['#A62B9F', '#59C8FA', '#1A7F37', '#BF8700', '#0969DA', '#CF222E', '#8250DF', '#57606A'];

interface BudgetChartsProps {
  monthlyData: { month: string; cost: number }[];
  costByShow: { name: string; cost: number }[];
}

export default function BudgetCharts({ monthlyData, costByShow }: BudgetChartsProps) {
  return (
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
          <div className="flex items-center justify-center h-[300px] text-text-secondary text-sm">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={costByShow} dataKey="cost" nameKey="name" cx="50%" cy="40%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {costByShow.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
