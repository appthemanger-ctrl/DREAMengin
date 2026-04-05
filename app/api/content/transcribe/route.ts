import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const TranscribeSchema = z.object({
  /** Raw SRT or VTT content uploaded by the user */
  subtitleContent: z.string().min(1).max(500_000).optional(),
  /** Format of the uploaded subtitle file */
  format: z.enum(['srt', 'vtt']).optional(),
  /**
   * For future use: base64-encoded audio/video to transcribe via
   * a speech-to-text model. Accepts up to ~5 MB base64 payload.
   */
  audioBase64: z.string().max(7_000_000).optional(),
  /** Language hint (BCP-47) for transcription */
  language: z.string().max(10).optional(),
});

type TranscribeBody = z.infer<typeof TranscribeSchema>;

function generateMockTranscript(content: string): string {
  // If the user uploaded actual SRT/VTT content, echo it back unchanged.
  if (content.trim()) return content.trim();
  return '';
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

  const parsed = TranscribeSchema.safeParse(body as TranscribeBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { subtitleContent, format, audioBase64 } = parsed.data;

  // If subtitle content is provided, parse and return as segments.
  if (subtitleContent) {
    return NextResponse.json({
      source: format ?? 'srt',
      rawContent: generateMockTranscript(subtitleContent),
      message: `Transcript loaded from ${format ?? 'srt'} file.`,
    });
  }

  // If audio is provided, return a stub response (real ML integration wired here).
  if (audioBase64) {
    // In production: call Whisper / Web Speech API / Deepgram here.
    // For now, return an empty transcript so the UI can handle it gracefully.
    return NextResponse.json({
      source: 'audio',
      rawContent: '',
      message: 'Audio transcription is not yet configured. Upload an SRT or VTT file instead.',
    });
  }

  return NextResponse.json(
    { error: 'Provide either subtitleContent (SRT/VTT) or audioBase64.' },
    { status: 400 }
  );
}
