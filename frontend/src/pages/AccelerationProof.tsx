import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Zap, Cpu, TrendingUp } from 'lucide-react';
import { useApi } from '../hooks/useApi';

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return value;
}

export const AccelerationProof: React.FC = () => {
  const { data, loading } = useApi<any>('/api/benchmarks', '_PLACEHOLDER');

  const bench = data?.benchmark_v2 || [];
  const tp = data?.throughput_summary || { speedup_factor: 1, gpu_flows_per_sec: 0, cpu_flows_per_sec: 0 };

  const speedup = useCountUp(Math.round(tp.speedup_factor));
  const gpuThroughput = useCountUp(tp.gpu_flows_per_sec);
  const cpuThroughput = useCountUp(tp.cpu_flows_per_sec);

  if (loading) {
    return <div className="p-6 text-textMuted">Loading benchmarks...</div>;
  }

  const barData = bench.map((b: any) => ({
    name: b.rows_label,
    'CPU (pandas)': b.cpu_seconds,
    'GPU (cuDF)': b.gpu_seconds,
  }));

  const lineData = bench.map((b: any) => ({
    name: b.rows_label,
    CPU: b.cpu_seconds,
    GPU: b.gpu_seconds,
  }));

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <header className="mb-2">
        <h1 className="text-2xl font-bold text-textMain tracking-tight">Acceleration Proof</h1>
        <p className="text-textMuted text-sm mt-1">GPU vs CPU pipeline — continuous dynamic trust computation at scale</p>
      </header>

      <div className="flex items-center justify-center h-[200px] my-4 bg-surface border border-critical/20 rounded-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-critical/5 to-transparent rounded-2xl pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-3">
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
          <p className="text-textMuted text-sm mt-2 font-medium tracking-wide">Faster Trust Re-Evaluation</p>
          <p className="text-[11px] text-textMuted/60 mt-0.5 font-mono">cuDF.pandas · NVIDIA T4 · CIC-IDS 2017</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-textMuted text-xs uppercase mb-2">
            <Cpu className="w-4 h-4" /> CPU Throughput
          </div>
          <span className="font-mono text-2xl font-bold text-textMain">
            {cpuThroughput.toLocaleString()}
          </span>
          <span className="text-textMuted text-xs">flows / second</span>
        </div>
        <div className="bg-surface border border-critical/25 rounded-xl p-5 flex flex-col gap-1 shadow-[0_0_24px_0_rgba(239,68,68,0.08)]">
          <div className="flex items-center gap-2 text-critical text-xs uppercase mb-2">
            <Zap className="w-4 h-4" /> GPU Throughput
          </div>
          <span className="font-mono text-2xl font-bold text-critical">
            {gpuThroughput.toLocaleString()}
          </span>
          <span className="text-textMuted text-xs">flows / second</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-benign text-xs uppercase mb-2">
            <TrendingUp className="w-4 h-4" /> Advantage
          </div>
          <span className="font-mono text-2xl font-bold text-benign">
            {speedup}x faster
          </span>
          <span className="text-textMuted text-xs">at 2.8M row scale</span>
        </div>
      </div>

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
              <Bar dataKey="CPU (pandas)" fill="#64748B" radius={[3, 3, 0, 0]} />
              <Bar dataKey="GPU (cuDF)" fill="#EF4444" radius={[3, 3, 0, 0]} />
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
              <Line type="monotone" dataKey="CPU" stroke="#64748B" strokeWidth={2.5} dot={{ r: 5, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="GPU" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 5, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#EF4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-6 text-xs text-textMuted font-mono text-center">
        Same pandas code · <code className="text-benign">%load_ext cudf.pandas</code> · Zero rewrites · NVIDIA T4 GPU
      </p>
    </div>
  );
};
