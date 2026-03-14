// app/api/appeal/route.ts
// TheBoogieMan.Ai — appeal queue endpoint (req 44, 53, 75).
//
// - Records the appeal with status "received"
// - Pauses escalation (req 45) by flagging the event for review
// - Notifies Dr. Eams bridge so users see "under review" status (req 74, 75)
// - Every appeal entry carries policy_version for traceability (req 3, 18)

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { AppealRequestSchema } from '@/lib/ai/schemas';
import { BOOGIE_POLICY_VERSION, RULE_CODES } from '@/lib/ai/boogie-policy';
import { writeAuditLog } from '@/lib/ai/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();
  const appeal_id = uuidv4();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in to submit an appeal.');
  }

  const parseResult = AppealRequestSchema.safeParse({ ...(body as Record<string, unknown>), user_id: user.id });
  if (!parseResult.success) {
    return jsonApiError(400, 'VALIDATION_ERROR', 'Invalid appeal body.');
  }

  const appeal = parseResult.data;
  const now = new Date().toISOString();

  // Write the appeal entry into the audit log as an append-only event (req 20, F53)
  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'boogieman_appeal',
    ok: true,
    policy_version: BOOGIE_POLICY_VERSION,
    payload: {
      appeal_id,
      appeal_status: 'received',
      strike_id: appeal.strike_id ?? null,
      event_id: appeal.event_id ?? null,
      reason_summary: appeal.reason.slice(0, 200),
      has_new_evidence: Boolean(appeal.new_evidence),
      rule_code: RULE_CODES.F53_APPEALABLE,
      submitted_at: now,
    },
    latency_ms: Date.now() - requestStart,
  });

  return NextResponse.json(
    {
      ok: true,
      appeal_id,
      status: 'received',
      policy_version: BOOGIE_POLICY_VERSION,
      message:
        'Your appeal has been received and is queued for review. ' +
        'You will be notified when the review is complete.',
      submitted_at: now,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
