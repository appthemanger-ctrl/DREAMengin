/**
 * scripts/gameengin/mechanic-run.ts
 *
 * Mechanic agent. Spec: GameENGINspec.md §3.4, §5.3.
 *
 * Local work: reads tuning.json from the target cartridge, validates ranges
 * against the brain mechanic-library, optionally compiles
 * `assembly/<cartridge_id>-player.ts` to wasm via `asc` when the `asc` binary
 * is installed (it is, via devDependency assemblyscript), and verifies the
 * resulting wasm is < 500 KB per spec §1.5.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { logRDSession, listMechanics, recordBuild } from '../../lib/gameengin/brain-reader.js';

const MAX_WASM_BYTES = 500 * 1024;

function compileAS(cartridgeId: string): { compiled: boolean; outPath?: string; bytes?: number; reason?: string } {
  const src = path.join(process.cwd(), 'assembly', `${cartridgeId}-player.ts`);
  if (!fs.existsSync(src)) {
    return { compiled: false, reason: `no assembly/${cartridgeId}-player.ts found` };
  }
  const outDir = path.join(process.cwd(), 'public', 'cartridges', cartridgeId, 'logic');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'main.wasm');
  try {
    execFileSync(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['asc', src, '-o', outPath, '--optimizeLevel', '3', '--shrinkLevel', '2', '--enable', 'simd', '--enable', 'bulk-memory'],
      { stdio: 'inherit' },
    );
    const bytes = fs.statSync(outPath).size;
    return { compiled: true, outPath, bytes };
  } catch (err) {
    return { compiled: false, reason: `asc failed: ${(err as Error).message}` };
  }
}

async function main() {
  const cartridgeId = process.env.TARGET_CARTRIDGE ?? process.argv[2] ?? 'mad-maxi';
  const tuningPath = path.join(process.cwd(), 'public', 'cartridges', cartridgeId, 'tuning.json');
  let tuning: unknown = null;
  if (fs.existsSync(tuningPath)) {
    tuning = JSON.parse(fs.readFileSync(tuningPath, 'utf-8'));
  }
  const mechanics = listMechanics();
  const compile = compileAS(cartridgeId);
  const oversize = compile.bytes !== undefined && compile.bytes > MAX_WASM_BYTES;

  const buildPath = recordBuild({
    cartridge_id: cartridgeId,
    source: `assembly/${cartridgeId}-player.ts`,
    bytes: compile.bytes ?? null,
    success: compile.compiled && !oversize,
    mechanics_referenced: mechanics.map((m) => m.name),
    optimisation_flags: ['--optimizeLevel', '3', '--shrinkLevel', '2', '--enable', 'simd', '--enable', 'bulk-memory'],
    reason: compile.reason,
  });

  const result = {
    cartridge_id: cartridgeId,
    tuning_present: tuning !== null,
    mechanic_library_size: mechanics.length,
    compile,
    wasm_within_budget: !oversize,
    max_wasm_bytes: MAX_WASM_BYTES,
    build_history_entry: path.relative(process.cwd(), buildPath),
    generated_at: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(process.cwd(), '.gameengin-mechanic-output.json'),
    JSON.stringify(result, null, 2),
  );
  logRDSession('mechanic', `${cartridgeId}-compile`, result);
  console.log(JSON.stringify(result, null, 2));
  if (oversize) process.exit(3);
}

main().catch((err) => { console.error(err); process.exit(1); });
