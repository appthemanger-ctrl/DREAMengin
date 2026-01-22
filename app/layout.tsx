import { inter } from '@/lib/theme/fonts'

import '@/styles/globals.css';
import NavBar from '@/components/NavBar';
import { supaServer } from '@/lib/supabase/server';
import { fontClass } from '@/lib/theme/fonts';

export const metadata = { title: 'dreampage', description: 'Dream feed + widgets' };

export default async function RootLayout({ children }:{ children: React.ReactNode }) {
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();

  // Load site default theme
  const { data: site } = await s.from('site_settings').select('value').eq('key','default_theme').maybeSingle();
  const siteTheme = (site?.value ?? {}) as any;

  // User theme if exists
  let brand = siteTheme.brand || '#4f46e5';
  let font = siteTheme.font || 'inter';
  let mode = siteTheme.mode || 'light';
  let base = siteTheme.base ?? 1;

  if (user) {
    const { data: p } = await s.from('profiles').select('theme').eq('user_id', user.id).maybeSingle();
    const t = (p?.theme ?? {}) as any;
    brand = t.brand || brand;
    font = t.font || font;
    mode = t.mode || mode;
    base = typeof t.base === 'number' ? t.base : base;
  }

  const fontCls = fontClass(font);
  const htmlClass = mode === 'dark' ? `${fontCls} dark` : fontCls;

  return (
    <html lang="en" className={htmlClass}>
      <body style={{ ['--brand' as any]: brand, ['--base' as any]: String(base) }} className={inter.className}>
        {/* @ts-expect-error Async Server Component */}
        <NavBar />
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
