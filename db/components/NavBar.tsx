import Link from "next/link";
import Image from "next/image";
import { supaServer } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function NavBar() {
  const s = supaServer();
  const { data: { user } } = await s.auth.getUser();

  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin')?.value === '1';

  let handle: string | null = null;
  if (user) {
    const { data: prof } = await s
      .from("profiles")
      .select("handle")
      .eq("user_id", user.id)
      .maybeSingle();
    handle = prof?.handle ?? null;
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-black/20 border-b border-white/60 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" width={36} height={36} alt="DREAMengin" className="object-contain" />
          <span className="font-semibold tracking-tight">DREAMengin</span>
        </Link>
        <nav className="ml-6 hidden sm:flex items-center gap-4 text-sm">
          <Link href="/music">Music</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/home">Dashboard</Link>
          {isAdmin && <Link href="/admin">Admin</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user && handle ? <Link href={`/profile/${handle}`}>@{handle}</Link> : user ? <Link href="/home">Dashboard</Link> : <Link href="/login">Login</Link>}
        </div>
      </div>
    </header>
  );
}
