import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const MaskSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
}).refine(
  m => m.x + m.width <= 1.001 && m.y + m.height <= 1.001,
  { message: 'Mask region extends beyond image bounds (x+width or y+height > 1).' }
);

const FillSchema = z.object({
  /** Base64-encoded source image or video frame (JPEG/PNG) */
  imageBase64: z.string().min(10).max(10_000_000),
  /** Natural-language fill description */
  prompt: z.string().min(3).max(500),
  /** Optional mask region as fractions of image dimensions (0–1) */
  mask: MaskSchema.optional(),
  quality: z.enum(['fast', 'hd']).default('fast'),
});

type FillBody = z.infer<typeof FillSchema>;

/**
 * POST /api/content/generative-fill
 *
 * Accepts an image + prompt and returns a filled result.
 *
 * In production, wire REPLICATE_API_TOKEN / STABILITY_API_KEY env vars
 * and call the respective model. Currently returns a graceful stub so
 * the UI flow works end-to-end without real credentials.
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

  const parsed = FillSchema.safeParse(body as FillBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prompt, quality, mask } = parsed.data;

  // Check for real API credentials.
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const stabilityKey = process.env.STABILITY_API_KEY;

  if (replicateToken || stabilityKey) {
    // Production path — call external provider.
    // Wire Replicate stable-diffusion-inpainting or Stability API here.
    return NextResponse.json(
      {
        error: 'External generative fill provider not yet wired. Set REPLICATE_API_TOKEN.',
        provider: 'replicate',
      },
      { status: 501 }
    );
  }

  const maskDescription = mask
    ? ` [mask: x=${mask.x.toFixed(2)}, y=${mask.y.toFixed(2)}, w=${mask.width.toFixed(2)}, h=${mask.height.toFixed(2)}]`
    : '';

  // Development / demo stub: echo the source image back with metadata.
  return NextResponse.json(
    {
      resultBase64: parsed.data.imageBase64,
      message: `Generative fill "${prompt}"${maskDescription} (${quality}) — configure REPLICATE_API_TOKEN for real results.`,
      provider: 'mock',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'ETag': `"${Buffer.from(prompt + quality).toString('base64').slice(0, 16)}"`,
      },
    }
  );
}

