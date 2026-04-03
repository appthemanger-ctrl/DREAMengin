// =====================================================
// Widget Feed Resolver API Route
// Resolves feed data for widget instances
// =====================================================

import { NextRequest, NextResponse, connection } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { resolveFeedHost } from '@/lib/widgets/feed-resolver';
import { HostKind, type FeedHostConfig, type WidgetDefinition, type WidgetInstance } from '@/types/widget-system-v2';

// Type for joined query result
type WidgetInstanceWithDefinition = WidgetInstance & {
  widget_definitions: WidgetDefinition;
};

// Shared helper function to resolve feed for a widget instance
async function resolveFeedForInstance(
  instanceId: string,
  userId: string
) {
  const supabase = await createServerClient();
  
  // Fetch widget instance and definition
  const { data: instance, error: instanceError } = await supabase
    .from('widget_instances')
    .select(`
      *,
      widget_definitions!inner(*)
    `)
    .eq('instance_id', instanceId)
    .eq('owner_id', userId)
    .single();
  
  if (instanceError || !instance) {
    return {
      error: 'Widget instance not found',
      status: 404,
    };
  }
  
  // Proper type assertion for joined data
  const instanceWithDef = instance as unknown as WidgetInstanceWithDefinition;
  const definition = instanceWithDef.widget_definitions;
  
  // Only handle feed widgets
  if (definition.host_kind !== HostKind.HOST_FEED_VIEW) {
    return {
      error: 'Not a feed widget',
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

export async function POST(request: NextRequest) {
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
  } catch (error) {
    console.error('Widget feed resolver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
  } catch (error) {
    console.error('Widget feed resolver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
