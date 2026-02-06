import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HomeDashboard from '@/components/HomeDashboard';
import type { FeedItemWithProfile } from '@/types/supabase-joins';

export default async function Home() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user's feed items
  const { data: feedData } = await supabase
    .from('feed_items')
    .select(`
      *,
      profiles!inner(display_name, handle, avatar_url)
    `)
    .returns<FeedItemWithProfile[]>()
    .eq('user_id', user.id)
    .order('ts', { ascending: false })
    .limit(50);

  // Fetch user's widgets
  const { data: widgetsData } = await supabase
    .from('widget_instances')
    .select('*')
    .returns<FeedItemWithProfile[]>()
    .eq('user_id', user.id)
    .order('order');

  // Fetch notifications
  const { data: notificationsData } = await supabase
    .from('notifications')
    .select('*')
    .returns<FeedItemWithProfile[]>()
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch unread messages count
  const { count: unreadMessagesCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .returns<FeedItemWithProfile[]>()
    .eq('user_id', user.id)
    .eq('type', 'message')
    .eq('read', false);

  // Demo feed data
  // Demo notifications
  const feed = feedData ?? [];
  const widgets = widgetsData || [];
  const notifications = notificationsData ?? [];
  const unreadMessages = unreadMessagesCount || 2;

  return (
    <HomeDashboard 
      feed={feed} 
      widgets={widgets} 
      userId={user.id}
      notifications={notifications}
      unreadMessages={unreadMessages}
    />
  );
}
