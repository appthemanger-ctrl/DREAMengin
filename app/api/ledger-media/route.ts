import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { decodeLedgerBlob } from '@/lib/media/ledger';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get('bucket');
  const storagePath = searchParams.get('path');

  if (!bucket || !storagePath) {
    return NextResponse.json({ error: 'bucket and path are required' }, { status: 400 });
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.storage.from(bucket).download(storagePath);

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Media not found' }, { status: 404 });
    }

    const decoded = await decodeLedgerBlob(data);
    return new Response(decoded.stream(), {
      headers: {
        'content-type': decoded.type || 'application/octet-stream',
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load media' },
      { status: 500 },
    );
  }
}
