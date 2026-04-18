/**
 * scripts/gameengin/maestro-analyze.ts
 *
 * Maestro orchestrator. Spec: GameENGINspec.md §3.1.
 *
 * Reads telemetry from Supabase (when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * present), computes cartridge health metrics, and decides which agents to
 * dispatch via `gh workflow run`.
 *
 * When credentials are absent, runs in *dry mode*: emits the dispatch plan to
 * stdout and writes `.gameengin-maestro-insights.json` based purely on the
 * brain (no live telemetry). This keeps CI and local runs deterministic.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { listMechanics, signatureHash, isOriginal, logRDSession } from '../../lib/gameengin/brain-reader.js';

interface Thresholds {
  deathsPerLevelMax: number;
  avgFpsMin: number;
  quitsMax: number;
  storySkipsMax: number;
}

const DEFAULTS: Thresholds = {
  deathsPerLevelMax: 50,
  avgFpsMin: 45,
  quitsMax: 20,
  storySkipsMax: 10,
};

interface AgentDispatch {
  agent: 'prophet' | 'mechanic' | 'artisan' | 'writer';
  reason: string;
}

async function fetchTelemetry(cartridgeId: string): Promise<Record<string, number> | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  // Defer import so the script runs without @supabase/supabase-js present.
  const mod = await import('@supabase/supabase-js').catch(() => null);
  if (!mod) return null;
  const client = mod.createClient(url, key);
  const { data, error } = await client
    .from('gameengin_telemetry')
    .select('event_type')
    .eq('cartridge_id', cartridgeId)
    .gte('client_timestamp', new Date(Date.now() - 86_400_000).toISOString());
  if (error) {
    console.warn('[maestro] telemetry fetch failed:', error.message);
    return null;
  }
  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.event_type] = (counts[r.event_type] ?? 0) + 1;
  return counts;
}

function planDispatches(metrics: Record<string, number> | null, t: Thresholds): AgentDispatch[] {
  const out: AgentDispatch[] = [];
  if (!metrics) return out; // no telemetry = no auto-dispatch
  if ((metrics.death ?? 0) > t.deathsPerLevelMax) {
    out.push({ agent: 'prophet', reason: `deaths=${metrics.death} > ${t.deathsPerLevelMax}` });
  }
  if ((metrics.session_end ?? 0) > t.quitsMax) {
    out.push({ agent: 'artisan', reason: `voluntary quits=${metrics.session_end} > ${t.quitsMax}` });
  }
  if ((metrics.story_skip ?? 0) > t.storySkipsMax) {
    out.push({ agent: 'writer', reason: `story_skip=${metrics.story_skip} > ${t.storySkipsMax}` });
  }
  return out;
}

function dispatch(agent: AgentDispatch['agent'], cartridgeId: string): void {
  if (!process.env.GITHUB_TOKEN || !process.env.GH_ACTIONS_DISPATCH) {
    console.log(`[maestro] DRY: would dispatch ${agent} for ${cartridgeId}`);
    return;
  }
  const wf = `gameengin-${agent}.yml`;
  console.log(`[maestro] gh workflow run ${wf} -f target_cartridge=${cartridgeId}`);
  execSync(`gh workflow run ${wf} -f target_cartridge=${cartridgeId}`, {
    env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN },
    stdio: 'inherit',
  });
}

async function main() {
  const cartridgeId = process.env.TARGET_CARTRIDGE ?? process.argv[2] ?? 'mad-maxi';
  const metrics = await fetchTelemetry(cartridgeId);
  const dispatches = planDispatches(metrics, DEFAULTS);

  const mechanicCount = listMechanics().length;
  const sig = signatureHash('platformer', ['coyote-time', 'double-jump', 'dash', 'parry']);
  const original = isOriginal(sig);

  const insights = {
    cartridge_id: cartridgeId,
    generated_at: new Date().toISOString(),
    telemetry_available: metrics !== null,
    metrics: metrics ?? {},
    dispatches,
    brain_state: {
      mechanic_count: mechanicCount,
      sample_signature: sig,
      sample_signature_original: original,
    },
  };

  const outPath = path.join(process.cwd(), '.gameengin-maestro-insights.json');
  fs.writeFileSync(outPath, JSON.stringify(insights, null, 2));
  logRDSession('maestro', `analyze-${cartridgeId}`, insights);
  console.log(JSON.stringify(insights, null, 2));

  for (const d of dispatches) dispatch(d.agent, cartridgeId);
}

main().catch((err) => { console.error(err); process.exit(1); });
