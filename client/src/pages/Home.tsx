import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Private Dream Home</div>
            <div className="text-2xl font-semibold">Welcome, {user?.username}</div>
          </div>
          <button
            className="rounded-xl px-4 py-2 border border-slate-700"
            onClick={async () => {
              await logout();
              window.location.href = "/";
            }}
          >
            Logout
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
          <div className="text-slate-300">
            This is your private dashboard. Next we’ll bring back the full desktop-like modules/windows UI once everything is stable.
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/" className="rounded-xl px-4 py-2 border border-slate-700">Public Home</Link>
            <Link href={`/@${user?.username ?? "owner"}`} className="rounded-xl px-4 py-2 border border-slate-700">Your Dream Page</Link>
            <Link href="/discover" className="rounded-xl px-4 py-2 border border-slate-700">Discover</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
