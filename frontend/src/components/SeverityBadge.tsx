import React from 'react';
import { cn } from '../lib/utils';

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

const severityConfig: Record<SeverityLevel, { label: string; colorClass: string }> = {
  1: { label: 'BENIGN', colorClass: 'bg-benign/20 text-benign border-benign/30' },
  2: { label: 'LOW', colorClass: 'bg-low/20 text-low border-low/30' },
  3: { label: 'MEDIUM', colorClass: 'bg-medium/20 text-medium border-medium/30' },
  4: { label: 'HIGH', colorClass: 'bg-high/20 text-high border-high/30' },
  5: { label: 'CRITICAL', colorClass: 'bg-critical/20 text-critical border-critical/30' },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
  const config = severityConfig[severity] || severityConfig[1];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border',
        config.colorClass,
        className
      )}
    >
      {config.label}
    </span>
  );
};
