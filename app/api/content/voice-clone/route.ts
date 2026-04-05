import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

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

const VoiceCloneSchema = z.discriminatedUnion('action', [CloneSchema, TTSSchema]);

type VoiceCloneBody = z.infer<typeof VoiceCloneSchema>;

/**
 * POST /api/content/voice-clone
 *
 * Supports two actions:
 *  - "clone": upload a voice sample to create a voice profile (stored in Supabase).
 *  - "tts": generate speech from text using a cloned voice profile.
 *
 * In production, wire ELEVENLABS_API_KEY to call the ElevenLabs API.
 * Currently returns a graceful stub so the UI flow works without credentials.
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

  if (parsed.data.action === 'clone') {
    const { voiceName } = parsed.data;

    if (elevenLabsKey) {
      // Production: POST to https://api.elevenlabs.io/v1/voices/add
      return NextResponse.json(
        { error: 'ElevenLabs integration not yet wired. Set ELEVENLABS_API_KEY.' },
        { status: 501 }
      );
    }

    // Stub: persist a mock voice profile to Supabase for later TTS.
    const profileId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const db = supabase as unknown as {
      from: (table: string) => {
        insert: (row: object) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } }
      }
    };

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

  // action === 'tts'
  const { text, voiceId } = parsed.data;

  if (elevenLabsKey) {
    return NextResponse.json(
      { error: 'ElevenLabs TTS integration not yet wired. Set ELEVENLABS_API_KEY.' },
      { status: 501 }
    );
  }

  // Stub: return an empty audio response — caller shows "demo mode" message.
  const wordCount = text.trim().split(/\s+/).length;
  const estimatedDuration = wordCount / 2.5; // rough 150 wpm / 60

  return NextResponse.json({
    audioBase64: '',
    durationSeconds: estimatedDuration,
    voiceId,
    message: `TTS generated for voice "${voiceId}" (mock). Configure ELEVENLABS_API_KEY for real audio.`,
  });
}
