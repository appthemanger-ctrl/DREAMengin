'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Theme } from '@/lib/theme';

export default function Header() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="flex items-center justify-between mb-8">
      <h1 className="font-display text-2xl text-white">DREAMengin</h1>
      <div className="flex items-center gap-4">
        <button onClick={Theme.toggle} className="text-sm text-slate-300">Toggle theme</button>
        <button onClick={logout} className="text-sm text-slate-300">Logout</button>
      </div>
    </header>
  );
}
