import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch projects
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get('owner_id');
  const visibility = searchParams.get('visibility') || 'all';
  const projectId = searchParams.get('id');

  // Fetch single project
  if (projectId) {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!inner(id, handle, display_name, avatar_url)
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check access
    if (project.visibility !== 'public' && project.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ project });
  }

  // Fetch multiple projects
  let query = supabase
    .from('projects')
    .select(`
      *,
      profiles!inner(id, handle, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (ownerId) {
    query = query.eq('user_id', ownerId);
    if (ownerId !== user.id) {
      query = query.eq('visibility', 'public');
    }
  } else if (visibility === 'public') {
    query = query.eq('visibility', 'public');
  } else {
    query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
  }

  const { data: projects, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects });
}

// POST - Create a new project
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, visibility = 'private', template, tags = [] } = body;

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      visibility,
      template: template || null,
      tags,
      data: {}, // Empty project data to start
    })
    .select(`
      *,
      profiles!inner(id, handle, display_name, avatar_url)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create feed item if public
  if (visibility === 'public') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('feed_items').insert({
      user_id: user.id,
      type: 'project',
      content: { title: project.title, project_id: project.id },
      ts: new Date().toISOString(),
    });
  }

  return NextResponse.json({ project }, { status: 201 });
}

// PUT - Update a project
export async function PUT(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, title, description, visibility, data: projectData, tags } = body;

  if (!id) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description?.trim();
  if (visibility !== undefined) updateData.visibility = visibility;
  if (projectData !== undefined) updateData.data = projectData;
  if (tags !== undefined) updateData.tags = tags;

  const { data: project, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project });
}

// DELETE - Remove a project
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
