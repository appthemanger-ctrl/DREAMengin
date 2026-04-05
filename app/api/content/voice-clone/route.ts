import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { estimateDurationSeconds } from '@/lib/content/voiceClone';

const CloneSchema = z.object({
  action: z.literal('clone'),
  sampleBase64: z.string().min(10).max(10_000_000),
  voiceName: z.string().min(1).max(100),
});

const TTSSchema = z.object({
  action: z.literal('tts'),
  text: z.string().min(1).max(5_000),
  voiceId: z.string().min(1).max(200),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
});

const ListSchema = z.object({
  action: z.literal('list'),
});

const DeleteSchema = z.object({
  action: z.literal('delete'),
  voiceId: z.string().min(1).max(200),
});

const VoiceCloneSchema = z.discriminatedUnion('action', [
  CloneSchema,
  TTSSchema,
  ListSchema,
  DeleteSchema,
]);

type VoiceCloneBody = z.infer<typeof VoiceCloneSchema>;

type SupabaseDb = {
  from: (table: string) => {
    insert: (row: object) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } };
    select: (cols?: string) => {
      eq: (col: string, val: string) => {
        order: (col: string, opts?: object) => Promise<{ data: unknown[]; error: unknown }>;
      };
    };
    delete: () => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => Promise<{ error: unknown }>;
      };
    };
  };
};

/**
 * POST /api/content/voice-clone
 *
 * Supports four actions:
 *  - "clone"  – upload a voice sample to create a voice profile (stored in Supabase).
 *  - "tts"    – generate speech from text using a cloned voice profile.
 *  - "list"   – list all voice profiles for the current user.
 *  - "delete" – delete a voice profile by ID.
 *
 * In production, wire ELEVENLABS_API_KEY to call the ElevenLabs API.
 * Currently returns graceful stubs so the UI flow works without credentials.
 */
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

  const parsed = VoiceCloneSchema.safeParse(body as VoiceCloneBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const db = supabase as unknown as SupabaseDb;

  // ── clone ────────────────────────────────────────────────────────────────
  if (parsed.data.action === 'clone') {
    const { voiceName } = parsed.data;

    if (elevenLabsKey) {
      return NextResponse.json(
        { error: 'ElevenLabs integration not yet wired. Set ELEVENLABS_API_KEY.' },
        { status: 501 }
      );
    }

    const profileId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await db
      .from('voice_profiles')
      .insert({ id: profileId, user_id: user.id, name: voiceName, created_at: now })
      .select()
      .single()
      .catch(() => null); // table may not exist yet — soft fail

    return NextResponse.json({
      profile: { id: profileId, name: voiceName, createdAt: now },
      message: `Voice profile "${voiceName}" created (mock). Configure ELEVENLABS_API_KEY for real cloning.`,
    });
  }

  // ── list ────────────────────────────────────────────────────────────────
  if (parsed.data.action === 'list') {
    const result = await db
      .from('voice_profiles')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .catch(() => ({ data: [], error: null })) as { data: unknown[]; error: unknown };

    const profiles = (Array.isArray(result.data) ? result.data : []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id ?? ''),
        name: String(r.name ?? ''),
        createdAt: String(r.created_at ?? ''),
      };
    });

    return NextResponse.json({ profiles });
  }

  // ── delete ───────────────────────────────────────────────────────────────
  if (parsed.data.action === 'delete') {
    const { voiceId } = parsed.data;

    await db
      .from('voice_profiles')
      .delete()
      .eq('id', voiceId)
      .eq('user_id', user.id)
      .catch(() => null); // soft fail if table doesn't exist

    return NextResponse.json({
      message: `Voice profile "${voiceId}" deleted.`,
    });
  }

  // ── tts ─────────────────────────────────────────────────────────────────
  const { text, voiceId } = parsed.data;

  if (elevenLabsKey) {
    return NextResponse.json(
      { error: 'ElevenLabs TTS integration not yet wired. Set ELEVENLABS_API_KEY.' },
      { status: 501 }
    );
  }

  const durationSeconds = estimateDurationSeconds(text);

  return NextResponse.json({
    audioBase64: '',
    durationSeconds: +durationSeconds.toFixed(2),
    voiceId,
    message: `TTS generated for voice "${voiceId}" (mock, ~${durationSeconds.toFixed(1)}s). Configure ELEVENLABS_API_KEY for real audio.`,
  });
}

