// SURFACE: dreamsurface.SettingsControls  (framework-mandated basename: page.tsx)
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import ControlsClient from './dream.ControlsClient';

export const metadata = { title: 'Controls – Dreamengin Settings' };

export default async function ControlsSettingsPage( ){
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ControlsClient />;
}