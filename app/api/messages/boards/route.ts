import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';


const PostSchema = z.object({
  board_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

const BoardSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  is_public: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Create a new board
    if (action === 'create_board') {
      const parse = BoardSchema.safeParse(body);
      if (!parse.success) {
        return NextResponse.json({ error: 'Invalid body', details: parse.error.flatten() }, { status: 400 });
      }
      const { title, description, is_public } = parse.data;
      const { data, error } = await supabase
        .from('boards')
        .insert({ owner_id: user.id, title, description: description ?? null, is_public })
        .select('id')
        .single();
      if (error) {
        console.error('[api/messages/boards POST create_board]', error);
        return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
      }
      return NextResponse.json({ id: data.id }, { status: 201 });
    }

    // Default: create a board post
    const parse = PostSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid body', details: parse.error.flatten() }, { status: 400 });
    }
    const { board_id, content } = parse.data;

    // Verify access: owner or public board
    const { data: board } = await supabase
      .from('boards')
      .select('owner_id, is_public')
      .eq('id', board_id)
      .single();

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }
    if (!board.is_public && board.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('board_posts')
      .insert({ board_id, author_id: user.id, content })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[api/messages/boards POST]', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, created_at: data.created_at }, { status: 201 });
  } catch (err) {
    console.error('[api/messages/boards] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
