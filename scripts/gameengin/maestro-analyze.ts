/**
 * scripts/gameengin/maestro-analyze.ts
 *
 * Maestro orchestrator. Spec: GameENGINspec.md §3.1 + Agent Profile §1.
 *
 * V2 behaviour (per expanded agent profile):
 *   1. Surveys EVERY cartridge under public/cartridges/ (not just one target).
 *   2. For each cartridge, computes last-touched timestamp per agent type
 *      from rd-sessions/, then makes a per-agent dispatch decision based on
 *      cooldown rules + (when present) live telemetry from Supabase.
 *   3. Records the full assignment plan to brain/work-queue/<date>-<stamp>.json
 *      (the studio activity log).
 *   4. Dispatches via `gh workflow run` only when GH_ACTIONS_DISPATCH=1 and
 *      GITHUB_TOKEN is present; otherwise runs in dry mode.
 *
 * Cooldowns (days; can be overridden via env MAESTRO_COOLDOWN_<AGENT>_DAYS):
 *   prophet  = 3   artisan  = 7   mechanic = 3
 *   writer   = 2   upgrader = 5
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  listMechanics,
  signatureHash,
  isOriginal,
  logRDSession,
  listCartridges,
  getLastTouched,
  recordAssignments,
  type AgentName,
  type AssignmentLogEntry,
} from '../../lib/gameengin/brain-reader.js';

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

const COOLDOWN_DAYS_DEFAULT: Record<AgentName, number> = {
  prophet: 3,
  artisan: 7,
  mechanic: 3,
  writer: 2,
  upgrader: 5,
};

function cooldownFor(agent: AgentName): number {
  const env = process.env[`MAESTRO_COOLDOWN_${agent.toUpperCase()}_DAYS`];
  const v = env ? Number(env) : NaN;
  return Number.isFinite(v) && v >= 0 ? v : COOLDOWN_DAYS_DEFAULT[agent];
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / 86_400_000;
}

async function fetchTelemetry(cartridgeId: string): Promise<Record<string, number> | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
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

function decisionsFor(
  cartridgeId: string,
  metrics: Record<string, number> | null,
  t: Thresholds,
): AssignmentLogEntry[] {
  const out: AssignmentLogEntry[] = [];
  const agents: AgentName[] = ['prophet', 'artisan', 'mechanic', 'writer', 'upgrader'];

  for (const agent of agents) {
    const last = getLastTouched(cartridgeId, agent);
    const ageDays = daysSince(last);
    const cooldown = cooldownFor(agent);
    const cooledDown = ageDays === null || ageDays >= cooldown;

    let reason: string | null = null;

    if (!cooledDown) {
      // Within cooldown — never dispatch unless telemetry forces it.
    } else if (last === null) {
      reason = `never touched by ${agent}`;
    } else {
      reason = `last ${agent} run ${ageDays!.toFixed(1)}d ago (cooldown ${cooldown}d)`;
    }

    // Telemetry overrides — stronger signals than cooldowns.
    if (metrics) {
      if (agent === 'prophet' && (metrics.death ?? 0) > t.deathsPerLevelMax) {
        reason = `deaths=${metrics.death} > ${t.deathsPerLevelMax}`;
      } else if (agent === 'artisan' && (metrics.session_end ?? 0) > t.quitsMax) {
        reason = `voluntary quits=${metrics.session_end} > ${t.quitsMax}`;
      } else if (agent === 'writer' && (metrics.story_skip ?? 0) > t.storySkipsMax) {
        reason = `story_skip=${metrics.story_skip} > ${t.storySkipsMax}`;
      }
    }

    if (reason) {
      out.push({
        cartridge_id: cartridgeId,
        agent,
        reason,
        last_touched_at: last,
        dispatched: false,
      });
    }
  }

  return out;
}

function dispatch(entry: AssignmentLogEntry): boolean {
  if (!process.env.GITHUB_TOKEN || !process.env.GH_ACTIONS_DISPATCH) {
    console.log(`[maestro] DRY: would dispatch ${entry.agent} for ${entry.cartridge_id} (${entry.reason})`);
    return false;
  }
  const wf = `gameengin-${entry.agent}.yml`;
  console.log(`[maestro] gh workflow run ${wf} -f target_cartridge=${entry.cartridge_id}`);
  execSync(`gh workflow run ${wf} -f target_cartridge=${entry.cartridge_id}`, {
    env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN },
    stdio: 'inherit',
  });
  return true;
}

async function main() {
  const restrictTo = process.env.TARGET_CARTRIDGE ?? process.argv[2];
  let cartridges = listCartridges();
  if (restrictTo) cartridges = cartridges.filter((c) => c === restrictTo);
  if (cartridges.length === 0) {
    cartridges = restrictTo ? [restrictTo] : ['mad-maxi'];
  }

  const allAssignments: AssignmentLogEntry[] = [];
  const perCartridgeMetrics: Record<string, Record<string, number> | null> = {};

  for (const cartridgeId of cartridges) {
    const metrics = await fetchTelemetry(cartridgeId);
    perCartridgeMetrics[cartridgeId] = metrics;
    const decisions = decisionsFor(cartridgeId, metrics, DEFAULTS);
    for (const d of decisions) {
      d.dispatched = dispatch(d);
      allAssignments.push(d);
    }
  }

  const mechanicCount = listMechanics().length;
  const sig = signatureHash('platformer', ['coyote-time', 'double-jump', 'dash', 'parry']);
  const original = isOriginal(sig);

  const workQueuePath = recordAssignments(allAssignments, cartridges);

  const insights = {
    generated_at: new Date().toISOString(),
    cartridges_surveyed: cartridges,
    telemetry_available_per_cartridge: Object.fromEntries(
      Object.entries(perCartridgeMetrics).map(([k, v]) => [k, v !== null]),
    ),
    assignments: allAssignments,
    work_queue_path: path.relative(process.cwd(), workQueuePath),
    brain_state: {
      mechanic_count: mechanicCount,
      sample_signature: sig,
      sample_signature_original: original,
    },
  };

  const outPath = path.join(process.cwd(), '.gameengin-maestro-insights.json');
  fs.writeFileSync(outPath, JSON.stringify(insights, null, 2));
  logRDSession('maestro', `survey-${cartridges.join('+').slice(0, 40)}`, insights);
  console.log(JSON.stringify(insights, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
