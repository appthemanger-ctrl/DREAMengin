// SURFACE: dreamsurface.DreamR  (framework-mandated basename: page.tsx)
import DreamRSection from '@/app/dreamdmbar/_components/dreamr/dreamsurface.dreamr';
import AuthenticatedPageHeader from '@/components/ui/dream.AuthenticatedPageHeader';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { safeGetUser } from '@/lib/supabase/safeGetUser';
import { createServerClient } from '@/lib/supabase/server';
import { Radio } from 'lucide-react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

export const metadata = {
  title: 'DreamR – DREAMengin',
  description: 'The DreamR human media platform: ranked feed, creator signal, publishing, and journey.',
};

const DEV_PROFILE = {
  handle: 'devdreamer',
  display_name: 'Dev Dreamer',
  avatar_url: null,
  bio: 'DreamR dev-bypass profile',
};

type DreamRProfile = {
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
};

export default async function DreamRPage( ){
  await connection();
  const supabase = await createServerClient();
  const user = await safeGetUser(supabase);
  const devBypass = isDevBypassActive();

  if (!user && !devBypass) redirect('/login');

  let profile: DreamRProfile | null = devBypass ? DEV_PROFILE : null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('handle, display_name, avatar_url, bio')
      .eq('id', user.id)
      .single();
    profile = data ?? null;
  }

  return (
    <div className="de-sky-bg min-h-screen pb-24">
      <AuthenticatedPageHeader
        backHref="/discover"
        title="DreamR"
        eyebrow="Human Media Platform"
        subtitle="Feed, creator signal, publishing, journey, and DreamR-ranked discovery — all on its own screen."
        badge="Live"
        icon={<Radio className="w-5 h-5 text-white" />}
        accentColor="#5ba8d4"
        containerClassName="max-w-5xl"
      />

      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="rounded-[28px] overflow-hidden border border-white/60 shadow-[0_24px_80px_rgba(91,168,212,0.22)] bg-white/40">
          <div style={{ height: 'calc(100vh - 190px)', minHeight: 720 }}>
            <DreamRSection profile={profile} initialPosts={[]} />
          </div>
        </div>
      </section>
    </div>
  );
}