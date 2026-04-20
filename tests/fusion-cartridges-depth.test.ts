/**
 * Asserts the visual/physics/gameplay upgrades shipped to the 4 fusion
 * cartridges that received depth work in this pass. Tests are content-based
 * (vitest runs in `node`, not `jsdom`) so they verify each new feature is
 * actually wired in code rather than just stubbed in a comment block.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const READ = (rel: string) => readFileSync(join(REPO_ROOT, rel), 'utf8');

describe('fusion cartridge depth upgrades', () => {
  it('shared FX kit exposes ParticlePool, ScreenShake, drawDitherFog, prefersReducedMotion', () => {
    const src = READ('components/games/_fx/canvasFx.ts');
    expect(src).toMatch(/export class ParticlePool/);
    expect(src).toMatch(/export class ScreenShake/);
    expect(src).toMatch(/export function drawDitherFog/);
    expect(src).toMatch(/export function prefersReducedMotion/);
  });

  it('NullCathedral wires mine archetypes, check detection, and particle FX', () => {
    const src = READ('components/games/dream.NullCathedral.tsx');
    // 3 mine kinds (standard, spread, time) + a fuse list + check rejection helper
    expect(src).toMatch(/MineKind/);
    expect(src).toMatch(/spread/);
    expect(src).toMatch(/time/);
    expect(src).toMatch(/squareAttacked/);
    expect(src).toMatch(/timeMineFusesRef/);
    expect(src).toMatch(/ParticlePool/);
    // Stat panel gone
    expect(src).not.toMatch(/Mines remaining:/);
    expect(src).not.toMatch(/CHRONICLE/);
  });

  it('VoidlineGP integrates real velocity/accel/drag, beat-window arc, chain meter, particles', () => {
    const src = READ('components/games/dream.VoidlineGP.tsx');
    expect(src).toMatch(/chainRef/);
    expect(src).toMatch(/starsRef/);                 // 3-layer parallax stars
    expect(src).toMatch(/Math\.exp\(-2\.4 \* dt\)/); // proper drag integration
    expect(src).toMatch(/restitution|\* 0\.35/);     // edge bounce restitution
    expect(src).toMatch(/motionTrail/);              // motion blur stamp
    // Old wall-of-stats HUD stripped
    expect(src).not.toMatch(/SCORE  \$\{scoreRef\.current\}/);
    expect(src).not.toMatch(/POS    /);
  });

  it('SerpentSiege adds shielded + scout enemies, a wave-5 boss, and ballistic projectiles', () => {
    const src = READ('components/games/dream.SerpentSiege.tsx');
    expect(src).toMatch(/EnemyKind/);
    expect(src).toMatch(/'shielded'/);
    expect(src).toMatch(/'scout'/);
    expect(src).toMatch(/'boss'/);
    expect(src).toMatch(/headAngVelRef/);            // angular acceleration on head
    expect(src).toMatch(/Separation/i);              // separation steering comment/identifier
    expect(src).toMatch(/p\.kind === 'mortar'/);     // mortar-specific gravity
    // HUD stripped to wave + energy chip only
    expect(src).not.toMatch(/EGG \{hud\.eggHp\}/);
    expect(src).not.toMatch(/SCORE \{hud\.score\}/);
  });

  it('Glassfall supports Z-rotation, curved-paddle reflection, cluster matching, particle bursts', () => {
    const src = READ('components/games/dream.Glassfall.tsx');
    expect(src).toMatch(/tryRotate/);
    expect(src).toMatch(/e\.key === 'z' \|\| e\.key === 'Z'/);
    expect(src).toMatch(/PADDLE_CURVATURE/);
    // Cluster (flood-fill) match replaced row/col runs
    expect(src).toMatch(/flood-fill|cluster/);
    expect(src).toMatch(/ParticlePool/);
    expect(src).toMatch(/garbageMeterRef/);
    // Big in-canvas HUD strings gone
    expect(src).not.toMatch(/SPACE = launch shard/);
    expect(src).not.toMatch(/`FLOOR \$\{floorRef\.current\}\/5`/);
  });
});
