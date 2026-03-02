import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PATCH /api/profile/pinned-dreams  — body: { pinned_dreams: string[] }
export async function PATCH(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { pinned_dreams?: string[] };
  const pinned = Array.isArray(body.pinned_dreams) ? body.pinned_dreams.slice(0, 12) : [];

  const { error } = await supabase
    .from('profiles')
    .update({ pinned_dreams: pinned, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pinned_dreams: pinned });
}
