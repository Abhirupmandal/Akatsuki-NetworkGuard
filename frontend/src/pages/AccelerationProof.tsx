import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Zap, Cpu, TrendingUp, Activity, Play, Clock, Layers, CircleDot } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getApiUrl } from '../config';

/* ── Animated number hook (supports changing targets) ──────── */
function useAnimatedValue(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const from = prev.current;
    const delta = target - from;
    if (Math.abs(delta) < 1) { setDisplay(target); prev.current = target; return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + delta * eased));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else prev.current = target;
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return display;
}

/* ── Relative time helper ──────────────────────────────────── */
function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

/* ── Format large numbers ──────────────────────────────────── */
function formatFlows(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

/* ── Benchmark data types ──────────────────────────────────── */
interface BenchmarkData {
  benchmark_v2: Array<{
    rows: number;
    rows_label: string;
    cpu_seconds: number;
    gpu_seconds: number;
    cpu_throughput: number;
    gpu_throughput: number;
  }>;
  throughput_summary: {
    cpu_flows_per_sec: number;
    gpu_flows_per_sec: number;
    speedup_factor: number;
  };
  pipeline_status: string;
  total_flows_processed: number;
  last_updated: string;
}

interface BenchmarkHistoryItem {
  rows: number;
  rows_label: string;
  cpu_seconds: number;
  gpu_seconds: number;
  speedup: number;
  timestamp: string;
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
export const AccelerationProof: React.FC = () => {
  /* ── Data fetching with 5-second polling ─────────────────── */
  const { data, loading } = useApi<BenchmarkData>('/api/benchmarks', 'benchmarks', 5000);
  const [history, setHistory] = useState<BenchmarkHistoryItem[]>([]);
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState<BenchmarkHistoryItem | null>(null);
  const [tickCount, setTickCount] = useState(0);

  /* Count poll cycles for subtle UI feedback */
  useEffect(() => {
    if (data?.last_updated) setTickCount(c => c + 1);
  }, [data?.last_updated]);

  /* Fetch benchmark history */
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/benchmarks/history'));
      if (res.ok) {
        const json = await res.json();
        setHistory(json.history || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /* ── Derived values ──────────────────────────────────────── */
  const tp = data?.throughput_summary || { speedup_factor: 1, gpu_flows_per_sec: 0, cpu_flows_per_sec: 0 };
  const bench = data?.benchmark_v2 || [];
  const pipelineStatus = data?.pipeline_status || 'idle';
  const totalFlows = data?.total_flows_processed || 0;
  const lastUpdated = data?.last_updated || new Date().toISOString();

  const speedup = useAnimatedValue(Math.round(tp.speedup_factor));
  const gpuThroughput = useAnimatedValue(tp.gpu_flows_per_sec);
  const cpuThroughput = useAnimatedValue(tp.cpu_flows_per_sec);
  const animatedFlows = useAnimatedValue(totalFlows, 4500);

  /* ── Run benchmark handler ───────────────────────────────── */
  const handleRunBenchmark = async (rows?: number) => {
    setRunLoading(true);
    setRunResult(null);
    try {
      const res = await fetch(getApiUrl('/api/benchmarks/run'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rows || null }),
      });
      if (res.ok) {
        const json = await res.json();
        setRunResult(json.benchmark);
        fetchHistory();
      }
    } catch { /* silent */ }
    setRunLoading(false);
  };

  /* ── Chart data ──────────────────────────────────────────── */
  const barData = bench.map((b) => ({
    name: b.rows_label,
    'CPU (pandas)': b.cpu_seconds,
    'GPU (cuDF)': b.gpu_seconds,
  }));

  const lineData = bench.map((b) => ({
    name: b.rows_label,
    CPU: b.cpu_seconds,
    GPU: b.gpu_seconds,
  }));

  /* ── Loading state ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-critical border-t-transparent rounded-full animate-spin" />
          <span className="text-textMuted text-sm">Loading benchmarks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-textMain tracking-tight">Acceleration Proof</h1>
            <LivePulse />
          </div>
          <p className="text-textMuted text-sm mt-1">
            GPU vs CPU pipeline — continuous dynamic trust computation at scale
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Last updated */}
          <span className="text-textMuted text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated {timeAgo(lastUpdated)}
          </span>
          {/* Pipeline status */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
            pipelineStatus === 'running'
              ? 'border-benign/30 bg-benign/10 text-benign'
              : 'border-border bg-surface text-textMuted'
          }`}>
            <Activity className="w-3 h-3" />
            {pipelineStatus}
          </span>
          {/* Run Benchmark */}
          <button
            onClick={() => handleRunBenchmark()}
            disabled={runLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold
                       bg-critical/15 text-critical border border-critical/30 hover:bg-critical/25
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                       hover:shadow-[0_0_16px_0_rgba(239,68,68,0.2)]"
          >
            {runLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-critical border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {runLoading ? 'Running...' : 'Run Benchmark'}
          </button>
        </div>
      </header>

      {/* ── Hero speedup card ───────────────────────────────── */}
      <div className="flex flex-col items-center justify-center min-h-[200px] py-8 my-4 bg-surface border border-critical/20 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-critical/5 to-transparent pointer-events-none" />
        {/* Subtle data-update flash */}
        <AnimatePresence>
          {tickCount > 1 && (
            <motion.div
              key={tickCount}
              className="absolute inset-0 bg-critical/5 pointer-events-none"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            />
          )}
        </AnimatePresence>
        <div className="flex items-center justify-center gap-3 relative z-10">
          <motion.span
            className="font-mono font-black text-critical leading-[1.2]"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.2rem)' }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {speedup}x
          </motion.span>
        </div>
        <p className="text-textMuted text-sm mt-2 font-medium tracking-wide relative z-10 text-center">Faster Trust Re-Evaluation</p>
        <p className="text-[11px] text-textMuted/60 mt-0.5 font-mono relative z-10 text-center px-4">cuDF.pandas · NVIDIA T4 · CIC-IDS 2017</p>
      </div>

      {/* ── KPI cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* CPU Throughput */}
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-textMuted text-xs uppercase mb-2">
            <Cpu className="w-4 h-4" /> CPU Throughput
          </div>
          <span className="font-mono text-2xl font-bold text-textMain">
            {cpuThroughput.toLocaleString()}
          </span>
          <span className="text-textMuted text-xs">flows / second</span>
        </div>

        {/* GPU Throughput */}
        <div className="bg-surface border border-critical/25 rounded-xl p-5 flex flex-col gap-1 shadow-[0_0_24px_0_rgba(239,68,68,0.08)]">
          <div className="flex items-center gap-2 text-critical text-xs uppercase mb-2">
            <Zap className="w-4 h-4" /> GPU Throughput
          </div>
          <span className="font-mono text-2xl font-bold text-critical">
            {gpuThroughput.toLocaleString()}
          </span>
          <span className="text-textMuted text-xs">flows / second</span>
        </div>

        {/* Advantage */}
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-benign text-xs uppercase mb-2">
            <TrendingUp className="w-4 h-4" /> Advantage
          </div>
          <span className="font-mono text-2xl font-bold text-benign">
            {speedup}x faster
          </span>
          <span className="text-textMuted text-xs">at 2.8M row scale</span>
        </div>

        {/* Total Flows Processed */}
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-textMuted text-xs uppercase mb-2">
            <Layers className="w-4 h-4" /> Flows Processed
          </div>
          <span className="font-mono text-2xl font-bold text-textMain">
            {formatFlows(animatedFlows)}
          </span>
          <span className="text-textMuted text-xs">cumulative pipeline total</span>
        </div>
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-textMain mb-1">Processing Time Comparison</h2>
          <p className="text-textMuted text-xs mb-4">CPU vs GPU at 3 dataset scales (seconds, lower = better)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} unit="s" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1D24', border: '1px solid #2A2D35', borderRadius: 6 }}
                labelStyle={{ color: '#E2E8F0', fontWeight: 600 }}
                formatter={(v: number) => [`${v}s`, '']}
              />
              <Legend formatter={v => <span style={{ color: '#E2E8F0', fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="CPU (pandas)" fill="#64748B" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={800} />
              <Bar dataKey="GPU (cuDF)" fill="#EF4444" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-textMain mb-1">Scaling Advantage</h2>
          <p className="text-textMuted text-xs mb-4">Gap widens as dataset grows — GPU scales, CPU doesn't</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} unit="s" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1D24', border: '1px solid #2A2D35', borderRadius: 6 }}
                labelStyle={{ color: '#E2E8F0', fontWeight: 600 }}
                formatter={(v: number) => [`${v}s`, '']}
              />
              <Legend formatter={v => <span style={{ color: '#E2E8F0', fontSize: 12 }}>{v}</span>} />
              <Line type="monotone" dataKey="CPU" stroke="#64748B" strokeWidth={2.5} dot={{ r: 5, strokeWidth: 0 }} isAnimationActive={true} animationDuration={800} />
              <Line type="monotone" dataKey="GPU" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 5, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#EF4444' }} isAnimationActive={true} animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Run result flash ────────────────────────────────── */}
      <AnimatePresence>
        {runResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-6 bg-benign/10 border border-benign/30 rounded-xl p-4 flex items-center gap-4"
          >
            <CircleDot className="w-5 h-5 text-benign flex-shrink-0" />
            <div className="text-sm text-textMain">
              <span className="font-semibold">Benchmark complete:</span>{' '}
              <span className="font-mono text-benign">{runResult.rows_label}</span> rows —{' '}
              CPU <span className="font-mono">{runResult.cpu_seconds}s</span> vs
              GPU <span className="font-mono text-critical">{runResult.gpu_seconds}s</span>{' '}
              (<span className="font-mono text-benign">{runResult.speedup}x</span> faster)
            </div>
            <button
              onClick={() => setRunResult(null)}
              className="ml-auto text-textMuted hover:text-textMain transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Benchmark History ───────────────────────────────── */}
      {history.length > 0 && (
        <div className="mt-6 bg-surface border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-textMain mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-textMuted" />
            Recent Benchmark Runs
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-textMuted text-xs uppercase tracking-wider border-b border-border">
                  <th className="text-left py-2 px-3">Time</th>
                  <th className="text-right py-2 px-3">Scale</th>
                  <th className="text-right py-2 px-3">CPU Time</th>
                  <th className="text-right py-2 px-3">GPU Time</th>
                  <th className="text-right py-2 px-3">Speedup</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((h, i) => (
                  <motion.tr
                    key={h.timestamp + i}
                    initial={i === 0 ? { backgroundColor: 'rgba(16, 185, 129, 0.1)' } : {}}
                    animate={{ backgroundColor: 'rgba(16, 185, 129, 0)' }}
                    transition={{ duration: 2 }}
                    className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2 px-3 text-textMuted font-mono text-xs">{timeAgo(h.timestamp)}</td>
                    <td className="py-2 px-3 text-right text-textMain font-mono">{h.rows_label}</td>
                    <td className="py-2 px-3 text-right text-textMuted font-mono">{h.cpu_seconds}s</td>
                    <td className="py-2 px-3 text-right text-critical font-mono">{h.gpu_seconds}s</td>
                    <td className="py-2 px-3 text-right text-benign font-mono font-semibold">{h.speedup}x</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <p className="mt-6 text-xs text-textMuted font-mono text-center">
        Same pandas code · <code className="text-benign">%load_ext cudf.pandas</code> · Zero rewrites · NVIDIA T4 GPU
      </p>
    </div>
  );
};
