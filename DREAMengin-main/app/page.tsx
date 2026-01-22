
import { redirect } from 'next/navigation';
import { supaServer } from '@/lib/supabase/server';
export default async function Page(){
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  redirect(user ? '/home' : '/discover');
}
