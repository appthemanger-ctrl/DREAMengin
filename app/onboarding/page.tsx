import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Welcome – DREAMengin' };

const TIPS = [
  {
    icon: '∞',
    title: 'Your Home Dream',
    body: 'The Home Dream is your personal feed and command center. It shows your content, widgets, and connected services — all in one beautiful space.',
    action: null,
  },
  {
    icon: '🔵🟡',
    title: 'The Two Home Buttons',
    body: 'The blue and gold floating buttons are your OS controls. Drag them together and they snap to lock. Single-tap the locked pair to open both menus.',
    action: null,
  },
  {
    icon: '✏️',
    title: 'Edit Mode',
    body: 'Tap "Edit Layout" on your Home Dream to enter Edit Mode. You can drag, reorder, and add widgets without accidentally moving things during normal use.',
    action: null,
  },
  {
    icon: '🔌',
    title: 'Connect Your Services',
    body: 'Link Instagram, YouTube, Spotify and more in Connectors. Each connection unlocks relevant widgets and content slices for your feed.',
    action: { label: 'Go to Connectors', href: '/connectors' },
  },
  {
    icon: '👤',
    title: 'Your Public Profile',
    body: 'Your public profile at /u/yourhandle shows only what you choose to publish. Everything else stays private.',
    action: { label: 'Edit Profile', href: '/edit-profile' },
  },
];

export default async function OnboardingPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Getting Started</h1>
          <Link href="/home" className="ml-auto text-xs" style={{ color: 'var(--de-text-dim)' }}>Skip</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {TIPS.map((tip, i) => (
          <div key={i} className="de-widget">
            <div className="de-widget-body">
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(42,138,184,0.1)', border: '1px solid rgba(42,138,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {tip.icon}
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
          <Link href="/home" className="de-btn de-btn-primary" style={{ display: 'inline-flex' }}>
            Start Using DREAMengin →
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--de-text-dim)', marginTop: 8 }}>
          These tips are always available in <Link href="/settings/help" style={{ color: 'var(--de-accent)' }}>Settings → Help</Link>
        </p>
      </div>
    </div>
  );
}
