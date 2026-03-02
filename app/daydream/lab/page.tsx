import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DayDreamShell from '@/components/daydream/DayDreamShell';
import ResearchFace from '@/components/daydream/lab/ResearchFace';
import SimulatorFace from '@/components/daydream/lab/SimulatorFace';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Lab – DREAMengin', description: 'Research, experiment, and simulate.' };

export default async function LabDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DayDreamShell
      dreamId="lab"
      faceALabel="Research"  faceAIcon="🧪"
      faceBLabel="Simulator" faceBIcon="⚗️"
      faceA={<ResearchFace />}
      faceB={<SimulatorFace />}
      accent="#22d3ee"
    />
  );
}
