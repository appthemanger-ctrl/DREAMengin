
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
import crypto from 'crypto';

async function upsertItem(s: any, userId: string, item: any) {
  const dedupe_hash = crypto.createHash('sha256').update(item.url ?? `${item.source}:${item.external_id}`).digest('hex');
  await s.from('feed_items').upsert({
    user_id: userId,
    source: item.source,
    source_account: item.source_account ?? null,
    external_id: item.external_id ?? null,
    ts: item.ts,
    title: item.title ?? null,
    summary: item.summary ?? null,
    url: item.url ?? null,
    media_json: item.media_json ?? null,
    tags_json: item.tags_json ?? null,
    importance_score: item.importance_score ?? 0,
    dedupe_hash
  }, { onConflict: 'user_id,dedupe_hash' });
}

export async function POST(req: Request) {
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // For MVP: create a stub item so user sees pipeline working.
  await upsertItem(s, user.id, {
    source: 'custom', source_account: 'example', external_id: `${Date.now()}`,
    ts: new Date().toISOString(), title: 'Welcome to DreamFeed',
    summary: 'Connector ingest stub (replace with provider fetchers).', url: null
  });

  return NextResponse.json({ ok: true });
}
