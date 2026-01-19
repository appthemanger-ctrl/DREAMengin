import { useEffect, useState } from "react";
import { Link } from "wouter";

type ProfileData = { user: { id: string; username: string } };

export default function Profile({ username }: { username: string }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/profiles/${encodeURIComponent(username)}`, { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as ProfileData;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">@{username}</h1>
          <Link href="/" className="text-sm underline text-slate-300">Home</Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-red-300">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
            <div className="text-slate-300">Public Dream Page (curated modules will render here next).</div>
            <div className="text-lg font-semibold">{data.user.username}</div>
          </div>
        ) : !error ? (
          <div className="text-slate-400">Loading…</div>
        ) : null}
      </div>
    </div>
  );
}
