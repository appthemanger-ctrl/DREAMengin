import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, Eye, Heart, DollarSign, FileText, Plug, ExternalLink, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch real data from DB
  const [{ data: profile }, { count: postCount }] = await Promise.all([
    supabase.from('profiles').select('handle, display_name').eq('id', user.id).single(),
    supabase.from('app_posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const handle = profile?.handle || 'you';

  const metrics = [
    { value: String(postCount ?? 0), label: 'Posts',      icon: FileText,    color: 'var(--de-accent)' },
    { value: '—',                     label: 'Views',       icon: Eye,         color: '#6366f1'          },
    { value: '—',                     label: 'Likes',       icon: Heart,       color: '#ec4899'          },
    { value: '—',                     label: 'Followers',   icon: Users,       color: '#10b981'          },
    { value: '—',                     label: 'Revenue',     icon: DollarSign,  color: '#22c55e'          },
    { value: '—',                     label: 'Growth',      icon: TrendingUp,  color: 'var(--de-gold)'   },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Analytics</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Overview grid */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Overview</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-3 gap-3">
              {metrics.map(({ value, label, icon: Icon, color }) => (
                <div key={label} className="de-surface p-3 text-center">
                  <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
                  <div className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--de-text-dim)' }}>{label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: 'var(--de-text-dim)' }}>
              — = data not yet available. Connect sources below.
            </p>
          </div>
        </div>

        {/* Public profile */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Users className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Your Reach</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <Link href={`/profile/${handle}`} className="de-row" style={{ borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ExternalLink className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
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

        {/* Revenue */}
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
  );
}
