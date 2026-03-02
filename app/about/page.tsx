import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Globe,
  Music2,
  FlaskConical,
  Store,
  MessageSquare,
  LayoutDashboard,
  Settings2,
  Lock,
  BrainCircuit,
  Heart,
  ArrowRight,
  Twitter,
  CircleUser,
} from 'lucide-react';
import PlatformBadge from '@/components/ui/PlatformBadge';

export default function AboutPage() {

  const features = [
    {
      icon: ShieldCheck,
      title: 'Privacy-First',
      description: 'Your data belongs to you. End-to-end encryption, no tracking, no selling your info. We built DreamEngin to respect your privacy at every level.',
      color: 'from-emerald-400 to-teal-500',
    },
    {
      icon: BrainCircuit,
      title: 'AI-Powered Tools',
      description: 'Inner Dreams AI helps you create, organize, and explore. Get intelligent suggestions, automate tasks, and unlock your creative potential.',
      color: 'from-blue-400 to-cyan-500',
    },
    {
      icon: Globe,
      title: 'Social Connections',
      description: 'Discover and connect with creators who share your passions. Follow, message, collaborate, and build your community.',
      color: 'from-sky-400 to-blue-500',
    },
    {
      icon: Music2,
      title: 'Music Integration',
      description: 'Share your music, embed tracks from YouTube and Spotify, and showcase your sound. Perfect for artists, producers, and music lovers.',
      color: 'from-violet-400 to-purple-500',
    },
    {
      icon: FlaskConical,
      title: 'Creative Labs',
      description: 'Build and share interactive experiments. Physics simulations, data visualizations, AI projects — your playground for innovation.',
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: Store,
      title: 'Merch Shop',
      description: 'Sell your creations directly to your audience. Set up your store, list items, and earn from your work — all within the platform.',
      color: 'from-rose-400 to-pink-500',
    },
  ];

  const navigationPrinciples = [
    {
      title: 'Spatial Navigation',
      description: 'Home, Profile, Feed, Messages, Marketplace, Lab, Music, Social Hub, and Settings live on a continuous plane.',
    },
    {
      title: 'Infinite Loop',
      description: 'Left meets right, up meets down, and zooming cycles layers so every direction eventually returns home.',
    },
    {
      title: 'Home Anchor ∞',
      description: 'Long press the logo, hold with haptics, or zoom out fully to snap back to the Home anchor.',
    },
  ];

  const spaces = [
    { name: 'Home',        path: '/home',       icon: Sparkles,       description: 'The gravitational center — Home Dreams and instant recall.' },
    { name: 'Profile',     path: '/profile/me', icon: CircleUser,     description: 'Living dashboards that morph from Home with public permissions.' },
    { name: 'Feed',        path: '/home',       icon: LayoutDashboard,description: 'Personal, social, widget, and AI-generated content.' },
    { name: 'Messages',    path: '/messages',   icon: MessageSquare,  description: 'Direct conversations and system signals layered into the plane.' },
    { name: 'Marketplace', path: '/shop',       icon: Store,          description: 'Sell widgets, beats, workflows, and creator goods natively.' },
    { name: 'Lab',         path: '/lab',        icon: FlaskConical,   description: 'Experiments, simulations, and research tools.' },
    { name: 'Music',       path: '/music',      icon: Music2,         description: 'Recording, sharing, and collaboration spaces for sound.' },
    { name: 'Social Hub',  path: '/discover',   icon: Globe,          description: 'Community clusters, discovery loops, and shared spaces.' },
    { name: 'Settings',    path: '/settings',   icon: Settings2,      description: 'System layer for privacy, security, and personalization.' },
  ];

  return (
    <div className="min-h-screen de-sky-bg">

      {/* Header */}
      <header className="sticky top-0 z-30 de-glass" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--de-text)', textDecoration: 'none' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back</span>
          </Link>
          <Link
            href="/join"
            className="de-btn de-btn-gold text-sm"
            style={{ minHeight: 36, padding: '0 18px' }}
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 pb-24 flex flex-col gap-16">

        {/* ── Hero ── */}
        <section className="text-center flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-3xl scale-150"
              style={{ background: 'radial-gradient(circle, rgba(42,138,184,0.18) 0%, transparent 70%)' }} />
            <Image
              src="/images/HeroAbout.PNG"
              alt="Dr. Eams — DREAMengin AI Companion"
              width={140}
              height={140}
              className="relative object-contain drop-shadow-xl"
              priority
            />
          </div>
          <div>
            <div className="de-badge mb-3">
              <Sparkles className="w-3 h-3" />
              Social Media Hub
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4" style={{ color: 'var(--de-heading)', letterSpacing: '-0.02em' }}>
              Welcome to{' '}
              <span style={{ color: 'var(--de-accent)' }}>DreamEngin</span>
            </h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--de-text-dim)' }}>
              A living interface system that turns your digital life into a navigable universe — one place to create, connect, and never have to leave.
            </p>
          </div>
        </section>

        {/* ── AI Team ── */}
        <section>
          <div className="de-tag text-center mb-6">Your AI companions</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Dr. Eams */}
            <div className="de-outer-shell flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl scale-125"
                  style={{ background: 'radial-gradient(circle, rgba(42,138,184,0.2) 0%, transparent 70%)' }} />
                <Image src="/images/HeroAbout.PNG" alt="Dr. Eams" width={88} height={88}
                  className="relative object-contain drop-shadow-lg" />
              </div>
              <div className="de-badge" style={{ fontSize: 9 }}>AI Guide</div>
              <h3 className="font-bold text-base" style={{ color: 'var(--de-heading)' }}>Dr. Eams</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--de-text-dim)' }}>
                Your always-present AI guide. Navigates, activates widgets, drafts content, and translates intent into motion.
              </p>
            </div>

            {/* Boogie */}
            <div className="de-outer-shell flex flex-col items-center text-center gap-3"
              style={{ borderColor: 'rgba(146,64,14,0.22)' }}>
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl scale-125"
                  style={{ background: 'radial-gradient(circle, rgba(200,152,26,0.2) 0%, transparent 70%)' }} />
                <Image src="/images/Boogie1.PNG" alt="Boogie" width={88} height={88}
                  className="relative object-contain drop-shadow-lg" />
              </div>
              <div className="de-badge" style={{ fontSize: 9, color: 'var(--de-gold)', borderColor: 'rgba(200,152,26,0.35)' }}>Safety Guardian</div>
              <h3 className="font-bold text-base" style={{ color: 'var(--de-heading)' }}>Boogie</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--de-text-dim)' }}>
                The silent guardian. Monitors for policy violations and harmful content — protecting the platform without disrupting your flow.
              </p>
            </div>

            {/* Idari */}
            <div className="de-outer-shell flex flex-col items-center text-center gap-3"
              style={{ borderColor: 'rgba(5,120,80,0.22)' }}>
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl scale-125"
                  style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)' }} />
                <Image src="/images/idari1.PNG" alt="Idari" width={88} height={88}
                  className="relative object-contain drop-shadow-lg" />
              </div>
              <div className="de-badge" style={{ fontSize: 9, color: '#0d9669', borderColor: 'rgba(5,120,80,0.3)' }}>System Intelligence</div>
              <h3 className="font-bold text-base" style={{ color: 'var(--de-heading)' }}>Idari</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--de-text-dim)' }}>
                The autonomous nervous system. Monitors performance, auto-repairs broken state, and keeps DREAMengin alive.
              </p>
            </div>

          </div>
        </section>

        {/* ── What Makes Us Different ── */}
        <section>
          <div className="de-tag text-center mb-6">Core Features</div>
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--de-heading)' }}>
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="de-tile flex gap-4 items-start" style={{ padding: 18 }}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--de-heading)', fontSize: 15 }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--de-text-dim)' }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Navigation Vision ── */}
        <section>
          <div className="de-tag text-center mb-6">How It Works</div>
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--de-heading)' }}>
            Unified Navigation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {navigationPrinciples.map((p) => (
              <div key={p.title} className="de-glass-blue" style={{ padding: '18px 20px' }}>
                <h3 className="font-bold mb-2" style={{ color: 'var(--de-accent)', fontSize: 14 }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--de-text-dim)' }}>{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Explore the Spaces ── */}
        <section>
          <div className="de-tag text-center mb-6">Platform Spaces</div>
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--de-heading)' }}>
            Explore the Spaces
          </h2>
          <div className="de-surface" style={{ padding: 0, overflow: 'hidden' }}>
            {spaces.map((space, i) => (
              <Link
                key={space.name}
                href={space.path}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="de-row"
                  style={{ borderTop: i > 0 ? '1px solid rgba(160,195,240,0.18)' : 'none', borderRadius: 0 }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(42,138,184,0.10)', border: '1px solid rgba(42,138,184,0.18)' }}>
                    <space.icon className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: 'var(--de-heading)' }}>{space.name}</div>
                    <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{space.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--de-text-dim)' }} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Privacy Promise ── */}
        <section>
          <div className="de-outer-shell" style={{ borderColor: 'rgba(5,120,80,0.22)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--de-heading)' }}>Our Privacy Promise</h2>
                <ul className="space-y-2">
                  {[
                    'We never sell your data to advertisers or third parties',
                    'End-to-end encryption on all private messages',
                    'Granular privacy controls on all your content',
                    'Delete your data anytime — we actually delete it',
                    'No behavioral tracking or surveillance capitalism',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--de-text)' }}>
                      <span className="flex-shrink-0 font-bold" style={{ color: '#0d9669' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Connect Everything ── */}
        <section className="text-center">
          <div className="de-tag mb-2">Integrations</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--de-heading)' }}>Connect Everything</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--de-text-dim)' }}>Bring all your platforms into one dream.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'instagram',  label: 'Instagram'  },
              { name: 'youtube',    label: 'YouTube'    },
              { name: 'spotify',    label: 'Spotify'    },
              { name: 'tiktok',     label: 'TikTok'     },
              { name: 'discord',    label: 'Discord'    },
              { name: 'twitch',     label: 'Twitch'     },
              { name: 'soundcloud', label: 'SoundCloud' },
              { name: 'reddit',     label: 'Reddit'     },
              { name: 'figma',      label: 'Figma'      },
              { name: 'dropbox',    label: 'Dropbox'    },
            ].map(({ name, label }) => (
              <Link key={name} href="/join" aria-label={`Connect ${label}`}
                className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                <PlatformBadge name={name} size={48} label={label} />
                <span className="text-xs font-medium" style={{ color: 'var(--de-text-dim)' }}>{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--de-heading)' }}>Ready to Navigate the Dream?</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--de-text-dim)' }}>Step into a universe where every gesture loops back to meaning.</p>
          <Link href="/login" className="de-btn de-btn-primary" style={{ display: 'inline-flex', gap: 8 }}>
            Create Your Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer className="pt-8 text-center" style={{ borderTop: '1px solid rgba(160,195,240,0.3)' }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src="/images/logo1.PNG" alt="DREAMengin" width={32} height={32}
              className="rounded-lg object-contain" />
            <span className="font-bold" style={{ color: 'var(--de-heading)' }}>DreamEngin</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <a href="https://x.com/dreamenginx" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 transition-opacity hover:opacity-100"
              style={{ opacity: 0.65, textDecoration: 'none', color: 'var(--de-text)' }}>
              <Twitter className="w-4 h-4" />
              <span className="text-sm">@dreamenginx</span>
            </a>
            <PlatformBadge name="instagram" size={32} label="Instagram" />
            <PlatformBadge name="tiktok"    size={32} label="TikTok"    />
          </div>
          <p className="text-xs flex items-center justify-center gap-1" style={{ color: 'var(--de-text-dim)' }}>
            Made with <Heart className="w-3 h-3" style={{ color: '#e55' }} /> for dreamers everywhere
          </p>
        </footer>

      </main>
    </div>
  );
}
