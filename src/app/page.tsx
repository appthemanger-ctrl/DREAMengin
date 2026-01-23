import Link from 'next/link'

export default function Page() {
  return (
    <main id="main" className="max-w-5xl mx-auto px-6 py-20">
      <div className="glass p-10 rounded-3xl">
        <h1 className="font-display text-4xl mb-2">Dreampage — your home on the internet</h1>
        <p className="text-slate-300 mb-6">Claim a private home feed, a public profile, and DMs where you decide what shows up.</p>
        <div className="flex gap-3">
          <Link href="/login" className="btn-primary">Create account</Link>
          <Link href="/home" className="px-4 py-2 rounded-xl border border-white/10 bg-white/5">Continue as guest</Link>
        </div>
      </div>
    </main>
  )
}
