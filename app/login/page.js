export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function Login() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Login or create account</h2>
      <form className="card space-y-3" method="post" action="/api/auth/magic-link">
        <label className="block">
          <span className="text-sm">Email</span>
          <input name="email" type="email" required placeholder="you@example.com"
                 className="mt-1 w-full rounded-md px-3 py-2 bg-white/5 border border-white/10" />
        </label>
        <button className="btn w-full" type="submit">Send magic link</button>
      </form>

      <div className="text-center text-sm text-white/70">or</div>

      <Link href="/home" className="btn w-full">Continue as guest</Link>
    </div>
  );
}
