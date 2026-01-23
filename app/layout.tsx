// app/layout.tsx
import '@/styles/globals.css';
import NavBar from '@/components/NavBar';
import { supaServer } from '@/lib/supabase/server';
import { inter, fontMap, defaultFont } from '@/lib/theme/fonts';
import type { CSSProperties, ReactNode } from 'react';

export const metadata = {
  title: 'dreampage',
  description: 'Dream feed + widgets',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const s = supaServer();
  const { data: { user } } = await s.auth.getUser();

  const { data: site } = await s
    .from('site_settings')
    .select('value')
    .eq('key', 'default_theme')
    .maybeSingle();

  const siteTheme = (site?.value ?? {}) as any;

  let brand = siteTheme.brand || '#dc2626'; // red-600 default
  let font: keyof typeof fontMap = (siteTheme.font as keyof typeof fontMap) || defaultFont;
  let mode: 'light' | 'dark' = siteTheme.mode || 'light';
  let base = typeof siteTheme.base === 'number' ? siteTheme.base : 1;

  if (user) {
    const { data: p } = await s
      .from('profiles')
      .select('theme')
      .eq('user_id', user.id)
      .maybeSingle();

    const t = (p?.theme ?? {}) as any;
    brand = t.brand || brand;
    font = (t.font as keyof typeof fontMap) || font;
    mode = (t.mode as 'light' | 'dark') || mode;
    base = typeof t.base === 'number' ? t.base : base;
  }

  const htmlClass = mode === 'dark' ? 'dark' : '';
  const fontSel = fontMap[font] ?? inter;

  const styleVars: CSSProperties = {
    // @ts-expect-error: custom CSS vars allowed
    '--brand': brand,
    '--base': base,
  };

  return (
    <html lang="en" className={htmlClass} style={styleVars} suppressHydrationWarning>
      <body className={fontSel.className}>
        {/* @ts-expect-error Async Server Component */}
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
