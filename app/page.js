export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function Landing() {
  return (
    <section className="grid lg:grid-cols-2 gap-8 items-center">
      <div className="space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Dreampage — your home on the internet
        </h1>
        <p className="text-white/80 text-lg">
          A private, customizable homepage that pulls your world into one calm feed —
          widgets, promos, releases — your rules.
        </p>
        <div className="flex gap-3">
          <Link className="btn" href="/login">Create account</Link>
          <Link className="btn" href="/home">Continue as guest</Link>
        </div>
        <ul className="text-white/70 text-sm list-disc pl-5 space-y-1">
          <li>Your feed, your rules (caps, mutes, pins)</li>
          <li>Drag-and-drop bubble widgets</li>
          <li>Creator tools: promos, releases, ad slots</li>
        </ul>
      </div>
      <div className="card">
        <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan-400/30 animate-hue" />
        <div className="text-white/70 text-sm mt-3">Live theme animation preview</div>
      </div>
    </section>
  );
}
