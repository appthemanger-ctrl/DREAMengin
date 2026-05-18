// SURFACE: dreamsurface.DaydreamConstellation  (framework-mandated basename: page.tsx)
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { isDevBypassActive } from '@/lib/dev-bypass';
import ConstellationClient from './dream.ConstellationClient';
import { connection } from 'next/server';

export const metadata = {
  title: 'Dream Constellation — DREAMengin',
  description: 'An interactive 3-D node map of all your Dream Surfaces.',
};

export default async function ConstellationPage( ){
  await connection();
  const supabase = await createServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch { /* Supabase not configured — treat as unauthenticated */ }
  if (!user && !isDevBypassActive()) redirect('/login');

  return <ConstellationClient />;
}