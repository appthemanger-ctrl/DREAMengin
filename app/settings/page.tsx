
import { supaServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';\nimport AvatarUploader from '@/components/AvatarUploader';
import { widgetModules } from '@/lib/modules/registry.gen';

export default async function Settings(){
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) redirect('/login');

  const { data: prof } = await s.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  const { data: us } = await s.from('user_settings').select('*').eq('user_id', user.id).maybeSingle();
  const { data: widgets } = await s.from('widget_instances').select('*').eq('user_id', user.id).order('order');

  async function saveProfile(formData: FormData) {
    'use server';
    const sv = supaServer();
    const { data:{ user } } = await sv.auth.getUser();
    if (!user) return;
    const display_name = String(formData.get('display_name') || '');
    const bio = String(formData.get('bio') || '');
    await sv.from('profiles').update({ display_name, bio }).eq('user_id', user.id);
  }

  async function toggleWidget(formData: FormData) {
    'use server';
    const sv = supaServer();
    const { data:{ user } } = await sv.auth.getUser();
    if (!user) return;
    const id = String(formData.get('id'));
    const enabled = String(formData.get('enabled')) === 'on';
    await sv.from('widget_instances').update({ enabled }).eq('id', id).eq('user_id', user.id);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-5">
        <h2 className="text-lg font-semibold">Edit Profile</h2>\n        <AvatarUploader initial={prof?.avatar_url ?? ''} />
        <form action={saveProfile} className="mt-3 space-y-3">
          <input name="display_name" defaultValue={prof?.display_name ?? ''} className="border rounded w-full px-3 py-2" placeholder="Display name"/>
          <textarea name="bio" defaultValue={prof?.bio ?? ''} className="border rounded w-full px-3 py-2 h-28" placeholder="Bio"></textarea>
          <button className="btn">Save</button>
        </form>
      </div>
      <div className="card p-5">
        <h2 className="text-lg font-semibold">Home Widgets</h2>
        <div className="mt-3 space-y-2">
          {(widgets ?? []).map((w:any)=>(
            <form key={w.id} action={toggleWidget} className="flex items-center justify-between border rounded p-2">
              <div><div className="font-medium text-sm">{w.type}</div></div>
              <input type="hidden" name="id" value={w.id}/>
              <label className="text-sm flex items-center gap-2">
                <input name="enabled" type="checkbox" defaultChecked={w.enabled}/>
                Enabled
              </label>
              <button className="btn">Update</button>
            </form>
          ))}
        </div>
      </div>
      <div className="card p-5 mt-6">
        <h2 className="text-lg font-semibold">Available Modules</h2>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          {widgetModules.map(m => (
            <form key={m.slug} action={addWidgetServer} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs text-gray-600">{m.slug}</div>
              </div>
              <input type="hidden" name="type" value={m.slug}/>
              <button className="btn">Add</button>
            </form>
          ))}
        </div>
      </div>
      <div className="card p-5 mt-6">
        <h2 className="text-lg font-semibold">Theme & Appearance</h2>
        <form action={saveTheme} className="mt-3 grid gap-3">
          <label className="text-sm">Brand Color</label>
          <input type="color" name="brand" defaultValue={(prof?.theme as any)?.brand ?? '#4f46e5'} className="h-10 w-16 border rounded"/>
          <label className="text-sm mt-2">Font</label>
          <select name="font" defaultValue={(prof?.theme as any)?.font ?? 'inter'} className="border rounded px-2 py-1 w-48">
            <option value="inter">Inter</option>
            <option value="sora">Sora</option>
            <option value="outfit">Outfit</option>
            <option value="space">Space Grotesk</option>
            <option value="dmsans">DM Sans</option>
          </select>
          <button className="btn w-max mt-2">Save Theme</button>
        </form>
      </div>

      <div className="card p-5 mt-6">
        <h2 className="text-lg font-semibold">Dr. Eam: Theme Control</h2>
        <form action={saveOptIn} className="flex items-center justify-between mt-2">
          <div className="text-sm">
            Allow Dr. Eam to gradually update my theme (colors/fonts)
          </div>
          <label className="text-sm flex items-center gap-2">
            <input name="allow" type="checkbox" defaultChecked={us?.allow_eam_theme_updates ?? false}/>
            Enable
          </label>
          <button className="btn">Update</button>
        </form>
      </div>
    </div>
  );
}


export const dynamic = 'force-dynamic';

async function addWidgetServer(formData: FormData) {
  'use server';
  const sv = (await import('@/lib/supabase/server')).supaServer();
  const { data:{ user } } = await sv.auth.getUser();
  if (!user) return;
  const type = String(formData.get('type'));
  const maxOrder = (await sv.from('widget_instances').select('order').eq('user_id', user.id).order('order', { ascending:false }).limit(1)).data?.[0]?.order ?? 0;
  await sv.from('widget_instances').insert({ user_id: user.id, type, order: maxOrder + 1, enabled: true, settings_json: {} });
}



async function saveTheme(formData: FormData) {
  'use server';
  const sv = (await import('@/lib/supabase/server')).supaServer();
  const { data:{ user } } = await sv.auth.getUser();
  if (!user) return;
  const brand = String(formData.get('brand') || '#4f46e5');
  const font = String(formData.get('font') || 'inter');
  const { data: p } = await sv.from('profiles').select('theme').eq('user_id', user.id).maybeSingle();
  const theme = { ...(p?.theme ?? {}), brand, font };
  await sv.from('profiles').update({ theme }).eq('user_id', user.id);
}

async function saveOptIn(formData: FormData) {
  'use server';
  const sv = (await import('@/lib/supabase/server')).supaServer();
  const { data:{ user } } = await sv.auth.getUser();
  if (!user) return;
  const allow = String(formData.get('allow')) === 'on';
  await sv.from('user_settings').upsert({ user_id: user.id, allow_eam_theme_updates: allow });
}


async function saveLinks(formData: FormData) {
  'use server';
  const sv = (await import('@/lib/supabase/server')).supaServer();
  const { data:{ user } } = await sv.auth.getUser();
  if (!user) return;
  const links = String(formData.get('links') || '[]');
  await sv.from('profiles').update({ links_json: JSON.parse(links) }).eq('user_id', user.id);
}
