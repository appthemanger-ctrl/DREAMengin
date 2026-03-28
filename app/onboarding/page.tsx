import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Welcome – Dreamengin' };

const TIPS = [
  {
    step: 1,
    icon: '∞',
    title: 'Your Home Dream',
    body: 'The Home Dream is your personal feed and command center. It shows your content, widgets, and connected services — all in one beautiful space.',
    action: null,
    color: '#2a8ab8',
  },
  {
    step: 2,
    icon: '🔵',
    title: 'The Golden Button',
    body: 'The gold button at the bottom is your home control. Single-tap to return home. Double-tap to open the Daydreams and System menus.',
    action: null,
    color: '#c8981a',
  },
  {
    step: 3,
    icon: '✏️',
    title: 'Edit Mode',
    body: 'Tap "Edit Layout" on your Home Dream to enter Edit Mode. You can drag, reorder, and add widgets without accidentally moving things during normal use.',
    action: null,
    color: '#6366f1',
  },
  {
    step: 4,
    icon: '🔌',
    title: 'Connect Your Services',
    body: 'Link Instagram, YouTube, Spotify and more in Connectors. Each connection unlocks relevant widgets and content slices for your feed.',
    action: { label: 'Go to Connectors', href: '/connectors' },
    color: '#10b981',
  },
  {
    step: 5,
    icon: '👤',
    title: 'Your Public Profile',
    body: 'Your public profile at /u/yourhandle shows only what you choose to publish. Everything else stays private.',
    action: { label: 'Edit ProfileDream', href: '/edit-profiledream' },
    color: '#ec4899',
  },
];

export default async function OnboardingPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(155deg, #070e1c 0%, #0c1829 45%, #0f2244 75%, #0a1628 100%)' }}
    >
      {/* Ambient glow — SICC enhanced */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div style={{
          position: 'absolute', top: '-100px', right: '-80px',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 40%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'sicc-soft-float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-50px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(200,152,26,0.11) 0%, rgba(200,152,26,0.03) 40%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'sicc-soft-float 6s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translateX(-50%)',
          width: '400px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(100,130,255,0.06) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animation: 'sicc-soft-float 10s ease-in-out infinite',
        }} />
      </div>

      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(7,14,28,0.82)',
          backdropFilter: 'blur(32px) saturate(160%)',
          WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          borderBottom: '1px solid rgba(200,152,26,0.08)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/homedream"
            className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'rgba(165,195,235,0.72)' }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'rgba(210,230,255,0.90)' }}>Getting Started</h1>
          <Link href="/homedream" className="ml-auto text-xs font-semibold" style={{ color: 'rgba(140,170,220,0.55)' }}>Skip →</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Wordmark hero — SICC premium */}
        <div className="sicc-soft-float" style={{ textAlign: 'center', paddingBottom: 16, paddingTop: 8 }}>
          <div style={{
            fontFamily: 'var(--font-cormorant, Georgia, serif)',
            fontStyle: 'italic', fontWeight: 500,
            fontSize: 40, letterSpacing: '-0.01em', lineHeight: 1,
            display: 'flex', alignItems: 'baseline', justifyContent: 'center',
          }}>
            <span className="sicc-gradient-text" style={{ fontSize: 'inherit' }}>dream</span>
            <span style={{ color: 'rgba(220,235,255,0.55)', fontWeight: 400 }}>engin</span>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(165,195,235,0.55)', marginTop: 8 }}>
            Here&apos;s a quick tour of your new space
          </p>
        </div>

        {TIPS.map((tip, i) => (
          <div
            key={i}
            className="sicc-glass-in"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(32px) saturate(160%)',
              WebkitBackdropFilter: 'blur(32px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              animationDelay: `${i * 0.08}s`,
            }}
          >
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Step icon */}
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${tip.color}18`, border: `1.5px solid ${tip.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, position: 'relative' }}>
                  {tip.icon}
                  <div style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: tip.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white' }}>
                    {tip.step}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-bold text-sm mb-1" style={{ color: 'rgba(210,230,255,0.90)' }}>{tip.title}</div>
                  <p className="text-sm" style={{ color: 'rgba(165,195,235,0.65)', lineHeight: 1.6 }}>{tip.body}</p>
                </div>
              </div>
            </div>
            {tip.action && (
              <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link
                  href={tip.action.href}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(200,220,255,0.80)', textDecoration: 'none',
                  }}
                >
                  {tip.action.label} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        ))}

        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <Link
            href="/homedream"
            className="sicc-shimmer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 15, padding: '14px 32px', borderRadius: 999, fontWeight: 700,
              background: 'linear-gradient(135deg, var(--de-gold, #c8981a) 0%, var(--de-gold-bright, #e8b830) 100%)',
              color: '#fff', boxShadow: '0 4px 20px rgba(200,152,26,0.35)',
              textDecoration: 'none',
            }}
          >
            Start Using DREAMengin →
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(140,170,220,0.45)', marginTop: 8 }}>
          These tips are always available in <Link href="/settings/help" style={{ color: '#c8981a' }}>Settings → Help</Link>
        </p>
      </div>
    </div>
  );
}
