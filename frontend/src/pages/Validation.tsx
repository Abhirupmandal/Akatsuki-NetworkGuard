import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Activity, RotateCcw, Layers } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getApiUrl } from '../config';

/* ── Animated number hook ──────────────────────────────────── */
function useAnimatedValue(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const from = prev.current;
    const delta = target - from;
    if (Math.abs(delta) < 1e-6) { setDisplay(target); prev.current = target; return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + delta * eased);
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else { setDisplay(target); prev.current = target; }
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return display;
}

/* ── Animated Value Component ──────────────────────────────── */
const AnimatedNum: React.FC<{ value: number; isPercent?: boolean; decimals?: number }> = ({ value, isPercent, decimals = 1 }) => {
  const animated = useAnimatedValue(value);
  return <span>{(animated * (isPercent ? 100 : 1)).toFixed(decimals)}</span>;
};

/* ── Helpers ───────────────────────────────────────────────── */
function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.floor(n));
}

function scoreToBg(score: number) {
  const s = Math.max(0, Math.min(1, score));
  const r = Math.round(255 * (1 - s));
  const g = Math.round(255 * s);
  return `rgb(${r},${g},0)`;
}

/* ── Pulse animation component ─────────────────────────────── */
const LivePulse: React.FC = () => (
  <span className="inline-flex items-center gap-1.5">
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-benign opacity-60" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-benign" />
    </span>
    <span className="text-benign text-[11px] font-semibold uppercase tracking-widest">Live</span>
  </span>
);

/* ═════════════════════════════════════════════════════════════ */
export const Validation: React.FC = () => {
  // Poll every 5 seconds for live drift
  const { data, loading, mutate } = useApi<any>('/api/validation', '_PLACEHOLDER_NOTE', 5000);
  const [recalibrating, setRecalibrating] = useState(false);
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    if (data?.last_updated) setTickCount(c => c + 1);
  }, [data?.last_updated]);

  /* ── Recalibrate Handler ─────────────────────────────────── */
  const handleRecalibrate = async () => {
    setRecalibrating(true);
    try {
      const res = await fetch(getApiUrl('/api/validation/recalibrate'), { method: 'POST' });
      if (res.ok) {
        await mutate(); // Force immediate re-fetch
      }
    } catch { /* silent */ }
    setRecalibrating(false);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-critical border-t-transparent rounded-full animate-spin" />
          <span className="text-textMuted text-sm">Loading validation metrics...</span>
        </div>
      </div>
    );
  }

  const perClass = data?.validation_per_class || [];
  const cm = data?.confusion_matrix || { labels: [], matrix: [] };
  const lastUpdated = data?.last_updated || new Date().toISOString();
  const pipelineStatus = data?.pipeline_status || 'idle';
  const totalSamples = data?.total_samples || 0;

  const overallFpr = perClass.length > 0 
    ? perClass.reduce((sum: any, c: any) => sum + (c.false_positive_rate ?? 0), 0) / perClass.length
    : 0;

  // Flatten matrix to find max for intensity scaling
  const maxVal = cm.matrix && cm.matrix.length > 0 
    ? Math.max(...cm.matrix.flat()) 
    : 1;

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-textMain tracking-tight">Model Validation</h1>
            <LivePulse />
          </div>
          <p className="text-textMuted text-sm mt-1">
            Precision / Recall / F1 per attack class & live confusion matrix heatmap
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-textMuted text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated {timeAgo(lastUpdated)}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
            pipelineStatus === 'evaluating'
              ? 'border-benign/30 bg-benign/10 text-benign'
              : 'border-border bg-surface text-textMuted'
          }`}>
            <Activity className="w-3 h-3" />
            {pipelineStatus}
          </span>
          <button
            onClick={handleRecalibrate}
            disabled={recalibrating}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold
                       bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                       hover:shadow-[0_0_16px_0_rgba(59,130,246,0.2)]"
          >
            {recalibrating ? (
              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            {recalibrating ? 'Recalibrating...' : 'Recalibrate Model'}
          </button>
        </div>
      </header>

      {/* ── Top KPIs ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-lg p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-critical/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-critical/10 rounded-lg">
              <Activity className="w-5 h-5 text-critical" />
            </div>
            <div>
              <div className="text-textMuted text-xs uppercase font-semibold mb-1">Overall False-Positive Rate</div>
              <div className="font-mono text-2xl font-bold text-critical">
                <AnimatedNum value={overallFpr} isPercent decimals={2} /> %
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-benign/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-benign/10 rounded-lg">
              <Layers className="w-5 h-5 text-benign" />
            </div>
            <div>
              <div className="text-textMuted text-xs uppercase font-semibold mb-1">Total Samples Evaluated</div>
              <div className="font-mono text-2xl font-bold text-textMain">
                {formatNumber(totalSamples)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Per-class Metrics Table ─────────────────────────── */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden mb-8 relative">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceHover border-b border-border">
            <tr>
              <th className="px-4 py-3 text-textMuted font-semibold text-xs uppercase tracking-wider">Class</th>
              <th className="px-4 py-3 text-textMuted font-semibold text-xs uppercase tracking-wider">Precision</th>
              <th className="px-4 py-3 text-textMuted font-semibold text-xs uppercase tracking-wider">Recall</th>
              <th className="px-4 py-3 text-textMuted font-semibold text-xs uppercase tracking-wider">F1</th>
              <th className="px-4 py-3 text-textMuted font-semibold text-xs uppercase tracking-wider">FPR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence>
              {perClass.map((cls: any) => (
                <motion.tr 
                  key={cls.class} 
                  className="hover:bg-surfaceHover transition-colors"
                  layout
                >
                  <td className="px-4 py-3 font-mono text-textMain font-medium">{cls.class}</td>
                  <td className="px-4 py-3 text-textMain font-mono">
                    <AnimatedNum value={cls.precision} isPercent decimals={1} /> %
                  </td>
                  <td className="px-4 py-3 text-textMain font-mono">
                    <AnimatedNum value={cls.recall} isPercent decimals={1} /> %
                  </td>
                  <td className="px-4 py-3 text-textMain font-mono">
                    <AnimatedNum value={cls.f1} isPercent decimals={1} /> %
                  </td>
                  <td className="px-4 py-3 text-textMain font-mono">
                    <AnimatedNum value={cls.false_positive_rate} isPercent decimals={2} /> %
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* ── Confusion Matrix ────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h2 className="text-lg font-semibold text-textMain mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-textMuted" />
          Live Confusion Matrix
        </h2>
        <div className="overflow-auto pb-2">
          <table className="w-full text-center text-sm border-collapse">
            <thead>
              <tr>
                <th className="px-2 py-2"></th>
                {cm.labels?.map((lbl: string) => (
                  <th key={lbl} className="px-2 py-2 text-textMuted font-semibold text-xs uppercase tracking-wider min-w-[80px]">
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cm.matrix?.map((row: number[], i: number) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2 text-textMuted font-semibold text-xs uppercase tracking-wider text-right border-r border-border min-w-[120px]">
                    {cm.labels[i]}
                  </td>
                  {row.map((value: number, j: number) => {
                    const intensity = maxVal > 0 ? value / maxVal : 0;
                    const bg = scoreToBg(intensity);
                    const isDiagonal = i === j;
                    
                    return (
                      <motion.td
                        key={j}
                        className={`px-2 py-2 font-mono text-xs ${isDiagonal ? 'font-bold' : ''}`}
                        animate={{ backgroundColor: bg }}
                        transition={{ duration: 1.5 }}
                        style={{ color: intensity > 0.5 ? '#fff' : '#000' }}
                      >
                        {formatNumber(value)}
                      </motion.td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-textMuted border-t border-border/50 pt-4">
          <p>Darker green → higher count. Red-tinged cells indicate lower or off-diagonal values.</p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[rgb(0,255,0)] rounded-sm" /> High</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[rgb(255,0,0)] rounded-sm" /> Low</span>
          </div>
        </div>
      </div>
    </div>
  );
};
