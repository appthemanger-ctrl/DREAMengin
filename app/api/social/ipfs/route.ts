/**
 * /api/social/ipfs — IPFS backend proxy
 *
 * POST /api/social/ipfs/upload  – upload content or file to IPFS
 * GET  /api/social/ipfs/content/[cid] – retrieve content by CID
 * POST /api/social/ipfs/pin     – pin a CID
 *
 * Proxies to the backend ipfsService so IPFS credentials never reach
 * the browser bundle. All routes require a valid Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

async function requireUser(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest: Promise<NextResponse>) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pathname = req.nextUrl.pathname;

  // POST /api/social/ipfs/pin
  if (pathname.endsWith('/pin')) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const { cid } = body as { cid?: string };
    if (!cid) {
      return NextResponse.json({ error: 'cid is required' }, { status: 400 });
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/ipfs/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid }),
      });
      return NextResponse.json({ pinned: res.ok });
    } catch {
      return NextResponse.json({ pinned: false });
    }
  }

  // POST /api/social/ipfs/upload
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    // File upload
    const formData = await req.formData();
    const backendForm = new FormData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'file field is required' }, { status: 400 });
    }
    backendForm.append('file', file as File);

    try {
      const res = await fetch(`${BACKEND_URL}/api/ipfs/upload`, {
        method: 'POST',
        body: backendForm,
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Backend upload failed (${res.status})` },
          { status: 502 }
        );
      }
      return NextResponse.json(await res.json());
    } catch {
      return NextResponse.json({ error: 'IPFS upload failed' }, { status: 502 });
    }
  }

  // JSON content upload
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { content } = body as { content?: string };
  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'content must be a string' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/ipfs/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend upload failed (${res.status})` },
        { status: 502 }
      );
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'IPFS upload failed' }, { status: 502 });
  }
}

// ─── Retrieve ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest: Promise<NextResponse>) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Extract CID from path: /api/social/ipfs/content/[cid]
  const segments = req.nextUrl.pathname.split('/');
  const contentIdx = segments.indexOf('content');
  const cid = contentIdx >= 0 ? segments[contentIdx + 1] : null;

  if (!cid) {
    return NextResponse.json({ error: 'CID is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/ipfs/content/${encodeURIComponent(cid)}`
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `CID not found (${res.status})` },
        { status: res.status }
      );
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'IPFS retrieval failed' }, { status: 502 });
  }
}
