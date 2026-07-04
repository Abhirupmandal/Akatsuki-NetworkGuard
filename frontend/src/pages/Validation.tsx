import React from 'react';
import { useApi } from '../hooks/useApi';

function scoreToBg(score: number) {
  const s = Math.max(0, Math.min(1, score));
  const r = Math.round(255 * (1 - s));
  const g = Math.round(255 * s);
  return `rgb(${r},${g},0)`;
}

export const Validation: React.FC = () => {
  const { data, loading } = useApi<any>('/api/validation', '_PLACEHOLDER_NOTE');

  if (loading || !data || !data.validation_per_class) {
    return <div className="p-6 text-textMuted">Loading validation metrics...</div>;
  }

  const perClass = data.validation_per_class;
  const cm = data.confusion_matrix;

  const overallFpr = perClass.reduce((sum: any, c: any) => sum + (c.false_positive_rate ?? 0), 0) / perClass.length;

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-textMain tracking-tight">Model Validation</h1>
        <p className="text-textMuted text-sm mt-1">Precision / Recall / F1 per attack class & confusion matrix heatmap</p>
      </header>

      <div className="bg-surface border border-border rounded-lg p-4 mb-6 flex items-center gap-4">
        <span className="font-mono text-sm text-textMuted">Overall false‑positive rate:</span>
        <span className="font-mono text-lg font-bold text-critical">{(overallFpr * 100).toFixed(2)} %</span>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden mb-8">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceHover border-b border-border">
            <tr>
              <th className="px-4 py-2 text-textMuted font-medium">Class</th>
              <th className="px-4 py-2 text-textMuted font-medium">Precision</th>
              <th className="px-4 py-2 text-textMuted font-medium">Recall</th>
              <th className="px-4 py-2 text-textMuted font-medium">F1</th>
              <th className="px-4 py-2 text-textMuted font-medium">FPR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {perClass.map((cls: any) => (
              <tr key={cls.class} className="hover:bg-surfaceHover">
                <td className="px-4 py-2 font-mono text-textMain">{cls.class}</td>
                <td className="px-4 py-2 text-textMain">{(cls.precision * 100).toFixed(1)} %</td>
                <td className="px-4 py-2 text-textMain">{(cls.recall * 100).toFixed(1)} %</td>
                <td className="px-4 py-2 text-textMain">{(cls.f1 * 100).toFixed(1)} %</td>
                <td className="px-4 py-2 text-textMain">{(cls.false_positive_rate * 100).toFixed(2)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-textMain mb-4">Confusion Matrix</h2>
        <div className="overflow-auto">
          <table className="w-full text-center text-sm border-collapse">
            <thead>
              <tr>
                <th className="px-2 py-1"></th>
                {cm.labels.map((lbl: string) => (
                  <th key={lbl} className="px-2 py-1 text-textMuted font-medium">{lbl}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cm.matrix.map((row: number[], i: number) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-2 py-1 text-textMuted font-medium">{cm.labels[i]}</td>
                  {row.map((value: number, j: number) => {
                    const maxVal = Math.max(...cm.matrix.flat());
                    const intensity = value / maxVal;
                    const bg = scoreToBg(intensity);
                    return (
                      <td
                        key={j}
                        className="px-2 py-1"
                        style={{ backgroundColor: bg, color: intensity > 0.5 ? '#fff' : '#000' }}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-textMuted">
          Darker green → higher count, red‑tinged cells indicate lower values.
        </p>
      </div>
    </div>
  );
};
