/**
 * lib/gameengin/brain-reader.ts
 *
 * Read / write API for the file-based knowledge brain.
 * Spec: GameENGINspec.md §2.3
 *
 * Used by the autonomous studio agent scripts under scripts/gameengin/.
 * Server-only — uses node:fs / node:path / node:crypto.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';

export const BRAIN_ROOT = path.join(process.cwd(), 'lib', 'gameengin', 'brain');

function readJSON<T = unknown>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`brain: file not found: ${path.relative(process.cwd(), filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

export interface GenreDNA {
  genre: string;
  subgenres: string[];
  core_mechanic: string;
  emotional_core: string;
  player_motivation: string;
  essential_feel: Record<string, unknown>;
  pacing_profile: { early: string; mid: string; late: string };
  canonical_examples: unknown[];
  anti_patterns: string[];
}

export function readGenreDNA(genre: string): GenreDNA {
  return readJSON<GenreDNA>(path.join(BRAIN_ROOT, 'genre-dna', `${genre}.json`));
}

export interface MechanicEntry {
  name: string;
  category: string;
  description: string;
  emotional_impact?: string[];
  implementation?: Record<string, unknown>;
  games_using?: string[];
  fun_heuristics?: Record<string, number>;
}

export function readMechanic(category: string, name: string): MechanicEntry {
  return readJSON<MechanicEntry>(
    path.join(BRAIN_ROOT, 'mechanic-library', category, `${name}.json`),
  );
}

export function listMechanics(category?: string): MechanicEntry[] {
  const root = path.join(BRAIN_ROOT, 'mechanic-library');
  const cats = category ? [category] : fs.readdirSync(root).filter((c) => {
    return fs.statSync(path.join(root, c)).isDirectory();
  });
  const out: MechanicEntry[] = [];
  for (const cat of cats) {
    const dir = path.join(root, cat);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      out.push(readJSON<MechanicEntry>(path.join(dir, f)));
    }
  }
  return out;
}

export function readInspiration(slug: string): Record<string, unknown> {
  return readJSON(path.join(BRAIN_ROOT, 'inspiration-corpus', `${slug}.json`));
}

export function readPrinciple(slug: string): string {
  return fs.readFileSync(path.join(BRAIN_ROOT, 'principles', `${slug}.md`), 'utf-8');
}

/**
 * Deterministic mechanic-combo signature hash (spec §4.4).
 * `genre + sorted(mechanic ids)` joined by `+` then sha256-prefixed.
 */
export function signatureHash(genre: string, mechanicIds: string[]): string {
  const sorted = [...mechanicIds].map((m) => m.trim().toLowerCase()).sort();
  const payload = [genre.trim().toLowerCase(), ...sorted].join('+');
  const digest = createHash('sha256').update(payload).digest('hex');
  return `sha256:${payload}:${digest.slice(0, 16)}`;
}

export interface OriginalitySignature {
  hash: string;
  cartridge_ids: string[];
  closest_known_game?: string;
  differentiation_factors?: string[];
  novelty_score: number;
}

export interface OriginalityRegistry {
  version: number;
  updated_at: string;
  signatures: OriginalitySignature[];
}

export function readOriginalityRegistry(): OriginalityRegistry {
  return readJSON<OriginalityRegistry>(
    path.join(BRAIN_ROOT, 'originality-registry', 'signatures.json'),
  );
}

/** Spec §4.4: returns true when the combo is novel enough to register. */
export function isOriginal(hash: string, minNoveltyScore = 0.3): boolean {
  const reg = readOriginalityRegistry();
  const existing = reg.signatures.find((s) => s.hash === hash);
  if (!existing) return true;
  return existing.novelty_score >= minNoveltyScore;
}

/** Spec §2.3 — Prophet logging research session (JSON, not the bare MD example in spec). */
export function logRDSession(agent: string, topic: string, findings: unknown): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const safeTopic = topic.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const fileName = `${date}-${agent}-${safeTopic}-${stamp}.json`;
  const dir = path.join(BRAIN_ROOT, 'rd-sessions');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        agent,
        topic,
        timestamp: now.toISOString(),
        findings,
        git_commit: process.env.GITHUB_SHA ?? 'local',
      },
      null,
      2,
    ),
  );
  return filePath;
}
