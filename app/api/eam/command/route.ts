
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supaServer } from '@/lib/supabase/server';
import { supaService } from '@/lib/supabase/service';

type Theme = { brand?: string; font?: string; mode?: 'light'|'dark'; base?: number };
const COLORS: Record<string,string> = {
  purple:'#7c3aed', violet:'#7c3aed', indigo:'#4f46e5', blue:'#0ea5e9',
  orange:'#f97316', green:'#16a34a', teal:'#0d9488', pink:'#ec4899', red:'#ef4444',
  lime:'#65a30d', cyan:'#06b6d4', amber:'#f59e0b'
};
const FONT_ALIASES: Record<string,string> = {
  inter:'inter', minimalist:'inter', clean:'inter',
  sora:'sora', modern:'sora',
  outfit:'outfit',
  grotesk:'space', space:'space',
  'dm sans':'dmsans', dmsans:'dmsans', 'dm-sans':'dmsans'
};

function pickColor(words: string[]): string | undefined {
  for (const w of words) if (COLORS[w]) return COLORS[w];
  return undefined;
}
function pickFont(words: string[]): string | undefined {
  for (const w of words) if (FONT_ALIASES[w]) return FONT_ALIASES[w];
  return undefined;
}

async function setSiteDefaultTheme(svc: ReturnType<typeof supaService>, patch: Theme) {
  const { data } = await svc.from('site_settings').select('value').eq('key','default_theme').maybeSingle();
  const cur = (data?.value ?? {}) as Theme;
  const merged = { ...cur, ...patch };
  await svc.from('site_settings').upsert({ key:'default_theme', value: merged });
  return merged;
}

async function setUserTheme(s: ReturnType<typeof supaServer>, userId: string, patch: Theme) {
  const { data: p } = await s.from('profiles').select('theme').eq('user_id', userId).maybeSingle();
  const theme = { ...(p?.theme ?? {}), ...patch };
  await s.from('profiles').update({ theme }).eq('user_id', userId);
  return theme;
}

export async function POST(req: Request) {
  const admin = cookies().get('admin')?.value === '1';
  if (!admin) return NextResponse.json({ error:'forbidden' }, { status:403 });

  const { q } = await req.json();
  const text = String(q ?? '').toLowerCase().trim();
  const words = text.split(/\s+/);
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  const svc = supaService();

  // Phase progression (existing behavior)
  if (text.includes('next phase') || text === '/next') {
    if (!user) return NextResponse.json({ ok:false, a: 'Login required.' }, { status: 401 });
    const { data: ph } = await svc.from('site_settings').select('value').eq('key','phase').maybeSingle();
    const cur = (ph?.value?.current ?? 0) as number;
    const next = cur + 1;
    const actions: string[] = [];

    if (next === 1) {
      const rules = { frequencyCaps:{ youtube:5, x:8, soundcloud:8, custom:10 }, dailyBudget:50, mutedKeywords:[], boostKeywords:['release','drop','stream'], pinnedAccounts:[], priorityFriends:[] };
      await s.from('feed_rules').upsert({ user_id: user.id, rules_json: rules });
      actions.push('Feed rules initialized.');
      const { data: existing } = await s.from('widget_instances').select('type').eq('user_id', user.id);
      const have = new Set((existing ?? []).map((w:any)=>w.type));
      for (const t of ['promo','next-stream']) if (!have.has(t)) await s.from('widget_instances').insert({ user_id: user.id, type:t, order:(existing?.length ?? 0)+1, enabled:true, settings_json:{} });
      actions.push('Widgets added: promo, next-stream.');
      await s.from('feed_items').insert([
        { user_id: user.id, source:'custom', source_account:'welcome', external_id: String(Date.now()), ts: new Date().toISOString(), title:'DreamFeed live', summary:'Your feed is ready.'},
        { user_id: user.id, source:'custom', source_account:'tips', external_id: String(Date.now()+1), ts: new Date().toISOString(), title:'Tip: Add connectors', summary:'Go to Connectors to add sources.'}
      ]);
      actions.push('Seeded 2 feed items.');
    }
    if (next === 2) {
      await s.from('connection_accounts').upsert({ user_id: user.id, provider:'youtube', account_id:'@handle', status:'connected', tokens:{} }, { onConflict:'user_id,provider,account_id' });
      await s.from('feed_items').insert({ user_id: user.id, source:'youtube', source_account:'@handle', external_id: String(Date.now()+2), ts: new Date().toISOString(), title:'YouTube stub item', summary:'Connected via phase 2.' });
      actions.push('Connected sample YouTube and seeded item.');
    }
    await svc.from('site_settings').upsert({ key:'phase', value:{ current: next } });
    return NextResponse.json({ ok:true, a:`Advanced to phase ${next}. ${actions.join(' ')}` });
  }

  // Natural-language THEME intents
  // 1) Dark / light mode
  if (text.includes('dark mode') || text.includes('go darker') || text.includes('night')) {
    await setSiteDefaultTheme(svc, { mode: 'dark' });
    if (user) await setUserTheme(s, user.id, { mode: 'dark' });
    return NextResponse.json({ ok:true, a:'Dark mode enabled (site default + your profile).' });
  }
  if (text.includes('light mode') || text.includes('go lighter') || text.includes('day')) {
    await setSiteDefaultTheme(svc, { mode: 'light' });
    if (user) await setUserTheme(s, user.id, { mode: 'light' });
    return NextResponse.json({ ok:true, a:'Light mode enabled.' });
  }

  // 2) Color change (e.g., "use orange", "accent to purple", "make it pop")
  const c = pickColor(words);
  if (c || text.includes('make it pop') || text.includes('more pop') || text.includes('vibrant')) {
    const brand = c ?? '#7c3aed'; // default to vivid violet
    await setSiteDefaultTheme(svc, { brand });
    if (user) await setUserTheme(s, user.id, { brand });
    return NextResponse.json({ ok:true, a:`Accent set to ${brand}.` });
  }

  // 3) Font change (e.g., "use sora", "go modern", "grotesk")
  const f = pickFont(words);
  if (f || text.includes('go modern') || text.includes('minimal')) {
    const font = f ?? 'sora';
    await setSiteDefaultTheme(svc, { font });
    if (user) await setUserTheme(s, user.id, { font });
    return NextResponse.json({ ok:true, a:`Font switched to ${font}.` });
  }

  // 4) Size change (bigger/smaller text)
  if (/(bigger|increase|larger).*text|font/.test(text)) {
    const { data: site } = await svc.from('site_settings').select('value').eq('key','default_theme').maybeSingle();
    const cur = (site?.value?.base ?? 1) as number;
    const base = Math.min(1.4, cur + 0.1);
    await setSiteDefaultTheme(svc, { base });
    if (user) await setUserTheme(s, user.id, { base });
    return NextResponse.json({ ok:true, a:`Text size increased.` });
  }
  if (/(smaller|decrease|reduce).*text|font/.test(text)) {
    const { data: site } = await svc.from('site_settings').select('value').eq('key','default_theme').maybeSingle();
    const cur = (site?.value?.base ?? 1) as number;
    const base = Math.max(0.85, cur - 0.1);
    await setSiteDefaultTheme(svc, { base });
    if (user) await setUserTheme(s, user.id, { base });
    return NextResponse.json({ ok:true, a:`Text size decreased.` });
  }

  // 5) Reset theme
  if (text.includes('reset theme') || text.includes('default theme')) {
    await svc.from('site_settings').upsert({ key:'default_theme', value: { brand:'#4f46e5', font:'inter', mode:'light', base:1 } });
    if (user) await setUserTheme(s, user.id, { brand:'#4f46e5', font:'inter', mode:'light', base:1 });
    return NextResponse.json({ ok:true, a:'Theme reset to defaults.' });
  }

  // 6) Apply to everyone (opted-in only)
  if (text.includes('apply to everyone') || text.includes('apply to all users')) {
    // Pull site default and push to opted-in users
    const { data: site } = await svc.from('site_settings').select('value').eq('key','default_theme').maybeSingle();
    const theme = (site?.value ?? {}) as Theme;
    const { data: ids } = await svc.from('user_settings').select('user_id').eq('allow_eam_theme_updates', true);
    for (const u of (ids ?? [])) {
      await svc.from('profiles').update({ theme }).eq('user_id', u.user_id);
    }
    return NextResponse.json({ ok:true, a:`Applied current default theme to ${ids?.length ?? 0} opted-in users.` });
  }

  return NextResponse.json({ ok:true, a: `Command not recognized. Try: "dark mode", "use orange", "font sora", "bigger text", "reset theme", "apply to everyone", or "next phase".` });
}
