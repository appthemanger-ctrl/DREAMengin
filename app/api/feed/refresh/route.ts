// POST /api/feed/refresh
// Bypasses the cache once per user action (pull-to-refresh).
// Stateless: simply redirects to /api/feed/home with _bypass=1.

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const theme = body.theme ?? 'play';
  const limit = body.limit ?? 40;
  const sourceType = body.sourceType ?? 'mixed';

  const feedUrl = new URL('/api/feed/home', req.url);
  feedUrl.searchParams.set('theme', theme);
  feedUrl.searchParams.set('limit', String(limit));
  feedUrl.searchParams.set('sourceType', sourceType);
  feedUrl.searchParams.set('_bypass', '1');

  const response = await fetch(feedUrl.toString());
  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
