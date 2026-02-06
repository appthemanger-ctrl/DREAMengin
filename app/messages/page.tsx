import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MessagesClient from '@/components/MessagesClient';

export default async function MessagesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      participant1:profiles!participant1_id(id, handle, display_name, avatar_url),
      participant2:profiles!participant2_id(id, handle, display_name, avatar_url)
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  // Get the other participant for each conversation
  const formattedConversations = (conversations || []).map(conv => {
    const otherParticipant = conv.participant1_id === user.id 
      ? conv.participant2 
      : conv.participant1;
    return {
      id: conv.id,
      otherUser: otherParticipant,
      updatedAt: conv.updated_at,
    };
  });

  // Demo conversations if none exist
  const demoConversations = [
    { 
      id: 'demo-1', 
      otherUser: { id: 'demo-user-1', display_name: 'Dr. Eams', handle: 'dreams', avatar_url: '/dr-eams.jpeg' },
      lastMessage: 'Your project looks amazing! Let me know if you need help.',
      updatedAt: new Date().toISOString(),
    },
    { 
      id: 'demo-2', 
      otherUser: { id: 'demo-user-2', display_name: 'Night Producer', handle: 'nightbeats', avatar_url: null },
      lastMessage: 'Just sent you the new beat. Check it out!',
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const displayConversations = formattedConversations.length > 0 ? formattedConversations : demoConversations;

  return (
    <MessagesClient 
      userId={user.id}
      initialConversations={displayConversations}
    />
  );
}
