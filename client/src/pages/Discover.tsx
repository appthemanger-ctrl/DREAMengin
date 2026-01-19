import { Link } from "wouter";

export default function Discover() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Discover</h1>
          <Link href="/" className="text-sm underline text-slate-300">Home</Link>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          Public feed + search comes next (drops, profiles, tags). This page is live and ready for wiring.
        </div>
      </div>
    </div>
  );
}
