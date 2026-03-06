import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Palette, Share2, ImageIcon } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Brand Daydream – DREAMengin', description: 'Build and manage your personal brand identity.' };


const WIDGETS: DaydreamWidget[] = [
  { id: 'post',      emoji: '📢', label: 'New Post',     desc: 'Create and share content',    color: '#ec4899', href: '/create' },
  { id: 'profile',   emoji: '👤', label: 'Edit Profile', desc: 'Update your public presence', color: '#2a8ab8', href: '/edit-profile' },
  { id: 'analytics', emoji: '📊', label: 'Analytics',    desc: 'Track your reach and growth', color: '#6366f1', href: '/daydream/analytics' },
  { id: 'appearance',emoji: '🎨', label: 'Appearance',   desc: 'Gradient theme and style',    color: '#f59e0b', href: '/settings/appearance' },
  { id: 'connectors',emoji: '🔌', label: 'Social Links', desc: 'Connect your platforms',      color: '#0ea5e9', href: '/connectors' },
  { id: 'view',      emoji: '🌐', label: 'View Profile', desc: 'See what visitors see',       color: '#22c55e', href: '/profile' },
  { id: 'shop',      emoji: '🛍️', label: 'Your Shop',    desc: 'Sell products and services',  color: '#c8981a', href: '/shop' },
  { id: 'music',     emoji: '🎵', label: 'Music Studio', desc: 'Your artist side',            color: '#8b5cf6', href: '/daydream/music' },
];

export default async function BrandDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Brand"
      accentColor="#ec4899"
      widgets={WIDGETS}
    >
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1 }}>dreamengin</div>
            <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
              <Palette className="w-4 h-4" style={{ color: '#ec4899' }} />
              <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)' }}>Brand</h1>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Profile card */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Profile Card</span></div>
          <div className="de-widget-body flex items-center gap-4">
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(236,72,153,0.25)', flexShrink: 0 }}>
              <span style={{ fontSize: 22 }}>👤</span>
            </div>
            <div>
              <div className="font-bold" style={{ color: 'var(--de-heading)' }}>Your Name</div>
              <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>@handle · Edit your profile to update</div>
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/edit-profile" className="de-btn de-btn-ghost text-xs">Edit Profile</Link>
            <Link href="/profile" className="de-btn de-btn-primary text-xs">View Public</Link>
          </div>
        </div>

        {/* Social Scheduler */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Social Scheduler</span>
            <span className="de-badge-premium">✦ Pro</span>
          </div>
          <div className="de-widget-body flex flex-col items-center py-4 gap-2">
            <Share2 className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>Schedule Posts</p>
            <p className="text-xs text-center" style={{ color: 'var(--de-text-dim)' }}>Connect Instagram, TikTok, or X in <Link href="/connectors" style={{ color: 'var(--de-accent)' }}>Connectors</Link> to schedule posts.</p>
          </div>
        </div>

        {/* Promo Banners */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Promo Banners</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 gap-3">
              {['Banner 1', 'Banner 2'].map((b) => (
                <div key={b} className="de-media-thumb flex items-center justify-center" style={{ height: 80 }}>
                  <ImageIcon className="w-5 h-5 opacity-20" style={{ color: 'var(--de-accent)' }} />
                </div>
              ))}
            </div>
          </div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-ghost text-xs">+ Add Banner</button>
          </div>
        </div>

        {/* Analytics preview */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Quick Analytics</span>
            <Link href="/daydream/analytics" className="text-xs font-semibold" style={{ color: 'var(--de-accent)' }}>Full View →</Link>
          </div>
          <div className="de-widget-body">
            <div className="grid grid-cols-3 gap-3">
              {[['—', 'Reach'], ['—', 'Clicks'], ['—', 'Growth']].map(([val, lbl]) => (
                <div key={lbl} className="de-metric de-surface">
                  <span className="de-metric-value">{val}</span>
                  <span className="de-metric-label">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
    </DaydreamShell>
  );
}