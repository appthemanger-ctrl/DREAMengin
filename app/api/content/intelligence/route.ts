import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';


const IntelligenceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('viral-hooks'),
    topic: z.string().min(3).max(200),
  }),
  z.object({
    type: z.literal('seo-score'),
    title: z.string().min(3).max(200),
  }),
]);

function buildViralHooks(topic: string): string[] {
  const clean = topic.trim();
  return [
    `Nobody talks about this, but ${clean} changes everything.`,
    `I wish I knew this about ${clean} years ago.`,
    `The ${clean} move almost nobody is using right now:`,
    `POV: you finally figured out how to make ${clean} work.`,
    `The truth about ${clean} nobody wants to admit:`,
  ];
}

function scoreSeoTitle(title: string) {
  let score = 40;
  const reasons: string[] = [];
  if (title.length >= 30 && title.length <= 70) {
    score += 20;
    reasons.push('Good title length for click-through.');
  }
  if (/\d/.test(title)) {
    score += 10;
    reasons.push('Numbers improve scanability.');
  }
  if (/(how|why|what|guide|best|tips|ultimate|secret)/i.test(title)) {
    score += 15;
    reasons.push('Strong search-intent keywords detected.');
  }
  if (/[\(\)\:\-]/.test(title)) {
    score += 5;
    reasons.push('Formatting improves readability.');
  }
  if (/(you|your)/i.test(title)) {
    score += 10;
    reasons.push('Direct reader framing increases relevance.');
  }
  return {
    score: Math.min(100, score),
    reasons: reasons.length > 0 ? reasons : ['Title is valid but could be more search-specific.'],
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  const parsed = IntelligenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 });
  }

  const db = supabase as any;
  const now = new Date().toISOString();

  if (parsed.data.type === 'viral-hooks') {
    const hooks = buildViralHooks(parsed.data.topic);
    const { data: draft, error } = await db
      .from('content_drafts')
      .insert({
        user_id: user.id,
        title: `Viral Hooks — ${parsed.data.topic}`,
        content: hooks.join('\n'),
        content_type: 'caption',
        scheduled_at: null,
        created_at: now,
        updated_at: now,
      })
      .select('id, title')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ hooks, draft });
  }

  const result = scoreSeoTitle(parsed.data.title);
  const { data: draft, error } = await db
    .from('content_drafts')
    .insert({
      user_id: user.id,
      title: `SEO Score — ${parsed.data.title}`,
      content: JSON.stringify(result),
      content_type: 'caption',
      scheduled_at: null,
      created_at: now,
      updated_at: now,
    })
    .select('id, title')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...result, draft });
}
