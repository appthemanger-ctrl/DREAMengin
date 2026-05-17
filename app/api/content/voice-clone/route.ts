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

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

/**
 * POST /api/content/voice-clone
 *
 * Supports four actions:
 *  - "clone"  – upload a voice sample to ElevenLabs and create a cloned voice.
 *  - "tts"    – generate speech from text using a cloned voice.
 *  - "list"   – list all cloned voice profiles for the current user.
 *  - "delete" – delete a cloned voice profile by ID.
 *
 * Requires ELEVENLABS_API_KEY. Falls back to graceful stubs when the key is absent.
 */
export async function POST(req: NextRequest {
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
    const { voiceName, sampleBase64 } = parsed.data;

    if (elevenLabsKey) {
      try {
        const sampleBuffer = Buffer.from(sampleBase64, 'base64');
        const form = new FormData();
        form.append('name', voiceName);
        form.append('description', `Cloned via DREAMengin for user ${user.id}`);
        form.append(
          'files',
          new Blob([sampleBuffer], { type: 'audio/mpeg' }),
          'sample.mp3',
        );

        const res = await fetch(`${ELEVEN_BASE}/voices/add`, {
          method: 'POST',
          headers: { 'xi-api-key': elevenLabsKey },
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json(
            { error: 'ElevenLabs clone failed', detail: (err as Record<string, unknown>).detail ?? res.statusText },
            { status: res.status },
          );
        }

        const result = await res.json() as { voice_id: string };
        const profileId = result.voice_id;
        const now = new Date().toISOString();

        await db
          .from('voice_profiles')
          .insert({ id: profileId, user_id: user.id, name: voiceName, created_at: now })
          .select()
          .single()
          .catch(() => null);

        return NextResponse.json({
          profile: { id: profileId, name: voiceName, createdAt: now },
        });
      } catch (err) {
        return NextResponse.json(
          { error: 'Voice clone request failed', detail: err instanceof Error ? err.message : String(err) },
          { status: 502 },
        );
      }
    }

    // Dev stub — no API key configured
    const profileId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    await db
      .from('voice_profiles')
      .insert({ id: profileId, user_id: user.id, name: voiceName, created_at: now })
      .select()
      .single()
      .catch(() => null);

    return NextResponse.json({
      profile: { id: profileId, name: voiceName, createdAt: now },
      message: `Voice profile "${voiceName}" created (dev stub — configure ELEVENLABS_API_KEY for real cloning).`,
    });
  }

  // ── list ────────────────────────────────────────────────────────────────
  if (parsed.data.action === 'list') {
    if (elevenLabsKey) {
      try {
        const res = await fetch(`${ELEVEN_BASE}/voices`, {
          headers: { 'xi-api-key': elevenLabsKey },
        });
        if (!res.ok) {
          return NextResponse.json({ error: 'ElevenLabs list failed' }, { status: res.status });
        }
        const data = await res.json() as { voices: Array<{ voice_id: string; name: string; created_at_unix: number }> };
        const profiles = data.voices.map(v => ({
          id: v.voice_id,
          name: v.name,
          createdAt: new Date((v.created_at_unix ?? 0) * 1000).toISOString(),
        }));
        return NextResponse.json({ profiles });
      } catch (err) {
        return NextResponse.json(
          { error: 'Voice list request failed', detail: err instanceof Error ? err.message : String(err) },
          { status: 502 },
        );
      }
    }

    const result = await db
      .from('voice_profiles')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .catch(() => ({ data: [], error: null })) as { data: unknown[]; error: unknown };

    const profiles = (Array.isArray(result.data) ? result.data : []).map((row: Record<string, unknown>) => {
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

    if (elevenLabsKey) {
      try {
        const res = await fetch(`${ELEVEN_BASE}/voices/${voiceId}`, {
          method: 'DELETE',
          headers: { 'xi-api-key': elevenLabsKey },
        });
        if (!res.ok && res.status !== 404) {
          return NextResponse.json({ error: 'ElevenLabs delete failed' }, { status: res.status });
        }
      } catch (err) {
        return NextResponse.json(
          { error: 'Voice delete request failed', detail: err instanceof Error ? err.message : String(err) },
          { status: 502 },
        );
      }
    }

    await db
      .from('voice_profiles')
      .delete()
      .eq('id', voiceId)
      .eq('user_id', user.id)
      .catch(() => null);

    return NextResponse.json({ message: `Voice profile "${voiceId}" deleted.` });
  }

  // ── tts ─────────────────────────────────────────────────────────────────
  const { text, voiceId, stability = 0.5, similarityBoost = 0.75 } = parsed.data;

  if (elevenLabsKey) {
    try {
      const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: 'ElevenLabs TTS failed', detail: (err as Record<string, unknown>).detail ?? res.statusText },
          { status: res.status },
        );
      }

      const audioBuffer = await res.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      const durationSeconds = estimateDurationSeconds(text);

      return NextResponse.json({
        audioBase64,
        durationSeconds: +durationSeconds.toFixed(2),
        voiceId,
      });
    } catch (err) {
      return NextResponse.json(
        { error: 'TTS request failed', detail: err instanceof Error ? err.message : String(err) },
        { status: 502 },
      );
    }
  }

  // Dev stub — no API key configured
  const durationSeconds = estimateDurationSeconds(text);
  return NextResponse.json({
    audioBase64: '',
    durationSeconds: +durationSeconds.toFixed(2),
    voiceId,
    message: `TTS (dev stub — configure ELEVENLABS_API_KEY for real audio, ~${durationSeconds.toFixed(1)}s estimated).`,
  });
}
