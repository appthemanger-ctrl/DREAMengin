import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Rss, LayoutGrid, Palette, Plug, Sliders,
  Shield, Database, Bot, Crown, ChevronRight, HelpCircle, LogOut, Cpu
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings – DREAMengin' };

const NAV_GROUPS = [
  {
    heading: 'Your Space',
    items: [
      { href: '/edit-profile',          icon: User,       label: 'Profile',        desc: 'Edit your name, handle, avatar, bio',             iconBg: '#2a8ab8' },
      { href: '/settings/feed',         icon: Rss,        label: 'Feed',           desc: 'Control what appears in your feed',               iconBg: '#10b981' },
      { href: '/settings/algorithm',    icon: Cpu,        label: 'My Algorithm',   desc: 'Your presets, your order — you own it',           iconBg: '#6366f1' },
      { href: '/settings/widgets',      icon: LayoutGrid, label: 'Widgets',        desc: 'Manage widget layout and pinned cards',           iconBg: '#f59e0b' },
      { href: '/settings/appearance',   icon: Palette,    label: 'Theme',          desc: 'Gradient presets, background, live preview',      iconBg: '#ec4899' },
    ],
  },
  {
    heading: 'Connections',
    items: [
      { href: '/connectors',            icon: Plug,       label: 'Connectors',     desc: 'Connect Instagram, YouTube, Spotify and more',    iconBg: '#0ea5e9' },
      { href: '/settings/controls',     icon: Sliders,    label: 'Controls',       desc: 'Customize the Home Button behaviors',             iconBg: '#8b5cf6' },
    ],
  },
  {
    heading: 'Privacy & Data',
    items: [
      { href: '/settings/privacy',      icon: Shield,     label: 'Privacy',        desc: 'Visibility, blocking, public profile settings',   iconBg: '#22c55e' },
      { href: '/settings/data',         icon: Database,   label: 'Data',           desc: 'Export, delete data, delete account',             iconBg: '#dc4444' },
    ],
  },
  {
    heading: 'Help',
    items: [
      { href: '/settings/help',         icon: HelpCircle, label: 'Help & Onboarding', desc: 'Re-open tips, how-it-works guides, wizard',    iconBg: '#c8981a' },
      { href: '/settings/safety',       icon: Shield,     label: 'Policy & Safety',   desc: 'Safety log, appeals, and community policy',    iconBg: '#64748b' },
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
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
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
          <div className="de-widget" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="de-widget-header" style={{ background: 'rgba(139,92,246,0.05)' }}>
              <Crown className="w-4 h-4 mr-2" style={{ color: '#8b5cf6' }} />
              <span className="de-widget-title" style={{ color: '#8b5cf6' }}>Admin Access</span>
            </div>
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              <Link href="/admin" className="de-row" style={{ borderRadius: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(139,92,246,0.3)' }}>
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
          <div key={group.heading} className="de-widget" style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="de-widget-header">
              <span className="de-widget-title">{group.heading}</span>
            </div>
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              {group.items.map(({ href, icon: Icon, label, desc, iconBg }, idx) => (
                <Link key={href} href={href} className="de-row" style={{ borderRadius: 12, borderBottom: idx < group.items.length - 1 ? '1px solid rgba(160,195,240,0.15)' : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${iconBg}40` }}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{label}</div>
                    <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--de-text-dim)', opacity: 0.5 }} />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="de-widget" style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <Link href="/api/auth/logout" className="de-row" style={{ borderRadius: 12, color: '#dc4444' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#dc4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(220,68,68,0.3)' }}>
                <LogOut className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold" style={{ color: '#dc4444' }}>Sign Out</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
