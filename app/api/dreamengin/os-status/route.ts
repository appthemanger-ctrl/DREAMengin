import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  let isFix = false;
  let connectedConnectors = 0;
  let authenticated = false;

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    authenticated = Boolean(user) && !authError;

    if (user) {
      const db = supabase as any;
      const { data, error } = await db
        .from('connector_accounts')
        .select('status')
        .eq('user_id', user.id);

      if (error) {
        isFix = true;
      } else {
        connectedConnectors = Array.isArray(data)
          ? data.filter((row) => row?.status === 'connected').length
          : 0;
      }
    }
  } catch {
    isFix = true;
  }

  return NextResponse.json({
    ok: true,
    isFix,
    subsystems: {
      auth: authenticated,
      connectors: connectedConnectors,
    },
  });
}
