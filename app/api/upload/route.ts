import { createHash } from 'crypto';
import { gzipSync } from 'zlib';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type UploadPayload = {
  data?: unknown;
  sourceInstanceId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Content-addressed upload endpoint.
 *
 * Spec alignment:
 * - Uses widget system tables only (`widget_content`, `widget_events`)
 * - No userId trust from client (derived from auth session)
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: UploadPayload;
  try {
    body = (await req.json()) as UploadPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || typeof body.data === 'undefined') {
    return NextResponse.json({ error: 'Missing `data` in request body' }, { status: 400 });
  }

  const json = JSON.stringify(body.data);
  const contentHash = createHash('sha256').update(json).digest('hex');
  const compressed = gzipSync(Buffer.from(json, 'utf8')).toString('base64');

  const { data: existing, error: existingError } = await supabase
    .from('widget_content')
    .select('id, content_hash')
    .eq('content_hash', contentHash)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  let contentId: string | number | null = existing?.id ?? null;

  if (!contentId) {
    const { data: insertedContent, error: insertError } = await supabase
      .from('widget_content')
      .insert({
        owner_id: user.id,
        content_hash: contentHash,
        content_encoding: 'gzip-base64',
        content_body: compressed,
        metadata: body.metadata ?? {},
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    contentId = insertedContent.id;
  }

  const { error: eventError } = await supabase.from('widget_events').insert({
    actor_id: user.id,
    widget_instance_id: body.sourceInstanceId ?? null,
    event_type: existing ? 'content.referenced' : 'content.created',
    payload: {
      contentHash,
      contentId,
      referenced: Boolean(existing),
      compressed: true,
    },
  });

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  return NextResponse.json({
    stored: !existing,
    referenced: Boolean(existing),
    contentHash,
    contentId,
    compressed: true,
  });
}
