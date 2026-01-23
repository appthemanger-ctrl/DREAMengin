// components/NavBar.tsx
import Link from 'next/link';
import Image from 'next/image';
import { supaServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function NavBar() {
  const s = supaServer();
  const { data: { user } } = await s.auth.getUser();
  const isAdmin = (await cookies()).get('admin')?.value === '1';

  let handle: string | null = null;
  if (user) {
    const { data: prof } = await s
      .from('profiles')
      .select('handle')
      .eq('user_id', user.id)
      .maybeSingle();
    handle = prof?.handle ?? null;
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-black/20 border-b border-white/60 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-lg bg-[var(--brand)] grid place-items-center text-white font-bold shadow-glass">
            D
          </div>
          <span className="font-semibold tracking-tight group-hover:opacity-90">
            dreampage
          </span>
        </Link>

        <nav className="ml-6 hidden sm:flex items-center gap-4 text-sm">
          <Link href="/discover" className="hover:text-[var(--brand)]">Discover</Link>
          <Link href="/music" className="hover:text-[var(--brand)]">Music</Link>
          <Link href="/shop" className="hover:text-[var(--brand)]">Shop</Link>
          <Link href="/lab" className="hover:text-[var(--brand)]">Lab</Link>
          {isAdmin && (
            <Link href="/admin" className="text-[var(--brand)] font-medium">Admin</Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user && handle ? (
            <>
              <Link href={`/profile/${handle}`} className="text-sm hover:text-[var(--brand)]">
                @{handle}
              </Link>
              <Link href="/home" className="btn">Dashboard</Link>
            </>
          ) : (
            <Link href="/login" className="btn">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
