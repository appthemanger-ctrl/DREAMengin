// SURFACE: dreamsurface.DaydreamConstellation  (framework-mandated basename: page.tsx)
import { isDevBypassActive } from '@/lib/dev-bypass';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import ConstellationClient from './dream.ConstellationClient';

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