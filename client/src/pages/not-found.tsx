import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="text-2xl font-semibold">404</div>
        <div className="text-slate-300">That page doesn’t exist.</div>
        <Link href="/" className="inline-block rounded-xl px-4 py-2 bg-cyan-500 text-slate-950 font-semibold">
          Go home
        </Link>
      </div>
    </div>
  );
}
