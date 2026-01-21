
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supaServer } from '@/lib/supabase/server';
import { aiChat } from '@/lib/ai/router';

export async function POST() {
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  const adminCookie = cookies().get('admin')?.value === '1';
  const role = (await s.auth.getUser()).data.user?.user_metadata?.role;
  if (!adminCookie && (!user || role !== 'admin')) {
    return NextResponse.json({ error:'forbidden' }, { status:403 });
  }

  const { data: errs } = await s.from('error_reports')
    .select('*').order('created_at', { ascending:false }).limit(20);

  const prompt = `You are Innerdreams CI. Analyze errors and propose minimal Next.js+TS patches or TODOs. Return a short summary.`;
  const { a: summary } = await (async () => {
    try {
      const { text } = await (await import('@/lib/ai/router')).aiChat({
        messages:[
          { role:'system', content:'You generate safe patch suggestions.' },
          { role:'user', content: prompt + "\nErrors:\n" + JSON.stringify(errs ?? []).slice(0, 8000) }
        ],
        maxTokens: 600
      } as any);
      return { a: text };
    } catch {
      return { a: 'Summary unavailable (AI keys not set).' };
    }
  })();

  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  let issueUrl: string | null = null;
  if (repo && token) {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${token}`, 'Accept':'application/vnd.github+json' },
      body: JSON.stringify({ title: 'Innerdreams: automated fix proposal', body: summary.slice(0, 5000) })
    });
    const j = await res.json();
    issueUrl = j?.html_url ?? null;
  }

  await s.from('admin_audit_log').insert({
    admin_id: user?.id ?? null, action: 'innerdreams_run', details: { issue: issueUrl, summary: summary.slice(0,1000) }
  });

  return NextResponse.json({ ok:true, issue: issueUrl, summary });
}
