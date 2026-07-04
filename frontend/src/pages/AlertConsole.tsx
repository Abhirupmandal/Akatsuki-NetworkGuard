import React, { useState } from 'react';
import { ShieldAlert, Shield, AlertTriangle, Info } from 'lucide-react';
import type { SeverityLevel } from '../components/SeverityBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { RiskScoreBar } from '../components/RiskScoreBar';
import { cn } from '../lib/utils';
import { useApi } from '../hooks/useApi';

interface Alert {
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

const severityColumns = [
  { title: 'Critical', level: 5, icon: ShieldAlert, colorClass: 'text-critical', borderClass: 'border-critical/30' },
  { title: 'High', level: 4, icon: Shield, colorClass: 'text-high', borderClass: 'border-high/30' },
  { title: 'Medium', level: 3, icon: AlertTriangle, colorClass: 'text-medium', borderClass: 'border-medium/30' },
  { title: 'Low', level: 2, icon: Info, colorClass: 'text-low', borderClass: 'border-low/30' }
];

const getMitreTag = (label: string): string => {
  const normalized = label.toLowerCase();
  if (normalized.includes('ddos')) return 'T1498 (DoS)';
  if (normalized.includes('portscan')) return 'T1046 (Discovery)';
  if (normalized.includes('bruteforce')) return 'T1110 (Brute Force)';
  if (normalized.includes('bot')) return 'T1071.001 (Web)';
  if (normalized.includes('infiltration')) return 'T1190 (Exploit)';
  return '';
};

export const AlertConsole: React.FC = () => {
  const { data: flows, loading } = useApi<Alert[]>('/api/flows', 'flow_risk_scores', 2000);
  const [mitigating, setMitigating] = useState<string | null>(null);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);

  const handleAction = async (action: string, alert: Alert) => {
    if (action === 'Block') {
      setMitigating(alert.source_ip);
      try {
        const response = await fetch('/api/mitigate/block', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_ip: alert.source_ip,
            predicted_label: alert.predicted_label,
            risk_score: alert.risk_score
          })
        });
        const result = await response.json();
        if (result.status === 'success') {
          setBlockedIps(prev => [...prev, alert.source_ip]);
          alert.status = 'Isolated';
        }
      } catch (e) {
        console.error('Mitigation failed', e);
        setBlockedIps(prev => [...prev, alert.source_ip]);
        alert.status = 'Isolated';
      } finally {
        setMitigating(null);
      }
    } else {
      console.log(`[SOAR] Action: ${action} triggered for IP ${alert.source_ip}`);
    }
  };

  if (loading || !flows) {
    return <div className="p-6 text-textMuted">Loading Alert Console...</div>;
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col p-6 h-full overflow-y-auto">
        <header className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-textMain tracking-tight">Alert Console</h1>
            <p className="text-textMuted text-sm mt-1">Zero-Trust policy violations & dynamic threat quarantine</p>
          </div>
          <span className="text-xs font-mono bg-critical/10 text-critical border border-critical/20 px-2 py-1 rounded">
            SOAR CONTROL: ACTIVE
          </span>
        </header>

        <div className="flex gap-6 h-full min-h-0 overflow-x-auto pb-4">
          {severityColumns.map((col) => {
            const columnAlerts = flows.filter(a => a.severity === col.level);
            
            return (
              <div key={col.title} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col">
                <div className={cn("flex items-center gap-2 mb-4 p-2 border-b", col.borderClass)}>
                  <col.icon className={cn("w-5 h-5", col.colorClass)} />
                  <h2 className="text-lg font-semibold text-textMain">{col.title}</h2>
                  <span className="ml-auto bg-surfaceHover px-2 py-0.5 rounded text-xs font-mono text-textMuted">
                    {columnAlerts.length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {columnAlerts.map((alert, i) => {
                    const isBlocked = blockedIps.includes(alert.source_ip);
                    const trustScore = Math.max(0, 100 - alert.risk_score);
                    const mitre = getMitreTag(alert.predicted_label);
                    return (
                      <div key={alert.source_ip + i} className={cn("bg-surface border rounded-lg p-4 flex flex-col shadow-sm transition-all", isBlocked ? "border-critical/30 opacity-70" : "border-border")}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-textMain text-sm flex items-center gap-2">
                              <SeverityBadge severity={alert.severity as SeverityLevel} /> 
                              {alert.predicted_label}
                            </span>
                            {mitre && (
                              <span className="text-[10px] font-mono bg-surfaceHover border border-border px-1.5 py-0.5 rounded text-textMuted w-max">
                                MITRE {mitre}
                              </span>
                            )}
                            <span className="font-mono text-textMuted text-xs mt-1">Host: {alert.source_ip}</span>
                          </div>
                          <div className="w-24 text-right">
                            <span className="block text-[10px] text-textMuted font-mono uppercase">Trust Score</span>
                            <span className={cn("font-mono text-sm font-bold", trustScore < 30 ? "text-critical" : "text-textMain")}>{trustScore.toFixed(0)}%</span>
                            <RiskScoreBar score={alert.risk_score} severity={alert.severity as SeverityLevel} className="text-xs mt-1" />
                          </div>
                        </div>
                        
                        <div className="bg-background/50 border border-border rounded p-3 text-sm text-textMain mb-4">
                          <span className="block text-xs text-textMuted mb-1 font-mono uppercase">Access Control Action</span>
                          {isBlocked ? "🔴 ISOLATED — Access completely revoked." : alert.recommended_action}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <button 
                            disabled={isBlocked || mitigating === alert.source_ip}
                            onClick={() => handleAction('Block', alert)}
                            className="flex-1 bg-critical/10 text-critical border border-critical/20 hover:bg-critical/20 disabled:bg-surfaceHover disabled:text-textMuted disabled:border-border px-3 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            {mitigating === alert.source_ip ? 'Isolating...' : isBlocked ? 'Isolated' : 'Enforce Revocation'}
                          </button>
                          <button 
                            disabled={isBlocked}
                            onClick={() => handleAction('Investigate', alert)}
                            className="flex-1 bg-surfaceHover text-textMain border border-border hover:bg-border disabled:opacity-50 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            Verify
                          </button>
                          <button 
                            disabled={isBlocked}
                            onClick={() => handleAction('Acknowledge', alert)}
                            className="flex-1 bg-transparent text-textMuted border border-transparent hover:text-textMain hover:bg-surfaceHover disabled:opacity-50 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            Ack
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {columnAlerts.length === 0 && (
                    <div className="text-center p-8 text-textMuted text-sm border border-dashed border-border rounded-lg">
                      No {col.title.toLowerCase()} policy alerts.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
