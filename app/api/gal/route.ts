/**
 * app/api/gal/route.ts
 *
 * POST /api/gal — Global Association Layer (GAL) registry sync.
 *
 * Ensures every new platform object is registered in the global_registry
 * table — the "Everything to Everything" hub that lets any object be
 * associated with any other object.
 *
 * Security (AXIOM 4):
 *   - Requires authentication; returns 401 otherwise.
 *   - owner_id is always resolved from the session — never from the request body.
 *   - Uses UPSERT so re-registering the same (type, internal_id) is idempotent.
 *
 * Architecture: docs/ARCHITECTURE.md §3 — server route in app/api/.
 *
 * Body (JSON):
 *   { type: string, internalId: string, label: string }
 *
 * Response:
 *   200  { data: GlobalRegistryRow }  (upserted or pre-existing)
 *   400  { error: string }
 *   401  { error: "Unauthorized" }
 *   500  { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const { type, internalId, label } = body as Record<string, unknown>;

  if (!type || typeof type !== 'string') {
    return NextResponse.json({ error: 'type is required.' }, { status: 400 });
  }
  if (!internalId || typeof internalId !== 'string') {
    return NextResponse.json({ error: 'internalId is required.' }, { status: 400 });
  }
  if (!label || typeof label !== 'string') {
    return NextResponse.json({ error: 'label is required.' }, { status: 400 });
  }

  const db = supabase as any;
  const { data, error } = await db
    .from('global_registry')
    .upsert(
      [{
        object_type: type,
        internal_id: internalId,
        label:       label.trim(),
        owner_id:    user.id,
      }],
      { onConflict: 'object_type,internal_id' },
    )
    .select()
    .single();

  if (error) {
    console.error('GAL registry sync failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
