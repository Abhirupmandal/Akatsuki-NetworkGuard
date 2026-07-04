import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useApi } from '../hooks/useApi';

const SERIES = [
  { key: 'DDoS',        color: '#EF4444' },
  { key: 'PortScan',    color: '#EAB308' },
  { key: 'BruteForce',  color: '#F97316' },
  { key: 'Botnet',      color: '#EC4899' },
  { key: 'WebAttack',   color: '#8B5CF6' },
  { key: 'Infiltration',color: '#06B6D4' },
];

type TimeWindow = '24h' | '7d';

const annotationLabels: Record<string, string> = {
  'DDoS escalation 13:00': '⚡ DDoS escalation 13:00',
  'Escalation detected 14:32': '⚡ Escalation detected 14:32',
  'PortScan surge 16:15': '⚡ PortScan surge 16:15',
  'Botnet spike Jun 28': '⚡ Botnet spike Jun 28',
  'Multi-vector attack Jul 2': '⚡ Multi-vector attack Jul 2',
};

export const Trends: React.FC = () => {
  const [window, setWindow] = useState<TimeWindow>('24h');

  const { data, loading } = useApi<any[]>(`/api/trends/${window}`, window === '24h' ? 'trend_data_24h' : 'trend_data_7d', 5000);

  if (loading || !data) {
    return <div className="p-6 text-textMuted">Loading trends...</div>;
  }

  const annotations = data
    .map((d, i) => ({ idx: i, note: (d as Record<string, unknown>).annotation as string | undefined }))
    .filter(d => d.note);

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain tracking-tight">Historical Trends</h1>
          <p className="text-textMuted text-sm mt-1">Attack volume over time, stacked by type</p>
        </div>
        <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
          {(['24h', '7d'] as TimeWindow[]).map(w => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                window === w
                  ? 'bg-surfaceHover text-textMain'
                  : 'text-textMuted hover:text-textMain'
              }`}
            >
              Last {w}
            </button>
          ))}
        </div>
      </div>

      {annotations.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {annotations.map(a => (
            <span key={a.note} className="bg-critical/10 border border-critical/30 text-critical text-xs font-mono px-3 py-1 rounded-full">
              {annotationLabels[a.note!] ?? a.note}
            </span>
          ))}
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg p-4 h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <defs>
              {SERIES.map(s => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" />
            <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1A1D24', border: '1px solid #2A2D35', borderRadius: 6 }}
              labelStyle={{ color: '#E2E8F0', fontWeight: 600 }}
              itemStyle={{ color: '#94A3B8' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(v) => <span style={{ color: '#E2E8F0', fontSize: 12 }}>{v}</span>}
            />
            {annotations.map(a => (
              <ReferenceLine
                key={a.note}
                x={data[a.idx].label}
                stroke="#EF4444"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                label={{ value: '⚡', position: 'top', fill: '#EF4444', fontSize: 14 }}
              />
            ))}
            {SERIES.map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
