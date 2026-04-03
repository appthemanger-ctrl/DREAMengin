import { createHash } from 'crypto';
import { gunzipSync, gzipSync } from 'zlib';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const MAX_PAYLOAD_BYTES = 2_000_000;

type UploadPayload = {
  data?: unknown;
  sourceInstanceId?: string;
  metadata?: Record<string, unknown>;
  encoding?: 'json' | 'gzip-base64';
};

function normalizeInputData(payload: UploadPayload): string {
  if (payload.encoding === 'gzip-base64') {
    if (typeof payload.data !== 'string') throw new Error('gzip-base64 data must be a string');
    const inflated = gunzipSync(Buffer.from(payload.data, 'base64')).toString('utf8');
    return JSON.stringify(JSON.parse(inflated));
  }
  return JSON.stringify(payload.data);
}

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

  let json: string;
  try {
    json = normalizeInputData(body);
  } catch {
    return NextResponse.json({ error: 'Unable to decode payload data' }, { status: 400 });
  }

  const jsonBytes = Buffer.byteLength(json, 'utf8');
  if (jsonBytes > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

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
        metadata: {
          ...(body.metadata ?? {}),
          originalEncoding: body.encoding ?? 'json',
          originalBytes: jsonBytes,
        },
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
      algorithm: 'gzip-base64',
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
    algorithm: 'gzip-base64',
  });
}
