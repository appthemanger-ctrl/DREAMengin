import { supaServer } from '@/lib/supabase/server';

export async function loadDreamFeed(user_id: string){
  const s = supaServer();
  const { data, error } = await s
    .from('feed_items')
    .select('*')
    .eq('user_id', user_id)
    .order('ts', { ascending: false })
    .limit(50);
  if(error){ return []; }
  return data ?? [];
}
