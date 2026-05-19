// =====================================================
// Dream Feed Resolver API Route
// Resolves feed data for dream instances
// =====================================================

import { NextRequest, NextResponse, connection } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveFeedHost } from '@/lib/widgets/feed-resolver';
import { HostKind, type FeedHostConfig, type DreamDefinition, type DreamInstance } from '@/types/widget-system-v2';

// Type for joined query result
type DreamInstanceWithDefinition = DreamInstance & {
  dream_definitions: DreamDefinition;
};

// Shared helper function to resolve feed for a dream instance
async function resolveFeedForInstance(
  instanceId: string,
  userId: string
) {
  const supabase = await createServerClient();
  
  // Fetch dream instance and definition
  const { data: instance, error: instanceError } = await (supabase as SupabaseClient)
    .from('dream_instances')
    .select(`
      *,
      dream_definitions!inner(*)
    `)
    .eq('instance_id', instanceId)
    .eq('owner_id', userId)
    .single();
  
  if (instanceError || !instance) {
    return {
      error: 'Dream instance not found',
      status: 404,
    };
  }
  
  // Proper type assertion for joined data
  const instanceWithDef = instance as unknown as DreamInstanceWithDefinition;
  const definition = instanceWithDef.dream_definitions;
  
  // Only handle feed dreams
  if (definition.host_kind !== HostKind.HOST_FEED_VIEW) {
    return {
      error: 'Not a feed Dream',
      status: 400,
    };
  }
  
  // Resolve feed
  const hostConfig = definition.host_config as FeedHostConfig;
  const resolved = await resolveFeedHost(userId, hostConfig);
  
  return {
    data: resolved,
    status: 200,
  };
}

export async function POST(request: NextRequest ): Promise<Response> {
  await connection();
  try {
    const supabase = await createServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { instance_id } = body;
    
    if (!instance_id) {
      return NextResponse.json(
        { error: 'instance_id is required' },
        { status: 400 }
      );
    }
    
    const result = await resolveFeedForInstance(instance_id, user.id);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Dream feed resolver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest ): Promise<Response> {
  await connection();
  try {
    const supabase = await createServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const instance_id = searchParams.get('instance_id');
    
    if (!instance_id) {
      return NextResponse.json(
        { error: 'instance_id is required' },
        { status: 400 }
      );
    }
    
    const result = await resolveFeedForInstance(instance_id, user.id);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Dream feed resolver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}