/**
 * tests/lab-dream-split.test.ts
 *
 * Unit tests for the pure helper utilities that power the Lab Dream
 * split-view IDE (input left, results right).
 *
 * All functions are deterministic and pure — no DOM, no network.
 */

import { describe, expect, it } from 'vitest';
import {
  detectLanguageFromCode,
  generateCodeFromCommand,
  detectNLCommand,
  parseCodeResponse,
} from '@/lib/code/drEamsCodeAssist';

// ─── Simulation result helpers ────────────────────────────────────────────────

/** Mirrors the SIMS constant used in LabEngin and the Lab Dream split IDE. */
const LAB_SIMS = [
  { id: 'particle', name: 'Particle Physics', emoji: '⚛️', result: '1024 particles simulated, avg velocity: 12.4m/s'      },
  { id: 'fluid',    name: 'Fluid Dynamics',   emoji: '🌊', result: 'Flow stable at Re=4200'                               },
  { id: 'quantum',  name: 'Quantum Circuit',  emoji: '🔬', result: 'Fidelity: 0.94, depth: 12'                           },
  { id: 'neural',   name: 'Neural Pattern',   emoji: '🧠', result: 'Convergence: 0.003, epochs: 100'                     },
] as const;

type SimId = (typeof LAB_SIMS)[number]['id'];

function getSimResult(id: SimId): string {
  return LAB_SIMS.find(s => s.id === id)?.result ?? '';
}

describe('LAB_SIMS', () => {
  it('has exactly 4 simulation types', () => {
    expect(LAB_SIMS).toHaveLength(4);
  });

  it('each sim has id, name, emoji, result', () => {
    for (const sim of LAB_SIMS) {
      expect(sim.id.length).toBeGreaterThan(0);
      expect(sim.name.length).toBeGreaterThan(0);
      expect(sim.emoji.length).toBeGreaterThan(0);
      expect(sim.result.length).toBeGreaterThan(0);
    }
  });

  it('returns correct result for particle sim', () => {
    expect(getSimResult('particle')).toContain('particles');
  });

  it('returns correct result for fluid sim', () => {
    expect(getSimResult('fluid')).toContain('Re=');
  });

  it('returns correct result for quantum sim', () => {
    expect(getSimResult('quantum')).toContain('Fidelity');
  });

  it('returns correct result for neural sim', () => {
    expect(getSimResult('neural')).toContain('Convergence');
  });
});

// ─── Mock script execution (deterministic) ────────────────────────────────────

/** Mirrors getLabMockOutput used in the Lab Dream split IDE. */
function getLabMockOutput(language: 'python' | 'javascript' | 'bash', script: string): string {
  if (!script.trim()) return '';
  // Route to sim if script hints at simulation
  if (/\bparticle\b/i.test(script)) return getSimResult('particle');
  if (/\bfluid\b/i.test(script))    return getSimResult('fluid');
  if (/\bquantum\b/i.test(script))  return getSimResult('quantum');
  if (/\bneural\b/i.test(script))   return getSimResult('neural');

  switch (language) {
    case 'python':
      return 'Python 3.12.0\n>>> ' + script.split('\n').slice(0, 1)[0] + '\n... executed\nOut: None';
    case 'javascript':
      return '> ' + script.split('\n').slice(0, 1)[0] + '\n← undefined';
    case 'bash':
      return '$ ' + script.split('\n').slice(0, 1)[0] + '\n[exit 0]';
    default:
      return 'Done.';
  }
}

describe('getLabMockOutput', () => {
  it('returns empty string for blank script', () => {
    expect(getLabMockOutput('python', '')).toBe('');
    expect(getLabMockOutput('python', '   ')).toBe('');
  });

  it('returns Python-style output for python language', () => {
    const out = getLabMockOutput('python', 'x = 42\nprint(x)');
    expect(out).toContain('Python');
  });

  it('returns JS REPL-style output for javascript', () => {
    const out = getLabMockOutput('javascript', 'console.log(42)');
    expect(out).toContain('>');
  });

  it('returns bash-style output', () => {
    const out = getLabMockOutput('bash', 'echo hello');
    expect(out).toContain('$');
    expect(out).toContain('exit 0');
  });

  it('routes to particle sim when script mentions particle', () => {
    const out = getLabMockOutput('python', 'simulate particle collisions');
    expect(out).toContain('particles');
  });

  it('routes to fluid sim', () => {
    const out = getLabMockOutput('python', 'model fluid flow in a pipe');
    expect(out).toContain('Re=');
  });

  it('routes to quantum sim', () => {
    const out = getLabMockOutput('python', 'run quantum gate operations');
    expect(out).toContain('Fidelity');
  });

  it('routes to neural sim', () => {
    const out = getLabMockOutput('python', 'train neural spike pattern');
    expect(out).toContain('Convergence');
  });
});

// ─── Visualization types ──────────────────────────────────────────────────────

/** Mirrors VIZ_TYPES used in LabEngin's visualization tab. */
const VIZ_TYPES = [
  { id: 'heatmap',    label: 'Heatmap',              desc: 'High-density data distribution map'      },
  { id: 'density',    label: 'Simulation Density',   desc: 'Particle / fluid density field'         },
  { id: 'activation', label: 'Neural Activation Map',desc: 'Per-layer activation strength'          },
] as const;

describe('VIZ_TYPES', () => {
  it('has exactly 3 visualization types', () => {
    expect(VIZ_TYPES).toHaveLength(3);
  });

  it('each viz has id, label, desc', () => {
    for (const viz of VIZ_TYPES) {
      expect(viz.id.length).toBeGreaterThan(0);
      expect(viz.label.length).toBeGreaterThan(0);
      expect(viz.desc.length).toBeGreaterThan(0);
    }
  });

  it('includes heatmap, density, and activation', () => {
    const ids = VIZ_TYPES.map(v => v.id);
    expect(ids).toContain('heatmap');
    expect(ids).toContain('density');
    expect(ids).toContain('activation');
  });
});

// ─── ASCII heatmap rendering ──────────────────────────────────────────────────

/** Mirrors the ASCII heatmap generator used in LabEngin's viz panel. */
function renderAsciiHeatmap(rows: number, cols: number, seed = 42): string {
  const chars = ['░', '▒', '▓', '█'];
  let out = '';
  let s = seed;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const idx = Math.abs(s) % chars.length;
      out += chars[idx];
    }
    if (r < rows - 1) out += '\n';
  }
  return out;
}

describe('renderAsciiHeatmap', () => {
  it('returns the correct number of rows', () => {
    const hm = renderAsciiHeatmap(4, 8);
    expect(hm.split('\n')).toHaveLength(4);
  });

  it('returns the correct number of columns per row', () => {
    const hm = renderAsciiHeatmap(4, 8);
    for (const row of hm.split('\n')) {
      expect(row.length).toBe(8);
    }
  });

  it('only uses the four block characters', () => {
    const hm = renderAsciiHeatmap(8, 16);
    const allowed = new Set(['░', '▒', '▓', '█', '\n']);
    for (const ch of hm) {
      expect(allowed.has(ch)).toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    expect(renderAsciiHeatmap(4, 8, 7)).toBe(renderAsciiHeatmap(4, 8, 7));
  });

  it('differs for different seeds', () => {
    expect(renderAsciiHeatmap(4, 8, 1)).not.toBe(renderAsciiHeatmap(4, 8, 2));
  });
});

// ─── Lab language detection ───────────────────────────────────────────────────

describe('detectLanguageFromCode (lab context)', () => {
  it('detects Python data science code', () => {
    const code = `import numpy as np\ndata = np.array([1, 2, 3])\nprint(data.mean())`;
    expect(detectLanguageFromCode(code)).toBe('python');
  });

  it('detects bash shell script', () => {
    const code = `#!/bin/bash\npython3 train.py --epochs 100`;
    expect(detectLanguageFromCode(code)).toBe('bash');
  });
});

// ─── Lab NL command detection ─────────────────────────────────────────────────

describe('detectNLCommand (lab context)', () => {
  it('detects create class for experiment runner', () => {
    const cmd = detectNLCommand('create a class called Experiment');
    expect(cmd?.type).toBe('create_class');
    expect(cmd?.subject).toBe('Experiment');
  });

  it('detects write function for data loader', () => {
    const cmd = detectNLCommand('write a function called load_dataset');
    expect(cmd?.type).toBe('write_function');
    expect(cmd?.subject).toBe('load_dataset');
  });

  it('detects try/except for error handling in experiment', () => {
    const cmd = detectNLCommand('add a try-except block to handle division by zero');
    expect(cmd?.type).toBe('add_try_except');
  });
});

// ─── Code generation for lab context ─────────────────────────────────────────

describe('generateCodeFromCommand (lab context)', () => {
  it('generates Python Experiment class', () => {
    const cmd = detectNLCommand('create a class called Experiment')!;
    const code = generateCodeFromCommand(cmd, 'python');
    expect(code).toContain('class Experiment');
    expect(code).toContain('def __init__');
  });

  it('generates Python async fetch for data science', () => {
    const cmd = detectNLCommand('Refactor this function to use async/await')!;
    const code = generateCodeFromCommand(cmd, 'python');
    expect(code).toContain('async');
  });
});

// ─── parseCodeResponse (lab IDE context) ─────────────────────────────────────

describe('parseCodeResponse (lab IDE)', () => {
  it('extracts Python code blocks from a Dr. Eams data science answer', () => {
    const reply = `Here is how to load a CSV:\n\`\`\`python\nimport pandas as pd\ndf = pd.read_csv("data.csv")\nprint(df.head())\n\`\`\`\nThis prints the first 5 rows.`;
    const parsed = parseCodeResponse(reply);
    expect(parsed.codeBlocks[0].language).toBe('python');
    expect(parsed.codeBlocks[0].code).toContain('pd.read_csv');
    expect(parsed.text).toContain('first 5 rows');
  });

  it('handles multi-step answer with multiple code blocks', () => {
    const reply = [
      'Step 1 — install:\n```bash\npip install pandas\n```',
      'Step 2 — load:\n```python\nimport pandas as pd\n```',
    ].join('\n');
    const parsed = parseCodeResponse(reply);
    expect(parsed.codeBlocks).toHaveLength(2);
    expect(parsed.codeBlocks[0].language).toBe('bash');
    expect(parsed.codeBlocks[1].language).toBe('python');
  });
});
