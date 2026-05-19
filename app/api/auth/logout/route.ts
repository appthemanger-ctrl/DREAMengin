import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET( ): Promise<NextResponse> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/');
}