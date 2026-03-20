// app/api/ai/execute/route.ts
// Execute validated intents after confirmation.
// Maps each IntentType to a real server-side action or client-side dispatch payload.

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { ExecuteBodySchema, type Intent } from '@/lib/ai/schemas';
import { verifyConfirmToken } from '@/lib/ai/confirm';
import { writeAuditLog } from '@/lib/ai/audit';
import { checkRateLimit } from '@/lib/ai/rateLimit';
import { validateWithIdari } from '@/lib/ai/triad';
import type { Json } from '@/types/supabase';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Intent dispatch table
// ---------------------------------------------------------------------------

type DispatchResult = {
  executed: boolean;
  action_type?: string;
  action_payload?: Record<string, unknown>;
  error?: string;
};

const ROUTE_MAP: Record<string, string> = {
  '/homedream':        '/homedream',
  '/home':             '/homedream',
  '/messages':         '/messages',
  '/shop':             '/shop',
  '/lab':              '/lab',
  '/connectors':       '/connectors',
  '/settings':         '/settings',
  '/daydream/music':   '/daydream/music',
  '/daydream/games':   '/daydream/games',
  '/daydream/lab':     '/daydream/lab',
  '/daydream/code':    '/daydream/code',
  '/daydream/brand':   '/daydream/brand',
  '/daydream/create':  '/daydream/create',
  '/create':           '/create',
  '/profile':          '/view-profile',
  '/game':             '/game',
};

async function dispatchIntent(
  intent: Intent,
  userId: string,
  actorRole: string,
  supabase: Awaited<ReturnType<typeof createServerClient>>,
): Promise<DispatchResult> {
  const { type, payload } = intent;

  switch (type) {
    // ── Navigation intent: return a route for the client to navigate to ──
    case 'NAV_DELTA': {
      const raw = typeof payload.route === 'string' ? payload.route : '';
      const route = ROUTE_MAP[raw] ?? (raw.startsWith('/') ? raw : '/homedream');
      return { executed: true, action_type: 'navigate', action_payload: { route } };
    }

    // ── Open the home anchor menu ──
    case 'HOME_MENU_OPEN':
    case 'HOME_ANCHOR_SET_STATE': {
      const state = typeof payload.state === 'number' ? payload.state : 1;
      return { executed: true, action_type: 'home_menu_open', action_payload: { state } };
    }

    // ── Navigate to a dream / preview one ──
    case 'DREAM_OPEN':
    case 'DREAM_PREVIEW': {
      const dream_id = typeof payload.dream_id === 'string' ? payload.dream_id : null;
      return {
        executed: true,
        action_type: type === 'DREAM_OPEN' ? 'dream_open' : 'dream_preview',
        action_payload: dream_id ? { dream_id } : { route: '/homedream' },
      };
    }

    // ── Patch dream config ──
    case 'DREAM_CONFIG_PATCH': {
      const dream_id = typeof payload.dream_id === 'string' ? payload.dream_id : null;
      if (!dream_id) return { executed: false, error: 'dream_id required for DREAM_CONFIG_PATCH' };
      const patch = payload.patch && typeof payload.patch === 'object' ? payload.patch : {};
      // Store the patch in the config JSONB field (widget_instances schema)
      const { error } = await supabase
        .from('widget_instances')
        .update({ config: patch as Json })
        .eq('id', dream_id)
        .eq('user_id', userId);
      if (error) return { executed: false, error: error.message };
      return { executed: true, action_type: 'dream_config_patch', action_payload: { dream_id, patch } };
    }

    // ── Reorder dreams ──
    case 'DREAM_REORDER': {
      const order = Array.isArray(payload.order) ? payload.order as string[] : null;
      if (!order) return { executed: false, error: 'order array required for DREAM_REORDER' };
      await Promise.all(
        order.map((id, idx) =>
          supabase
            .from('widget_instances')
            .update({ config: { position: idx } as Json })
            .eq('id', id)
            .eq('user_id', userId),
        ),
      );
      return { executed: true, action_type: 'dream_reorder', action_payload: { order } };
    }

    // ── Search: return query for client to execute ──
    case 'SEARCH': {
      const query = typeof payload.query === 'string' ? payload.query : '';
      return { executed: true, action_type: 'search', action_payload: { query, route: `/search?q=${encodeURIComponent(query)}` } };
    }

    // ── Navigate to create post ──
    case 'POST_CREATE': {
      const prefill = typeof payload.body === 'string' ? payload.body : '';
      return { executed: true, action_type: 'navigate', action_payload: { route: '/create', prefill } };
    }

    // ── Admin diagnostics ──
    case 'DIAG_SCHEMA_SNAPSHOT': {
      if (actorRole !== 'admin' && actorRole !== 'owner') {
        return { executed: false, error: 'Admin role required for DIAG_SCHEMA_SNAPSHOT' };
      }
      // Return the list of known public tables from the type-safe schema
      const knownTables = [
        'profiles', 'boards', 'widget_instances', 'app_posts', 'conversations',
        'messages', 'merch', 'ad_listings', 'follows', 'journey_dots',
        'daydream_states', 'user_blocks', 'user_roles', 'admin_audit_log',
      ];
      return { executed: true, action_type: 'diag_result', action_payload: { type: 'schema', tables: knownTables } };
    }

    case 'DIAG_RLS_SNAPSHOT': {
      if (actorRole !== 'admin' && actorRole !== 'owner') {
        return { executed: false, error: 'Admin role required for DIAG_RLS_SNAPSHOT' };
      }
      return { executed: true, action_type: 'diag_result', action_payload: { type: 'rls', note: 'RLS policies enforced at Supabase layer.' } };
    }

    default:
      return { executed: false, error: `Unknown intent type: ${String(type)}` };
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const requestStart = Date.now();

  // Parse and validate request
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = ExecuteBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonApiError(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const request = parseResult.data;

  // Authenticate
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const actorRole = (roleData as { role?: string } | null)?.role ?? 'user';

  // Rate limit
  const rateLimitCheck = await checkRateLimit(user.id, '/api/ai/execute', 30, 60);
  if (!rateLimitCheck.allowed) {
    return jsonApiError(429, 'RATE_LIMIT', 'Too many requests.');
  }

  // Confirm token required
  if (!request.confirm_token) {
    return jsonApiError(403, 'CONFIRMATION_REQUIRED', 'Confirmation token required.');
  }

  // Verify confirmation token
  const tokenValid = verifyConfirmToken({
    token: request.confirm_token,
    requestId: request.request_id,
    userId: user.id,
  });

  if (!tokenValid) {
    await writeAuditLog({
      request_id: request.request_id,
      user_id: user.id,
      agent: 'execute',
      ok: false,
      error_code: 'INVALID_TOKEN',
      latency_ms: Date.now() - requestStart,
    });
    return jsonApiError(403, 'INVALID_TOKEN', 'Confirmation token is invalid or expired.');
  }

  // Resolve the intents to dispatch: client sends full intent objects back
  // (intent_ids used for cross-reference / audit; intents used for dispatch)
  const candidateIntents = request.intents?.filter(i => request.intent_ids.includes(i.intent_id)) ?? [];

  if (candidateIntents.length === 0) {
    return jsonApiError(400, 'NO_INTENTS', 'No resolvable intents found. Please include the full intents array.');
  }

  // Re-validate through IDARi before executing
  const { intents: safeIntents } = validateWithIdari(
    candidateIntents,
    actorRole === 'admin' || actorRole === 'owner' ? 'admin' : 'user',
  );

  // Dispatch each intent
  const results = await Promise.all(
    safeIntents.map(async (intent) => {
      const result = await dispatchIntent(intent, user.id, actorRole, supabase);
      return { intent_id: intent.intent_id, ...result };
    }),
  );

  const allOk = results.every(r => r.executed);

  await writeAuditLog({
    request_id: request.request_id,
    user_id: user.id,
    agent: 'execute',
    ok: allOk,
    latency_ms: Date.now() - requestStart,
    payload: {
      intent_count: safeIntents.length,
      executed_count: results.filter(r => r.executed).length,
      intent_types: safeIntents.map(i => i.type),
    },
  });

  return NextResponse.json({
    ok: allOk,
    results,
    boogie: { allowed: true },
  });
}
