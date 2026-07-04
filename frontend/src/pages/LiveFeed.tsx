import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { SeverityBadge, type SeverityLevel } from '../components/SeverityBadge';
import { ExplainabilityPanel } from '../components/ExplainabilityPanel';
import { useApi } from '../hooks/useApi';

interface FlowRecord {
  timestamp: string;
  source_ip: string;
  dest_ip: string;
  predicted_label: string;
  severity: number;
  is_anomaly: number;
  risk_score: number;
  recommended_action: string;
  status: string;
  features?: any[];
}

type SortKey = keyof FlowRecord;
type SortDir = 'asc' | 'desc';

const STATUS_CLASSES: Record<string, string> = {
  Open: 'text-critical',
  Closed: 'text-benign',
  Logged: 'text-textMuted',
};

const getMitreTag = (label: string): string => {
  const normalized = label.toLowerCase();
  if (normalized.includes('ddos')) return 'T1498';
  if (normalized.includes('portscan')) return 'T1046';
  if (normalized.includes('bruteforce')) return 'T1110';
  if (normalized.includes('bot')) return 'T1071.001';
  if (normalized.includes('infiltration')) return 'T1190';
  return '';
};

export const LiveFeed: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedAttackType, setSelectedAttackType] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedRow, setSelectedRow] = useState<FlowRecord | null>(null);

  const { data: allData, loading } = useApi<FlowRecord[]>('/api/flows', 'flow_risk_scores', 2000);
  const attackTypes = allData ? ['ALL', ...Array.from(new Set(allData.map(r => r.predicted_label)))] : ['ALL'];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filteredData = (allData || [])
    .filter(row => {
      const matchSearch = !searchTerm ||
        row.source_ip.includes(searchTerm) ||
        row.dest_ip.includes(searchTerm);
      const matchSev = selectedSeverity === 'ALL' || row.severity.toString() === selectedSeverity;
      const matchType = selectedAttackType === 'ALL' || row.predicted_label === selectedAttackType;
      return matchSearch && matchSev && matchType;
    })
    .sort((a, b) => {
  const av = a[sortKey] as string | number;
  const bv = b[sortKey] as string | number;

  if (av < bv) return sortDir === 'asc' ? -1 : 1;
  if (av > bv) return sortDir === 'asc' ? 1 : -1;
  return 0;
});

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-textMain" /> : <ArrowDown className="w-3 h-3 text-textMain" />;
  };

  const cols: { key: SortKey; label: string }[] = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'source_ip', label: 'Source IP' },
    { key: 'dest_ip', label: 'Dest IP' },
    { key: 'predicted_label', label: 'Attack Type' },
    { key: 'risk_score', label: 'Trust Level' },
    { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col p-6 h-full overflow-hidden min-w-0">
        <header className="mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-textMain tracking-tight">Zero-Trust Threat Feed</h1>
            <p className="text-textMuted text-sm mt-1">Continuous verification & dynamic authorization status • {filteredData.length} active sessions</p>
          </div>
          <span className={`text-xs font-mono px-2 py-1 rounded self-start ${loading ? 'bg-medium/10 text-medium border-medium/20' : 'bg-benign/10 text-benign border-benign/20'} border`}>
            {loading ? 'LOADING...' : 'DATA: LIVE'}
          </span>
        </header>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
            <input
              type="text"
              placeholder="Search IP…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-surface border border-border rounded-md pl-9 pr-3 py-1.5 text-sm text-textMain focus:outline-none focus:border-textMuted w-48 transition-colors"
            />
          </div>
          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm text-textMain focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="5">Critical</option>
            <option value="4">High</option>
            <option value="3">Medium</option>
            <option value="2">Low</option>
            <option value="1">Benign</option>
          </select>
          <select
            value={selectedAttackType}
            onChange={e => setSelectedAttackType(e.target.value)}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm text-textMain focus:outline-none"
          >
            {attackTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {(searchTerm || selectedSeverity !== 'ALL' || selectedAttackType !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedSeverity('ALL'); setSelectedAttackType('ALL'); }}
              className="flex items-center gap-1 text-xs text-textMuted hover:text-textMain transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto border border-border rounded-lg bg-surface">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="sticky top-0 z-10 bg-surface border-b border-border">
              <tr>
                {cols.map(c => (
                  <th
                    key={c.key}
                    onClick={() => handleSort(c.key)}
                    className="px-4 py-3 text-textMuted font-semibold cursor-pointer hover:text-textMain select-none"
                  >
                    <span className="flex items-center gap-1">
                      {c.label} <SortIcon col={c.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-textMuted">
                    No active sessions match the current filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => {
                  const trustScore = Math.max(0, 100 - row.risk_score);
                  const mitre = getMitreTag(row.predicted_label);
                  return (
                    <motion.tr
                      key={row.timestamp + row.source_ip}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.015 }}
                      onClick={() => setSelectedRow(r => r?.timestamp === row.timestamp && r.source_ip === row.source_ip ? null : row)}
                      className={`cursor-pointer transition-colors hover:bg-surfaceHover ${
                        row.severity === 5 ? 'hover:shadow-[0_0_12px_0_rgba(239,68,68,0.08)]' : ''
                      } ${selectedRow?.timestamp === row.timestamp && selectedRow?.source_ip === row.source_ip ? 'bg-surfaceHover' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-textMuted">
                        {new Date(row.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.severity >= 4
                          ? <span className="text-critical font-semibold">{row.source_ip}</span>
                          : <span className="text-textMain">{row.source_ip}</span>
                        }
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-textMain">{row.dest_ip}</td>
                      <td className="px-4 py-3 font-mono text-xs text-textMain">
                        <div>{row.predicted_label}</div>
                        {mitre && (
                          <div className="text-[10px] text-textMuted mt-0.5 opacity-80 font-sans font-medium">MITRE {mitre}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 w-36 font-mono text-xs">
                        <span className={`font-bold ${trustScore < 30 ? 'text-critical' : 'text-benign'}`}>
                          {trustScore.toFixed(0)}% Trust
                        </span>
                        <div className="w-full h-1 bg-surface rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full rounded-full transition-all ${trustScore < 30 ? 'bg-critical' : 'bg-benign'}`}
                            style={{ width: `${trustScore}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={row.severity as SeverityLevel} />
                        {row.severity === 5 && (
                          <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-critical animate-pulse" />
                        )}
                      </td>
                    <td className={`px-4 py-3 font-mono text-xs ${STATUS_CLASSES[row.status] ?? 'text-textMuted'}`}>
                      {row.status}
                    </td>
                  </motion.tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      <ExplainabilityPanel
        flow={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  );
};
