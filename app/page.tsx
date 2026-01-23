import Link from 'next/link';

export default function Landing() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="font-display text-4xl md:text-6xl font-bold text-white drop-shadow">Dreampage — your home on the internet</h1>
      <p className="mt-4 text-slate-100/90 max-w-2xl">
        A private, customizable homepage that pulls your world into one calm feed — widgets, promos, releases — your rules.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/login" className="bg-brandA text-white rounded-xl px-5 py-3">Create account</Link>
        <Link href="/home" className="bg-brandB text-white rounded-xl px-5 py-3">Continue as guest</Link>
      </div>
      <div className="glass mt-10 p-6">
        <p className="text-sm text-slate-200">Live theme animation preview</p>
        <div className="h-32 rounded-xl mt-3" style={{ background: 'var(--bg-gradient)' }} />
      </div>
    </main>
  );
}
