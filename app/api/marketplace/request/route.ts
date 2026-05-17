/**
 * app/api/marketplace/request/route.ts
 *
 * DreamMarketplace contact / "Request" API route — Point 46.
 *
 * POST /api/marketplace/request
 *   - Auth-required (Axiom 4)
 *   - Looks up the listing's seller_id from marketplace_items
 *   - Inserts a marketplace_contact_requests row
 *   - Returns { request: { id, item_id, status, created_at } }
 *
 * Security: RLS on marketplace_contact_requests ensures only the
 *   requester and seller can read their own records (Point 44).
 *
 * Architecture: docs/ARCHITECTURE.md §10 — server client for all DB writes
 * Phase 8 §E:   Point 46 — no placeholder handler; real system action
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  validateContactRequest,
  buildContactRequestRecord,
} from '@/lib/marketplace/request';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Axiom 4: all writes require authentication
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Validate input
  const validation = validateContactRequest(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
  }

  const { item_id, message } = body as { item_id: string; message?: string };

  // Fetch the listing to obtain the seller_id.
  // RLS ensures the listing is visible (published OR own item).
  const { data: listing, error: listingError } = await supabase
    .from('marketplace_items')
    .select('id, seller_id, is_published')
    .eq('id', item_id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }

  // Prevent sending a request to yourself
  if (listing.seller_id === user.id) {
    return NextResponse.json(
      { error: 'You cannot request your own listing.' },
      { status: 400 },
    );
  }

  // Build the DB record using the pure function
  const record = buildContactRequestRecord(user.id, listing.seller_id, {
    item_id,
    message,
  });

  const { data: contactRequest, error: insertError } = await supabase
    .from('marketplace_contact_requests')
    .insert(record)
    .select('id, item_id, seller_id, status, created_at')
    .single();

  if (insertError) {
    console.error('[marketplace/request POST]', insertError.message);
    return NextResponse.json({ error: 'Failed to send request.' }, { status: 500 });
  }

  return NextResponse.json({ request: contactRequest }, { status: 201 });
}
