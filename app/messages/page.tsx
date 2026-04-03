import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MessagesClient from '@/components/MessagesClient';
import { connection } from 'next/server';


interface MessagesPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Read URL params — supports from=dr-eams&q=<query> routing from DrEamsSearchBar
  const params = searchParams ? await searchParams : {};
  const fromDrEams = params.from === 'dr-eams';
  const initialQuery = typeof params.q === 'string' ? params.q : '';

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

  const displayConversations = formattedConversations;

  return (
    <MessagesClient 
      userId={user.id}
      initialConversations={displayConversations}
      fromDrEams={fromDrEams}
      initialDrEamsQuery={initialQuery}
    />
  );
}
