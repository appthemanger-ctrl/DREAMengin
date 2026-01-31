import { createServerClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/DashboardLayout';
import { redirect } from 'next/navigation';
import HomeDashboard from '@/components/HomeDashboard';

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
    .eq('user_id', user.id)
    .order('ts', { ascending: false })
    .limit(50);

  // Fetch user's widgets
  const { data: widgetsData } = await supabase
    .from('widget_instances')
    .select('*')
    .eq('user_id', user.id)
    .order('order');

  // Fetch notifications
  const { data: notificationsData } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch unread messages count
  const { count: unreadMessagesCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'message')
    .eq('read', false);

  // Demo feed data
  const demoFeed = [
    {
      id: 'demo-1',
      type: 'post',
      content: { text: 'Just launched my new AI-powered music generator! Check it out in the Labs section. Been working on this for months and finally ready to share.', title: 'New Project Launch' },
      ts: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      profiles: { display_name: 'Dr. Eams', handle: 'dreams', avatar_url: '/dr-eams.jpeg' }
    },
    {
      id: 'demo-2',
      type: 'post',
      content: { text: 'The universe is not only queerer than we suppose, but queerer than we can suppose. Working on visualizing quantum entanglement in 3D today.' },
      ts: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      profiles: { display_name: 'Quantum Lab', handle: 'quantum', avatar_url: null }
    },
    {
      id: 'demo-3',
      type: 'post',
      content: { text: 'New beat just dropped! Link in my music page. Inspired by late night coding sessions and too much coffee.' },
      ts: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      profiles: { display_name: 'Night Producer', handle: 'nightbeats', avatar_url: null }
    },
    {
      id: 'demo-4',
      type: 'post',
      content: { text: 'Just hit 1000 followers! Thanks everyone for the support. More exciting content coming soon - including a collaboration with some amazing creators here.' },
      ts: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      profiles: { display_name: 'Creative Mind', handle: 'creative', avatar_url: null }
    },
  ];

  // Demo notifications
  const demoNotifications = [
    { id: 'notif-1', type: 'like', message: 'Dr. Eams liked your post', read: false },
    { id: 'notif-2', type: 'follow', message: 'Quantum Lab started following you', read: false },
    { id: 'notif-3', type: 'comment', message: 'Night Producer commented on your track', read: false },
  ];

  const feed = feedData && feedData.length > 0 ? feedData : demoFeed;
  const widgets = widgetsData || [];
  const notifications = notificationsData && notificationsData.length > 0 ? notificationsData : demoNotifications;
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
