import Link from 'next/link';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Music, 
  Beaker,
  MessageCircle,
  ShoppingBag,
  LayoutGrid,
  Settings,
  Lock,
  Cpu,
  Heart,
  ArrowRight,
  Twitter,
  Sparkles
} from 'lucide-react';
import PlatformBadge from '@/components/ui/PlatformBadge';

export default function AboutPage() {

  const features = [
    {
      icon: Shield,
      title: 'Privacy-First',
      description: 'Your data belongs to you. End-to-end encryption, no tracking, no selling your info. We built DreamEngin to respect your privacy at every level.',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Cpu,
      title: 'AI-Powered Tools',
      description: 'Inner Dreams AI helps you create, organize, and explore. Get intelligent suggestions, automate tasks, and unlock your creative potential.',
      color: 'from-purple-500 to-violet-600'
    },
    {
      icon: Users,
      title: 'Social Connections',
      description: 'Discover and connect with creators who share your passions. Follow, message, collaborate, and build your community.',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Music,
      title: 'Music Integration',
      description: 'Share your music, embed tracks from YouTube and Spotify, and showcase your sound. Perfect for artists, producers, and music lovers.',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Beaker,
      title: 'Creative Labs',
      description: 'Build and share interactive experiments. Physics simulations, data visualizations, AI projects - your playground for innovation.',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: ShoppingBag,
      title: 'Merch Shop',
      description: 'Sell your creations directly to your audience. Set up your store, list items, and earn from your work - all within the platform.',
      color: 'from-orange-500 to-amber-600'
    },
  ];

  const navigationPrinciples = [
    {
      title: 'Spatial Navigation (Not Pages)',
      description: 'Home, Profile, Feed, Messages, Marketplace, Lab, Music, Social Hub, and Settings live on a continuous plane.'
    },
    {
      title: 'Torus / Infinite Loop',
      description: 'Left meets right, up meets down, and zooming cycles layers so every direction eventually returns home.'
    },
    {
      title: 'Home Anchor (∞)',
      description: 'Long press the logo, hold with haptics, or zoom out fully to snap back to the Home anchor.'
    },
  ];

  const widgetSystem = [
    {
      title: 'Widget Rails',
      description: 'Top, bottom, left, and right rails keep 8 widgets visible while overflow scrolls around the view.'
    },
    {
      title: 'Capacity + Layers',
      description: 'Each surface holds up to 9 active widgets; advanced layers unlock up to 36 across depth.'
    },
    {
      title: 'Gesture Actions',
      description: 'Tap to preview, long press for menus, drag to reorder, pinch to resize, and throw into the feed to post.'
    },
  ];

  const spaces = [
    { name: 'HomeDream', path: '/homedream', icon: Sparkles, description: 'The gravitational center with Home Dreams and instant recall.' },
    { name: 'ViewProfile', path: '/view-profile', icon: Heart, description: 'Living dashboards that morph from Home with public permissions.' },
    { name: 'Feed', path: '/homedream', icon: LayoutGrid, description: 'A dynamic surface for personal, social, widget, and AI-generated content.' },
    { name: 'DreamDM', path: '/messages', icon: MessageCircle, description: 'Direct conversations and system signals layered into the plane.' },
    { name: 'DreamMarketplace', path: '/marketplace', icon: ShoppingBag, description: 'Sell widgets, beats, workflows, and creator goods natively.' },
    { name: 'Lab', path: '/lab', icon: Beaker, description: 'CCC experiments, simulations, and research tools.' },
    { name: 'Music', path: '/music', icon: Music, description: 'Recording, sharing, and collaboration spaces for sound.' },
    { name: 'Social Hub', path: '/discover', icon: Users, description: 'Community clusters, discovery loops, and shared spaces.' },
    { name: 'Settings', path: '/settings', icon: Settings, description: 'System layer for privacy, security, and personalization.' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)', color: 'var(--de-text)' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <Link href="/join" className="de-btn de-btn-primary text-xs" style={{ padding: '8px 18px' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-20">

        {/* Hero Section */}
        <section className="text-center mb-14">
          <div className="flex justify-center mb-6">
            <div style={{
              width: 100, height: 100, borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(42,138,184,0.15) 0%, rgba(200,152,26,0.12) 100%)',
              border: '1.5px solid rgba(42,138,184,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 52,
            }}>∞</div>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 12, lineHeight: 1.15 }}>
            Welcome to DREAMengin
          </h1>
          <p style={{ fontSize: 16, color: 'var(--de-text-dim)', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
            DREAMengin is a living interface system that turns your digital life into a navigable universe. Instead of apps, you move through connected spaces that loop, morph, and return home without friction.
          </p>
        </section>

        {/* ── Meet Dr. Eams ── */}
        <section className="mb-12">
          <div className="de-widget">
            <div className="de-widget-body" style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="sm:flex-row sm:items-center sm:gap-6">
                <div style={{ width: 80, height: 80, borderRadius: 20, flexShrink: 0, background: 'linear-gradient(135deg, rgba(42,138,184,0.14) 0%, rgba(42,138,184,0.08) 100%)', border: '1.5px solid rgba(42,138,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>∞</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--de-accent)', marginBottom: 4 }}>AI Companion</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 8 }}>Meet Dr. Eams</h2>
                  <p style={{ fontSize: 14, color: 'var(--de-text-dim)', lineHeight: 1.7 }}>
                    Dr. Eams is your always-present AI guide inside DREAMengin. Powered by the Inner Dreams intelligence layer, Dr. Eams helps you navigate the spatial interface, activate widgets, draft and post content, answer questions, and translate your intent into motion — all without leaving your current dream. Think of Dr. Eams as the mind that lives at the center of your universe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Meet Boogie ── */}
        <section className="mb-12">
          <div className="de-widget">
            <div className="de-widget-body" style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="sm:flex-row-reverse sm:items-center sm:gap-6">
                <div style={{ width: 80, height: 80, borderRadius: 20, flexShrink: 0, background: 'linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(200,152,26,0.08) 100%)', border: '1.5px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👾</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b5cf6', marginBottom: 4 }}>Safety Guardian</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 8 }}>Meet Boogie</h2>
                  <p style={{ fontSize: 14, color: 'var(--de-text-dim)', lineHeight: 1.7 }}>
                    Boogie is the silent guardian of DREAMengin. Operating as the platform's safety and moderation layer, Boogie monitors for policy violations, harmful content, and suspicious activity — stepping in before problems reach users. Boogie doesn't interfere with your creative flow; it works in the background so your dreams stay safe, fair, and protected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Meet Idari ── */}
        <section className="mb-12">
          <div className="de-widget">
            <div className="de-widget-body" style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="sm:flex-row sm:items-center sm:gap-6">
                <div style={{ width: 80, height: 80, borderRadius: 20, flexShrink: 0, background: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(200,152,26,0.08) 100%)', border: '1.5px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🧠</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#10b981', marginBottom: 4 }}>System Intelligence</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 8 }}>Meet iDari</h2>
                  <p style={{ fontSize: 14, color: 'var(--de-text-dim)', lineHeight: 1.7 }}>
                    iDari is the autonomous system intelligence that keeps DREAMengin healthy and self-healing. While you dream, iDari silently monitors performance, auto-repairs broken state, maintains widget integrity, and surfaces insights to the platform team. iDari is the reason DREAMengin feels alive — it's the nervous system behind everything that just works.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Unified Interface Vision */}
        <section className="mb-12">
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 20, textAlign: 'center' }}>Unified Interface &amp; Navigation Vision</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {navigationPrinciples.map((principle) => (
              <div key={principle.title} className="de-widget">
                <div className="de-widget-body">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>{principle.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>{principle.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Widget System */}
        <section className="mb-12">
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 20, textAlign: 'center' }}>Widget Rails &amp; Layers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {widgetSystem.map((item) => (
              <div key={item.title} className="de-widget">
                <div className="de-widget-body">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Features */}
        <section className="mb-12">
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 20, textAlign: 'center' }}>What Makes Us Different</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {features.map((feature) => (
              <div key={feature.title} className="de-widget">
                <div className="de-widget-body">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${feature.color.replace('from-', '').replace(' to-', ', ')})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <feature.icon className="w-5 h-5" style={{ color: '#fff' }} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>{feature.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pages Overview */}
        <section className="mb-12">
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 20, textAlign: 'center' }}>Explore the Spaces</h2>
          <div className="de-widget">
            <div className="de-widget-body" style={{ padding: '6px 8px' }}>
              {spaces.map((page) => (
                <Link key={page.name} href={page.path} className="de-row" style={{ borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <page.icon className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--de-heading)' }}>{page.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>{page.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy Commitment */}
        <section className="mb-12">
          <div className="de-widget" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
            <div className="de-widget-header" style={{ background: 'rgba(16,185,129,0.05)', borderBottomColor: 'rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock className="w-4 h-4" style={{ color: '#10b981' }} />
                <span className="de-widget-title" style={{ color: '#10b981' }}>Our Privacy Promise</span>
              </div>
            </div>
            <div className="de-widget-body">
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'We never sell your data to advertisers or third parties',
                  'End-to-end encryption on all private messages',
                  'You control who sees your content with granular privacy settings',
                  'Delete your data anytime — we actually delete it',
                  'No behavioral tracking or surveillance capitalism',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--de-text)', lineHeight: 1.5 }}>
                    <span style={{ color: '#10b981', flexShrink: 0, marginTop: 1, fontWeight: 700 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Connect Everything */}
        <section className="mb-12" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 8 }}>Connect Everything</h2>
          <p style={{ fontSize: 13, color: 'var(--de-text-dim)', marginBottom: 20 }}>Bring all your platforms into one Dream.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
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
              <Link key={name} href="/connectors" aria-label={`Connect ${label}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.7, textDecoration: 'none' }}>
                <PlatformBadge name={name} size={48} label={label} />
                <span style={{ fontSize: 10, color: 'var(--de-text-dim)', fontWeight: 600 }}>{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 8 }}>Ready to Navigate the Dream?</h2>
          <p style={{ fontSize: 14, color: 'var(--de-text-dim)', marginBottom: 24, lineHeight: 1.6 }}>Step into a universe where every gesture loops back to meaning.</p>
          <Link href="/join" className="de-btn de-btn-primary" style={{ fontSize: 15, padding: '14px 32px', gap: 10 }}>
            Create Your Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Footer */}
        <footer style={{ paddingTop: 24, borderTop: '1px solid var(--de-border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(42,138,184,0.2), rgba(200,152,26,0.15))', border: '1.5px solid rgba(42,138,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>∞</div>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--de-heading)' }}>DREAMengin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            <a href="https://x.com/dreamenginx" target="_blank" rel="noopener noreferrer"
              className="de-btn de-btn-ghost text-xs" style={{ padding: '8px 16px', gap: 6 }}>
              <Twitter className="w-3 h-3" />
              @dreamenginx
            </a>
            <PlatformBadge name="instagram" size={36} label="Instagram" />
            <PlatformBadge name="tiktok"    size={36} label="TikTok"    />
          </div>
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            Made with <Heart className="w-3 h-3" style={{ color: '#dc4444' }} /> for dreamers everywhere
          </p>
        </footer>
      </main>
    </div>
  );
}
