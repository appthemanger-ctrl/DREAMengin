
import Link from 'next/link';
import Image from 'next/image';
import { supaServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function NavBar() {
  const s = supaServer();
  const { data: { user } } = await s.auth.getUser();
  const isAdmin = cookies().get('admin')?.value === '1';

  // Fetch profile handle for quick link
  let handle: string | null = null;
  if (user) {
    const { data: prof } = await s.from('profiles').select('handle').eq('user_id', user.id).maybeSingle();
    handle = prof?.handle ?? null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 border-b">
      <div className="max-w-6xl mx-auto px-3 py-2 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="dreampage" width={28} height={28} className="rounded-md" />
          <span className="font-semibold tracking-tight">dreampage</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/discover">Discover</Link>
          <Link href="/ads">Ads</Link>
          <Link href="/lab">Lab</Link>
          <Link href="/music">Music</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/shop/me">My Shop</Link>
          {isAdmin && <Link href="/admin" className="font-medium">Admin</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user && handle && <Link className="text-sm underline" href={`/profile/${handle}`}>My Profile</Link>}
          {user ? <Link className="btn" href="/home">Dashboard</Link> : <Link className="btn" href="/login">Login</Link>}
        </div>
      </div>
    </header>
  );
}
