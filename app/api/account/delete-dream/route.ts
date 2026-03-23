// app/api/account/delete-dream/route.ts
// "Delete My Dream" (delete account) endpoint.
// Deletes all user data including profile, then the auth identity.
//
// Phase 8 §H Point 69: runTriadConsensus gates this critical system-level action.
// All three AI agents must approve before deletion proceeds.
//
// NOTE: Deleting the auth user requires the Supabase service role key
// (dreamengin_SUPABASE_SECRET_KEY). createServiceClient() uses it when configured.
// Without it, data rows are still removed but the auth identity persists.

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/ai/audit';
import { runTriadConsensus } from '@/lib/agents/agentBus';

export const dynamic = 'force-dynamic';

const DeleteDreamBodySchema = z.object({
  confirm: z.literal('DELETE_MY_DREAM'),
  reason: z.string().max(500).optional(),
});


export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = DeleteDreamBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonApiError(400, 'CONFIRM_REQUIRED', 'Send { confirm: "DELETE_MY_DREAM" } to proceed.');
  }

  const { reason } = parseResult.data;

  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  const deleted: string[] = [];
  const errors: string[] = [];

  // ── AI Triad Consensus Gate (Phase 8 §H Point 69) ────────────────────────
  // Account deletion is a major irreversible system action. All three agents
  // must approve before any data is removed.
  const consensus = await runTriadConsensus({
    message: `User ${user.id} is requesting permanent account deletion. Reason: ${reason ?? 'none provided'}. This will remove all user data and auth identity.`,
    actorEmail: user.email,
    actorRole:  'user',
    uiRoute:    '/settings/account',
  });

  if (!consensus.unanimous) {
    const blockReason = consensus.boogie.hard_block
      ? `Policy blocked: ${consensus.boogie.reason ?? 'policy violation'}`
      : 'Triad consensus not reached — deletion blocked for safety.';
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent:   'account',
      ok:      false,
      error_code: 'TRIAD_BLOCKED',
      latency_ms: Date.now() - requestStart,
      payload:    { action: 'delete_dream', block_reason: blockReason },
    });
    return jsonApiError(403, 'TRIAD_BLOCKED', blockReason);
  }

  // Run all independent table deletes in parallel (dependency-safe: none reference each other)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;
  const tableResults = await Promise.all([
    supabase.from('feed_rules').delete().eq('user_id', user.id),
    supabase.from('widget_instances').delete().eq('user_id', user.id),
    supabaseAny.from('connector_configs').delete().eq('user_id', user.id),
    supabaseAny.from('page_configs').delete().eq('user_id', user.id),
  ]);

  const tableNames = ['feed_rules', 'widget_instances', 'connector_configs', 'page_configs'] as const;
  for (let i = 0; i < tableNames.length; i++) {
    const { error } = tableResults[i];
    if (error) {
      errors.push(`${tableNames[i]}: ${(error as { message: string }).message}`);
    } else {
      deleted.push(tableNames[i]);
    }
  }

  // Profiles table may use 'id' instead of 'user_id' — try user_id first, then id
  const { error: profileUserIdErr } = await supabaseAny
    .from('profiles')
    .delete()
    .eq('user_id', user.id);
  if (profileUserIdErr) {
    // Fallback: try deleting by id
    const { error: profileIdErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);
    if (profileIdErr) {
      errors.push(`profiles: ${(profileIdErr as { message: string }).message}`);
    } else {
      deleted.push('profiles');
    }
  } else {
    deleted.push('profiles');
  }

  // Delete auth identity using service role client
  let authDeleted = false;
  try {
    const serviceClient = await createServiceClient();
    const { error: authErr } = await serviceClient.auth.admin.deleteUser(user.id);
    if (authErr) {
      errors.push(`auth_identity: ${authErr.message}`);
    } else {
      authDeleted = true;
      deleted.push('auth_identity');
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Service role client not available';
    errors.push(`auth_identity: ${msg} — data rows removed but auth identity was not deleted`);
  }

  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'account',
    ok: authDeleted,
    error_code: errors.length > 0 ? 'PARTIAL_DELETE' : undefined,
    latency_ms: Date.now() - requestStart,
    payload: { action: 'delete_dream', deleted, errors, reason },
  });

  return NextResponse.json(
    {
      ok: authDeleted,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
