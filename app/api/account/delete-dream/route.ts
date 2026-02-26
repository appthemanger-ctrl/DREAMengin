// app/api/account/delete-dream/route.ts
// "Delete My Dream" (delete account) endpoint.
// Deletes all user data including profile, then the auth identity.
//
// NOTE: Deleting the auth user requires the Supabase service role key
// (SUPABASE_SERVICE_ROLE_KEY). createServiceClient() uses it when configured.
// Without it, data rows are still removed but the auth identity persists.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/ai/audit';

export const dynamic = 'force-dynamic';

const DeleteDreamBodySchema = z.object({
  confirm: z.literal('DELETE_MY_DREAM'),
  reason: z.string().max(500).optional(),
});

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = DeleteDreamBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonError(400, 'CONFIRM_REQUIRED', 'Send { confirm: "DELETE_MY_DREAM" } to proceed.');
  }

  const { reason } = parseResult.data;

  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  const deleted: string[] = [];
  const errors: string[] = [];

  // Delete all data tables in dependency order
  const tables: Array<'feed_rules' | 'widget_instances'> = ['feed_rules', 'widget_instances'];
  const extraTables = ['connector_configs', 'page_configs', 'profiles'] as const;

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', user.id);
    if (error) {
      errors.push(`${table}: ${error.message}`);
    } else {
      deleted.push(table);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;
  for (const table of extraTables) {
    const { error } = await supabaseAny.from(table).delete().eq('user_id', user.id);
    if (error) {
      errors.push(`${table}: ${(error as { message: string }).message}`);
    } else {
      deleted.push(table);
    }
  }

  // Profiles table may use 'id' instead of 'user_id'
  // Try to clean up profile by id if user_id-based delete didn't work
  if (!deleted.includes('profiles')) {
    const { error: profileErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);
    if (!profileErr) {
      deleted.push('profiles');
      const idx = errors.findIndex((e) => e.startsWith('profiles:'));
      if (idx !== -1) errors.splice(idx, 1);
    }
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
