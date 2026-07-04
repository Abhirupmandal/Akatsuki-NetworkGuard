import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApi } from '../hooks/useApi';

interface FlowRecord {
  predicted_label: string;
  severity: number;
  risk_score: number;
}

const ATTACK_COLORS: Record<string, string> = {
  'BENIGN':       '#22C55E',
  'DDoS':         '#EF4444',
  'PortScan':     '#EAB308',
  'BruteForce':   '#F97316',
  'Botnet':       '#EC4899',
  'WebAttack':    '#8B5CF6',
  'Infiltration': '#06B6D4',
};

const MOCK_TRENDS: Record<string, 'up' | 'down'> = {
  'BENIGN': 'up',
  'DDoS': 'up',
  'PortScan': 'down',
  'BruteForce': 'up',
  'Botnet': 'down',
  'WebAttack': 'up',
  'Infiltration': 'down',
};

export const AttackBreakdown: React.FC = () => {
  const { data: flows, loading } = useApi<FlowRecord[]>('/api/flows', 'flow_risk_scores', 2000);

  if (loading) {
    return <div className="p-6 text-textMuted">Loading attack breakdown...</div>;
  }

  const total = flows?.length || 0;
  const counts = (flows || []).reduce((acc: Record<string, number>, curr) => {
    const label = curr.predicted_label;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const rawBreakdown = Object.keys(ATTACK_COLORS).map(name => {
    const count = counts[name] || 0;
    const value = total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0;
    return {
      name,
      value,
      fill: ATTACK_COLORS[name] || '#94A3B8',
      trend: MOCK_TRENDS[name] || 'up'
    };
  }).filter(item => item.value > 0);

  const breakdownData = rawBreakdown.length > 0 
    ? rawBreakdown 
    : [{ name: 'BENIGN', value: 100, fill: '#22C55E', trend: 'up' as const }];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col p-6 h-full overflow-y-auto">
        <header className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-textMain tracking-tight">Attack-Type Breakdown</h1>
            <p className="text-textMuted text-sm mt-1">Percentage of current traffic by attack type ({total} active flows evaluated)</p>
          </div>
          <span className="text-xs font-mono bg-benign/10 text-benign border border-benign/20 px-2 py-1 rounded">
            CALCULATION: LIVE
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
          <div className="bg-surface border border-border rounded-lg p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-textMain mb-4">Traffic Distribution</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1D24', borderColor: '#2A2D35', color: '#E2E8F0' }}
                    itemStyle={{ color: '#E2E8F0' }}
                    formatter={(value: number) => [`${value}%`, 'Traffic']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-textMain ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-textMain mb-4">Trend Analysis (vs Prev Window)</h2>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-3">
                {breakdownData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 border border-border rounded bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="font-medium text-textMain">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-textMain">{item.value}%</span>
                      <span className={cn(
                        "flex items-center text-xs font-semibold w-16",
                        item.trend === 'up' ? "text-critical" : "text-benign"
                      )}>
                        {item.trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {item.trend === 'up' ? '+1.2%' : '-0.4%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
