/**
 * app/api/drafts/route.ts
 *
 * GET  /api/drafts          — fetch all drafts for the authenticated user
 * POST /api/drafts          — create or update a draft
 *
 * Draft schema (content_drafts table):
 *   id            uuid PK
 *   user_id       uuid FK → auth.users
 *   content       text        — draft body / text
 *   content_type  text        — 'post' | 'video' | 'story' | 'thread' | 'caption' | 'tweet_thread' | 'bio' | 'script'
 *   title         text        — optional human-readable label
 *   scheduled_at  timestamptz — null = no schedule; set = scheduled for future publish
 *   created_at    timestamptz
 *   updated_at    timestamptz
 *
 * Security rules (AXIOM 4 — Security by Default, ARCHITECTURE.md §5):
 *   - Requires authenticated user via supabase.auth.getUser()
 *   - user_id is always set from auth, never from the request body
 *   - Drafts are private by default (LAW.md §2 — nothing is public by default)
 *
 * LAW.md §3 — every visible action must do something real.
 * ACTION_AUDIT.md — was labelled 🟡 fake-wired (drafts written to local state only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';


// ── Validation ──────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  'post', 'video', 'story', 'thread',
  'caption', 'tweet_thread', 'bio', 'script',
] as const;

const CreateDraftSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10_000),
  content_type: z.enum(CONTENT_TYPES).default('post'),
  title: z.string().max(200).optional(),
  scheduled_at: z.string().datetime({ offset: true }).nullable().optional(),
});

// ── GET /api/drafts ──────────────────────────────────────────────────────────

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

   
  const db = supabase as any;

  const { data: drafts, error } = await db
    .from('content_drafts')
    .select('id, content, content_type, title, scheduled_at, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ drafts: drafts ?? [] });
}

// ── POST /api/drafts ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  const parseResult = CreateDraftSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const { content, content_type, title, scheduled_at } = parseResult.data;

   
  const db = supabase as any;

  const now = new Date().toISOString();
  const { data: draft, error } = await db
    .from('content_drafts')
    .insert({
      user_id: user.id,            // always from auth — never from body
      content,
      content_type,
      title: title ?? null,
      scheduled_at: scheduled_at ?? null,
      created_at: now,
      updated_at: now,
    })
    .select('id, content, content_type, title, scheduled_at, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ draft }, { status: 201 });
}
