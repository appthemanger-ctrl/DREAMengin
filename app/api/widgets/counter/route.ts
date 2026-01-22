
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
export async function POST(req: Request) {
  const { widgetId, site, action } = await req.json();
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data } = await s.from('widget_instances').select('settings_json').eq('id', widgetId).eq('user_id', user.id).single();
  const settings:any = (data && (data as any).settings_json) ? (data as any).settings_json : { counters: {} };
  settings.counters = settings.counters || {};
  settings.counters[site] = settings.counters[site] || { muted:false, unread:0 };
  if (action === 'clear') settings.counters[site].unread = 0;
  if (action === 'mute') settings.counters[site].muted = true;
  if (action === 'unmute') settings.counters[site].muted = false;
  await s.from('widget_instances').update({ settings_json: settings }).eq('id', widgetId).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
