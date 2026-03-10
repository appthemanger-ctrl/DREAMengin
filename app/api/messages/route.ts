import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch conversations
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversation_id');

  if (conversationId) {
    // Fetch messages for a specific conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, handle, display_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages });
  }

  // Fetch all conversations for the user
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant1:profiles!participant1_id(id, handle, display_name, avatar_url),
      participant2:profiles!participant2_id(id, handle, display_name, avatar_url),
      last_message:messages(content, created_at)
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations });
}

// POST - Send a message
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { recipient_id, content, conversation_id, media_url, media_type } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }

  let convId = conversation_id;

  // If no conversation_id, create or find existing conversation
  if (!convId && recipient_id) {
    // Check for existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${recipient_id}),and(participant1_id.eq.${recipient_id},participant2_id.eq.${user.id})`)
      .single();

    if (existing) {
      convId = existing.id;
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          participant1_id: user.id,
          participant2_id: recipient_id,
        })
        .select()
        .single();

      if (convError) {
        return NextResponse.json({ error: convError.message }, { status: 500 });
      }
      convId = newConv.id;
    }
  }

  // Insert the message
  const messageRow: Record<string, unknown> = {
    conversation_id: convId,
    sender_id: user.id,
    content: content.trim(),
  };
  if (media_url) messageRow.media_url = media_url;
  if (media_type) messageRow.media_type = media_type;

  const { data: message, error } = await supabase
    .from('messages')
    .insert(messageRow)
    .select(`
      *,
      sender:profiles!sender_id(id, handle, display_name, avatar_url)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', convId);

  // Create notification for recipient
  const recipientId = conversation_id ? null : recipient_id;
  if (recipientId) {
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'message',
      content: {
        message: `New message from ${user.email}`,
        conversation_id: convId,
        message_id: message.id,
      },
    });
  }

  return NextResponse.json({ message, conversation_id: convId }, { status: 201 });
}
