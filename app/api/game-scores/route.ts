import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const VALID_GAMES = ['platformer', 'word-sprint', 'memory-grid', 'speed-tap'] as const;

const PostScoreSchema = z.object({
  game: z.enum(VALID_GAMES, {
    error: `game must be one of: ${VALID_GAMES.join(', ')}`,
  }),
  score: z.number().int().min(0, { message: 'score must be a non-negative integer' }),
  level: z.number().int().min(1).optional(),
});

// GET /api/game-scores?game=<name>&limit=<n>
// Returns top N scores for the given game, enriched with player handle
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get('game');
  const limitParam = searchParams.get('limit');

  if (!game) {
    return NextResponse.json({ data: null, error: 'game is required' }, { status: 400 });
  }

  if (!VALID_GAMES.includes(game as (typeof VALID_GAMES)[number])) {
    return NextResponse.json(
      { data: null, error: `game must be one of: ${VALID_GAMES.join(', ')}` },
      { status: 400 }
    );
  }

  const limit = Math.min(Math.max(parseInt(limitParam ?? '10', 10) || 10, 1), 50);

  const supabase = await createServerClient();

  // Fetch top scores for the game
  const { data: scores, error: scoresError } = await supabase
    .from('game_scores')
    .select('id, user_id, game, score, level, achieved_at')
    .eq('game', game)
    .order('score', { ascending: false })
    .limit(limit);

  if (scoresError) {
    return NextResponse.json({ data: null, error: scoresError.message }, { status: 500 });
  }

  if (!scores || scores.length === 0) {
    return NextResponse.json({ data: [], error: null });
  }

  // Fetch profile data for all score holders
  const userIds = [...new Set(scores.map((s) => s.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url')
    .in('id', userIds);

  const profilesMap = Object.fromEntries(
    (profiles || []).map((p) => [p.id, p])
  );

  // Merge profile data into each score entry and add rank
  const enriched = scores.map((s, index) => ({
    ...s,
    rank: index + 1,
    profile: profilesMap[s.user_id] ?? null,
  }));

  return NextResponse.json({ data: enriched, error: null });
}

// POST /api/game-scores
// Body: { game, score, level? } — auth required
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = PostScoreSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ');
    return NextResponse.json({ data: null, error: message }, { status: 422 });
  }

  const { game, score, level } = parsed.data;

  const { data: entry, error } = await supabase
    .from('game_scores')
    .insert({ user_id: user.id, game, score, level: level ?? null })
    .select('id, user_id, game, score, level, achieved_at')
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: entry, error: null }, { status: 201 });
}
