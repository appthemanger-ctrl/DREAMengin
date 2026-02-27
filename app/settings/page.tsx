import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Rss, LayoutGrid, Palette, Plug, Sliders,
  Shield, Database, Bot, Crown, ChevronRight, HelpCircle, LogOut
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings – DREAMengin' };

const NAV_GROUPS = [
  {
    heading: 'Your Space',
    items: [
      { href: '/edit-profile',          icon: User,       label: 'Profile',        desc: 'Edit your name, handle, avatar, bio' },
      { href: '/settings/feed',         icon: Rss,        label: 'Feed',           desc: 'Control what appears in your feed' },
      { href: '/settings/widgets',      icon: LayoutGrid, label: 'Widgets',        desc: 'Manage widget layout and pinned cards' },
      { href: '/settings/appearance',   icon: Palette,    label: 'Theme',          desc: 'Gradient presets, background, live preview' },
    ],
  },
  {
    heading: 'Connections',
    items: [
      { href: '/connectors',            icon: Plug,       label: 'Connectors',     desc: 'Connect Instagram, YouTube, Spotify and more' },
      { href: '/settings/controls',     icon: Sliders,    label: 'Controls',       desc: 'Customize the Home Button behaviors' },
    ],
  },
  {
    heading: 'Privacy & Data',
    items: [
      { href: '/settings/privacy',      icon: Shield,     label: 'Privacy',        desc: 'Visibility, blocking, public profile settings' },
      { href: '/settings/data',         icon: Database,   label: 'Data',           desc: 'Export, delete data, delete account' },
    ],
  },
  {
    heading: 'Help',
    items: [
      { href: '/settings/help',         icon: HelpCircle, label: 'Help & Onboarding', desc: 'Re-open tips, how-it-works guides, wizard' },
      { href: '/policy',                icon: Shield,     label: 'Policy',            desc: 'Community + safety policy — TheBoogieMan.Ai' },
    ],
  },
];

export default async function SettingsPage() {
  let isAdmin = false;
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: profile } = await supabase.from('profiles').select('handle').eq('id', user.id).single();
    isAdmin = user.user_metadata?.role === 'admin' || profile?.handle === 'admin';
  } catch {
    redirect('/login');
  }

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Admin section */}
        {isAdmin && (
          <div className="de-widget" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="de-widget-header" style={{ background: 'rgba(139,92,246,0.06)' }}>
              <Crown className="w-4 h-4 mr-2" style={{ color: '#8b5cf6' }} />
              <span className="de-widget-title" style={{ color: '#8b5cf6' }}>Admin Access</span>
            </div>
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              <Link href="/admin" className="de-row" style={{ borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Admin Dashboard</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>AI triad, system health, proposals</div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
              </Link>
            </div>
          </div>
        )}

        {/* Navigation groups */}
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">{group.heading}</span>
            </div>
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              {group.items.map(({ href, icon: Icon, label, desc }) => (
                <Link key={href} href={href} className="de-row" style={{ borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{label}</div>
                    <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="de-widget">
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <Link href="/api/auth/logout" className="de-row" style={{ borderRadius: 10, color: '#dc4444' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(220,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LogOut className="w-4 h-4" style={{ color: '#dc4444' }} />
              </div>
              <span className="text-sm font-semibold">Sign Out</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
