import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_0%,var(--glow),transparent_60%)] bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">
            DreamEngin — your privacy-first <span className="text-cyan-300">Creator OS</span>
          </h1>
          <p className="text-slate-300 leading-relaxed">
            Not another feed. A desktop-like home where you control what’s public, what’s friends-only, and what stays private.
            Build your identity, drops, modules, and your whole “career machine” in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {user ? (
            <Link href="/app" className="rounded-xl px-5 py-3 bg-cyan-500 text-slate-950 font-semibold">
              Open your Dream Home
            </Link>
          ) : (
            <Link href="/login" className="rounded-xl px-5 py-3 bg-cyan-500 text-slate-950 font-semibold">
              Login / Create account
            </Link>
          )}

          <Link href="/discover" className="rounded-xl px-5 py-3 border border-slate-700 text-slate-100">
            Discover
          </Link>

          <Link href="/@owner" className="rounded-xl px-5 py-3 border border-slate-700 text-slate-100">
            View example Dream Page
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
          <h2 className="text-xl font-semibold">What you’ll be able to do</h2>
          <ul className="list-disc pl-5 text-slate-300 space-y-2">
            <li>Private Dream Home (owner view): modules/windows/dock, drafts, tools, settings.</li>
            <li>Public Dream Page: a curated, shareable page (MySpace vibe, modern UX).</li>
            <li>Mini-Wall: slow ambient feed you control, friend-by-friend + platform-by-platform.</li>
            <li>InnerDreams AI: helps create and can automate updates (Level 2 later via PRs).</li>
          </ul>
        </div>

        <footer className="text-xs text-slate-500">
          © {new Date().getFullYear()} DREAMENGIN — privacy-first creator OS
        </footer>
      </div>
    </div>
  );
}
