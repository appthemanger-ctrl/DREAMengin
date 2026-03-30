'use client';

/**
 * ExperimentsPanel — Standalone experiments runner for the Lab Engine app.
 *
 * Run 4 simulation types, view results, and push to data viz.
 * Lives at /engines/lab/experiments.
 */

import { useState } from 'react';
import { Play, RotateCcw, FlaskConical, ChevronRight, Loader2 } from 'lucide-react';

type SimState = 'idle' | 'running' | 'complete';

interface SimType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  duration: number;
  result: string;
}

const SIMS: SimType[] = [
  {
    id: 'fluid',
    name: 'Fluid Dynamics',
    emoji: '💧',
    description: 'Navier-Stokes incompressible flow simulation',
    duration: 2200,
    result: 'Reynolds number: 3,847\nFlow regime: turbulent\nMax velocity: 4.23 m/s\nPressure drop: 0.12 Pa',
  },
  {
    id: 'nbody',
    name: 'N-Body Gravity',
    emoji: '🌌',
    description: 'Gravitational simulation of 512 particles',
    duration: 1800,
    result: '512 particles simulated\nTime step: 0.01s\nEnergy conservation: 99.97%\nStable orbits formed: 14',
  },
  {
    id: 'neural',
    name: 'Neural Activation',
    emoji: '🧠',
    description: 'Feedforward network activation pattern mapping',
    duration: 1400,
    result: 'Layers: 4 (128-64-32-16)\nActivation: ReLU → Softmax\nForward pass: 0.8ms\nMax activation: 0.94',
  },
  {
    id: 'chaos',
    name: 'Chaos Attractor',
    emoji: '🌀',
    description: 'Lorenz attractor with parameter sensitivity',
    duration: 1600,
    result: 'σ=10, ρ=28, β=8/3\nIterations: 50,000\nLyapunov exponent: 0.9056\nAttractor dimension: 2.06',
  },
];

interface RunState {
  [id: string]: { state: SimState; result: string; elapsed: number };
}

export default function ExperimentsPanel() {
  const [runStates, setRunStates] = useState<RunState>({});

  async function runSim(sim: SimType) {
    setRunStates((prev) => ({
      ...prev,
      [sim.id]: { state: 'running', result: '', elapsed: 0 },
    }));

    const start = Date.now();
    const interval = setInterval(() => {
      setRunStates((prev) => ({
        ...prev,
        [sim.id]: { ...prev[sim.id], elapsed: Math.floor((Date.now() - start) / 1000) },
      }));
    }, 500);

    await new Promise((r) => setTimeout(r, sim.duration));
    clearInterval(interval);

    setRunStates((prev) => ({
      ...prev,
      [sim.id]: { state: 'complete', result: sim.result, elapsed: Math.floor(sim.duration / 1000) },
    }));
  }

  function reset(id: string) {
    setRunStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Experiments</h1>
          <p className="text-sm text-white/50">Run physics & ML simulations · view results</p>
        </div>

        <div className="space-y-4">
          {SIMS.map((sim) => {
            const rs = runStates[sim.id];
            return (
              <div
                key={sim.id}
                className="rounded-xl border bg-white/[0.03] overflow-hidden"
                style={{ borderColor: rs?.state === 'running' ? '#10b98144' : 'rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-3 px-4 py-4">
                  <span className="text-2xl">{sim.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{sim.name}</div>
                    <div className="text-xs text-white/40">{sim.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rs?.state === 'complete' && (
                      <button
                        onClick={() => reset(sim.id)}
                        className="p-1.5 rounded text-white/30 hover:text-white/60 transition-colors"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => runSim(sim)}
                      disabled={rs?.state === 'running'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={
                        rs?.state === 'complete'
                          ? { background: '#10b98122', color: '#10b981' }
                          : rs?.state === 'running'
                          ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                          : { background: '#10b98120', color: '#10b981' }
                      }
                    >
                      {rs?.state === 'running'
                        ? <><Loader2 size={12} className="animate-spin" /> {rs.elapsed}s…</>
                        : <><Play size={12} /> {rs?.state === 'complete' ? 'Re-run' : 'Run'}</>
                      }
                    </button>
                  </div>
                </div>

                {rs?.state === 'complete' && rs.result && (
                  <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Results</div>
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap bg-black/30 rounded-lg px-3 py-2">
                      {rs.result}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
