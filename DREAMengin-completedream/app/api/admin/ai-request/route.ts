import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const prompt = formData.get('prompt') as string;

  // Log the request
  await supabase
    .from('admin_audit_log')
    .insert({
      admin_id: user.id,
      action: 'ai_update_request',
      details: { prompt, status: 'pending' }
    });

  return redirect('/admin');
}
