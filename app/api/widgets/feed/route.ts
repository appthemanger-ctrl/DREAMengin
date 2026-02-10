// =====================================================
// Widget Feed Resolver API Route
// Resolves feed data for widget instances
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveFeedHost } from '@/lib/widgets/feed-resolver';
import { HostKind, type FeedHostConfig } from '@/types/widget-system-v2';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
    
    // Fetch widget instance and definition
    const { data: instance, error: instanceError } = await supabase
      .from('widget_instances')
      .select(`
        *,
        widget_definitions!inner(*)
      `)
      .eq('instance_id', instance_id)
      .eq('owner_id', user.id)
      .single();
    
    if (instanceError || !instance) {
      return NextResponse.json(
        { error: 'Widget instance not found' },
        { status: 404 }
      );
    }
    
    // Type assertion for the joined data
    const definition = (instance as any).widget_definitions;
    
    // Only handle feed widgets
    if (definition.host_kind !== HostKind.HOST_FEED_VIEW) {
      return NextResponse.json(
        { error: 'Not a feed widget' },
        { status: 400 }
      );
    }
    
    // Resolve feed
    const hostConfig = definition.host_config as FeedHostConfig;
    const resolved = await resolveFeedHost(user.id, hostConfig);
    
    return NextResponse.json(resolved);
  } catch (error) {
    console.error('Widget feed resolver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
    
    // Fetch widget instance and definition
    const { data: instance, error: instanceError } = await supabase
      .from('widget_instances')
      .select(`
        *,
        widget_definitions!inner(*)
      `)
      .eq('instance_id', instance_id)
      .eq('owner_id', user.id)
      .single();
    
    if (instanceError || !instance) {
      return NextResponse.json(
        { error: 'Widget instance not found' },
        { status: 404 }
      );
    }
    
    // Type assertion for the joined data
    const definition = (instance as any).widget_definitions;
    
    // Only handle feed widgets
    if (definition.host_kind !== HostKind.HOST_FEED_VIEW) {
      return NextResponse.json(
        { error: 'Not a feed widget' },
        { status: 400 }
      );
    }
    
    // Resolve feed
    const hostConfig = definition.host_config as FeedHostConfig;
    const resolved = await resolveFeedHost(user.id, hostConfig);
    
    return NextResponse.json(resolved);
  } catch (error) {
    console.error('Widget feed resolver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
