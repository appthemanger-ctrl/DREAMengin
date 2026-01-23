
import Link from "next/link";
import { supaServer } from "@/lib/supabase/server";

export default async function NavBar(){
  const s = await supaServer();
  const { data: { user } } = await s.auth.getUser();

  return (
    <header className="sticky top-0 z-40 bg-white/60 dark:bg-black/30 backdrop-blur border-b border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{background: "var(--brand)"}} />
          <span className="font-semibold tracking-tight">DREAMengin</span>
        </Link>

        <nav className="ml-6 hidden sm:flex items-center gap-4 text-sm opacity-90">
          <Link href="/music">Music</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/home">Dashboard</Link>
        </nav>

        <div className="ml-auto">
          {user ? (
            <Link href="/home" className="btn-outline">Dashboard</Link>
          ) : (
            <Link href="/login" className="btn">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
