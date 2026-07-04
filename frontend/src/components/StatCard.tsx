import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  className
}) => {
  return (
    <div className={cn("bg-surface border border-border p-4 rounded-lg flex flex-col", className)}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-textMuted text-sm font-medium">{title}</h3>
        {icon && <div className="text-textMuted">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="text-2xl font-mono font-semibold text-textMain">{value}</span>
        {trendValue && (
          <span className={cn(
            "text-xs font-semibold",
            trend === 'up' ? "text-critical" : trend === 'down' ? "text-benign" : "text-textMuted"
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-textMuted mt-1">{subtitle}</p>}
    </div>
  );
};
