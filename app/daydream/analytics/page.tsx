import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Users, Zap, FileText, ExternalLink, ShoppingBag, Plug } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics Daydream – DREAMengin', description: 'Overview of your reach, revenue, and growth.' };


const WIDGETS: DaydreamWidget[] = [
  { id: 'posts',    emoji: '📈', label: 'Post Stats',    desc: 'Views, likes, and shares',       color: '#6366f1', href: '/daydream/analytics' },
  { id: 'revenue',  emoji: '💰', label: 'Revenue',       desc: 'Earnings and weekly payouts',    color: '#22c55e', href: '/daydream/analytics' },
  { id: 'profile',  emoji: '👁️', label: 'Profile Views', desc: 'Who visited your profile',       color: '#0ea5e9', href: '/profile' },
  { id: 'connect',  emoji: '🔌', label: 'Data Sources',  desc: 'Connect analytics providers',    color: '#f59e0b', href: '/connectors' },
  { id: 'export',   emoji: '📥', label: 'Export Data',   desc: 'Download your analytics',        color: '#ec4899', href: '/settings/data' },
  { id: 'shop',     emoji: '🛍️', label: 'Shop Stats',    desc: 'Product and sales metrics',      color: '#c8981a', href: '/shop' },
  { id: 'brand',    emoji: '🎨', label: 'Brand Hub',     desc: 'Your brand control center',      color: '#8b5cf6', href: '/daydream/brand' },
  { id: 'discover', emoji: '🔍', label: 'Discover',      desc: 'Find and grow your audience',    color: '#2a8ab8', href: '/discover' },
];

export default async function AnalyticsDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch real data
  const [{ data: profile }, { count: postCount }] = await Promise.all([
    supabase.from('profiles').select('handle, display_name').eq('id', user.id).single(),
    supabase.from('app_posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const handle = profile?.handle || 'you';

  const metrics = [
    { value: String(postCount ?? 0), label: 'Posts',      delta: null, icon: FileText,    color: '#0ea5e9' },
    { value: '—',                     label: 'Revenue',     delta: null, icon: DollarSign, color: '#22c55e' },
    { value: '—',                     label: 'Growth',      delta: null, icon: TrendingUp, color: '#6366f1' },
    { value: '—',                     label: 'Engagement',  delta: null, icon: Zap,        color: '#f59e0b' },
  ];

  return (
    <DaydreamShell
      title="Analytics"
      enginName="AnalyticsEngin"
      accentColor="#6366f1"
      widgets={WIDGETS}
    >
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1 }}>dreamengin</div>
            <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
              <BarChart3 className="w-4 h-4" style={{ color: '#6366f1' }} />
              <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)' }}>Analytics</h1>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Overview metrics — real post count + honest "—" for unconnected data */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Overview</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(({ value, label, icon: Icon, color }) => (
                <div key={label} className="de-surface p-3">
                  <Icon className="w-4 h-4 mb-2" style={{ color }} />
                  <div className="de-metric-value">{value}</div>
                  <div className="de-metric-label mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Public profile — real link */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Users className="w-4 h-4 mr-2" style={{ color: '#0ea5e9' }} />
            <span className="de-widget-title">Your Reach</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <Link href={`/profile/${handle}`} className="de-row" style={{ borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ExternalLink className="w-4 h-4" style={{ color: '#0ea5e9' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>View Public Profile</div>
                <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>@{handle} · see what others see</div>
              </div>
            </Link>
            <Link href="/connectors" className="de-row" style={{ borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plug className="w-4 h-4" style={{ color: '#6366f1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Connect Data Sources</div>
                <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Instagram, YouTube, Spotify and more</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Revenue — real CTA to start selling */}
        <div className="de-widget" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
          <div className="de-widget-header" style={{ borderBottomColor: 'rgba(34,197,94,0.15)' }}>
            <DollarSign className="w-4 h-4 mr-2" style={{ color: '#22c55e' }} />
            <span className="de-widget-title">Revenue</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <Link href="/shop/sell" className="de-row" style={{ borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingBag className="w-4 h-4" style={{ color: '#22c55e' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>List an Item for Sale</div>
                <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Sell digital products, music, art, or services</div>
              </div>
            </Link>
            <Link href="/shop" className="de-row" style={{ borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign className="w-4 h-4" style={{ color: '#22c55e' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Your Shop</div>
                <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Manage listings and track sales</div>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
    </DaydreamShell>
  );
}