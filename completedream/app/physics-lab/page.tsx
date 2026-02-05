import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PhysicsLab from '@/components/PhysicsLab';

export default async function PhysicsLabPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return <PhysicsLab />;
}
