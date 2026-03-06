/**
 * /api/ledger — LedgerAI REST API
 *
 * GET  /api/ledger          → current state
 * POST /api/ledger          → { action: "record" | "decide" | "phase-shift" | "reset", ...params }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLedgerAI, resetLedgerAI } from '@/lib/ledger/ledger-store';

export const dynamic = 'force-dynamic';

// ── GET /api/ledger ──────────────────────────────────────────────────────────

export async function GET() {
  const ai = getLedgerAI();
  return NextResponse.json({
    ok: true,
    state: ai.getState(),
    ledger: ai.ledger.slice(-50), // last 50 entries
  });
}

// ── POST /api/ledger ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, ...params } = body as Record<string, unknown>;
  const ai = getLedgerAI();

  try {
    switch (action) {
      case 'record': {
        const experience = String(params.experience ?? '');
        const outcome = Number(params.outcome ?? 0);
        if (!experience) {
          return NextResponse.json({ ok: false, error: 'experience is required' }, { status: 400 });
        }
        ai.record(experience, outcome);
        return NextResponse.json({ ok: true, state: ai.getState() });
      }

      case 'decide': {
        const state = String(params.state ?? '');
        const actionSpace = params.action_space;
        if (!Array.isArray(actionSpace) || actionSpace.length === 0) {
          return NextResponse.json(
            { ok: false, error: 'action_space must be a non-empty array' },
            { status: 400 },
          );
        }
        const chosen = ai.decide(state, actionSpace.map(String));
        return NextResponse.json({ ok: true, action: chosen, state: ai.getState() });
      }

      case 'phase-shift': {
        ai.phaseShift();
        return NextResponse.json({ ok: true, state: ai.getState() });
      }

      case 'reset': {
        resetLedgerAI();
        return NextResponse.json({ ok: true, state: getLedgerAI().getState() });
      }

      default:
        return NextResponse.json(
          { ok: false, error: `Unknown action: ${String(action)}` },
          { status: 400 },
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
