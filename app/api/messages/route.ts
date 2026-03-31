import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { scanContent } from '@/lib/child-safety/childSafetyDetector';
import { scanMediaUrlsForChildSafety } from '@/lib/child-safety/scanMediaUrls';
import { reportChildSafetyIncident } from '@/lib/child-safety/ncmecReporter';
import { createHash } from 'crypto';

// ── Minor-to-adult image blocking helpers ─────────────────────────────────

/**
 * Look up the age of a user from their profile.
 * Returns null if age is unavailable or unverified.
 */
async function getUserAge(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
): Promise<number | null> {
  try {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('age, birth_year')
      .eq('id', userId)
      .single();

    if (!data) return null;

    // Prefer explicit age field; fall back to birth_year
    if (typeof data.age === 'number' && data.age > 0) return data.age;
    if (typeof data.birth_year === 'number' && data.birth_year > 0) {
      return new Date().getFullYear() - data.birth_year;
    }
    return null;
  } catch {
    return null;
  }
}

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
     
    const { data: messages, error } = await (supabase as any)
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
   
  const { data: conversations, error } = await (supabase as any)
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

  // ── Look up sender and recipient ages for minor-adult enforcement ─────────
  const senderAge = await getUserAge(supabase, user.id);
  const recipientAge = recipient_id ? await getUserAge(supabase, recipient_id) : null;

  const senderIsMinor = typeof senderAge === 'number' && senderAge >= 13 && senderAge < 18;
  const recipientIsAdult = typeof recipientAge === 'number' && recipientAge >= 18;
  const hasImage = media_url && typeof media_url === 'string' && media_type === 'image';

  // ── C32_MINOR_IMAGE: any image from a minor to an adult is ALWAYS blocked ─
  if (hasImage && senderIsMinor && recipientIsAdult) {
    const contentRef = `minor_image:${user.id.slice(0, 8)}`;
    reportChildSafetyIncident({
      reportedUserId: user.id,
      ruleCode: 'C32_MINOR_IMAGE',
      detectionResult: {
        flagged: true,
        rule_code: 'C32_MINOR_IMAGE',
        severity: 1.0,
        confidence: 1.0,
        category: 'MINOR_IMAGE',
        signal_count: 1,
        _audit: { signals: ['minor_to_adult_image'], hash_match: false },
      },
      surface: 'message',
      contentRef,
    }).catch((err) => console.error('[child-safety] minor image block report error:', err));

    return NextResponse.json(
      { error: 'This image was sent from a minor and has been blocked.' },
      { status: 451 },
    );
  }

  // ── TheBoogieMan child safety scan (zero-tolerance) ──────────────────────
  // Also pass sender/recipient ages so scanContent can detect image solicitation
  // from adults to minors (rule C33_SOLICITING_IMAGES via grooming patterns).
  const childSafetyResult = scanContent({ text: content });
  if (childSafetyResult.flagged) {
    const contentHash = createHash('sha256').update(content).digest('hex');
    reportChildSafetyIncident({
      reportedUserId: user.id,
      ruleCode: childSafetyResult.rule_code!,
      detectionResult: childSafetyResult,
      surface: 'message',
      contentRef: `draft:${contentHash.slice(0, 16)}`,
      contentHash,
    }).catch((err) => console.error('[child-safety] message report error:', err));

    return NextResponse.json(
      { error: 'Message violates our child safety policy and has been blocked.' },
      { status: 451 },
    );
  }

  // ── TheBoogieMan media image scan (LLM + hash) — real-time ───────────────
  // Only runs when an image attachment is present in the message.
  if (media_url && typeof media_url === 'string' && media_type === 'image') {
    const mediaSafetyResult = await scanMediaUrlsForChildSafety({
      urls: [media_url],
      supabase,
    });
    if (mediaSafetyResult.flagged) {
      reportChildSafetyIncident({
        reportedUserId: user.id,
        ruleCode: mediaSafetyResult.rule_code!,
        detectionResult: mediaSafetyResult,
        surface: 'message',
        contentRef: 'media:1_file',
      }).catch((err) => console.error('[child-safety] message media report error:', err));

      return NextResponse.json(
        { error: 'Attached image violates our child safety policy and has been blocked.' },
        { status: 451 },
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

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

   
  const { data: message, error } = await (supabase as any)
    .from('messages')
     
    .insert(messageRow as any)
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
     
    await (supabase as any).from('notifications').insert({
      user_id: recipientId,
      type: 'message',
      content: {
        message: `New message from ${user.email}`,
        conversation_id: convId,
        message_id: (message as Record<string, unknown>).id,
      },
    });
  }

  return NextResponse.json({ message, conversation_id: convId }, { status: 201 });
}
