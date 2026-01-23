import { supaServer } from '@/lib/supabase/server';

export async function loadDreamFeed(userId: string) {
  try {
    const s = supaServer();
    const { data, error } = await s
      .from('feed_items')
      .select('*')
      .eq('user_id', userId)
      .order('ts', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}
