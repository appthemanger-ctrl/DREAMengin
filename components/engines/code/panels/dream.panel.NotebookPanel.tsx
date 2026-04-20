'use client';

/**
 * NotebookPanel — Live interactive notebook for the Code Engine app.
 *
 * Python-rival cell-by-cell execution with simulated output.
 * Lives at /engines/code/notebook.
 */

import { useState, useCallback } from 'react';
import { Plus, Play, Trash2, ChevronDown, ChevronUp, Code2, TerminalSquare } from 'lucide-react';

type CellType = 'code' | 'markdown';
type CellStatus = 'idle' | 'running' | 'done' | 'error';

interface Cell {
  id: string;
  type: CellType;
  source: string;
  output: string;
  status: CellStatus;
  executionCount: number | null;
}

const STARTER_CELLS: Cell[] = [
  {
    id: '1',
    type: 'code',
    source: '# Welcome to DREAMengin Notebook\nprint("Hello, DREAMengin!")',
    output: '',
    status: 'idle',
    executionCount: null,
  },
  {
    id: '2',
    type: 'code',
    source: 'import math\nresult = [math.sqrt(i) for i in range(1, 11)]\nprint(result)',
    output: '',
    status: 'idle',
    executionCount: null,
  },
];

const SIMULATED_OUTPUTS: Record<string, string> = {
  default: '→ executed successfully',
};

let execCounter = 0;

function simulateRun(source: string): Promise<string> {
  return new Promise((resolve) => {
    const delay = 400 + Math.random() * 800;
    setTimeout(() => {
      if (source.includes('print(')) {
        const match = source.match(/print\(["'](.+?)["']\)/);
        if (match) { resolve(match[1]); return; }
        if (source.includes('result')) {
          resolve('[1.0, 1.414, 1.732, 2.0, 2.236, 2.449, 2.646, 2.828, 3.0, 3.162]');
          return;
        }
      }
      if (source.includes('import')) { resolve('Module imported.'); return; }
      if (source.trim().startsWith('#')) { resolve(''); return; }
      resolve(SIMULATED_OUTPUTS.default);
    }, delay);
  });
}

export default function NotebookPanel() {
  const [cells, setCells] = useState<Cell[]>(STARTER_CELLS);

  const addCell = useCallback((type: CellType = 'code') => {
    setCells((prev) => [
      ...prev,
      { id: Date.now().toString(), type, source: '', output: '', status: 'idle', executionCount: null },
    ]);
  }, []);

  const deleteCell = useCallback((id: string) => {
    setCells((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateSource = useCallback((id: string, source: string) => {
    setCells((prev) => prev.map((c) => c.id === id ? { ...c, source } : c));
  }, []);

  const runCell = useCallback(async (id: string) => {
    setCells((prev) => prev.map((c) => c.id === id ? { ...c, status: 'running', output: '' } : c));
    const cell = cells.find((c) => c.id === id);
    if (!cell) return;
    try {
      const output = await simulateRun(cell.source);
      execCounter++;
      setCells((prev) => prev.map((c) =>
        c.id === id ? { ...c, status: 'done', output, executionCount: execCounter } : c
      ));
    } catch {
      setCells((prev) => prev.map((c) => c.id === id ? { ...c, status: 'error', output: 'Error: execution failed' } : c));
    }
  }, [cells]);

  async function runAll() {
    for (const cell of cells) {
      await runCell(cell.id);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Live Notebook</h1>
            <p className="text-sm text-white/50">Cell-by-cell interactive code execution</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] text-xs font-medium transition-all"
            >
              <Play size={13} />
              Run All
            </button>
            <button
              onClick={() => addCell('code')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all"
            >
              <Plus size={13} />
              Cell
            </button>
          </div>
        </div>

        {/* Cells */}
        <div className="space-y-4">
          {cells.map((cell, idx) => (
            <div
              key={cell.id}
              className="rounded-xl overflow-hidden border transition-all"
              style={{ borderColor: cell.status === 'running' ? '#22d3ee44' : 'rgba(255,255,255,0.08)' }}
            >
              {/* Cell header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.06]">
                <Code2 size={13} className="text-white/30" />
                <span className="text-xs text-white/30">
                  [{cell.executionCount ?? ' '}]
                </span>
                <span className="flex-1 text-xs text-white/40">Cell {idx + 1}</span>
                <button
                  onClick={() => runCell(cell.id)}
                  disabled={cell.status === 'running'}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20 text-[#22d3ee] text-xs transition-all disabled:opacity-40"
                >
                  <Play size={11} />
                  {cell.status === 'running' ? 'Running…' : 'Run'}
                </button>
                <button
                  onClick={() => deleteCell(cell.id)}
                  className="text-white/20 hover:text-red-400 transition-colors ml-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Source editor */}
              <textarea
                value={cell.source}
                onChange={(e) => updateSource(cell.id, e.target.value)}
                rows={Math.max(2, cell.source.split('\n').length)}
                className="w-full px-4 py-3 bg-[#0d1117] text-[#c9d1d9] text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-[#22d3ee]/30"
                style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
                spellCheck={false}
              />

              {/* Output */}
              {(cell.output || cell.status === 'running') && (
                <div className="px-4 py-2 bg-black/40 border-t border-white/[0.05]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TerminalSquare size={11} className="text-white/30" />
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">Output</span>
                  </div>
                  <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                    {cell.status === 'running' ? '⠋ Running…' : cell.output}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add cell controls */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => addCell('code')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-white/10 hover:border-[#22d3ee]/40 text-white/30 hover:text-[#22d3ee] text-xs transition-all"
          >
            <Plus size={13} />
            Code cell
          </button>
          <button
            onClick={() => addCell('markdown')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-white/10 hover:border-[#22d3ee]/40 text-white/30 hover:text-[#22d3ee] text-xs transition-all"
          >
            <Plus size={13} />
            Text cell
          </button>
        </div>
      </div>
    </div>
  );
}
