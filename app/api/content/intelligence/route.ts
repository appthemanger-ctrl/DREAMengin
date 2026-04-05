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
  z.object({
    type: z.literal('repurpose'),
    content: z.string().min(10).max(5000),
  }),
  z.object({
    type: z.literal('predict-schedule'),
  }),
  z.object({
    type: z.literal('brand-voice'),
    /** The draft content to check */
    content: z.string().min(10).max(5000),
    /** Comma-separated brand keywords / tone descriptors e.g. "bold, playful, Gen-Z" */
    voiceProfile: z.string().min(2).max(300),
  }),
  z.object({
    type: z.literal('seo-outline'),
    keyword: z.string().min(2).max(200),
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

interface RepurposeOutput {
  platform: string;
  format: string;
  text: string;
}

function buildRepurposeOutputs(content: string): RepurposeOutput[] {
  const snippet = content.slice(0, 120).trim();
  const hook = snippet.length > 60 ? snippet.slice(0, 60) + '…' : snippet;
  return [
    { platform: 'Twitter / X',       format: 'Tweet Thread',       text: `🧵 Thread: ${hook}\n\n1/ ${snippet}\n\n2/ Key takeaway: [insight]\n\n3/ Why it matters: [impact]\n\n4/ How to start: [first step]\n\nFollow for more 🔁` },
    { platform: 'Instagram',          format: 'Caption',            text: `✨ ${hook}\n\nDouble tap if you agree 🔥\n\n#DREAMengin #ContentCreator #CreateDaily` },
    { platform: 'LinkedIn',           format: 'Professional Post',  text: `📌 ${hook}\n\nHere's what most people miss:\n\n→ [Key point 1]\n→ [Key point 2]\n→ [Key point 3]\n\nWhat's your take? Drop a comment below.` },
    { platform: 'TikTok',             format: 'Script Hook',        text: `POV: ${hook} [Hold for 3s] Let me explain… [cut to explanation] Save this for later!` },
    { platform: 'Instagram Reels',    format: 'Reel Hook',          text: `🎬 Hook: "${hook}" — [B-roll transition] — [Insight] — [CTA: follow for more]` },
    { platform: 'YouTube Shorts',     format: 'Short Script',       text: `[0s] Hook: ${hook}\n[5s] Here's why this matters\n[20s] [Main point + visual]\n[45s] CTA: Subscribe for more` },
    { platform: 'Newsletter',         format: 'Email Snippet',      text: `Subject: ${hook}\n\nHey [First Name],\n\n${snippet}\n\n→ [Key insight]\n→ [Action step]\n\nSee you next week 🚀` },
    { platform: 'Blog',               format: 'Summary + CTA',      text: `## ${hook}\n\n${content.slice(0, 200)}\n\n**Ready to go deeper?** [Read the full post →]` },
    { platform: 'Pinterest',          format: 'Pin Description',    text: `📌 ${hook} | Save this pin for your content strategy! #ContentTips #CreatorLife #DREAMengin` },
    { platform: 'Podcast / Audio',    format: 'Intro Script',       text: `"Welcome back. Today we're talking about: ${hook}. If you've ever wondered [problem], this one's for you. Let's dive in."` },
  ];
}

interface PredictSuggestion {
  type: string;
  title: string;
  reason: string;
  platform: string;
  bestTime: string;
}

function buildPredictSchedule(): { suggestions: PredictSuggestion[]; gaps: string[] } {
  const suggestions: PredictSuggestion[] = [
    { type: '📱 Reel',      title: 'Behind-the-scenes process video',   reason: 'Reels get 3× your average reach',         platform: 'Instagram', bestTime: 'Wed 6 PM' },
    { type: '🧵 Thread',    title: '5 lessons from your last campaign',  reason: 'Educational threads peak Tue–Thu',         platform: 'Twitter/X', bestTime: 'Tue 9 AM' },
    { type: '📝 Carousel',  title: 'Step-by-step breakdown carousel',    reason: 'Carousels drive highest saves (+2.3×)',     platform: 'Instagram', bestTime: 'Thu 7 PM' },
    { type: '🎬 Short',     title: 'Quick tip under 30 seconds',         reason: 'Shorts indexed well in your niche now',    platform: 'YouTube',   bestTime: 'Fri 4 PM' },
    { type: '📋 Newsletter', title: 'This week\'s curated insights',     reason: 'Your open rate peaks on Thu mornings',     platform: 'Email',     bestTime: 'Thu 8 AM' },
  ];
  const gaps = [
    'No Reels posted in 6 days — algorithm prefers 3+/week',
    'LinkedIn hasn\'t been updated in 11 days',
    'YouTube Short gap: 2 weeks — consider repurposing existing content',
  ];
  return { suggestions, gaps };
}

interface BrandVoiceFlag {
  word: string;
  issue: string;
  suggestion: string;
}

function checkBrandVoice(content: string, voiceProfile: string): {
  score: number;
  onBrand: string[];
  flags: BrandVoiceFlag[];
  rewrite: string;
} {
  const tones = voiceProfile.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const words = content.toLowerCase().split(/\s+/);
  const onBrand: string[] = [];
  const flags: BrandVoiceFlag[] = [];

  // Detect tone-aligned signals
  if (tones.some(t => ['bold', 'direct', 'confident'].includes(t))) {
    if (/\b(you|your|stop|now|start|get|do)\b/.test(content)) onBrand.push('Direct address detected ✓');
  }
  if (tones.some(t => ['playful', 'fun', 'casual'].includes(t))) {
    if (/[!🔥✨💡😎🎯]/.test(content)) onBrand.push('Playful tone signals ✓');
    if (/\b(hey|love|cool|awesome)\b/i.test(content)) onBrand.push('Casual language ✓');
  }
  if (tones.some(t => ['professional', 'expert', 'authoritative'].includes(t))) {
    if (/\b(research|strategy|proven|results|data)\b/i.test(content)) onBrand.push('Authority language ✓');
  }
  if (tones.some(t => ['gen-z', 'genz', 'gen z', 'youth'].includes(t))) {
    if (/\b(pov|vibe|no cap|lowkey|fr|slay)\b/i.test(content)) onBrand.push('Gen-Z vernacular ✓');
  }
  if (onBrand.length === 0) onBrand.push('Neutral tone — see suggestions below');

  // Flag off-brand signals
  const corporate = ['synergy', 'leverage', 'utilize', 'paradigm', 'bandwidth', 'circle back', 'deep dive', 'touch base'];
  corporate.forEach(w => {
    if (words.includes(w)) {
      flags.push({ word: w, issue: 'Corporate jargon — conflicts with brand voice', suggestion: `Replace "${w}" with a more natural alternative` });
    }
  });
  if (tones.includes('short') || tones.includes('concise')) {
    const sentenceCount = content.split(/[.!?]/).filter(s => s.trim()).length;
    if (sentenceCount > 8) flags.push({ word: 'length', issue: `${sentenceCount} sentences — too long for concise brand`, suggestion: 'Trim to 4–5 punchy sentences' });
  }
  if (tones.some(t => ['no-emoji', 'minimal', 'clean'].includes(t))) {
    const emojiCount = (content.match(/[\u{1F300}-\u{1FAFF}]/gu) ?? []).length;
    if (emojiCount > 2) flags.push({ word: 'emojis', issue: `${emojiCount} emojis detected — brand uses minimal emoji style`, suggestion: 'Reduce to 0–1 emoji max' });
  }

  const flagPenalty = Math.min(flags.length * 12, 40);
  const bonusFromOnBrand = Math.min(onBrand.filter(o => o.includes('✓')).length * 15, 45);
  const score = Math.max(30, Math.min(100, 55 + bonusFromOnBrand - flagPenalty));

  // Light rewrite suggestion
  let rewrite = content.slice(0, 200);
  if (flags.length > 0) {
    corporate.forEach(w => { rewrite = rewrite.replace(new RegExp(`\\b${w}\\b`, 'gi'), '[rephrase]'); });
  }
  if (rewrite.length < content.length) rewrite += '…';

  return { score, onBrand, flags, rewrite };
}

function buildSeoOutline(keyword: string) {
  const clean = keyword.trim();
  const cap   = clean.charAt(0).toUpperCase() + clean.slice(1);
  return {
    title:      `The Complete Guide to ${cap} in 2026`,
    wordTarget: 1800,
    sections: [
      { heading: `What Is ${cap}?`,                     keywords: [clean, `${clean} definition`, `${clean} meaning`],                      note: 'Define in first 100 words — featured snippet eligibility.' },
      { heading: `Why ${cap} Matters for Creators`,     keywords: [`${clean} benefits`, `${clean} for creators`, `why ${clean}`],           note: 'Use stats. 150–200 words.' },
      { heading: `How to Get Started with ${cap}`,      keywords: [`${clean} how to`, `${clean} tutorial`, `${clean} beginners`],           note: 'Numbered steps. 300–400 words.' },
      { heading: `Best ${cap} Tools in 2026`,           keywords: [`best ${clean} tools`, `${clean} software`, `${clean} apps`],            note: 'Table or list. 5+ tools.' },
      { heading: `${cap} Mistakes to Avoid`,            keywords: [`${clean} mistakes`, `${clean} errors`, `${clean} tips`],                note: 'Bullet list. 200 words.' },
      { heading: `Your ${cap} Action Plan`,             keywords: [`${clean} strategy`, `${clean} plan`, `${clean} checklist`],             note: 'CTA + summary. Under 150 words.' },
    ],
    relatedTerms: [
      `${clean} strategy`, `${clean} tips 2026`, `${clean} for beginners`,
      `best ${clean}`, `${clean} guide`, `${clean} examples`,
      `how to ${clean}`, `${clean} tutorial`,
    ],
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

  if (parsed.data.type === 'repurpose') {
    const outputs = buildRepurposeOutputs(parsed.data.content);
    const { data: draft, error } = await db
      .from('content_drafts')
      .insert({
        user_id: user.id,
        title: `Repurposed — ${parsed.data.content.slice(0, 50)}`,
        content: outputs.map(o => `[${o.platform}] ${o.text}`).join('\n\n---\n\n'),
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
    return NextResponse.json({ outputs, draft });
  }

  if (parsed.data.type === 'predict-schedule') {
    return NextResponse.json(buildPredictSchedule());
  }

  if (parsed.data.type === 'brand-voice') {
    const result = checkBrandVoice(parsed.data.content, parsed.data.voiceProfile);
    return NextResponse.json(result);
  }

  if (parsed.data.type === 'seo-outline') {
    return NextResponse.json(buildSeoOutline(parsed.data.keyword));
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
