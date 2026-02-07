import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WidgetFeedScreen from '@/components/v1-ui/WidgetFeedScreen';

export default async function Home() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return <WidgetFeedScreen />;
}
