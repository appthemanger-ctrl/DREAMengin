// app/(marketing)/page.tsx
// Static landing page — no client components, no Supabase.
import Link from 'next/link';

export const metadata = {
  title: 'Dreampage — your home on the internet',
  description: 'Create an account, log in, or visit the admin tools.',
};

export default function MarketingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-black via-[#0a0a12] to-black">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(90deg,#60a5fa_0%,#a78bfa_50%,#f472b6_100%)] animate-[pulse_4s_ease-in-out_infinite]">
          Dreampage
        </h1>

        <p className="mt-4 text-slate-300">
          your home on the internet
        </p>

        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="px-5 py-3 rounded-md border border-white/20 bg-white/5 hover:bg-white/10 transition text-white text-sm font-medium"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="px-5 py-3 rounded-md border border-white/20 bg-white/5 hover:bg-white/10 transition text-white text-sm font-medium"
          >
            Log in
          </Link>
          <Link
            href="/admin"
            className="px-5 py-3 rounded-md border border-white/20 hover:bg-white/10 transition text-white/70 text-sm"
          >
            Admin
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          (Search is no longer the default view. Use your nav to open it when needed.)
        </p>
      </div>
    </main>
  );
}
