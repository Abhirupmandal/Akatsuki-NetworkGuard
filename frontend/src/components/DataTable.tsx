import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({ data, columns, onRowClick, className }: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  return (
    <div className={cn("overflow-auto border border-border rounded-lg bg-surface", className)}>
      <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
        <thead className="sticky top-0 bg-surface border-b border-border z-10">
          <tr>
            {columns.map((col) => (
              <th 
                key={String(col.key)}
                className={cn(
                  "px-4 py-3 font-semibold text-textMuted bg-surface",
                  col.sortable ? "cursor-pointer hover:text-textMain select-none" : ""
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-textMuted/50 flex-shrink-0">
                      {sortConfig?.key === col.key ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-textMain" /> : <ArrowDown className="w-3 h-3 text-textMain" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono text-xs divide-y divide-border">
          {sortedData.map((row, rowIdx) => (
            <tr 
              key={rowIdx} 
              onClick={() => onRowClick?.(row)}
              className={cn(
                "hover:bg-surfaceHover transition-colors",
                onRowClick ? "cursor-pointer" : ""
              )}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-textMain">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-textMuted font-sans">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
