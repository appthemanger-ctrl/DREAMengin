import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { parseSRT, parseVTT, totalDurationMs } from '@/lib/content/transcriptEditor';

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

  if (subtitleContent) {
    // Parse the file server-side to return metadata alongside raw content.
    const detectedFormat = format ?? 'srt';
    let segments: ReturnType<typeof parseSRT> = [];
    try {
      segments = detectedFormat === 'vtt'
        ? parseVTT(subtitleContent)
        : parseSRT(subtitleContent);
    } catch {
      // Parsing errors are non-fatal — still return raw content
    }

    const wordCount = segments.flatMap(s => s.words).length;
    const durationMs = totalDurationMs(segments);

    return NextResponse.json({
      source: detectedFormat,
      rawContent: subtitleContent.trim(),
      segmentCount: segments.length,
      wordCount,
      durationMs,
      durationSeconds: +(durationMs / 1000).toFixed(2),
      message: `Transcript loaded from ${detectedFormat} file — ${segments.length} segments, ${wordCount} words.`,
    });
  }

  if (audioBase64) {
    // In production: call Whisper / Deepgram here with the decoded audio.
    return NextResponse.json({
      source: 'audio',
      rawContent: '',
      segmentCount: 0,
      wordCount: 0,
      durationMs: 0,
      durationSeconds: 0,
      message: 'Audio transcription is not yet configured. Upload an SRT or VTT file instead.',
    });
  }

  return NextResponse.json(
    { error: 'Provide either subtitleContent (SRT/VTT) or audioBase64.' },
    { status: 400 }
  );
}

