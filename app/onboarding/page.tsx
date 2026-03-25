import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import DreamWord from '@/components/ui/DreamWord';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Welcome – Dreamengin' };

const TIPS = [
  {
    step: 1,
    icon: '∞',
    title: 'Your Home Dream',
    body: 'The Home Dream is your personal feed and command center. It shows your Dream Windows, connected services, and content — all in one beautiful space.',
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
    body: 'Tap "Edit Layout" on your Home Dream to enter Edit Mode. You can drag, reorder, and add Dream Windows without accidentally moving things during normal use.',
    action: null,
    color: '#6366f1',
  },
  {
    step: 4,
    icon: '🔌',
    title: 'Connect Your Services',
    body: 'Link Instagram, YouTube, Spotify and more in Connectors. Each connection unlocks relevant Dream Windows and content slices for your feed.',
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
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Getting Started</h1>
          <Link href="/homedream" className="ml-auto text-xs font-semibold" style={{ color: 'var(--de-text-dim)' }}>Skip →</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Wordmark hero */}
        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
          <span className="de-wordmark" style={{ fontSize: 32 }}><DreamWord />engin</span>
          <p style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 6 }}>
            Here&apos;s a quick tour of your new space
          </p>
        </div>

        {TIPS.map((tip, i) => (
          <div key={i} className="de-widget" style={{ background: 'rgba(255,255,255,0.93)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div className="de-widget-body">
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Step icon */}
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${tip.color}18`, border: `1.5px solid ${tip.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, position: 'relative' }}>
                  {tip.icon}
                  <div style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: tip.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white' }}>
                    {tip.step}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-bold text-sm mb-1" style={{ color: 'var(--de-heading)' }}>{tip.title}</div>
                  <p className="text-sm" style={{ color: 'var(--de-text)', lineHeight: 1.6 }}>{tip.body}</p>
                </div>
              </div>
            </div>
            {tip.action && (
              <div className="de-widget-actions">
                <Link href={tip.action.href} className="de-btn de-btn-ghost text-xs">
                  {tip.action.label} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        ))}

        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <Link href="/homedream" className="de-btn de-btn-gold" style={{ display: 'inline-flex', fontSize: 14, padding: '12px 28px' }}>
            Start Using Dreamengin →
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--de-text-dim)', marginTop: 8 }}>
          These tips are always available in <Link href="/settings/help" style={{ color: 'var(--de-accent)' }}>Settings → Help</Link>
        </p>
      </div>
    </div>
  );
}
