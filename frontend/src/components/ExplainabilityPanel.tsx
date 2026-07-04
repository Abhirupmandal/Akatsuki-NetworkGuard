import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain } from 'lucide-react';
import { SeverityBadge, type SeverityLevel } from './SeverityBadge';
import { useApi } from '../hooks/useApi';

interface FlowRecord {
  predicted_label: string;
  severity: number;
  source_ip: string;
  dest_ip: string;
  risk_score: number;
}

interface ExplainabilityPanelProps {
  flow: FlowRecord | null;
  onClose: () => void;
}

const FEATURE_COLORS: Record<string, string> = {
  'SYN Flag Count':    '#EF4444',
  'Flow Bytes/s':      '#F97316',
  'Total Fwd Packets': '#EAB308',
  'Flow Duration':     '#22C55E',
  'Packet Length Std': '#3B82F6',
  'Fwd IAT Mean':      '#8B5CF6',
};

const getExplainabilityKey = (label: string): string => {
  const normalized = label.toLowerCase();
  if (normalized.includes('ddos')) return 'DDoS';
  if (normalized.includes('portscan')) return 'PortScan';
  if (normalized.includes('bruteforce') || normalized.includes('patator')) return 'BruteForce';
  if (normalized.includes('bot')) return 'Botnet';
  if (normalized.includes('web')) return 'WebAttack';
  if (normalized.includes('infiltration')) return 'Infiltration';
  return 'BENIGN';
};

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ flow, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  
  const { data: explainData } = useApi<any>('/api/explainability', 'explainability');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const targetLabel = flow ? getExplainabilityKey(flow.predicted_label) : 'BENIGN';
  const expData = explainData ? (explainData[targetLabel] ?? explainData.BENIGN) : { confidence: 0, features: [], summary: '' };

  return (
    <AnimatePresence>
      {flow && (
        <motion.aside
          ref={panelRef}
          key="explainability-panel"
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="w-[420px] shrink-0 border-l border-border bg-surface h-full overflow-y-auto flex flex-col"
          aria-label="Explainability panel"
        >
          <div className="p-5 border-b border-border flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-low shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-textMain text-sm">{flow.predicted_label}</span>
                  <SeverityBadge severity={flow.severity as SeverityLevel} />
                </div>
                <p className="text-xs text-textMuted font-mono mt-0.5">{flow.source_ip} → {flow.dest_ip}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-textMuted hover:text-textMain p-1 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4 border-b border-border">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-textMuted font-sans uppercase tracking-wide">Model Confidence</span>
              <span className="font-mono text-lg font-bold text-textMain">{expData.confidence}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-low rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${expData.confidence}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="px-5 py-4 flex-1">
            <h3 className="text-xs text-textMuted uppercase tracking-wide mb-4 font-sans">Top Contributing Features</h3>
            <div className="space-y-3">
              {expData.features.map((f: { name: string; importance: number }, i: number) => {
                const barColor = FEATURE_COLORS[f.name] ?? '#94A3B8';
                return (
                  <div key={f.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-mono text-textMain">{f.name}</span>
                      <span className="text-xs font-mono text-textMuted">{(f.importance * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${f.importance * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 bg-background/60 border border-border rounded-lg p-4">
              <p className="text-xs text-textMuted uppercase tracking-wide mb-2 font-sans">Plain-language summary</p>
              <p className="text-sm text-textMain leading-relaxed">{expData.summary}</p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-mono text-textMuted">
              <span>Risk score</span>
              <span className="text-textMain font-semibold">{flow.risk_score.toFixed(1)} / 100</span>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
