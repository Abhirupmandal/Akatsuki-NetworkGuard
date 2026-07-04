import React, { useState } from 'react';
import { Brain, ShieldCheck } from 'lucide-react';
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
}

export const Explainability: React.FC = () => {
  const { data: flows, loading } = useApi<FlowRecord[]>('/api/flows', 'flow_risk_scores', 2000);
  const [selectedFlow, setSelectedFlow] = useState<FlowRecord | null>(null);

  const threatFlows = (flows || []).filter(f => f.predicted_label !== 'BENIGN').sort((a, b) => b.risk_score - a.risk_score);

  if (loading) {
    return <div className="p-6 text-textMuted">Loading explainability data...</div>;
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-low" />
            <h1 className="text-2xl font-bold text-textMain tracking-tight">Model Explainability</h1>
          </div>
          <p className="text-textMuted text-sm mt-1">
            Select a threat flow to understand why the model flagged it — feature contributions, confidence scores, and plain-language summaries.
          </p>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {threatFlows.map((flow, i) => {
              const trustScore = Math.max(0, 100 - flow.risk_score);
              const isSelected = selectedFlow?.source_ip === flow.source_ip && selectedFlow?.timestamp === flow.timestamp;
              return (
                <button
                  key={flow.source_ip + i}
                  onClick={() => setSelectedFlow(isSelected ? null : flow)}
                  className={`text-left bg-surface border rounded-lg p-4 transition-all hover:border-low/40 ${
                    isSelected ? 'border-low/60 shadow-[0_0_12px_0_rgba(59,130,246,0.1)]' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-textMain">{flow.predicted_label}</span>
                    <span className={`text-xs font-mono font-bold ${trustScore < 30 ? 'text-critical' : 'text-medium'}`}>
                      {trustScore.toFixed(0)}% Trust
                    </span>
                  </div>
                  <div className="font-mono text-xs text-textMuted">
                    {flow.source_ip} → {flow.dest_ip}
                  </div>
                  <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${trustScore < 30 ? 'bg-critical' : 'bg-medium'}`}
                      style={{ width: `${flow.risk_score}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {threatFlows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-textMuted">
              <ShieldCheck className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">No threat flows detected. All sessions are verified.</p>
            </div>
          )}
        </div>
      </div>

      <ExplainabilityPanel flow={selectedFlow} onClose={() => setSelectedFlow(null)} />
    </div>
  );
};
