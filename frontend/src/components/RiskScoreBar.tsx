import React from 'react';
import { cn } from '../lib/utils';
import type { SeverityLevel } from './SeverityBadge';

interface RiskScoreBarProps {
  score: number;
  severity: SeverityLevel;
  className?: string;
}

const severityColors: Record<SeverityLevel, string> = {
  1: 'bg-benign',
  2: 'bg-low',
  3: 'bg-medium',
  4: 'bg-high',
  5: 'bg-critical',
};

export const RiskScoreBar: React.FC<RiskScoreBarProps> = ({ score, severity, className }) => {
  const colorClass = severityColors[severity] || severityColors[1];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="font-mono text-sm w-8 text-right">{score.toFixed(1)}</span>
      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};
