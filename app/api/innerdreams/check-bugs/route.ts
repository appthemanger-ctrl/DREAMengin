import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '../config';
import { isOwnerEmail } from '@/lib/ai/triad';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'InnerDreams automated bug checking is not yet implemented.' },
        { status: 501 },
      );
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = isOwnerEmail(user.email) || user.user_metadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Log the bug check request
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'innerdreams_bug_check',
      details: {
        timestamp: new Date().toISOString(),
        status: 'running'
      }
    });

    // Automated bug checking is not yet implemented — return honest error
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'innerdreams_bug_check_not_implemented',
      details: { timestamp: new Date().toISOString() }
    });

    return NextResponse.json(
      { success: false, error: 'InnerDreams automated bug checking is not yet implemented.' },
      { status: 501 },
    );

  } catch (error) {
    console.error('InnerDreams bug check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
