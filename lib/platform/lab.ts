/**
 * lib/platform/lab.ts
 *
 * Physics Engine telemetry helpers — browser-safe, RLS-protected.
 *
 * Call logPhysicsExperiment from your Wasm tick handler to persist
 * performance snapshots to the physics_experiments row that owns the run.
 * RLS on physics_experiments ensures only the creator can update their own row.
 *
 * Architecture: docs/ARCHITECTURE.md §3 — logic layer (lib/); browser clients
 * use lib/supabase/client for direct RLS-gated writes.
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Persists a WASM/physics tick telemetry snapshot to a physics_experiments row.
 *
 * @param experimentId  UUID of the physics_experiments record to update.
 * @param tickData      Arbitrary performance snapshot from the Wasm tick handler.
 *
 * The caller must be authenticated; RLS enforces creator-only writes.
 */
export async function logPhysicsExperiment(
  experimentId: string,
  tickData: Record<string, unknown>,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('physics_experiments')
    .update({
      performance_metrics: tickData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', experimentId);

  if (error) {
    console.error('Physics telemetry log failed:', error.message);
  }
}
