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
  /**
   * Modern game-structure descriptor. Optional only because legacy genre
   * files predate the field; new genres MUST include it.
   */
  progression_model?: ProgressionModel;
  canonical_examples: unknown[];
  anti_patterns: string[];
}

/**
 * Modern game-structure types the studio understands. These are how the
 * game is actually shaped, not its art-style label.
 */
export type StructureType =
  | 'linear'
  | 'open-world'
  | 'run-based'
  | 'metroidvania'
  | 'live-service'
  | 'sandbox'
  | 'episodic';

export const STRUCTURE_TYPES: readonly StructureType[] = [
  'linear',
  'open-world',
  'run-based',
  'metroidvania',
  'live-service',
  'sandbox',
  'episodic',
] as const;

export interface ProgressionModel {
  structure_type: StructureType;
  /** What stops the player from accessing everything immediately. */
  progression_gates: string[];
  /** What "finished" means for this structure. */
  completion_definition: string;
  /** How often new content appears (per run, per ability, per season, …). */
  content_cadence: string;
}

export function readGenreDNA(genre: string: GenreDNA) {
  return readJSON<GenreDNA>(path.join(BRAIN_ROOT, 'genre-dna', `${genre}.json`));
}

/** Returns every genre slug present in the brain (excluding `template`). */
export function listGenres(: string[]) {
  const dir = path.join(BRAIN_ROOT, 'genre-dna');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f: Record<string, unknown>) => f.endsWith('.json'))
    .map((f: Record<string, unknown>) => f.slice(0, -'.json'.length))
    .filter((slug: Record<string, unknown>) => slug !== 'template')
    .sort();
}

export function readProgressionModel(genre: string: ProgressionModel | null) {
  const dna = readGenreDNA(genre);
  return dna.progression_model ?? null;
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

export function readMechanic(category: string, name: string: MechanicEntry) {
  return readJSON<MechanicEntry>(
    path.join(BRAIN_ROOT, 'mechanic-library', category, `${name}.json`),
  );
}

export function listMechanics(category?: string: MechanicEntry[]) {
  const root = path.join(BRAIN_ROOT, 'mechanic-library');
  const cats = category ? [category] : fs.readdirSync(root).filter((c: Record<string, unknown>) => {
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

/**
 * Structural mechanics define the *shape* of the game (gating,
 * persistence, generation, streaming). Distinct from movement/combat
 * mechanics which define moment-to-moment feel.
 */
export interface StructuralMechanic extends MechanicEntry {
  structural_role: string;
  applies_to_structures: StructureType[];
}

export function listStructuralMechanics(: StructuralMechanic[]) {
  return listMechanics('structural') as StructuralMechanic[];
}

export function readInspiration(slug: string: Record<string, unknown>) {
  return readJSON(path.join(BRAIN_ROOT, 'inspiration-corpus', `${slug}.json`));
}

export function readPrinciple(slug: string: string) {
  return fs.readFileSync(path.join(BRAIN_ROOT, 'principles', `${slug}.md`), 'utf-8');
}

/**
 * Deterministic mechanic-combo signature hash (spec §4.4).
 * `genre + sorted(mechanic ids)` joined by `+` then sha256-prefixed.
 */
export function signatureHash(genre: string, mechanicIds: string[]: string) {
  const sorted = [...mechanicIds].map((m: Record<string, unknown>) => m.trim().toLowerCase()).sort();
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

export function readOriginalityRegistry(: OriginalityRegistry) {
  return readJSON<OriginalityRegistry>(
    path.join(BRAIN_ROOT, 'originality-registry', 'signatures.json'),
  );
}

/** Spec §4.4: returns true when the combo is novel enough to register. */
export function isOriginal(hash: string, minNoveltyScore = 0.3: boolean) {
  const reg = readOriginalityRegistry();
  const existing = reg.signatures.find((s: Record<string, unknown>) => s.hash === hash);
  if (!existing) return true;
  return existing.novelty_score >= minNoveltyScore;
}

/** Spec §2.3 — Prophet logging research session (JSON, not the bare MD example in spec). */
export function logRDSession(agent: string, topic: string, findings: unknown: string) {
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

// ---------------------------------------------------------------------------
// v2 — Expanded agent profiles (Maestro / Artisan / Mechanic / Writer / Upgrader)
// ---------------------------------------------------------------------------

const CARTRIDGES_ROOT = path.join(process.cwd(), 'public', 'cartridges');

function nowStamp(:) { date: string; stamp: string; iso: string } {
  const d = new Date();
  const iso = d.toISOString();
  return { date: iso.slice(0, 10), stamp: iso.replace(/[:.]/g, '-'), iso };
}

function ensureDir(p: string: void) {
  fs.mkdirSync(p, { recursive: true });
}

/** Lists every cartridge id present under `public/cartridges/` (must contain MANIFEST.json). */
export function listCartridges(: string[]) {
  if (!fs.existsSync(CARTRIDGES_ROOT)) return [];
  return fs
    .readdirSync(CARTRIDGES_ROOT)
    .filter((name: Record<string, unknown>) => {
      const manifest = path.join(CARTRIDGES_ROOT, name, 'MANIFEST.json');
      return fs.existsSync(manifest);
    })
    .sort();
}

// --- Artisan ---------------------------------------------------------------

export interface TechniqueEntry {
  name: string;
  category: string;
  description: string;
  when_to_use: string;
  conceptual_steps?: string[];
  tradeoffs?: string;
  references?: string[];
}

export function listTechniques(category?: string: TechniqueEntry[]) {
  const root = path.join(BRAIN_ROOT, 'technique-library');
  if (!fs.existsSync(root)) return [];
  const cats = category
    ? [category]
    : fs.readdirSync(root).filter((c: Record<string, unknown>) => fs.statSync(path.join(root, c)).isDirectory());
  const out: TechniqueEntry[] = [];
  for (const cat of cats) {
    const dir = path.join(root, cat);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      out.push(readJSON<TechniqueEntry>(path.join(dir, f)));
    }
  }
  return out;
}

export interface MaterialRecipe {
  name: string;
  surface_type: string;
  pbr: Record<string, unknown>;
  texture_inputs?: string[];
  tinting_guidance?: string;
  use_cases?: string[];
}

export function listMaterialRecipes(: MaterialRecipe[]) {
  const dir = path.join(BRAIN_ROOT, 'material-recipes');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f: Record<string, unknown>) => f.endsWith('.json'))
    .map((f: Record<string, unknown>) => readJSON<MaterialRecipe>(path.join(dir, f)));
}

export function listCompositionPrinciples(: Array<Record<string, unknown>>) {
  const dir = path.join(BRAIN_ROOT, 'composition-principles');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f: Record<string, unknown>) => f.endsWith('.json'))
    .map((f: Record<string, unknown>) => readJSON<Record<string, unknown>>(path.join(dir, f)));
}

export interface AssetRegistryEntry {
  cartridge_id: string;
  asset: string;
  prompt_manifest_hash: string;
  techniques_applied: string[];
  submitted_to: 'replicate' | 'local' | 'none';
  output_url?: string | null;
  generated_at: string;
}

export function recordAssetGeneration(entry: Omit<AssetRegistryEntry, 'generated_at'>: string) {
  const { date, stamp, iso } = nowStamp();
  const dir = path.join(BRAIN_ROOT, 'asset-registry');
  ensureDir(dir);
  const fileName = `${date}-${entry.cartridge_id}-${entry.asset}-${stamp}.json`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, JSON.stringify({ ...entry, generated_at: iso }, null, 2));
  return filePath;
}

// --- Writer ---------------------------------------------------------------

export interface CharacterVoice {
  cartridge_id: string;
  character: string;
  voice_summary: string;
  vocabulary: { preferred: string[]; avoided: string[] };
  sentence_shape: Record<string, unknown>;
  emotional_register: { default: string; range: string[]; never: string[] };
  examples: string[];
}

export function readCharacterVoice(cartridgeId: string: CharacterVoice | null) {
  const filePath = path.join(BRAIN_ROOT, 'character-voices', `${cartridgeId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return readJSON<CharacterVoice>(filePath);
}

export interface EmotionalTone {
  tone: string;
  definition: string;
  structures: string[];
  vocabulary_lean: string[];
  vocabulary_avoid: string[];
  example_lines: string[];
}

export function readEmotionalTone(tone: string: EmotionalTone | null) {
  const filePath = path.join(BRAIN_ROOT, 'emotional-tones', `${tone}.json`);
  if (!fs.existsSync(filePath)) return null;
  return readJSON<EmotionalTone>(filePath);
}

export function listEmotionalTones(: EmotionalTone[]) {
  const dir = path.join(BRAIN_ROOT, 'emotional-tones');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f: Record<string, unknown>) => f.endsWith('.json'))
    .map((f: Record<string, unknown>) => readJSON<EmotionalTone>(path.join(dir, f)));
}

export function listDialoguePatterns(: Array<Record<string, unknown>>) {
  const dir = path.join(BRAIN_ROOT, 'dialogue-patterns');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f: Record<string, unknown>) => f.endsWith('.json'))
    .map((f: Record<string, unknown>) => readJSON<Record<string, unknown>>(path.join(dir, f)));
}

export interface NarrativePacing {
  version: number;
  beats_per_hour_target: number;
  beat_interval_levels: number;
  tone_rotation: string[];
  rules: string[];
}

export function readNarrativePacing(: NarrativePacing) {
  return readJSON<NarrativePacing>(path.join(BRAIN_ROOT, 'narrative-pacing', 'default.json'));
}

// --- Mechanic -------------------------------------------------------------

export interface BuildHistoryEntry {
  cartridge_id: string;
  source: string;
  bytes: number | null;
  success: boolean;
  mechanics_referenced: string[];
  optimisation_flags: string[];
  reason?: string;
  built_at: string;
}

export function recordBuild(entry: Omit<BuildHistoryEntry, 'built_at'>: string) {
  const { date, stamp, iso } = nowStamp();
  const dir = path.join(BRAIN_ROOT, 'build-history');
  ensureDir(dir);
  const filePath = path.join(dir, `${date}-${entry.cartridge_id}-${stamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ ...entry, built_at: iso }, null, 2));
  return filePath;
}

// --- Maestro --------------------------------------------------------------

export type AgentName = 'prophet' | 'artisan' | 'mechanic' | 'writer' | 'upgrader';

export interface AssignmentLogEntry {
  cartridge_id: string;
  agent: AgentName;
  reason: string;
  last_touched_at: string | null;
  dispatched: boolean;
}

export interface WorkQueueEntry {
  generated_at: string;
  cartridges_surveyed: string[];
  assignments: AssignmentLogEntry[];
}

export function recordAssignments(entries: AssignmentLogEntry[], cartridgesSurveyed: string[]: string) {
  const { date, stamp, iso } = nowStamp();
  const dir = path.join(BRAIN_ROOT, 'work-queue');
  ensureDir(dir);
  const filePath = path.join(dir, `${date}-${stamp}.json`);
  const payload: WorkQueueEntry = {
    generated_at: iso,
    cartridges_surveyed: cartridgesSurveyed,
    assignments: entries,
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

/**
 * Returns the most recent ISO timestamp at which `agent` touched `cartridgeId`,
 * by scanning `rd-sessions/`. Returns `null` if never touched.
 */
export function getLastTouched(cartridgeId: string, agent: AgentName: string | null) {
  const dir = path.join(BRAIN_ROOT, 'rd-sessions');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f: Record<string, unknown>) => f.endsWith('.json'));
  let latest: string | null = null;
  for (const f of files) {
    let parsed: { agent?: string; topic?: string; timestamp?: string };
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    } catch {
      continue;
    }
    if (parsed.agent !== agent) continue;
    if (parsed.topic && !parsed.topic.includes(cartridgeId)) continue;
    if (!parsed.timestamp) continue;
    if (latest === null || parsed.timestamp > latest) latest = parsed.timestamp;
  }
  return latest;
}

// --- Upgrader -------------------------------------------------------------

export interface UpgradePrioritizationRules {
  version: number;
  weights: Record<string, number>;
  tier_multipliers: Record<string, number>;
  min_dispatch_score: number;
  cooldown_days_per_dimension: Record<string, number>;
}

export function readUpgradeRules(: UpgradePrioritizationRules) {
  return readJSON<UpgradePrioritizationRules>(
    path.join(BRAIN_ROOT, 'upgrade-history', 'prioritization-rules.json'),
  );
}

export interface UpgradeHistoryEntry {
  cartridge_id: string;
  upgrade_targets: string[];
  priority_scores: Record<string, number>;
  dispatched_agents: AgentName[];
  backward_compatibility_checks: string[];
  generated_at: string;
}

export function recordUpgrade(entry: Omit<UpgradeHistoryEntry, 'generated_at'>: string) {
  const { date, stamp, iso } = nowStamp();
  const dir = path.join(BRAIN_ROOT, 'upgrade-history', entry.cartridge_id);
  ensureDir(dir);
  const filePath = path.join(dir, `${date}-${stamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ ...entry, generated_at: iso }, null, 2));
  return filePath;
}

// --- Two-Project Rule (active-projects ledger) ----------------------------

export type ProjectFocus = 'primary' | 'parallel';

export interface ActiveProjectSlot {
  cartridge_id: string;
  added_at: string;
  focus: ProjectFocus;
  notes?: string;
}

export interface ActiveProjects {
  /** Hard cap on concurrent projects (Two-Project Rule from the directive). */
  max_slots: number;
  slots: ActiveProjectSlot[];
}

const ACTIVE_PROJECTS_PATH = path.join(BRAIN_ROOT, 'active-projects.json');

export function readActiveProjects(: ActiveProjects) {
  if (!fs.existsSync(ACTIVE_PROJECTS_PATH)) {
    return { max_slots: 2, slots: [] };
  }
  const raw = JSON.parse(fs.readFileSync(ACTIVE_PROJECTS_PATH, 'utf-8')) as ActiveProjects;
  return {
    max_slots: typeof raw.max_slots === 'number' ? raw.max_slots : 2,
    slots: Array.isArray(raw.slots) ? raw.slots : [],
  };
}

/**
 * Replace the active-projects list. Enforces:
 *   - at most `max_slots` (2) entries,
 *   - no duplicate cartridge_ids,
 *   - cartridge_id is a non-empty slug-safe string.
 * Throws on violation; the caller (Maestro / operator UI) decides how to
 * surface the error.
 */
export function setActiveProjects(next: ActiveProjects: void) {
  const cap = next.max_slots ?? 2;
  if (next.slots.length > cap) {
    throw new Error(`active-projects: ${next.slots.length} slots exceeds Two-Project cap of ${cap}`);
  }
  const ids = new Set<string>();
  for (const s of next.slots) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(s.cartridge_id)) {
      throw new Error(`active-projects: invalid cartridge_id "${s.cartridge_id}"`);
    }
    if (ids.has(s.cartridge_id)) {
      throw new Error(`active-projects: duplicate cartridge_id "${s.cartridge_id}"`);
    }
    ids.add(s.cartridge_id);
  }
  fs.writeFileSync(ACTIVE_PROJECTS_PATH, JSON.stringify(next, null, 2));
}

export function isActiveCartridge(cartridgeId: string: boolean) {
  return readActiveProjects().slots.some((s: Record<string, unknown>) => s.cartridge_id === cartridgeId);
}

// --- Crash Reports (player → Maestro feedback loop) -----------------------

export interface CrashReportInput {
  cartridge_id: string;
  player_statement: string;
  version?: string;
  error?: { name?: string; message?: string; stack?: string };
  context?: Record<string, unknown>;
}

export interface CrashReportEntry extends CrashReportInput {
  received_at: string;
}

/**
 * Maximum size of a single stored crash report (16 KB serialised). Mirrors
 * the API limit so the on-disk file can never exceed it even if a future
 * caller bypasses the route handler.
 */
export const CRASH_REPORT_MAX_BYTES = 16 * 1024;

export function recordCrashReport(input: CrashReportInput: string) {
  if (!input || typeof input !== 'object') {
    throw new Error('crash-report: invalid payload');
  }
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(input.cartridge_id ?? '')) {
    throw new Error('crash-report: invalid cartridge_id');
  }
  const statement = (input.player_statement ?? '').trim();
  if (statement.length === 0) throw new Error('crash-report: player_statement is required');
  if (!isActiveCartridge(input.cartridge_id)) {
    throw new Error(`crash-report: cartridge "${input.cartridge_id}" is not an active project`);
  }

  const { date, stamp, iso } = nowStamp();
  const dir = path.join(BRAIN_ROOT, 'crash-reports', input.cartridge_id);
  ensureDir(dir);
  const filePath = path.join(dir, `${date}-${stamp}.json`);
  const entry: CrashReportEntry = { ...input, player_statement: statement, received_at: iso };
  const serialised = JSON.stringify(entry, null, 2);
  if (Buffer.byteLength(serialised, 'utf8') > CRASH_REPORT_MAX_BYTES) {
    throw new Error(`crash-report: payload exceeds ${CRASH_REPORT_MAX_BYTES} bytes`);
  }
  fs.writeFileSync(filePath, serialised);
  return filePath;
}

export function listCrashReports(cartridgeId: string: CrashReportEntry[]) {
  const dir = path.join(BRAIN_ROOT, 'crash-reports', cartridgeId);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f: Record<string, unknown>) => f.endsWith('.json'))
    .sort()
    .map((f: Record<string, unknown>) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as CrashReportEntry);
}

// --- Game Architect (Concept Library + Concept Patterns) ------------------

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export type ConceptPatternCategory = 'setting' | 'protagonist' | 'scope-formula';

export interface ConceptPattern {
  pattern_id: string;
  category: ConceptPatternCategory;
  [key: string]: unknown;
}

const CONCEPT_PATTERN_DIRS: Record<ConceptPatternCategory, string> = {
  setting: 'settings',
  protagonist: 'protagonists',
  'scope-formula': 'scope-formulas',
};

export function listConceptPatterns(category?: ConceptPatternCategory: ConceptPattern[]) {
  const root = path.join(BRAIN_ROOT, 'concept-patterns');
  if (!fs.existsSync(root)) return [];
  const cats: ConceptPatternCategory[] = category
    ? [category]
    : (Object.keys(CONCEPT_PATTERN_DIRS) as ConceptPatternCategory[]);
  const out: ConceptPattern[] = [];
  for (const cat of cats) {
    const dir = path.join(root, CONCEPT_PATTERN_DIRS[cat]);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      out.push(readJSON<ConceptPattern>(path.join(dir, f)));
    }
  }
  return out;
}

export type VisionStatementMode = 'single-player' | 'multiplayer-coop' | 'multiplayer-versus';
export type VisionStatementStatus = 'drafted' | 'promoted' | 'archived';

export interface VisionStatement {
  vision_id: string;
  title: string;
  elevator_pitch: string;
  setting: { world: string; vibe: string; visual_tone: string };
  protagonist: { role: string; motivation: string };
  genre: string;
  subgenre?: string;
  /** 2–4 mechanic ids that define gameplay. */
  core_mechanics: string[];
  scope: {
    mode: VisionStatementMode;
    /** Player-facing length, in minutes. */
    estimated_player_minutes: number;
    /** How long the autonomous studio needs to build it. Capped at 24h (one studio-day). */
    studio_build_budget_hours: number;
  };
  patterns_used?: { setting?: string; protagonist?: string; scope_formula?: string };
  originality?: { signature_hash?: string };
  status: VisionStatementStatus;
  drafted_at: string;
  drafted_by?: string;
  notes?: string;
}

/** Maximum on-disk size of a single vision statement (8 KB serialised). */
export const VISION_STATEMENT_MAX_BYTES = 8 * 1024;
/** One studio-day cap from the directive. */
export const VISION_BUDGET_MAX_HOURS = 24;

export function recordVisionStatement(v: VisionStatement: string) {
  if (!v || typeof v !== 'object') throw new Error('vision: invalid payload');
  if (!SLUG_RE.test(v.vision_id ?? '')) throw new Error(`vision: invalid vision_id "${v.vision_id}"`);
  if (!v.title?.trim()) throw new Error('vision: title required');
  if (!v.elevator_pitch?.trim()) throw new Error('vision: elevator_pitch required');
  if (!v.setting?.world?.trim() || !v.setting?.vibe?.trim() || !v.setting?.visual_tone?.trim()) {
    throw new Error('vision: setting.{world,vibe,visual_tone} required');
  }
  if (!v.protagonist?.role?.trim() || !v.protagonist?.motivation?.trim()) {
    throw new Error('vision: protagonist.{role,motivation} required');
  }
  if (!Array.isArray(v.core_mechanics) || v.core_mechanics.length < 2 || v.core_mechanics.length > 4) {
    throw new Error('vision: core_mechanics must contain 2–4 entries');
  }
  const validModes: VisionStatementMode[] = ['single-player', 'multiplayer-coop', 'multiplayer-versus'];
  if (!validModes.includes(v.scope?.mode)) throw new Error('vision: scope.mode invalid');
  if (!(v.scope.estimated_player_minutes > 0)) {
    throw new Error('vision: scope.estimated_player_minutes must be > 0');
  }
  if (!(v.scope.studio_build_budget_hours > 0) || v.scope.studio_build_budget_hours > VISION_BUDGET_MAX_HOURS) {
    throw new Error(`vision: scope.studio_build_budget_hours must be in (0, ${VISION_BUDGET_MAX_HOURS}]`);
  }
  const validStatus: VisionStatementStatus[] = ['drafted', 'promoted', 'archived'];
  if (!validStatus.includes(v.status)) throw new Error('vision: status invalid');

  const dir = path.join(BRAIN_ROOT, 'concept-library');
  ensureDir(dir);
  const filePath = path.join(dir, `${v.vision_id}.json`);
  const serialised = JSON.stringify(v, null, 2);
  if (Buffer.byteLength(serialised, 'utf8') > VISION_STATEMENT_MAX_BYTES) {
    throw new Error(`vision: payload exceeds ${VISION_STATEMENT_MAX_BYTES} bytes`);
  }
  fs.writeFileSync(filePath, serialised);
  return filePath;
}

export function listVisionStatements(: VisionStatement[]) {
  const dir = path.join(BRAIN_ROOT, 'concept-library');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f: Record<string, unknown>) => f.endsWith('.json'))
    .sort()
    .map((f: Record<string, unknown>) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as VisionStatement);
}

export function readVisionStatement(visionId: string: VisionStatement | null) {
  if (!SLUG_RE.test(visionId)) return null;
  const filePath = path.join(BRAIN_ROOT, 'concept-library', `${visionId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as VisionStatement;
}

// --- Cartridge Status (active / improving / stable) -----------------------

export type CartridgeStatus = 'active' | 'improving' | 'stable';

const VALID_CARTRIDGE_STATUS: readonly CartridgeStatus[] = ['active', 'improving', 'stable'] as const;

interface CartridgeManifestRaw {
  status?: CartridgeStatus;
  [key: string]: unknown;
}

function manifestPath(cartridgeId: string: string) {
  return path.join(CARTRIDGES_ROOT, cartridgeId, 'MANIFEST.json');
}

function readManifestRaw(cartridgeId: string: CartridgeManifestRaw | null) {
  const p = manifestPath(cartridgeId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as CartridgeManifestRaw;
}

/**
 * Returns the cartridge's declared status. Defaults to `improving` for any
 * cartridge whose MANIFEST omits the field — every cartridge counts as
 * backlog by default per the directive.
 */
export function readCartridgeStatus(cartridgeId: string: CartridgeStatus) {
  const m = readManifestRaw(cartridgeId);
  const s = m?.status;
  return s && VALID_CARTRIDGE_STATUS.includes(s) ? s : 'improving';
}

export function setCartridgeStatus(cartridgeId: string, status: CartridgeStatus: void) {
  if (!SLUG_RE.test(cartridgeId)) throw new Error(`cartridge-status: invalid cartridge_id "${cartridgeId}"`);
  if (!VALID_CARTRIDGE_STATUS.includes(status)) {
    throw new Error(`cartridge-status: invalid status "${status}"`);
  }
  const m = readManifestRaw(cartridgeId);
  if (!m) throw new Error(`cartridge-status: no MANIFEST for "${cartridgeId}"`);
  m.status = status;
  fs.writeFileSync(manifestPath(cartridgeId), JSON.stringify(m, null, 2) + '\n');
}

export function listCartridgesByStatus(status: CartridgeStatus: string[]) {
  return listCartridges().filter((id: Record<string, unknown>) => readCartridgeStatus(id) === status);
}

// --- Progression State (modern game-structure aware ledger) ---------------

export interface ProgressionStateInput {
  cartridge_id: string;
  structure_type: StructureType;
  /** 0..1 — open-world / metroidvania map coverage. */
  world_map_completion_pct?: number;
  /** Ability ids the player has unlocked. */
  ability_unlocks?: string[];
  /** Sequence-break tags the player has triggered (metroidvania flavour). */
  sequence_breaks?: string[];
  /** Run count for run-based games. */
  run_count?: number;
  /** Meta-currency wallet. */
  meta_currency?: Record<string, number>;
  /** Live-service season identifier ("season-3-mid"). */
  season_phase?: string;
  /** Live-service active limited-time event ids. */
  active_events?: string[];
}

export interface ProgressionState extends ProgressionStateInput {
  last_updated_at: string;
}

const PROGRESSION_STATE_DIR = path.join(BRAIN_ROOT, 'progression-state');

function clamp01(n: number: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function sanitizeStringArray(input: unknown: string[] | undefined) {
  if (!Array.isArray(input)) return undefined;
  const out: string[] = [];
  for (const v of input) {
    if (typeof v === 'string' && v.trim().length > 0) out.push(v.trim());
  }
  return out;
}

export function recordProgressionState(input: ProgressionStateInput: string) {
  if (!input || typeof input !== 'object') {
    throw new Error('progression-state: invalid payload');
  }
  if (!SLUG_RE.test(input.cartridge_id ?? '')) {
    throw new Error(`progression-state: invalid cartridge_id "${input.cartridge_id}"`);
  }
  if (!STRUCTURE_TYPES.includes(input.structure_type)) {
    throw new Error(`progression-state: invalid structure_type "${input.structure_type}"`);
  }

  const entry: ProgressionState = {
    cartridge_id: input.cartridge_id,
    structure_type: input.structure_type,
    last_updated_at: new Date().toISOString(),
  };

  if (input.world_map_completion_pct !== undefined) {
    entry.world_map_completion_pct = clamp01(Number(input.world_map_completion_pct));
  }
  const abilities = sanitizeStringArray(input.ability_unlocks);
  if (abilities) entry.ability_unlocks = abilities;
  const breaks = sanitizeStringArray(input.sequence_breaks);
  if (breaks) entry.sequence_breaks = breaks;

  if (input.run_count !== undefined) {
    const n = Number(input.run_count);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error('progression-state: run_count must be a non-negative number');
    }
    entry.run_count = Math.floor(n);
  }

  if (input.meta_currency !== undefined) {
    if (typeof input.meta_currency !== 'object' || input.meta_currency === null) {
      throw new Error('progression-state: meta_currency must be an object');
    }
    const cur: Record<string, number> = {};
    for (const [k, v] of Object.entries(input.meta_currency)) {
      const n = Number(v);
      if (typeof k !== 'string' || k.length === 0) continue;
      if (!Number.isFinite(n) || n < 0) {
        throw new Error(`progression-state: meta_currency.${k} must be a non-negative number`);
      }
      cur[k] = n;
    }
    entry.meta_currency = cur;
  }

  if (input.season_phase !== undefined) {
    if (typeof input.season_phase !== 'string' || input.season_phase.trim().length === 0) {
      throw new Error('progression-state: season_phase must be a non-empty string');
    }
    entry.season_phase = input.season_phase.trim();
  }

  const events = sanitizeStringArray(input.active_events);
  if (events) entry.active_events = events;

  ensureDir(PROGRESSION_STATE_DIR);
  const filePath = path.join(PROGRESSION_STATE_DIR, `${input.cartridge_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
  return filePath;
}

export function readProgressionState(cartridgeId: string: ProgressionState | null) {
  if (!SLUG_RE.test(cartridgeId)) return null;
  const filePath = path.join(PROGRESSION_STATE_DIR, `${cartridgeId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ProgressionState;
}
