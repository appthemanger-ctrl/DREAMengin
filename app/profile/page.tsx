import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import ProfileCanvas from '@/components/profile/ProfileCanvas';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Profile – Dreamengin', description: 'Your profile — edit and choose what the world sees.' };

export default async function ProfileEditorPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name, bio, avatar_url, location, website')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <User className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Edit ProfileDream</h1>
          <span className="ml-auto text-xs" style={{ color: 'var(--de-text-dim)' }}>@{profile.handle}</span>
        </div>
      </header>

      <ProfileCanvas initialProfile={profile} />
    </div>
  );
}
