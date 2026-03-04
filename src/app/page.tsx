import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav'
import LogoHero from '@/components/LogoHero'
import { ArrowRight, Zap, Shield, Globe, Star, Users, TrendingUp } from 'lucide-react'

const features = [
  { icon: Zap,        title: 'AI-Powered Tools',    desc: 'Three AIs — EAMS, IDARI, Boogieman — each specialised for your workflow.', color: 'de-sky' },
  { icon: Globe,      title: 'Decentralised',        desc: 'Own your content, data, and identity. No lock-in, ever.',                  color: 'de-gold' },
  { icon: Shield,     title: 'Creator-First',        desc: 'Revenue splits that actually make sense. Build a real business.',          color: 'de-sky' },
  { icon: TrendingUp, title: 'Marketplace',          desc: 'Sell your work directly — digital goods, services, and beyond.',          color: 'de-gold' },
  { icon: Users,      title: 'Community',            desc: 'Profiles, follows, messages, and a feed built for makers.',               color: 'de-sky' },
  { icon: Star,       title: 'Premium Content',      desc: 'Gate your best work with tiers your fans actually want.',                 color: 'de-gold' },
]

const stats = [
  { value: '50K+',  label: 'Creators' },
  { value: '$2M+',  label: 'Paid Out' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★',  label: 'Rating' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="de-section">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
            {/* Left copy */}
            <div className="flex flex-col gap-6 animate-fade-up">
              <span className="de-badge de-badge-sky w-fit">
                <Zap size={12} /> Now in Open Beta
              </span>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Build the world{' '}
                <span className="de-gradient-text">you dream of</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                DREAMengin is the decentralised creative platform that puts
                creators first — AI tools, a real marketplace, and a community
                that has your back.
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <Link href="/join"    className="de-btn-gold text-base px-6 py-3">
                  Start for Free <ArrowRight size={18} />
                </Link>
                <Link href="/about"  className="de-btn-ghost text-base px-6 py-3">
                  Learn More
                </Link>
              </div>
              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4 border-t border-de-border mt-2">
                {stats.map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold de-gold-text">{s.value}</div>
                    <div className="text-sm text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right character */}
            <div className="flex justify-center lg:justify-end">
              <LogoHero />
            </div>
          </div>
        </div>

        {/* Decorative grid lines */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(125,211,252,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </section>

      {/* Features */}
      <section className="de-section">
        <div className="text-center mb-16">
          <span className="de-badge de-badge-gold mx-auto mb-4">Features</span>
          <h2 className="text-4xl font-bold de-gradient-text mb-4">Everything you need</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            One platform. Infinite possibilities. No middlemen.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="de-card p-6 hover:shadow-sky-glow transition-all group cursor-default">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4
                ${f.color === 'de-sky' ? 'bg-sky-500/15 text-de-sky' : 'bg-amber-500/15 text-de-gold-light'}`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-de-sky transition-colors">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Triad section */}
      <section className="de-section border-t border-de-border">
        <div className="text-center mb-16">
          <span className="de-badge de-badge-sky mx-auto mb-4">AI Triad</span>
          <h2 className="text-4xl font-bold mb-4">Meet your <span className="de-gradient-text">AI crew</span></h2>
          <p className="text-slate-400 max-w-xl mx-auto">Three specialised intelligences working for you around the clock.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { src: '/images/idari1.PNG',  name: 'IDARI',     role: 'Admin Intelligence',    desc: 'Handles ops, moderation, and platform health. The backbone.',     badge: 'de-gold', href: '/api/ai/idari' },
            { src: '/images/hero3.PNG',   name: 'EAMS',      role: 'Creative Intelligence', desc: 'Your creative partner — brainstorm, write, design, ideate.',       badge: 'de-sky',  href: '/api/ai/eams' },
            { src: '/images/Boogie1.PNG', name: 'Boogieman', role: 'Street Intelligence',   desc: 'Culture, trends, community pulse. Keeps it real on the streets.',  badge: 'de-gold', href: '/api/ai/boogieman' },
          ].map(ai => (
            <div key={ai.name} className="de-card overflow-hidden group hover:shadow-sky-glow transition-all">
              <div className="relative h-48 overflow-hidden bg-gradient-to-b from-de-card to-de-navy">
                <Image src={ai.src} alt={ai.name} fill className="object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-de-card via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <span className={`de-badge mb-3 ${ai.badge === 'de-sky' ? 'de-badge-sky' : 'de-badge-gold'}`}>
                  {ai.role}
                </span>
                <h3 className="text-xl font-bold mb-2">{ai.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{ai.desc}</p>
                <a href={ai.href} className="de-btn-primary text-sm w-full justify-center">
                  Try {ai.name} <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="de-section text-center border-t border-de-border">
        <div className="de-card inline-block p-12 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 de-gradient-text">Ready to build?</h2>
          <p className="text-slate-400 mb-8 text-lg">Join 50,000+ creators who already chose their dream.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/join"     className="de-btn-gold text-lg px-8 py-3">Get Started Free</Link>
            <Link href="/discover" className="de-btn-ghost text-lg px-8 py-3">Explore Creators</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-de-border py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo-icon.png" alt="" width={28} height={28} className="rounded" />
                <span className="font-bold de-gold-text">DREAMengin</span>
              </div>
              <p className="text-slate-500 text-sm">Build the world you dream of.</p>
            </div>
            {[
              { title: 'Platform', links: [['Discover','/discover'],['Marketplace','/marketplace'],['Shop','/shop'],['Home Feed','/home']] },
              { title: 'Creators', links: [['Join Free','/join'],['Profile','/profile'],['Settings','/settings'],['Messages','/messages']] },
              { title: 'Company',  links: [['About','/about'],['Policy','/policy'],['Login','/login']] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm text-slate-300 mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-slate-500 hover:text-de-sky transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-de-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">© 2026 DREAMengin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
