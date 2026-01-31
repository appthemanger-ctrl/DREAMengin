import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

type DeviceMode = 'desktop' | 'mobile' | 'desktop_on_mobile';

type ToolContext = {
  userId?: string;
  mode?: DeviceMode;
  route?: string;
  projectId?: string;
  notebookId?: string;
  attachmentId?: string;
  featureFlags?: Record<string, boolean>;
};

type ToolRequest = {
  action: string;
  input?: Record<string, unknown>;
  context?: ToolContext;
};

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

// NOTE:
// This is a minimal, build-safe tool runner so Dr. Eams can execute *core* app verbs.
// You can expand the action set over time without changing the client contract.

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parsed = body as Partial<ToolRequest>;
  const action = typeof parsed.action === 'string' ? parsed.action : '';
  const input = (parsed.input ?? {}) as Record<string, unknown>;

  if (!action) {
    return jsonError(400, 'MISSING_ACTION', 'Request must include an action string.');
  }

  // “Setup check” is always available.
  if (action === 'setup.check') {
    const url = new URL(req.url);
    const res = await fetch(`${url.origin}/api/setup/check`, { method: 'GET' });
    const data = await res.json();
    return NextResponse.json({ ok: true, action, data });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return jsonError(401, 'NOT_AUTHENTICATED', 'You must be signed in to use this tool.');
  }

  // --- Projects ---
  if (action === 'project.list') {
    const { data, error } = await supabase
      .from('projects')
      .select('id, owner_id, title, description, visibility, created_at')
      .order('created_at', { ascending: false });

    if (error) return jsonError(500, 'DB_ERROR', 'Failed to list projects.', error);
    return NextResponse.json({ ok: true, action, data });
  }

  if (action === 'project.get') {
    const projectId = String(input.projectId ?? '');
    if (!projectId) return jsonError(400, 'MISSING_PROJECT_ID', 'projectId is required.');

    const { data, error } = await supabase
      .from('projects')
      .select('id, owner_id, title, description, visibility, created_at')
      .eq('id', projectId)
      .single();

    if (error || !data) return jsonError(404, 'NOT_FOUND', 'Project not found.', error);
    return NextResponse.json({ ok: true, action, data });
  }

  if (action === 'project.create') {
    const title = String(input.title ?? '').trim();
    const description = typeof input.description === 'string' ? input.description : null;
    const visibility = (String(input.visibility ?? 'private') || 'private') as 'public' | 'unlisted' | 'private';
    if (!title) return jsonError(400, 'MISSING_TITLE', 'title is required.');

    const { data, error } = await supabase
      .from('projects')
      .insert({ owner_id: user.id, title, description, visibility })
      .select('id')
      .single();

    if (error || !data) return jsonError(500, 'DB_ERROR', 'Failed to create project.', error);
    return NextResponse.json({ ok: true, action, data });
  }

  if (action === 'project.update') {
    const projectId = String(input.projectId ?? '');
    const patch = (input.patch ?? {}) as Record<string, unknown>;
    if (!projectId) return jsonError(400, 'MISSING_PROJECT_ID', 'projectId is required.');

    // Enforce owner-only updates for now (until members/roles exist).
    const { data: existing } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (!existing) return jsonError(404, 'NOT_FOUND', 'Project not found.');
    if (existing.owner_id !== user.id) return jsonError(403, 'FORBIDDEN', 'Only the owner can update this project.');

    const update: Record<string, unknown> = {};
    if (typeof patch.title === 'string') update.title = patch.title;
    if (typeof patch.description === 'string' || patch.description === null) update.description = patch.description;
    if (typeof patch.visibility === 'string') update.visibility = patch.visibility;

    const { data, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', projectId)
      .select('id, owner_id, title, description, visibility, created_at')
      .single();

    if (error || !data) return jsonError(500, 'DB_ERROR', 'Failed to update project.', error);
    return NextResponse.json({ ok: true, action, data });
  }

  if (action === 'project.delete') {
    const projectId = String(input.projectId ?? '');
    const confirm = String(input.confirmPhrase ?? '');
    if (!projectId) return jsonError(400, 'MISSING_PROJECT_ID', 'projectId is required.');
    if (confirm !== 'DELETE PROJECT') {
      return jsonError(400, 'CONFIRM_REQUIRED', 'Type DELETE PROJECT to delete.', { confirmPhrase: 'DELETE PROJECT' });
    }

    const { data: existing } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
    if (!existing) return jsonError(404, 'NOT_FOUND', 'Project not found.');
    if (existing.owner_id !== user.id) return jsonError(403, 'FORBIDDEN', 'Only the owner can delete this project.');

    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) return jsonError(500, 'DB_ERROR', 'Failed to delete project.', error);
    return NextResponse.json({ ok: true, action, data: { deleted: true } });
  }

  return jsonError(404, 'UNKNOWN_ACTION', `Unknown action: ${action}`);
}
