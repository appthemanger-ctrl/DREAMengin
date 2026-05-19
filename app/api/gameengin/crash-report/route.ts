/**
 * app/api/gameengin/crash-report/route.ts
 *
 * Crash-report ingest endpoint for the Brain feedback loop described in the
 * directive: "When a cartridge crashes or hits a critical bug, a window
 * opens. The player can send a statement directly to Maestro describing
 * what happened. That feedback goes straight into the Brain — into the
 * Project History for that cartridge."
 *
 * Server-only; writes to lib/gameengin/brain/crash-reports/<cartridge_id>/.
 *
 * Hard-rules:
 *   - Reports are accepted only for cartridges in active-projects.json
 *     (the Two-Project Rule). Inactive cartridges → 404 (Upgrader's domain).
 *   - 16 KB payload cap, enforced before disk write.
 *   - cartridge_id must be a slug; player_statement must be non-empty.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  CRASH_REPORT_MAX_BYTES,
  recordCrashReport,
  isActiveCartridge,
} from '@/lib/gameengin/brain-reader';

const ALLOWED_KEYS = new Set([
  'cartridge_id',
  'player_statement',
  'version',
  'error',
  'context',
]);

interface RawPayload {
  cartridge_id?: unknown;
  player_statement?: unknown;
  version?: unknown;
  error?: unknown;
  context?: unknown;
  [key: string]: unknown;
}

function pick(payload: RawPayload ){
  const cleaned: Record<string, unknown> = {};
  for (const k of Object.keys(payload)) {
    if (ALLOWED_KEYS.has(k)) cleaned[k] = payload[k];
  }
  return cleaned;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: 'unreadable body' }, { status: 400 });
  }
  if (Buffer.byteLength(raw, 'utf8') > CRASH_REPORT_MAX_BYTES) {
    return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  }

  let parsed: RawPayload;
  try {
    parsed = JSON.parse(raw) as RawPayload;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  if (!parsed || typeof parsed !== 'object') {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const safe = pick(parsed);
  const cartridgeId = typeof safe.cartridge_id === 'string' ? safe.cartridge_id : '';
  const statement = typeof safe.player_statement === 'string' ? safe.player_statement : '';

  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(cartridgeId)) {
    return NextResponse.json({ error: 'invalid cartridge_id' }, { status: 400 });
  }
  if (statement.trim().length === 0) {
    return NextResponse.json({ error: 'player_statement is required' }, { status: 400 });
  }
  if (!isActiveCartridge(cartridgeId)) {
    // Inactive / unknown cartridge: this is Upgrader's domain, not Maestro's.
    return NextResponse.json(
      { error: 'cartridge is not an active project' },
      { status: 404 },
    );
  }

  try {
    const filePath = recordCrashReport({
      cartridge_id: cartridgeId,
      player_statement: statement,
      version: typeof safe.version === 'string' ? safe.version : undefined,
      error: typeof safe.error === 'object' && safe.error !== null
        ? (safe.error as { name?: string; message?: string; stack?: string })
        : undefined,
      context: typeof safe.context === 'object' && safe.context !== null
        ? (safe.context as Record<string, unknown>)
        : undefined,
    });
    return NextResponse.json({ ok: true, stored: filePath.split(/[\\/]/).slice(-3).join('/') }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'failed to record crash report' },
      { status: 400 },
    );
  }
}