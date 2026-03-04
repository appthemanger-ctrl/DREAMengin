import Nav from '@/components/Nav'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="de-section">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold de-gradient-text mb-6">About DREAMengin</h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            We built DREAMengin because the creator economy was broken. Platforms took too much, paid too little,
            and treated creators like products. We flipped that.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              To give every creator — designer, musician, developer, storyteller — the tools, community,
              and economic infrastructure to build a sustainable creative life.
            </p>
            <Link href="/join" className="de-btn-gold">Join the Movement <ArrowRight size={16}/></Link>
          </div>
          <div className="relative h-64 rounded-2xl overflow-hidden bg-de-card flex items-center justify-center">
            <Image src="/logo_transparent.png" alt="About" fill className="object-contain p-8" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[['2022','Founded with a vision'],['2023','Launched beta — 10K creators'],['2026','50K creators, $2M paid out']].map(([year, label]) => (
            <div key={year} className="de-card p-6 text-center">
              <div className="text-3xl font-bold de-gradient-text mb-2">{year}</div>
              <p className="text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
