/**
 * tests/code-dream-preview.test.ts
 *
 * Unit tests for pure helper utilities used by the Code Dream live preview.
 * Tests cover: language detection, mock output generation, and engine
 * connection label resolution — all without DOM or network.
 */

import { describe, expect, it } from 'vitest';
import {
  detectLanguageFromCode,
  generateCodeFromCommand,
  detectNLCommand,
  parseCodeResponse,
  matchCodeVocabulary,
  type CellLanguage,
} from '@/lib/code/drEamsCodeAssist';

// ─── Preview engine labels ────────────────────────────────────────────────────

/** Mirrors the ENGINE_CONNECTIONS constant defined in CodeEngin's preview tab. */
const ENGINE_CONNECTIONS = [
  { id: 'game',  label: 'GameEngin',  color: '#8b5cf6', description: 'Babylon.js rendering & physics' },
  { id: 'lab',   label: 'LabEngin',   color: '#22c55e', description: 'Simulation & data science'      },
  { id: 'sim',   label: 'SimEngin',   color: '#0ea5e9', description: 'Particle & fluid simulation'    },
  { id: 'asset', label: 'AssetEngin', color: '#f59e0b', description: 'Mesh, texture & sprite assets'  },
] as const;

type EngineId = (typeof ENGINE_CONNECTIONS)[number]['id'];

function getEngineById(id: EngineId) {
  return ENGINE_CONNECTIONS.find(e => e.id === id) ?? null;
}

describe('ENGINE_CONNECTIONS', () => {
  it('has exactly 4 engines', () => {
    expect(ENGINE_CONNECTIONS).toHaveLength(4);
  });

  it('each engine has id, label, color, and description', () => {
    for (const eng of ENGINE_CONNECTIONS) {
      expect(typeof eng.id).toBe('string');
      expect(typeof eng.label).toBe('string');
      expect(eng.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(typeof eng.description).toBe('string');
    }
  });

  it('resolves game engine by id', () => {
    const eng = getEngineById('game');
    expect(eng).not.toBeNull();
    expect(eng!.label).toBe('GameEngin');
  });

  it('resolves lab engine by id', () => {
    const eng = getEngineById('lab');
    expect(eng!.label).toBe('LabEngin');
  });
});

// ─── Mock output generation (mirrors getMockOutput used in preview tab) ───────

/** Same logic as getMockOutput in CodeEngin (deterministic, no eval). */
function getMockOutput(language: CellLanguage, engine?: EngineId): string {
  if (engine === 'game')  return 'GameEngin: scene loaded, FPS=60, entities=124\nMesh "player" position: (0, 1.5, 0)';
  if (engine === 'lab')   return 'LabEngin: simulation complete\nParticles=1024, avg_velocity=12.4m/s';
  if (engine === 'sim')   return 'SimEngin: fluid stable at Re=4200\nTimestep=0.016s, cells=65536';
  if (engine === 'asset') return 'AssetEngin: 3 meshes loaded\nbox.glb (2.1KB), sphere.glb (1.8KB), plane.glb (0.9KB)';
  switch (language) {
    case 'python':     return 'BPM: 128\nGame score: 9999';
    case 'javascript': return '[{"game":"platformer","score":9999}]';
    case 'typescript': return '{ result: "TypeScript compiled successfully" }';
    case 'bash':       return '✓ 291 tests passed in 1.24s';
    default:           return 'Done.';
  }
}

describe('getMockOutput', () => {
  it('returns python output for python cells', () => {
    expect(getMockOutput('python')).toContain('BPM');
  });

  it('returns javascript output for js cells', () => {
    expect(getMockOutput('javascript')).toContain('platformer');
  });

  it('returns typescript output for ts cells', () => {
    expect(getMockOutput('typescript')).toContain('compiled');
  });

  it('returns bash output for bash cells', () => {
    expect(getMockOutput('bash')).toContain('tests passed');
  });

  it('returns GameEngin output when game engine selected', () => {
    const out = getMockOutput('python', 'game');
    expect(out).toContain('GameEngin');
    expect(out).toContain('FPS');
  });

  it('returns LabEngin output when lab engine selected', () => {
    const out = getMockOutput('python', 'lab');
    expect(out).toContain('LabEngin');
  });

  it('returns SimEngin output when sim engine selected', () => {
    const out = getMockOutput('python', 'sim');
    expect(out).toContain('SimEngin');
  });

  it('returns AssetEngin output when asset engine selected', () => {
    const out = getMockOutput('python', 'asset');
    expect(out).toContain('AssetEngin');
  });
});

// ─── Preview mode label resolution ────────────────────────────────────────────

type PreviewMode = 'terminal' | 'canvas' | 'data' | 'game';

const PREVIEW_MODE_LABELS: Record<PreviewMode, string> = {
  terminal: '⬛ Terminal',
  canvas:   '🎨 Canvas',
  data:     '📊 Data',
  game:     '🎮 Game',
};

describe('PREVIEW_MODE_LABELS', () => {
  it('has exactly 4 modes', () => {
    expect(Object.keys(PREVIEW_MODE_LABELS)).toHaveLength(4);
  });

  it('each mode has a non-empty label', () => {
    for (const label of Object.values(PREVIEW_MODE_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

// ─── Language detection in preview context ────────────────────────────────────

describe('detectLanguageFromCode (preview context)', () => {
  it('detects Python from a DREAMengin game script', () => {
    const code = `
import dream_engine
scene = dream_engine.Scene()
player = scene.add_entity("player")
print(player.id)
    `.trim();
    expect(detectLanguageFromCode(code)).toBe('python');
  });

  it('detects TypeScript from a GameEngin ECS snippet', () => {
    const code = `
const world: ECSWorld = new ECSWorld();
const entity: number = world.createEntity();
world.addComponent<TransformComponent>(entity, { x: 0, y: 0 });
    `.trim();
    expect(detectLanguageFromCode(code)).toBe('typescript');
  });

  it('detects bash from a deployment script', () => {
    const code = `pnpm run build\necho "Deploy complete"`;
    expect(detectLanguageFromCode(code)).toBe('bash');
  });
});

// ─── NL command detection in preview context ──────────────────────────────────

describe('detectNLCommand (preview context)', () => {
  it('detects "write a function" pattern', () => {
    const cmd = detectNLCommand('write a function called renderScene');
    expect(cmd?.type).toBe('write_function');
    expect(cmd?.subject).toBe('renderScene');
  });

  it('detects "create a class" for game objects', () => {
    const cmd = detectNLCommand('create a class called Player');
    expect(cmd?.type).toBe('create_class');
    expect(cmd?.subject).toBe('Player');
  });

  it('returns null for pure game prompts unrelated to code commands', () => {
    expect(detectNLCommand('launch GameEngin')).toBeNull();
  });
});

// ─── Code generation for game/graphics context ────────────────────────────────

describe('generateCodeFromCommand (graphics/game context)', () => {
  it('generates TypeScript class for a Player entity', () => {
    const cmd = detectNLCommand('create a class called Player')!;
    const code = generateCodeFromCommand(cmd, 'typescript');
    expect(code).toContain('class Player');
  });

  it('generates Python async function for network fetch', () => {
    const cmd = detectNLCommand('Refactor this function to use async/await')!;
    const code = generateCodeFromCommand(cmd, 'python');
    expect(code).toContain('async def');
  });
});

// ─── parseCodeResponse for preview output rendering ──────────────────────────

describe('parseCodeResponse (preview panel)', () => {
  it('separates explanation text from code in a Dr. Eams reply', () => {
    const reply = `Here is a minimal Babylon.js scene setup:\n\`\`\`typescript\nconst scene = new Scene(engine);\n\`\`\`\nThis creates an empty scene ready for meshes.`;
    const parsed = parseCodeResponse(reply);
    expect(parsed.codeBlocks).toHaveLength(1);
    expect(parsed.codeBlocks[0].language).toBe('typescript');
    expect(parsed.text).toContain('minimal Babylon');
    expect(parsed.text).toContain('empty scene');
    expect(parsed.text).not.toContain('```');
  });

  it('handles multi-language response', () => {
    const reply = `Python:\n\`\`\`python\nprint("hi")\n\`\`\`\nTypeScript:\n\`\`\`typescript\nconsole.log("hi");\n\`\`\``;
    const parsed = parseCodeResponse(reply);
    expect(parsed.codeBlocks).toHaveLength(2);
  });
});

// ─── Vocabulary relevance for code dream ─────────────────────────────────────

describe('matchCodeVocabulary (preview/game context)', () => {
  it('matches "shader" for graphics queries', () => {
    const results = matchCodeVocabulary('how do I write a shader for the game engine?');
    expect(results.some(r => r.term === 'shader')).toBe(true);
  });

  it('matches "physics" for simulation queries', () => {
    const results = matchCodeVocabulary('how does physics simulation work?');
    expect(results.some(r => r.term === 'physics')).toBe(true);
  });

  it('matches "neural network" for ML queries', () => {
    const results = matchCodeVocabulary('explain neural network architecture');
    expect(results.some(r => r.term === 'neural network')).toBe(true);
  });
});
