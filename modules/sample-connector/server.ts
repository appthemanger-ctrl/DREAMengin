
import { supaServer } from '@/lib/supabase/server';

export async function ingest({ userId }:{ userId: string }){
  const s = supaServer();
  await s.from('feed_items').insert({
    user_id: userId,
    source: 'connector', source_account: 'sample', external_id: String(Date.now()),
    ts: new Date().toISOString(), title: 'Sample Connector Item',
    summary: 'Created by sample connector module.'
  });
}
