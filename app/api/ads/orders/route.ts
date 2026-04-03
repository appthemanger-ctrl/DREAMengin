/**
 * app/api/ads/orders/route.ts
 *
 * POST /api/ads/orders — Create a new ad order with platform revenue split.
 *
 * Financial operations must run server-side to prevent client-side revenue
 * manipulation. The 10% / 90% platform-to-creator split is enforced here;
 * clients never touch the platform_share or creator_share columns directly.
 *
 * Security (AXIOM 4 / BUGS.md):
 *   - Requires authentication; returns 401 otherwise.
 *   - buyer_id is always set from the authenticated session — never from input.
 *   - No secrets or financial calculation logic ever reaches the browser.
 *
 * Architecture: docs/ARCHITECTURE.md §3 — server route in app/api/.
 *
 * Body (JSON):
 *   { listingId: string, grossAmount: number }
 *
 * Response:
 *   201  { data: AdOrderRow }
 *   400  { error: string }
 *   401  { error: "Unauthorized" }
 *   500  { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const PLATFORM_SHARE_PERCENT = 0.10; // 10% DREAMengin platform cut


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
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const { listingId, grossAmount } = body as Record<string, unknown>;

  if (!listingId || typeof listingId !== 'string') {
    return NextResponse.json({ error: 'listingId is required.' }, { status: 400 });
  }

  const gross = typeof grossAmount === 'number' ? grossAmount : parseFloat(String(grossAmount ?? 0));
  if (isNaN(gross) || gross < 0) {
    return NextResponse.json({ error: 'grossAmount must be a non-negative number.' }, { status: 400 });
  }

  const platformPayout = parseFloat((gross * PLATFORM_SHARE_PERCENT).toFixed(2));
  const creatorPayout  = parseFloat((gross - platformPayout).toFixed(2));

  const db = supabase as any;
  const { data, error } = await db
    .from('ad_orders')
    .insert([{
      ad_listing_id:  listingId,
      buyer_id:       user.id,
      gross_revenue:  gross,
      platform_share: PLATFORM_SHARE_PERCENT,
      creator_share:  1 - PLATFORM_SHARE_PERCENT,
      platform_payout: platformPayout,
      creator_payout:  creatorPayout,
      status:         'pending',
    }])
    .select()
    .single();

  if (error) {
    console.error('Ad order creation failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
