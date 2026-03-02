import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DayDreamShell from '@/components/daydream/DayDreamShell';
import StudioFace from '@/components/daydream/music/StudioFace';
import ReleasesFace from '@/components/daydream/music/ReleasesFace';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Music – DREAMengin', description: 'Record, produce, and release your music.' };

export default async function MusicDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DayDreamShell
      dreamId="music"
      faceALabel="Studio"   faceAIcon="��"
      faceBLabel="Releases" faceBIcon="📀"
      faceA={<StudioFace />}
      faceB={<ReleasesFace />}
      accent="#a855f7"
    />
  );
}
