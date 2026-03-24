// app/api/account/export-data/route.ts
// "Export My Data" endpoint — GDPR/privacy-by-design export (AXIOM 5).
//
// GET /api/account/export-data
//   Returns a JSON snapshot of all user-owned data rows across known tables.
//   Any table that doesn't exist yet (or errors) is skipped gracefully — the
//   export never fails hard because of a missing table.
//
// Architecture justification:
//   AXIOM 5 (Privacy by Design) — users must be able to retrieve their data.
//   LAW.md §2 — nothing is exposed without auth; this route is auth-gated.
//   ARCHITECTURE.md §10 — Next.js App Router, Supabase SSR client.

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Tables to export, each with the column name that identifies the owner.
const EXPORT_TARGETS: Array<{ table: string; ownerCol: string }> = [
  { table: 'profiles',           ownerCol: 'id' },
  { table: 'widget_instances',   ownerCol: 'user_id' },
  { table: 'feed_items',         ownerCol: 'user_id' },
  { table: 'merch',              ownerCol: 'user_id' },
  { table: 'favorites',          ownerCol: 'user_id' },
  { table: 'music_releases',     ownerCol: 'user_id' },
  { table: 'notes',              ownerCol: 'user_id' },
];

export async function GET(_req: NextRequest) {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in to export your data.');
  }

   
  const supabaseAny = supabase as any;

  const exportData: Record<string, unknown[] | null> = {};
  const skipped: string[] = [];

  // Fetch all tables concurrently; skip any that fail (table may not exist yet).
  await Promise.all(
    EXPORT_TARGETS.map(async ({ table, ownerCol }) => {
      try {
        const { data, error } = await supabaseAny
          .from(table)
          .select('*')
          .eq(ownerCol, user.id);

        if (error) {
          // Gracefully skip — table might not exist in this deployment yet.
          skipped.push(table);
          exportData[table] = null;
        } else {
          exportData[table] = data ?? [];
        }
      } catch {
        skipped.push(table);
        exportData[table] = null;
      }
    })
  );

  return NextResponse.json(
    {
      ok: true,
      exported_at: new Date().toISOString(),
      user_id: user.id,
      data: exportData,
      ...(skipped.length > 0 ? { skipped } : {}),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Disposition': `attachment; filename="dreamengin-export-${Date.now()}.json"`,
      },
    }
  );
}
