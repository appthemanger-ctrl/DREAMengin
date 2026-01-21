
import { supaServer } from '@/lib/supabase/server';

export async function loadDreamFeed(userId: string) {
  const s = supaServer();
  const sinceISO = new Date(Date.now() - 6*3600*1000).toISOString();
  const nowISO = new Date().toISOString();

  const [feedRes, connRes] = await Promise.all([
    s.from('feed_items').select('*')
      .eq('user_id', userId)
      .or(`ts.gte.${sinceISO},and(saved_by_user.eq.true,retained_until.gt.${nowISO})`)
      .order('ts', { ascending: false })
      .limit(400),
    s.from('connection_accounts').select('provider,account_id,status').eq('user_id', userId)
  ]);

  const disconnected = new Set((connRes.data ?? []).filter(r=>r.status==='disconnected')
                        .map(r=>`${r.provider}:${r.account_id}`));

  const items = (feedRes.data ?? []).filter(i => !disconnected.has(`${i.source}:${i.source_account ?? ''}`));
  return items;
}
