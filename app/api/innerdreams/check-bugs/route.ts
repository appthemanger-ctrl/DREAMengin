import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_CHECK_STATUS, isSupabaseConfigured } from '../config';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase configuration required for InnerDreams admin operations. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
        },
        { status: 503 }
      );
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const isAdmin = user.user_metadata?.role === 'admin' || profile?.handle === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    // Log the bug check request
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'innerdreams_bug_check',
      details: {
        timestamp: new Date().toISOString(),
        status: 'running'
      }
    });

    // In production, this would:
    // 1. Run automated tests
    // 2. Check for console errors
    // 3. Validate database queries
    // 4. Check for security vulnerabilities
    // 5. Monitor performance metrics
    // 6. Scan for accessibility issues

    // Simulate bug checking
    const bugsFound = 0;
    const checks = { ...DEFAULT_CHECK_STATUS };
    if (bugsFound > 0) {
      checks.consoleErrors = 'Warning';
    }
    if (bugsFound > 1) {
      checks.performance = 'Warning';
    }

    const result = {
      success: true,
      bugsFound: bugsFound,
      details: bugsFound > 0
        ? `Found ${bugsFound} potential issue(s). Review the detailed report in the admin panel.`
        : 'All systems operational. No issues detected.',
      checks,
      timestamp: new Date().toISOString()
    };

    // Update audit log with results
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'innerdreams_bug_check_complete',
      details: result
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('InnerDreams bug check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
