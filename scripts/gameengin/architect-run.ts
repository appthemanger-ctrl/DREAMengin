/**
 * scripts/gameengin/architect-run.ts
 *
 * Game Architect — the visionary. Generates a Vision Statement and stores
 * it in the Brain's Concept Library so Maestro can promote it later.
 *
 * Inputs (all from the Brain — no internet required for the deterministic
 * default; `--scrape` is reserved for future trend ingestion):
 *   - genre-dna/<genre>.json
 *   - mechanic-library/<category>/<id>.json
 *   - emotional-tones/<tone>.json
 *   - concept-patterns/{settings,protagonists,scope-formulas}/*.json
 *   - originality-registry/signatures.json (for novelty check)
 *
 * Output:
 *   - lib/gameengin/brain/concept-library/<vision_id>.json
 *   - one R&D session entry under brain/rd-sessions/
 *
 * Env / args:
 *   ARCHITECT_VISION_ID, ARCHITECT_GENRE, ARCHITECT_TITLE
 *   ARCHITECT_DRY=1     → log only, do not write to the Concept Library
 */

import {
  listConceptPatterns,
  listMechanics,
  recordVisionStatement,
  readVisionStatement,
  signatureHash,
  isOriginal,
  logRDSession,
  type VisionStatement,
  type ConceptPattern,
} from '../../lib/gameengin/brain-reader.js';

interface ArchitectInputs {
  visionId: string;
  title: string;
  genre: string;
  dry: boolean;
}

function readInputs(): ArchitectInputs {
  const visionId = (process.env.ARCHITECT_VISION_ID ?? process.argv[2] ?? 'neon-courier').toLowerCase();
  const genre = process.env.ARCHITECT_GENRE ?? 'platformer';
  const title = process.env.ARCHITECT_TITLE ?? toTitleCase(visionId);
  const dry = process.env.ARCHITECT_DRY === '1';
  return { visionId, title, genre, dry };
}

function toTitleCase(slug: string): string {
  return slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function pickPattern<T extends ConceptPattern>(
  patterns: T[],
  preferredId: string | undefined,
): T | undefined {
  if (patterns.length === 0) return undefined;
  if (preferredId) {
    const exact = patterns.find((p) => p.pattern_id === preferredId);
    if (exact) return exact;
  }
  return patterns[0];
}

function pickCoreMechanics(genre: string): string[] {
  // Genre-tagged mechanic selection: prefer mechanics that already declare
  // the target genre in `games_using`, fall back to the first 3 movement
  // mechanics. Cap at 3 to stay within the 2–4 mechanic budget.
  const all = listMechanics();
  const matched = all.filter((m) => Array.isArray(m.games_using) && m.games_using.some((g) => g.includes(genre)));
  const pool = matched.length >= 2 ? matched : all.filter((m) => m.category === 'movement');
  const picked = pool.slice(0, 3).map((m) => m.name);
  if (picked.length < 2) {
    return ['dash', 'coyote-time'];
  }
  return picked;
}

function draftVision(inputs: ArchitectInputs): VisionStatement {
  const settings = listConceptPatterns('setting');
  const protagonists = listConceptPatterns('protagonist');
  const scopes = listConceptPatterns('scope-formula');

  const setting = pickPattern(settings, process.env.ARCHITECT_SETTING_ID);
  const protagonist = pickPattern(protagonists, process.env.ARCHITECT_PROTAGONIST_ID);
  const scope = pickPattern(scopes, process.env.ARCHITECT_SCOPE_ID);

  if (!setting) throw new Error('architect: no setting patterns found in Brain');
  if (!protagonist) throw new Error('architect: no protagonist patterns found in Brain');
  if (!scope) throw new Error('architect: no scope-formula patterns found in Brain');

  const mechanics = pickCoreMechanics(inputs.genre);
  const sigHash = signatureHash(inputs.genre, mechanics);
  const original = isOriginal(sigHash);

  const studioHours = Number(scope.studio_build_budget_hours) || 8;
  const playerMinutes = Number(scope.estimated_player_minutes) || 30;

  return {
    vision_id: inputs.visionId,
    title: inputs.title,
    elevator_pitch: `A ${inputs.genre} about ${String(protagonist.role).toLowerCase()}`,
    setting: {
      world: String(setting.world ?? ''),
      vibe: String(setting.vibe ?? ''),
      visual_tone: String(setting.visual_tone ?? ''),
    },
    protagonist: {
      role: String(protagonist.role ?? ''),
      motivation: String(protagonist.motivation ?? ''),
    },
    genre: inputs.genre,
    core_mechanics: mechanics,
    scope: {
      mode: 'single-player',
      estimated_player_minutes: playerMinutes,
      studio_build_budget_hours: studioHours,
    },
    patterns_used: {
      setting: setting.pattern_id,
      protagonist: protagonist.pattern_id,
      scope_formula: scope.pattern_id,
    },
    originality: { signature_hash: sigHash },
    status: original ? 'drafted' : 'archived',
    drafted_at: new Date().toISOString(),
    drafted_by: 'game-architect',
    notes: original
      ? 'Architect draft — passes the Originality Ledger check.'
      : 'Architect draft — combo flagged by the Originality Ledger; archived for review.',
  };
}

async function main() {
  const inputs = readInputs();

  // Don't clobber a hand-curated vision unless explicitly forced.
  const existing = readVisionStatement(inputs.visionId);
  if (existing && process.env.ARCHITECT_FORCE !== '1') {
    console.log(`[architect] vision "${inputs.visionId}" already exists; skipping (set ARCHITECT_FORCE=1 to overwrite).`);
    return;
  }

  const vision = draftVision(inputs);
  const summary = {
    vision_id: vision.vision_id,
    genre: vision.genre,
    mechanics: vision.core_mechanics,
    studio_hours: vision.scope.studio_build_budget_hours,
    player_minutes: vision.scope.estimated_player_minutes,
    status: vision.status,
    originality: vision.originality?.signature_hash,
  };

  if (inputs.dry) {
    console.log('[architect] DRY:', JSON.stringify(summary, null, 2));
    return;
  }

  const written = recordVisionStatement(vision);
  logRDSession('game-architect', `vision-${vision.vision_id}`, summary);
  console.log(`[architect] wrote ${written}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
