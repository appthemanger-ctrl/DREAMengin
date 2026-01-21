
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const s = supaServer();
  const [profiles, products, music] = await Promise.all([
    s.from('profiles').select('handle, display_name, avatar_url').or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`).limit(10),
    s.from('products').select('id, name, price, image_url').ilike('name', `%${q}%`).limit(10),
    s.from('music_releases').select('id, title, cover_url, release_url').ilike('title', `%${q}%`).limit(10)
  ]);
  return NextResponse.json({ profiles: profiles.data ?? [], products: products.data ?? [], music: music.data ?? [] });
}
