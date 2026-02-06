import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HomeDashboard from '@/components/HomeDashboard';
import type { Database } from '@/types/supabase';

type FeedItemRow = Database['public']['Tables']['feed_items']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type WidgetInstanceRow = Database['public']['Tables']['widget_instances']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

type FeedItemWithProfile = FeedItemRow & {
  profiles: Pick<ProfileRow, 'display_name' | 'handle' | 'avatar_url'>;
};

export default async function Home() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: feedData } = await supabase
    .from('feed_items')
    .select(`*, profiles!inner(display_name, handle, avatar_url)`)
    .returns<FeedItemWithProfile[]>()
    .eq('user_id', user.id)
    .order('ts', { ascending: false })
    .limit(50);

  const { data: widgetsData } = await supabase
    .from('widget_instances')
    .select('*')
    .returns<WidgetInstanceRow[]>()
    .eq('user_id', user.id)
    .order('order', { ascending: true });

  const { data: notificationsData } = await supabase
    .from('notifications')
    .select('*')
    .returns<NotificationRow[]>()
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: unreadMessagesCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'message')
    .eq('read', false);

  return (
    <HomeDashboard
      feed={feedData ?? []}
      widgets={widgetsData ?? []}
      userId={user.id}
      notifications={notificationsData ?? []}
      unreadMessages={unreadMessagesCount ?? 0}
    />
  );
}
