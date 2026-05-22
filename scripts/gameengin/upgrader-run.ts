/**
 * scripts/gameengin/upgrader-run.ts
 *
 * Upgrader maintenance agent. Spec: GameENGINspec.md §6 (Agent Profile).
 *
 * Purpose
 *   Revisit an existing cartridge and decide which dimensions need refresh
 *   (mechanics / visuals / narrative / tuning) based on:
 *     - days since each agent last touched the cartridge
 *     - current mechanic-library / technique-library size vs. references
 *       baked into the cartridge artefacts
 *     - cartridge tier (flagship / active / maintenance / archived)
 *
 * Output
 *   - .gameengin-upgrader-output.json (machine-readable plan)
 *   - brain/upgrade-history/<cartridge_id>/<date>-<stamp>.json
 *
 * Backward compatibility
 *   Upgrader does not mutate compiled artefacts. It only emits a dispatch
 *   plan. Save/level format checks are recorded so future migrations can be
 *   gated.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    getLastTouched,
    listCartridges,
    listMechanics,
    listTechniques,
    logRDSession,
    readUpgradeRules,
    recordUpgrade,
    type AgentName,
} from '../../lib/gameengin/brain-reader.js';

interface ManifestLite {
  id?: string;
  tier?: 'flagship' | 'active' | 'maintenance' | 'archived';
  ai?: { mechanics?: string[]; visual_techniques?: string[] };
}

function readManifest(cartridgeId: string): ManifestLite | null {
  const p = path.join(process.cwd(), 'public', 'cartridges', cartridgeId, 'MANIFEST.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as ManifestLite;
  } catch {
    return null;
  }
}

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 9999;
  return (Date.now() - t) / 86_400_000;
}

const DIMENSION_TO_AGENT: Record<string, AgentName> = {
  mechanics: 'mechanic',
  visuals: 'artisan',
  narrative: 'writer',
  tuning: 'prophet',
};

interface UpgradePlan {
  cartridge_id: string;
  tier: ManifestLite['tier'];
  scores: Record<string, number>;
  targets: string[];
  dispatched_agents: AgentName[];
  backward_compat_checks: string[];
}

function planFor(cartridgeId: string, manifest: ManifestLite | null): UpgradePlan {
  const rules = readUpgradeRules();
  const tier = manifest?.tier ?? 'active';
  const tierMul = rules.tier_multipliers[tier] ?? 1.0;
  const w = rules.weights;

  const lastMechanic = getLastTouched(cartridgeId, 'mechanic');
  const lastArtisan  = getLastTouched(cartridgeId, 'artisan');
  const lastWriter   = getLastTouched(cartridgeId, 'writer');
  const lastProphet  = getLastTouched(cartridgeId, 'prophet');

  // Drift = how far the cartridge's references lag behind the brain.
  const totalMechanics = listMechanics().length;
  const refMechanics = manifest?.ai?.mechanics?.length ?? 0;
  const mechanicDrift = totalMechanics === 0 ? 0 : Math.max(0, 1 - refMechanics / totalMechanics);

  const totalTechniques = listTechniques().length;
  const refTechniques = manifest?.ai?.visual_techniques?.length ?? 0;
  const techniqueDrift = totalTechniques === 0 ? 0 : Math.max(0, 1 - refTechniques / totalTechniques);

  const cooldown = rules.cooldown_days_per_dimension;

  function score(daysAgo: number, drift: number, dimension: keyof typeof cooldown): number {
    const cooledDown = daysAgo >= (cooldown[dimension] ?? 0);
    if (!cooledDown) return 0;
    const ageNorm = Math.min(1, daysAgo / 30); // saturate at 30d
    return tierMul * (
      w.days_since_last_touch * ageNorm +
      (dimension === 'mechanics' ? w.mechanic_library_drift * drift : 0) +
      (dimension === 'visuals' ? w.visual_technique_drift * drift : 0) +
      (dimension === 'narrative' ? w.narrative_beat_gap * Math.min(1, daysAgo / 7) : 0) +
      (dimension === 'tuning' ? w.tuning_drift_from_prophet * Math.min(1, daysAgo / 14) : 0)
    );
  }

  const scores: Record<string, number> = {
    mechanics: score(daysSince(lastMechanic), mechanicDrift, 'mechanics'),
    visuals:   score(daysSince(lastArtisan),  techniqueDrift, 'visuals'),
    narrative: score(daysSince(lastWriter),   0,              'narrative'),
    tuning:    score(daysSince(lastProphet),  0,              'tuning'),
  };

  const targets = Object.entries(scores)
    .filter(([, s]) => s >= rules.min_dispatch_score)
    .sort((a, b) => b[1] - a[1])
    .map(([dim]) => dim);

  const dispatched: AgentName[] = [];
  const seen = new Set<AgentName>();
  for (const dim of targets) {
    const a = DIMENSION_TO_AGENT[dim];
    if (a && !seen.has(a)) { dispatched.push(a); seen.add(a); }
  }

  return {
    cartridge_id: cartridgeId,
    tier,
    scores,
    targets,
    dispatched_agents: dispatched,
    backward_compat_checks: [
      `manifest_present:${manifest !== null}`,
      `wasm_present:${fs.existsSync(path.join('public', 'cartridges', cartridgeId, 'logic', 'main.wasm'))}`,
      `tuning_present:${fs.existsSync(path.join('public', 'cartridges', cartridgeId, 'tuning.json'))}`,
    ],
  };
}

async function main() {
  const restrictTo = process.env.TARGET_CARTRIDGE ?? process.argv[2];
  let cartridges = listCartridges();
  if (restrictTo) cartridges = cartridges.filter((c) => c === restrictTo);
  if (cartridges.length === 0) cartridges = restrictTo ? [restrictTo] : ['mad-maxi'];

  const plans: UpgradePlan[] = [];
  for (const id of cartridges) {
    const manifest = readManifest(id);
    const plan = planFor(id, manifest);
    plans.push(plan);
    recordUpgrade({
      cartridge_id: id,
      upgrade_targets: plan.targets,
      priority_scores: plan.scores,
      dispatched_agents: plan.dispatched_agents,
      backward_compatibility_checks: plan.backward_compat_checks,
    });
  }

  const out = {
    generated_at: new Date().toISOString(),
    cartridges_surveyed: cartridges,
    plans,
  };
  fs.writeFileSync(
    path.join(process.cwd(), '.gameengin-upgrader-output.json'),
    JSON.stringify(out, null, 2),
  );
  logRDSession('upgrader', `survey-${cartridges.join('+').slice(0, 40)}`, out);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
