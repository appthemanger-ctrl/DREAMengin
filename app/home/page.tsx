import { createServerClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/DashboardLayout';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user's feed items
  const { data: feed } = await supabase
    .from('feed_items')
    .select(`
      *,
      profiles!inner(display_name, handle, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('ts', { ascending: false })
    .limit(50);

  // Fetch user's widgets
  const { data: widgets } = await supabase
    .from('widget_instances')
    .select('*')
    .eq('user_id', user.id)
    .order('order');

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <DashboardLayout 
      feed={feed || []} 
      widgets={widgets || []} 
      userId={user.id}
      notifications={notifications || []}
    />
  );
}