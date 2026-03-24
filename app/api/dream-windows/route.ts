/**
 * app/api/dream-windows/route.ts
 *
 * GET  /api/dream-windows  — list Dream Windows for the authenticated user
 *                            (own records + shared/public from followed users)
 * POST /api/dream-windows  — create a Dream Window record with full 10-field
 *                            validation (Phase 8 §B Point 12)
 *
 * Every write persists the lifecycle state to the database (Point 11).
 * owner_id is enforced at insert — only the authenticated user's own id is
 * accepted (Point 15).
 *
 * Architecture: docs/ARCHITECTURE.md §4
 * Privacy: visibility defaults to 'private' (docs/AXIOMS.md §product integrity)
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { DREAM_WINDOW_STATES } from '@/lib/dream-window/DreamWindowLifecycle';

// ---------------------------------------------------------------------------
// The 10 required fields (Phase 8 §B Point 12)
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = [
  'id',
  'type',
  'owner_id',
  'config',
  'size',
  'position',
  'visibility',
  'sourceBindings',
  'destinationRules',
  'activeState',
] as const;

type RequiredField = (typeof REQUIRED_FIELDS)[number];

function validateRequiredFields(
  body: Record<string, unknown>,
): RequiredField[] {
  return REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    return value === undefined || value === null;
  });
}

// ---------------------------------------------------------------------------
// GET — list Dream Windows
// ---------------------------------------------------------------------------

/**
 * GET /api/dream-windows
 *
 * Returns:
 *   - All Dream Windows owned by the authenticated user
 *   - Shared Dream Windows from users the authenticated user follows
 *   - Public Dream Windows from all users
 *
 * RLS on the dream_windows table enforces these rules at the DB layer.
 * This route only returns records the RLS policy already permits.
 * Private records from other users are never returned (Point 15).
 */
export async function GET(_req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // RLS enforces visibility rules — the DB will only return permitted rows.
   
  const { data: dreamWindows, error } = await (supabase as any)
    .from('dream_windows')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dreamWindows: dreamWindows ?? [] });
}

// ---------------------------------------------------------------------------
// POST — create Dream Window
// ---------------------------------------------------------------------------

/**
 * POST /api/dream-windows
 *
 * Body (all 10 fields required — returns 422 if any are missing):
 *   id             string (UUID — must be provided by client)
 *   type           string
 *   owner_id       string (must equal auth.uid() — returns 403 otherwise)
 *   config         object
 *   size           { width: number; height: number }
 *   position       { x: number; y: number }
 *   visibility     'private' | 'shared' | 'public'
 *   sourceBindings string[]
 *   destinationRules  object[]
 *   activeState    canonical lifecycle state string
 *
 * Persists to dream_windows table on every call (Point 11, 16).
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── 10-field validation (Point 12) ──────────────────────────────────────
  const missingFields = validateRequiredFields(body);
  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: 'Unprocessable Entity — missing required Dream Window fields',
        missingFields,
        requiredFields: REQUIRED_FIELDS,
      },
      { status: 422 },
    );
  }

  // ── owner_id enforcement (Point 15) ─────────────────────────────────────
  if (body.owner_id !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden — owner_id must match the authenticated user' },
      { status: 403 },
    );
  }

  // ── Validate activeState ─────────────────────────────────────────────────
  const validStates = Object.values(DREAM_WINDOW_STATES) as string[];
  if (!validStates.includes(body.activeState as string)) {
    return NextResponse.json(
      {
        error: 'Unprocessable Entity — invalid activeState',
        validStates,
      },
      { status: 422 },
    );
  }

  // ── Validate visibility ──────────────────────────────────────────────────
  const validVisibility = ['private', 'shared', 'public'];
  if (!validVisibility.includes(body.visibility as string)) {
    return NextResponse.json(
      {
        error: 'Unprocessable Entity — invalid visibility',
        validVisibility,
      },
      { status: 422 },
    );
  }

  // ── Insert ───────────────────────────────────────────────────────────────
   
  const { data: dreamWindow, error } = await (supabase as any)
    .from('dream_windows')
    .insert({
      id: body.id as string,
      type: body.type as string,
      owner_id: user.id,
      config: body.config,
      size: body.size,
      position: body.position,
      visibility: (body.visibility as string) ?? 'private',
      source_bindings: body.sourceBindings,
      destination_rules: body.destinationRules,
      active_state: body.activeState as string,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dreamWindow }, { status: 201 });
}
