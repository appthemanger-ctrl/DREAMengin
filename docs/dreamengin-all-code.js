\documentclass[11pt]{article}
\usepackage[a4paper,margin=0.8in]{geometry}
\usepackage[T1]{fontenc}
\usepackage[scaled]{beramono}
\usepackage{inconsolata}
\usepackage{hyperref}
\usepackage{xcolor}
\usepackage{listings}
\usepackage{longtable}
\usepackage{etoolbox}

\hypersetup{
  colorlinks=true,
  linkcolor=blue!60!black,
  urlcolor=blue!60!black,
  citecolor=blue!60!black
}

\definecolor{bg}{HTML}{0B1020}
\definecolor{fg}{HTML}{E6E8EE}
\definecolor{kw}{HTML}{7DD3FC}
\definecolor{st}{HTML}{FDE68A}
\definecolor{cm}{HTML}{9CA3AF}

\lstdefinestyle{code}{
  backgroundcolor=\color{bg},
  basicstyle=\linespread{1.0}\footnotesize\ttfamily\color{fg},
  keywordstyle=\color{kw}\bfseries,
  stringstyle=\color{st},
  commentstyle=\color{cm}\itshape,
  breaklines=true,
  showstringspaces=false,
  tabsize=2,
  frame=single,
  framerule=0.2pt,
  rulecolor=\color{black},
  numbers=left,
  numbersep=8pt,
  numberstyle=\tiny\color{cm}
}

\title{DREAMengin --- Full Project Source (LaTeX export)}
\author{Auto-generated listing}
\date{\today}
\begin{document}
\maketitle

\section*{Contents}
\begin{longtable}{p{0.65\linewidth}r}
\textbf{File} & \textbf{Lines} \\ \hline
README-SSR-FIX.txt & 35 \\
README-next-detection-fix.md & 20 \\
README.md & 15 \\
jsconfig.json & 10 \\
next.config.js & 4 \\
package.json & 19 \\
postcss.config.js & 7 \\
tailwind.config.js & 29 \\
tsconfig.json & 21 \\
vercel.json & 5 \\
app/globals.css & 28 \\
app/layout.js & 27 \\
app/page.js & 33 \\
app/ads/page.js & 1 \\
app/api/assistant/route.js & 11 \\
app/api/auth/magic-link/route.js & 20 \\
app/api/auth/signout/route.js & 10 \\
app/api/innerdreams/run/route.js & 17 \\
app/auth/forgot/page.js & 41 \\
app/auth/reset/page.js & 52 \\
app/connectors/page.js & 1 \\
app/home/page.js & 41 \\
app/home/page.tsx & 27 \\
app/home/add/page.js & 37 \\
app/home/add/page.tsx & 56 \\
app/login/page.js & 57 \\
app/login/page.tsx & 58 \\
app/music/page.js & 44 \\
app/music/upload/page.js & 41 \\
app/profile/[handle]/page.js & 62 \\
app/settings/page.js & 70 \\
app/shop/page.js & 40 \\
app/shop/buy/[id]/route.js & 41 \\
app/shop/me/page.js & 43 \\
app/shop/me/new/page.js & 41 \\
app/signup/page.js & 52 \\
components/AudioPlayer.js & 26 \\
components/Header.js & 31 \\
components/Header.tsx & 25 \\
components/Providers.js & 24 \\
components/Providers.tsx & 24 \\
components/UploadcareFileUploader.js & 33 \\
components/WidgetGrid.tsx & 80 \\
db/phase2.sql & 34 \\
lib/theme.js & 15 \\
lib/theme.ts & 14 \\
lib/ai/router.js & 13 \\
lib/modules/registry.gen.js & 4 \\
lib/supabase/client.js & 13 \\
lib/supabase/server.js & 27 \\
modules/registry.generated.js & 6 \\
modules/widgets/messages/index.js & 10 \\
modules/widgets/promo/index.js & 10 \\
scripts/prepare.mjs & 74 \\
\end{longtable}

\section*{\texttt{README-SSR-FIX.txt}}
\noindent\begin{lstlisting}[style=code]
DREAMengin — Supabase SSR Fix (drop-in patch)
=============================================

What this patch does
--------------------
1) Adds the two helper files expected by your codebase:
   - lib/supabase/client.js  -> createBrowserClient wrapper
   - lib/supabase/server.js  -> createServerClient wrapper (with cookie bridge)
2) Provides aliases `supaClient` and `supaServer` so older imports keep working.

One REQUIRED step in package.json
---------------------------------
Install the missing dependency **@supabase/ssr** by adding it to your dependencies.

If you use Working Copy on iOS:
  • Tap `package.json` → Edit.
  • Under "dependencies", add this line (keep JSON commas correct):
      "@supabase/ssr": "^0.5.1"
  • Commit (Push ON) with message: fix: add @supabase/ssr and SSR helpers

If you prefer CLI:
  npm i @supabase/ssr

Imports to use in code
----------------------
Client (browser):
  import { createClient } from '@/lib/supabase/client'
  const supabase = createClient()

Server (RSC / route / server action):
  import { createServerClientFixed } from '@/lib/supabase/server'
  const supabase = createServerClientFixed()

That’s it. Re-deploy on Vercel and the build should pass.

\end{lstlisting}

\section*{\texttt{README-next-detection-fix.md}}
\noindent\begin{lstlisting}[style=code]
# Next.js Detection Fix (Drop-in Patch)

1) Place these files in the **repo root** (same folder as your `src/` and `app/`).
   - package.json
   - next.config.mjs
   - jsconfig.json
   - vercel.json

2) Commit:
   git add package.json next.config.mjs jsconfig.json vercel.json
   git commit -m "chore: ensure Next.js detected by Vercel"
   git push

3) In Vercel Project → Settings → General:
   - Root Directory: `/` (repo root)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

That's it. Vercel will detect Next.js and build.

\end{lstlisting}

\section*{\texttt{README.md}}
\noindent\begin{lstlisting}[style=code]
# DREAMengin UI/UX Patch

This zip contains Tailwind + Next UI update (landing, login, home with draggable widgets),
providers, theme manager, and configs. Drop into your repo root and commit.

Env vars (Vercel > Settings > Environment Variables):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Supabase table `widgets` suggested columns:
- id (uuid default uuid_generate_v4() primary key)
- owner (uuid references auth.users)
- title text, body text, url text, type text
- position int

\end{lstlisting}

\section*{\texttt{jsconfig.json}}
\noindent\begin{lstlisting}[style=code]
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    }
  }
}
\end{lstlisting}

\section*{\texttt{next.config.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;

\end{lstlisting}

\section*{\texttt{package.json}}
\noindent\begin{lstlisting}[style=code]
{
  "name": "dreamengin",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "prebuild": "node scripts/prepare.mjs || true"
  },
  "dependencies": {
    "next": "14.2.6",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@supabase/ssr": "^0.4.0",
    "@supabase/auth-helpers-nextjs": "^0.9.0"
  }
}
\end{lstlisting}

\section*{\texttt{postcss.config.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

\end{lstlisting}

\section*{\texttt{tailwind.config.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        brandA: '#0ea5e9',
        brandB: '#f97316',
        ink: '#0f172a',
      },
      animation: {
        'slow-pan': 'pan 20s linear infinite',
      },
      keyframes: {
        pan: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}

\end{lstlisting}

\section*{\texttt{tsconfig.json}}
\noindent\begin{lstlisting}[style=code]
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true, 
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "paths": { "@/*": ["./*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

\end{lstlisting}

\section*{\texttt{vercel.json}}
\noindent\begin{lstlisting}[style=code]
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci"
}
\end{lstlisting}

\section*{\texttt{app/globals.css}}
\noindent\begin{lstlisting}[style=code,language=CSS]
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-gradient: linear-gradient(120deg, #f97316cc 0%, #0ea5e9cc 100%);
  }
  .dark {
    --bg-gradient: linear-gradient(120deg, #f9731680 0%, #0ea5e980 100%);
  }
  body {
    @apply bg-ink text-slate-100 font-body antialiased;
    background: radial-gradient(at 20% 90%, hsla(217,80%,30%,1) 0px, transparent 50%),
                radial-gradient(at 80% 10%, hsla(28,90%,60%,1) 0px, transparent 50%),
                radial-gradient(at 50% 50%, hsla(198,90%,50%,1) 0px, transparent 50%);
    background-attachment: fixed;
    animation: slow-pan 20s linear infinite;
  }
  .glass {
    @apply bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl;
  }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

\end{lstlisting}

\section*{\texttt{app/layout.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
import './globals.css'
import { Inter, Sora } from 'next/font/google'
import Providers from '../components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })

export const metadata = {
  title: 'DREAMengin',
  description: 'Your home on the internet.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-ink text-white p-2 rounded">
          Skip to main
        </a>
        <Providers>
          <div id="main">{children}</div>
        </Providers>
      </body>
    </html>
  )
}

\end{lstlisting}

\section*{\texttt{app/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function Landing() {
  return (
    <section className="grid lg:grid-cols-2 gap-8 items-center">
      <div className="space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Dreampage — your home on the internet
        </h1>
        <p className="text-white/80 text-lg">
          A private, customizable homepage that pulls your world into one calm feed —
          widgets, promos, releases — your rules.
        </p>
        <div className="flex gap-3">
          <Link className="btn" href="/login">Create account</Link>
          <Link className="btn" href="/home">Continue as guest</Link>
        </div>
        <ul className="text-white/70 text-sm list-disc pl-5 space-y-1">
          <li>Your feed, your rules (caps, mutes, pins)</li>
          <li>Drag-and-drop bubble widgets</li>
          <li>Creator tools: promos, releases, ad slots</li>
        </ul>
      </div>
      <div className="card">
        <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan-400/30 animate-hue" />
        <div className="text-white/70 text-sm mt-3">Live theme animation preview</div>
      </div>
    </section>
  );
}

\end{lstlisting}

\section*{\texttt{app/ads/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
export default function Ads(){ return (<div className='card'>Ads marketplace (stub)</div>);}
\end{lstlisting}

\section*{\texttt{app/api/assistant/route.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { q, messages } = await req.json().catch(() => ({ q: '' }));
  const text = await aiChat(messages ? { messages } : String(q ?? ''));
  return NextResponse.json({ a: text });
}

\end{lstlisting}

\section*{\texttt{app/api/auth/magic-link/route.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const form = await req.formData();
  const email = String(form.get('email') || '').trim();
  if (!email) return NextResponse.redirect(new URL('/login?e=missing', req.url));

  try {
    const s = supaServer();
    const { error } = await s.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
    return NextResponse.redirect(new URL('/login?sent=1', req.url));
  } catch (e) {
    return NextResponse.redirect(new URL('/login?e=send', req.url));
  }
}

\end{lstlisting}

\section*{\texttt{app/api/auth/signout/route.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
// app/api/auth/signout/route.js
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';

export async function POST() {
  const s = supaServer();
  await s.auth.signOut();
  return NextResponse.json({ ok: true });
}

\end{lstlisting}

\section*{\texttt{app/api/innerdreams/run/route.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

/**
 * Admin-only (TODO: add auth check). For now returns a safe "plan" string.
 */
export async function POST(req) {
  const { prompt, errors } = await req.json().catch(() => ({ prompt: '', errors: [] }));
  const plan = await aiChat({ messages: [
    { role: 'system', content: 'You propose small, safe UI tweaks only.' },
    { role: 'user', content: `Prompt:${prompt}\nErrors:${JSON.stringify(errors ?? []).slice(0, 2000)}` }
  ]});
  return NextResponse.json({ ok: true, plan });
}

\end{lstlisting}

\section*{\texttt{app/auth/forgot/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
// app/auth/forgot/page.js
'use client';
import { useState } from 'react';
import { supaBrowser } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function ForgotPage(){
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendReset(e){
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const supa = supaBrowser();
      const redirectTo = (process.env.NEXT_PUBLIC_SITE_URL || '') + '/auth/reset';
      const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMsg('Reset link sent. Check your email.');
    } catch (err) {
      setMsg(err.message || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'80vh',display:'grid',placeItems:'center'}}>
      <form onSubmit={sendReset} className="card p-6" style={{minWidth:320}}>
        <h1 style={{fontSize:22, fontWeight:600, marginBottom:12}}>Reset password</h1>
        <input type="email" className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
        <button disabled={loading} className="btn" style={{marginTop:12}}>{loading ? '...' : 'Send reset link'}</button>
        {msg && <p style={{marginTop:10,fontSize:13}}>{msg}</p>}
      </form>
    </div>
  );
}

\end{lstlisting}

\section*{\texttt{app/auth/reset/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
// app/auth/reset/page.js
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supaBrowser } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function ResetPage(){
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = params.get('code');
    const supa = supaBrowser();
    if (code) {
      supa.auth.exchangeCodeForSession(code).catch(() => {});
    }
  }, [params]);

  async function update(e){
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const supa = supaBrowser();
      const { error } = await supa.auth.updateUser({ password });
      if (error) throw error;
      setMsg('Password updated. Redirecting...');
      setTimeout(()=>router.push('/login'), 1200);
    } catch (err) {
      setMsg(err.message || 'Could not update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'80vh',display:'grid',placeItems:'center'}}>
      <form onSubmit={update} className="card p-6" style={{minWidth:320}}>
        <h1 style={{fontSize:22, fontWeight:600, marginBottom:12}}>Choose a new password</h1>
        <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" minLength={8} required />
        <button disabled={loading} className="btn" style={{marginTop:12}}>{loading ? '...' : 'Update password'}</button>
        {msg && <p style={{marginTop:10,fontSize:13}}>{msg}</p>}
      </form>
    </div>
  );
}

\end{lstlisting}

\section*{\texttt{app/connectors/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
export default function Connectors(){ return (<div className='card'>Connectors (stub)</div>);}
\end{lstlisting}

\section*{\texttt{app/home/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Header from '../../components/Header'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: widgets } = await supabase
    .from('widgets')
    .select('*')
    .eq('owner', session.user.id)
    .order('position', { ascending: true })

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Header />
      <section className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl">Your widgets</h2>
        <a href="/home/add" className="bg-brandB px-4 py-2 rounded-lg text-sm">Add widget</a>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {(widgets ?? []).map((w) => (
          <div key={w.id} className="glass p-4">
            <h3 className="font-semibold">{w.title}</h3>
            {w.body && <p className="text-sm text-slate-300 mt-1">{w.body}</p>}
            {w.url && <a href={w.url} className="text-brandA text-sm underline mt-2 inline-block">Open link</a>}
          </div>
        ))}
      </div>
      {(widgets ?? []).length === 0 && (
        <p className="text-slate-400 mt-4">Add your first widget to see it here.</p>
      )}
    </main>
  )
}

\end{lstlisting}

\section*{\texttt{app/home/page.tsx}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import WidgetGrid from '@/components/WidgetGrid';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: widgets } = await supabase
    .from('widgets')
    .select('*')
    .eq('owner', session.user.id)
    .order('position', { ascending: true });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Header />
      <WidgetGrid initial={widgets ?? []} />
    </main>
  );
}

\end{lstlisting}

\section*{\texttt{app/home/add/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AddWidget() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('widgets').insert({
      title: data.title,
      body: data.body || null,
      url: data.url || null,
      type: 'text',
      owner: session.user.id,
      position: 0,
    })
    router.push('/home')
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <h1 className="font-display text-2xl">Add widget</h1>
        <input {...register('title', { required: true })} placeholder="Title" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <textarea {...register('body')} placeholder="Body (optional)" className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />
        <input {...register('url')} placeholder="URL (optional)" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <button className="bg-brandA text-white px-4 py-2 rounded-lg">Save</button>
      </form>
    </main>
  )
}

\end{lstlisting}

\section*{\texttt{app/home/add/page.tsx}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const schema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  url: z.string().url().optional(),
  type: z.enum(['text', 'link', 'promo']).default('text'),
});
type Values = z.infer<typeof schema>;

export default function AddWidget() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Values) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login');
    await supabase.from('widgets').insert({ ...data, owner: session.user.id, position: 0 });
    router.push('/home');
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <h1 className="font-display text-2xl">Add widget</h1>

        <label className="block text-sm font-medium">Title</label>
        <input {...register('title')} className="w-full rounded-lg px-4 py-2 bg-white/10" />
        {errors.title && <p className="text-rose-400 text-sm">{errors.title.message}</p>}

        <label className="block text-sm font-medium">Body (optional)</label>
        <textarea {...register('body')} className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />

        <label className="block text-sm font-medium">URL (optional)</label>
        <input {...register('url')} type="url" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        {errors.url && <p className="text-rose-400 text-sm">{errors.url.message}</p>}

        <label className="block text-sm font-medium">Type</label>
        <select {...register('type')} className="w-full rounded-lg px-4 py-2 bg-white/10">
          <option value="text">Text</option>
          <option value="link">Link</option>
          <option value="promo">Promo</option>
        </select>

        <button className="bg-brandA text-white px-4 py-2 rounded-lg">Save</button>
      </form>
    </main>
  );
}

\end{lstlisting}

\section*{\texttt{app/login/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState('login')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { error } =
      view === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else router.push('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="glass w-full max-w-sm mx-auto p-8 space-y-4">
        <h1 className="font-display text-2xl">{view === 'login' ? 'Welcome back' : 'Create account'}</h1>
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <input
          className="w-full rounded-lg px-4 py-2 bg-white/10 placeholder-slate-300"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg px-4 py-2 bg-white/10 placeholder-slate-300"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full bg-brandA text-white rounded-lg py-2">{view === 'login' ? 'Login' : 'Sign up'}</button>
        <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-sm text-slate-300">
          {view === 'login' ? 'Need an account?' : 'Already have one?'}
        </button>
        <p className="text-xs text-slate-400">
          Or continue to <Link href="/" className="underline">landing</Link>
        </p>
      </form>
    </div>
  )
}

\end{lstlisting}

\section*{\texttt{app/login/page.tsx}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } =
      view === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else router.push('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="glass w-full max-w-sm mx-auto p-6 space-y-4">
        <h1 className="font-display text-2xl">{view === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <input
          className="w-full rounded-lg px-4 py-2 bg-white/10 placeholder-slate-300"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          autoComplete="email"
        />
        <input
          className="w-full rounded-lg px-4 py-2 bg-white/10 placeholder-slate-300"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={view === 'login' ? 'current-password' : 'new-password'}
        />
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <button className="w-full bg-brandA text-white rounded-lg py-2">
          {view === 'login' ? 'Login' : 'Sign up'}
        </button>
        <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-sm text-slate-300">
          {view === 'login' ? 'Need an account?' : 'Already have one?'}
        </button>
      </form>
    </div>
  );
}

\end{lstlisting}

\section*{\texttt{app/music/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AudioPlayer from '../../components/AudioPlayer'

export default function MusicPage() {
  const [tracks, setTracks] = useState([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTracks(data || []))
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Music</h1>
        <a href="/music/upload" className="bg-brandB px-4 py-2 rounded-lg text-sm">
          Upload track
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tracks.map((t) => (
          <div key={t.id} className="glass p-4">
            <img
              src={t.artwork_url || '/placeholder.png'}
              alt={t.title}
              className="w-full h-40 object-cover rounded-lg mb-3"
            />
            <h3 className="font-semibold">{t.title}</h3>
            <p className="text-sm text-slate-300">{t.artist}</p>
            {t.mp3_url && <AudioPlayer src={t.mp3_url} />}
          </div>
        ))}
      </div>
    </main>
  )
}

\end{lstlisting}

\section*{\texttt{app/music/upload/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UploadcareFileUploader } from '../../../components/UploadcareFileUploader'

export default function UploadTrack() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm()

  const onSubmit = async (d) => {
    await supabase.from('tracks').insert({
      title: d.title, artist: d.artist,
      artwork_url: d.artwork_url || null,
      mp3_url: d.mp3_url || null
    })
    router.push('/music')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl mb-6">Upload track</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <input {...register('title', { required: true })} placeholder="Title" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <input {...register('artist', { required: true })} placeholder="Artist" className="w-full rounded-lg px-4 py-2 bg-white/10" />

        <label className="text-sm">Artwork</label>
        <UploadcareFileUploader onUpload={(url) => setValue('artwork_url', url)} />

        <label className="text-sm">MP3 file</label>
        <UploadcareFileUploader onUpload={(url) => setValue('mp3_url', url)} />

        <button disabled={isSubmitting} className="bg-brandB text-white px-4 py-2 rounded-lg">
          {isSubmitting ? 'Uploading...' : 'Save'}
        </button>
      </form>
    </main>
  )
}

\end{lstlisting}

\section*{\texttt{app/profile/[handle]/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const supabase = createServerComponentClient({ cookies })
  const { data } = await supabase
    .from('profiles')
    .select('full_name, bio')
    .eq('username', params.handle)
    .single()
  return {
    title: `${data?.full_name ?? params.handle} — DREAMengin`,
    description: data?.bio ?? '',
  }
}

export default async function ProfilePage({ params }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.handle)
    .single()

  if (!profile) return <p className="p-8">Profile not found</p>

  const links = Array.isArray(profile.links_json) ? profile.links_json : []

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <section className="glass p-6 flex items-center gap-4 mb-6">
        <div className="rounded-full bg-brandA/20 flex items-center justify-center font-display text-brandA w-24 h-24">
          {(profile.username || 'me').slice(0,2).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl">{profile.full_name}</h1>
          <p className="text-slate-300">@{profile.username}</p>
          {profile.bio && <p className="mt-2">{profile.bio}</p>}
        </div>
      </section>

      {links.length > 0 && (
        <section className="glass p-4 space-y-3">
          {links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              {l.title}
            </a>
          ))}
        </section>
      )}
    </main>
  )
}

\end{lstlisting}

\section*{\texttt{app/settings/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Theme } from '../../lib/theme'

export default function Settings() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) {
        reset({
          full_name: data.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          links_json: JSON.stringify(data.links_json || [], null, 2),
          accent_color: data.accent_color || '#0ea5e9',
        })
      }
    }
    load()
  }, [])

  const onSubmit = async (d) => {
    const parsedLinks = (() => { try { return JSON.parse(d.links_json || '[]') } catch { return [] } })()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('profiles').update({
      full_name: d.full_name,
      username: d.username,
      bio: d.bio,
      links_json: parsedLinks,
      accent_color: d.accent_color,
    }).eq('id', session.user.id)
    router.push(`/profile/${d.username}`)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl mb-6">Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <input {...register('full_name')} placeholder="Full name" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <input {...register('username')} placeholder="Username" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <textarea {...register('bio')} placeholder="Bio" className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />
        <textarea
          {...register('links_json')}
          placeholder='[{"title":"GitHub","url":"https://github.com/you"}]'
          className="w-full rounded-lg px-4 py-2 bg-white/10 font-mono text-sm"
          rows={4}
        />
        <div className="flex items-center gap-4">
          <label className="text-sm">Accent color</label>
          <input type="color" {...register('accent_color')} className="w-16 h-8 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-brandA text-white px-4 py-2 rounded-lg">Save</button>
          <button type="button" onClick={Theme.toggle} className="text-sm text-slate-300">Toggle dark/light</button>
        </div>
      </form>
    </main>
  )
}

\end{lstlisting}

\section*{\texttt{app/shop/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function Shop() {
  const supabase = createServerComponentClient({ cookies })
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Shop</h1>
        <a href="/shop/me" className="bg-brandB px-4 py-2 rounded-lg text-sm">
          Creator dashboard
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(data ?? []).map((p) => (
          <div key={p.id} className="glass p-4">
            <h3 className="font-semibold">{p.title}</h3>
            {p.description && <p className="text-sm text-slate-300 mt-1">{p.description}</p>}
            <p className="mt-3 text-lg">${(p.price_int / 100).toFixed(2)}</p>
            <form action={`/shop/buy/${p.id}`} method="post">
              <button className="inline-block mt-3 bg-brandA text-white px-4 py-2 rounded-lg text-sm">
                Buy
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  )
}

\end{lstlisting}

\section*{\texttt{app/shop/buy/[id]/route.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req, { params }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!product) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500 })
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

  const origin = req.headers.get('origin') || 'http://localhost:3000'
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: product.title },
        unit_amount: product.price_int,
      },
      quantity: 1,
    }],
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop`,
  })

  return new Response(JSON.stringify({ url: session.url }), { headers: { 'content-type': 'application/json' } })
}

\end{lstlisting}

\section*{\texttt{app/shop/me/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

export default function ShopMe() {
  const [products, setProducts] = useState([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []))
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">My products</h1>
        <Link href="/shop/me/new" className="bg-brandB px-4 py-2 rounded-lg text-sm">
          New product
        </Link>
      </div>

      <div className="grid gap-4">
        {products.map((p) => (
          <div key={p.id} className="glass p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-slate-300">${(p.price_int / 100).toFixed(2)} · {p.published ? 'Published' : 'Draft'}</p>
            </div>
            <Link href={`/shop/me/edit/${p.id}`} className="text-sm text-brandA">
              Edit
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}

\end{lstlisting}

\section*{\texttt{app/shop/me/new/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UploadcareFileUploader } from '../../../../components/UploadcareFileUploader'

export default function NewProduct() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm()

  const onSubmit = async (d) => {
    await supabase.from('products').insert({
      title: d.title,
      description: d.description || null,
      price_int: Math.round(Number(d.price || 0) * 100),
      file_path: d.file_path || null,
      published: false,
    })
    router.push('/shop/me')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl mb-6">New product</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <input {...register('title', { required: true })} placeholder="Title" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <textarea {...register('description')} placeholder="Description" className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />
        <input {...register('price')} placeholder="Price (USD)" type="number" step="0.01" className="w-full rounded-lg px-4 py-2 bg-white/10" />

        <label className="text-sm">Digital file</label>
        <UploadcareFileUploader onUpload={(url) => setValue('file_path', url)} />

        <button disabled={isSubmitting} className="bg-brandB text-white px-4 py-2 rounded-lg">
          {isSubmitting ? 'Creating...' : 'Create draft'}
        </button>
      </form>
    </main>
  )
}

\end{lstlisting}

\section*{\texttt{app/signup/page.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
// app/signup/page.js
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supaBrowser } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function SignupPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e){
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const supa = supaBrowser();
      const redirectTo = (process.env.NEXT_PUBLIC_SITE_URL || '') + '/auth/callback';
      const { error } = await supa.auth.signUp({
        email, password,
        options: { emailRedirectTo: redirectTo }
      });
      if (error) throw error;
      setMessage('Check your email to confirm your account.');
    } catch (err) {
      setMessage(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'80vh',display:'grid',placeItems:'center'}}>
      <form onSubmit={onSubmit} className="card p-6" style={{minWidth:320}}>
        <h1 style={{fontSize:22, fontWeight:600, marginBottom:12}}>Create account</h1>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required className="input" placeholder="you@example.com" />
        <label style={{marginTop:8}}>Password</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
        <button disabled={loading} className="btn" style={{marginTop:12}}>{loading ? '...' : 'Create account'}</button>
        <div style={{marginTop:10,fontSize:14}}>
          <Link href="/login">Back to sign in</Link>
        </div>
        {message && <p style={{marginTop:10,fontSize:13}}>{message}</p>}
      </form>
    </div>
  );
}

\end{lstlisting}

\section*{\texttt{components/AudioPlayer.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { useRef, useState } from 'react'

export default function AudioPlayer({ src }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    if (!ref.current) return
    if (playing) ref.current.pause()
    else ref.current.play()
    setPlaying((p) => !p)
  }

  if (!src) return null

  return (
    <div className="flex items-center gap-3 mt-3">
      <button onClick={toggle} className="bg-white/10 px-3 py-1 rounded text-sm">
        {playing ? 'Pause' : 'Play'}
      </button>
      <audio ref={ref} src={src} onEnded={() => setPlaying(false)} />
    </div>
  )
}

\end{lstlisting}

\section*{\texttt{components/Header.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Theme } from '../lib/theme'

export default function Header() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <Link href="/home" className="font-display text-2xl text-white">DREAMengin</Link>
      <nav className="flex items-center gap-4 text-sm text-slate-300">
        <Link href="/profile/me">Profile</Link>
        <Link href="/music">Music</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/connectors">Connectors</Link>
        <Link href="/settings">Settings</Link>
        <button onClick={Theme.toggle}>Theme</button>
        <button onClick={logout}>Logout</button>
      </nav>
    </header>
  )
}

\end{lstlisting}

\section*{\texttt{components/Header.tsx}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Theme } from '@/lib/theme';

export default function Header() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="flex items-center justify-between mb-8">
      <h1 className="font-display text-2xl text-white">DREAMengin</h1>
      <div className="flex items-center gap-4">
        <button onClick={Theme.toggle} className="text-sm text-slate-300">Toggle theme</button>
        <button onClick={logout} className="text-sm text-slate-300">Logout</button>
      </div>
    </header>
  );
}

\end{lstlisting}

\section*{\texttt{components/Providers.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { Theme } from '../lib/theme'

export default function Providers({ children }) {
  const [supabase] = useState(() => createClientComponentClient())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    Theme.applyStored()
  }, [])

  if (!mounted) return null

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  )
}

\end{lstlisting}

\section*{\texttt{components/Providers.tsx}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';
import { Theme } from '@/lib/theme';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    Theme.applyStored();
  }, []);

  if (!mounted) return null;

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}

\end{lstlisting}

\section*{\texttt{components/UploadcareFileUploader.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client'
import { useRef } from 'react'

export function UploadcareFileUploader({ onUpload }) {
  const ref = useRef(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const form = new FormData()
          form.append('file', file)
          form.append('UPLOADCARE_PUB_KEY', 'demopublickey') // replace with your key
          const res = await fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: form })
          const uuid = await res.text()
          onUpload?.(`https://ucarecdn.com/${uuid}/${file.name}`)
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="bg-white/10 px-3 py-2 rounded-lg text-sm"
      >
        Choose file
      </button>
    </>
  )
}

\end{lstlisting}

\section*{\texttt{components/WidgetGrid.tsx}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client';
import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function WidgetGrid({ initial }: { initial: any[] }) {
  const [widgets, setWidgets] = useState(initial ?? []);
  const supabase = createClientComponentClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = widgets.findIndex((w:any) => w.id === active.id);
    const newIndex = widgets.findIndex((w:any) => w.id === over.id);
    const newOrder = arrayMove(widgets, oldIndex, newIndex);
    setWidgets(newOrder);
    try {
      await supabase.from('widgets').upsert(
        newOrder.map((w:any, idx:number) => ({ ...w, position: idx })),
        { onConflict: 'id' }
      );
    } catch {}
  }

  async function deleteWidget(id: string) {
    await supabase.from('widgets').delete().eq('id', id);
    setWidgets((w:any[]) => w.filter((x:any) => x.id !== id));
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl">Your widgets</h2>
        <Link href="/home/add" className="bg-brandB px-4 py-2 rounded-lg text-sm">Add widget</Link>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w:any) => w.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4 md:grid-cols-2">
            {widgets.map((w:any) => (
              <SortableWidget key={w.id} widget={w} onDelete={deleteWidget} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {widgets.length === 0 && (
        <p className="text-slate-300">Add your first widget to see it here.</p>
      )}
    </>
  );
}

function SortableWidget({ widget, onDelete }: { widget: any; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: widget.id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="glass p-4 cursor-move">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{widget.title}</h3>
          {widget.body && <p className="text-sm text-slate-300 mt-1">{widget.body}</p>}
          {widget.url && <a className="text-sm underline text-brandA" href={widget.url} target="_blank">Open link</a>}
        </div>
        <button onClick={() => onDelete(widget.id)} className="text-rose-400 text-sm">Delete</button>
      </div>
    </div>
  );
}

\end{lstlisting}

\section*{\texttt{db/phase2.sql}}
\noindent\begin{lstlisting}[style=code,language=SQL]
-- Phase-2 schema (run once in Supabase SQL Editor)
alter table profiles add column if not exists links_json jsonb default '[]';
alter table profiles add column if not exists bio text default '';

create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users on delete cascade,
  title text not null,
  artist text,
  artwork_url text,
  mp3_url text,
  spotify_uri text,
  created_at timestamptz default now()
);
alter table tracks enable row level security;
drop policy if exists "own tracks" on tracks;
create policy "own tracks" on tracks for all using (auth.uid() = owner);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users on delete cascade,
  title text not null,
  description text,
  price_int int not null,
  file_path text,
  published bool default false,
  created_at timestamptz default now()
);
alter table products enable row level security;
drop policy if exists "own products" on products;
create policy "own products" on products for all using (auth.uid() = owner);
drop policy if exists "public visible" on products;
create policy "public visible" on products for select using (published = true);

\end{lstlisting}

\section*{\texttt{lib/theme.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
export const Theme = {
  applyStored() {
    try {
      const mode = localStorage.getItem('theme') || 'dark'
      document.documentElement.classList.toggle('dark', mode === 'dark')
    } catch {}
  },
  toggle() {
    try {
      const isDark = document.documentElement.classList.toggle('dark')
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    } catch {}
  }
}

\end{lstlisting}

\section*{\texttt{lib/theme.ts}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
export const Theme = {
  applyStored() {
    if (typeof window === 'undefined') return;
    const pref = localStorage.getItem('theme-mode');
    const initial = pref ?? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', initial === 'dark');
  },
  toggle() {
    if (typeof window === 'undefined') return;
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
  }
};

\end{lstlisting}

\section*{\texttt{lib/ai/router.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
// Minimal AI router so builds never fail
// Usage: aiChat({ messages: [{ role: 'user', content: 'hello'}] })
export async function aiChat(input) {
  if (typeof input === 'string') return `Dr. Eam says: ${input}`;
  const messages = input?.messages ?? [];
  const last = messages.length ? messages[messages.length - 1].content : '';
  return `Dr. Eam says: ${last}`;
}

export async function aiComplete(prompt) {
  return `Result: ${String(prompt ?? '').slice(0, 400)}`;
}

\end{lstlisting}

\section*{\texttt{lib/modules/registry.gen.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
// lib/modules/registry.gen.js
// Re-export from the generated file. Path is from /lib/modules to /modules.
export { widgetRegistry, connectorRegistry, widgetModules, connectorModules } from '../../modules/registry.generated.js';

\end{lstlisting}

\section*{\texttt{lib/supabase/client.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
// lib/supabase/client.js
// Browser-side Supabase client (Next.js App Router)
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

// Optional named alias used by older imports in this repo:
export const supaClient = createClient

\end{lstlisting}

\section*{\texttt{lib/supabase/server.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
// lib/supabase/server.js
// Server-side Supabase client (Next.js App Router)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createServerClientFixed = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value
        },
        set(name, value, options) {
          cookies().set({ name, value, ...options })
        },
        remove(name, options) {
          cookies().set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )

// Optional named alias used by older imports in this repo:
export const supaServer = createServerClientFixed

\end{lstlisting}

\section*{\texttt{modules/registry.generated.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
// AUTO-GENERATED by scripts/prepare.mjs (safe fallback)
export const widgetRegistry = {};
export const connectorRegistry = {};
export const widgetModules = [];
export const connectorModules = [];

\end{lstlisting}

\section*{\texttt{modules/widgets/messages/index.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client';
export default function MessagesWidget(){
  return (
    <div>
      <div className="text-sm opacity-70">Messages</div>
      <div className="font-medium">Inbox coming soon</div>
    </div>
  );
}

\end{lstlisting}

\section*{\texttt{modules/widgets/promo/index.js}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
'use client';
export default function PromoWidget(){
  return (
    <div>
      <div className="text-sm opacity-70">Promo</div>
      <div className="font-medium">Add your promo in Settings → Widgets</div>
    </div>
  );
}

\end{lstlisting}

\section*{\texttt{scripts/prepare.mjs}}
\noindent\begin{lstlisting}[style=code,language=JavaScript]
  // scripts/prepare.mjs
  // Generates modules/registry.generated.js (PLAIN JS, no TS syntax).
  import { readdir, stat, mkdir, writeFile } from 'node:fs/promises';
  import path from 'node:path';
  import { fileURLToPath } from 'node:url';

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const ROOT = path.join(__dirname, '..');
  const MOD_DIR = path.join(ROOT, 'modules');
  const WIDGET_DIR = path.join(MOD_DIR, 'widgets');
  const CONNECT_DIR = path.join(MOD_DIR, 'connectors');
  const OUT = path.join(MOD_DIR, 'registry.generated.js');

  async function ensureDir(p){ try{ await mkdir(p, { recursive: true }); } catch{} }
  async function exists(p){ try{ await stat(p); return true; } catch{ return false; } }

  async function list(dir){
    const items = [];
    try{
      const entries = await readdir(dir, { withFileTypes: true });
      for (const e of entries){
        if (e.isDirectory()){
          const slug = e.name;
          const base = path.join(dir, slug);
          const hasIndex = (
            await exists(path.join(base, 'index.js')) ||
            await exists(path.join(base, 'index.ts')) ||
            await exists(path.join(base, 'index.tsx'))
          );
          if (hasIndex){
            const rel = path.posix.join(path.relative(MOD_DIR, base).replace(/\\/g,'/'));
            items.push({ slug, rel });
          }
          continue;
        }
        if (e.isFile() && /(index|[\w-]+)\.(t|j)sx?$/.test(e.name)){
          const slug = e.name.replace(/\.(t|j)sx?$/, '');
          if (slug === 'index') continue;
          const rel = path.posix.join(path.relative(MOD_DIR, path.join(dir, slug)).replace(/\\/g,'/'));
          items.push({ slug, rel });
        }
      }
    } catch {}
    // de-dupe & sort
    const seen = new Set();
    return items
      .filter(i => !seen.has(i.slug) && seen.add(i.slug))
      .sort((a,b)=>a.slug.localeCompare(b.slug));
  }

  await ensureDir(MOD_DIR);
  await ensureDir(WIDGET_DIR);
  await ensureDir(CONNECT_DIR);

  const widgets = await list(WIDGET_DIR);
  const connectors = await list(CONNECT_DIR);

  const file = `// AUTO-GENERATED. Do not edit by hand. Plain JavaScript.
export const widgetRegistry = {
${widgets.map(i => `  "${i.slug}": () => import("./${i.rel}")`).join(',\n')}
};

export const connectorRegistry = {
${connectors.map(i => `  "${i.slug}": () => import("./${i.rel}")`).join(',\n')}
};

// Convenience arrays for discovery
export const widgetModules = Object.entries(widgetRegistry).map(([slug, loader]) => ({ slug, name: slug, loader }));
export const connectorModules = Object.entries(connectorRegistry).map(([slug, loader]) => ({ slug, name: slug, loader }));
`;

  await writeFile(OUT, file, 'utf8');
  console.log('Generated', path.relative(ROOT, OUT), 'with', widgets.length, 'widgets and', connectors.length, 'connectors');

\end{lstlisting}

\end{document}
