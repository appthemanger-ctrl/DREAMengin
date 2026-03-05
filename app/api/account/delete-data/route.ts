// app/api/account/delete-data/route.ts
// "Delete My Data" endpoint.
// Removes feed_rules, widget_instances, connector_configs, page configs.
// Preserves auth identity and profile handle.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/ai/audit';

export const dynamic = 'force-dynamic';

const DeleteDataBodySchema = z.object({
  confirm: z.literal('DELETE_MY_DATA'),
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

  const parseResult = DeleteDataBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonError(400, 'CONFIRM_REQUIRED', 'Send { confirm: "DELETE_MY_DATA" } to proceed.');
  }

  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  const deleted: string[] = [];
  const errors: string[] = [];

  // Run all independent deletes in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;
  const [feedResult, widgetResult, connectorResult, pageResult] = await Promise.all([
    supabase.from('feed_rules').delete().eq('user_id', user.id),
    supabase.from('widget_instances').delete().eq('user_id', user.id),
    supabaseAny.from('connector_configs').delete().eq('user_id', user.id),
    supabaseAny.from('page_configs').delete().eq('user_id', user.id),
  ]);

  if (feedResult.error) {
    errors.push(`feed_rules: ${feedResult.error.message}`);
  } else {
    deleted.push('feed_rules');
  }

  if (widgetResult.error) {
    errors.push(`widget_instances: ${widgetResult.error.message}`);
  } else {
    deleted.push('widget_instances');
  }

  if (connectorResult.error) {
    errors.push(`connector_configs: ${(connectorResult.error as { message: string }).message}`);
  } else {
    deleted.push('connector_configs');
  }

  if (pageResult.error) {
    errors.push(`page_configs: ${(pageResult.error as { message: string }).message}`);
  } else {
    deleted.push('page_configs');
  }

  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'account',
    ok: errors.length === 0,
    error_code: errors.length > 0 ? 'PARTIAL_DELETE' : undefined,
    latency_ms: Date.now() - requestStart,
    payload: { action: 'delete_data', deleted, errors },
  });

  return NextResponse.json(
    {
      ok: true,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
      preserved: ['auth_identity', 'profile_handle'],
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
