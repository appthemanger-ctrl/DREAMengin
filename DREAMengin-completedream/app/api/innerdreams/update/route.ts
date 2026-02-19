import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ESTIMATED_COMPLETION, isSupabaseConfigured } from '../config';

type UpdatePayload = {
  prompt?: string;
  autoRefresh?: boolean;
  bugCheck?: boolean;
};

const toUpdatePayload = (body: unknown): UpdatePayload => {
  if (typeof body !== 'object' || body === null) return {};
  const record = body as Record<string, unknown>;
  return {
    prompt: typeof record.prompt === 'string' ? record.prompt : undefined,
    autoRefresh: typeof record.autoRefresh === 'boolean' ? record.autoRefresh : undefined,
    bugCheck: typeof record.bugCheck === 'boolean' ? record.bugCheck : undefined,
  };
};

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON body',
          details: error instanceof Error ? error.message : 'Unable to parse request payload',
          expected: 'JSON object with prompt, autoRefresh, and bugCheck fields'
        },
        { status: 400 }
      );
    }

    // Demo-friendly fallback when Supabase is not wired up yet
    const payload = toUpdatePayload(body);

    if (!isSupabaseConfigured()) {
      const { prompt, autoRefresh, bugCheck } = payload;
      const result = {
        success: true,
        message: 'InnerDreams update queued (demo mode - Supabase not configured)',
        details: {
          promptReceived: prompt,
          bugCheckEnabled: bugCheck,
          autoRefreshEnabled: autoRefresh,
          estimatedCompletionTime: `${ESTIMATED_COMPLETION.minMinutes}-${ESTIMATED_COMPLETION.maxMinutes} minutes`,
          status: 'queued'
        }
      };
      return NextResponse.json(result);
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

    const { prompt, autoRefresh, bugCheck } = payload;

    // Log the update request to audit log
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'innerdreams_update',
      details: {
        prompt,
        autoRefresh,
        bugCheck,
        timestamp: new Date().toISOString(),
        status: 'processing'
      }
    });

    // In production, this would:
    // 1. Call your AI service (OpenAI, Anthropic, etc.) with the prompt
    // 2. Generate code changes
    // 3. Run tests if bugCheck is enabled
    // 4. Apply changes if tests pass
    // 5. Deploy to staging/production

    // For now, we'll simulate the process
    const result = {
      success: true,
      message: 'InnerDreams update queued successfully',
        details: {
          promptReceived: prompt,
          bugCheckEnabled: bugCheck,
          autoRefreshEnabled: autoRefresh,
          estimatedCompletionTime: `${ESTIMATED_COMPLETION.minMinutes}-${ESTIMATED_COMPLETION.maxMinutes} minutes`,
          status: 'queued'
        }
    };

    // Update audit log with result
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'innerdreams_update_complete',
      details: result
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('InnerDreams update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
