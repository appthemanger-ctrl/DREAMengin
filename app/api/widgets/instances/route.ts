// app/api/widgets/instances/route.ts
// GET handler for fetching widget instances from DB

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Zod 4 schema for query params
const QuerySchema = z.object({
  space: z.enum(['home', 'profile']).default('home'),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query params
    const { searchParams } = new URL(req.url);
    const parseResult = QuerySchema.safeParse({
      space: searchParams.get('space') || 'home',
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { space } = parseResult.data;

    // Query widget_instances table
    const { data, error } = await supabase
      .from('widget_instances')
      .select('id,type,space,order,config')
      .eq('space', space)
      .eq('user_id', user.id)
      .order('order', { ascending: true })
      .limit(48);

    if (error) {
      console.error('[widgets/instances] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch widgets' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { items: data ?? [] },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[widgets/instances] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
