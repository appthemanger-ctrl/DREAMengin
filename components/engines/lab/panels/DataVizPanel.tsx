'use client';

/**
 * DataVizPanel — Data visualization panel for the Lab Engine app.
 *
 * ASCII chart previews with chart type selector and CSV export.
 * Lives at /engines/lab/data.
 */

import { useState } from 'react';
import { BarChart2, TrendingUp, Download, RefreshCw, Layers } from 'lucide-react';

type ChartType = 'bar' | 'line' | 'scatter';

interface DataSet {
  id: string;
  label: string;
  values: number[];
}

const DEMO_DATASETS: DataSet[] = [
  { id: 'velocity',    label: 'Velocity (m/s)',       values: [1.2, 3.4, 5.6, 4.2, 6.8, 7.1, 5.9, 8.3, 7.7, 9.2] },
  { id: 'temperature', label: 'Temperature (°C)',     values: [22, 23, 25, 28, 30, 29, 27, 26, 24, 22] },
  { id: 'pressure',    label: 'Pressure (kPa)',       values: [101, 100.5, 99.8, 98.2, 97.1, 96.4, 97.8, 99.1, 100.2, 101] },
  { id: 'energy',      label: 'Energy (J)',           values: [450, 520, 610, 580, 720, 810, 760, 900, 870, 950] },
];

function renderBarChart(values: number[]): string {
  const max = Math.max(...values);
  const height = 8;
  const rows: string[] = [];
  for (let row = height; row >= 0; row--) {
    const threshold = (row / height) * max;
    let line = '';
    for (const v of values) {
      line += v >= threshold ? '█ ' : '  ';
    }
    rows.push(`${String(Math.round((row / height) * max)).padStart(4)} │${line}`);
  }
  rows.push(`     └${'──'.repeat(values.length)}`);
  rows.push(`      ${values.map((_, i) => String(i + 1).padStart(2)).join('')}`);
  return rows.join('\n');
}

function renderLineChart(values: number[]): string {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const height = 8;
  const rows: string[] = [];
  for (let row = height; row >= 0; row--) {
    const threshold = min + ((row / height) * (max - min));
    let line = '';
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      const prev = values[i - 1] ?? v;
      const isAt = Math.abs(v - threshold) <= (max - min) / height;
      const isCrossing = (v > threshold && prev < threshold) || (v < threshold && prev > threshold);
      line += isAt || isCrossing ? '◆ ' : '· ';
    }
    rows.push(`${String(Math.round(threshold)).padStart(4)} │${line}`);
  }
  rows.push(`     └${'──'.repeat(values.length)}`);
  return rows.join('\n');
}

function renderScatter(values: number[]): string {
  const max = Math.max(...values);
  const height = 8;
  const rows: string[] = [];
  for (let row = height; row >= 0; row--) {
    let line = '';
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      const y = Math.round((v / max) * height);
      line += y === row ? '○ ' : '· ';
    }
    rows.push(`${String(Math.round((row / height) * max)).padStart(4)} │${line}`);
  }
  rows.push(`     └${'──'.repeat(values.length)}`);
  return rows.join('\n');
}

export default function DataVizPanel() {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedDataset, setSelectedDataset] = useState<string>(DEMO_DATASETS[0].id);

  const dataset = DEMO_DATASETS.find((d) => d.id === selectedDataset) ?? DEMO_DATASETS[0];

  const chart =
    chartType === 'bar'     ? renderBarChart(dataset.values)
    : chartType === 'line'  ? renderLineChart(dataset.values)
    : renderScatter(dataset.values);

  function exportCSV() {
    const csv = ['index,value', ...dataset.values.map((v, i) => `${i + 1},${v}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${dataset.label.replace(/[^a-z0-9]/gi, '_')}.csv`;
    a.click();
  }

  const CHART_TYPES: { id: ChartType; label: string; icon: typeof BarChart2 }[] = [
    { id: 'bar',     label: 'Bar',     icon: BarChart2 },
    { id: 'line',    label: 'Line',    icon: TrendingUp },
    { id: 'scatter', label: 'Scatter', icon: Layers },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Data Visualization</h1>
            <p className="text-sm text-white/50">ASCII charts · CSV export</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] text-xs font-medium transition-all"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>

        {/* Dataset selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {DEMO_DATASETS.map((ds) => (
            <button
              key={ds.id}
              onClick={() => setSelectedDataset(ds.id)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all text-left"
              style={
                selectedDataset === ds.id
                  ? { background: '#10b98122', color: '#10b981', border: '1px solid #10b98155' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {ds.label}
            </button>
          ))}
        </div>

        {/* Chart type */}
        <div className="flex gap-2 mb-5">
          {CHART_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setChartType(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                chartType === id
                  ? { background: '#10b98122', color: '#10b981', border: '1px solid #10b98155' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Chart output */}
        <div className="rounded-xl bg-black/40 border border-white/[0.06] p-4 overflow-x-auto">
          <div className="text-xs text-white/30 mb-3 font-medium">{dataset.label}</div>
          <pre className="text-xs font-mono text-[#10b981] whitespace-pre leading-relaxed">
            {chart}
          </pre>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Min',  value: Math.min(...dataset.values).toFixed(1) },
            { label: 'Max',  value: Math.max(...dataset.values).toFixed(1) },
            { label: 'Mean', value: (dataset.values.reduce((a, b) => a + b, 0) / dataset.values.length).toFixed(2) },
            { label: 'N',    value: String(dataset.values.length) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="text-xs text-white/30">{label}</span>
              <span className="text-sm font-bold text-[#10b981] mt-1">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
