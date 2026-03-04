import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Star, TrendingUp, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marketplace – DREAMengin', description: 'Discover tools, themes, and widgets.' };

export default async function MarketplacePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const categories = [
    { icon: '🎨', label: 'Themes',    count: 0,  desc: 'Gradient packs and glass presets' },
    { icon: '🧩', label: 'Widgets',   count: 0,  desc: 'Add-on widgets for your spaces' },
    { icon: '🔌', label: 'Connectors',count: 0,  desc: 'Third-party service integrations' },
    { icon: '🎵', label: 'Music',     count: 0,  desc: 'Sample packs and sound kits' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <ShoppingBag className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Marketplace</h1>
          <Link href="/shop/sell" className="ml-auto de-btn de-btn-ghost text-xs" style={{ padding: '6px 12px' }}>Sell →</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Hero */}
        <div className="de-widget" style={{ background: 'linear-gradient(135deg, rgba(42,138,184,0.1), rgba(200,152,26,0.08))', borderColor: 'rgba(42,138,184,0.2)' }}>
          <div className="de-widget-body text-center py-4">
            <div style={{ fontSize: 36, marginBottom: 8 }}>∞</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>DREAMengin Marketplace</div>
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
              Discover themes, widgets, and tools created by the community.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Categories</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 gap-3">
              {categories.map(({ icon, label, count, desc }) => (
                <button key={label} type="button" className="de-surface text-left p-3 flex flex-col gap-1">
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-accent)', fontWeight: 600 }}>{count} items</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Star className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title">Featured</span>
          </div>
          <div className="de-widget-body flex flex-col items-center py-6 gap-2">
            <Package className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
            <p style={{ fontSize: 13, color: 'var(--de-heading)', fontWeight: 600 }}>Coming soon</p>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center' }}>Featured items will appear here once creators start publishing.</p>
          </div>
        </div>

        {/* Trending */}
        <div className="de-widget">
          <div className="de-widget-header">
            <TrendingUp className="w-4 h-4 mr-2" style={{ color: '#22c55e' }} />
            <span className="de-widget-title">Trending</span>
          </div>
          <div className="de-widget-body flex flex-col items-center py-6 gap-2">
            <TrendingUp className="w-8 h-8 opacity-20" style={{ color: '#22c55e' }} />
            <p style={{ fontSize: 13, color: 'var(--de-heading)', fontWeight: 600 }}>No trending items yet</p>
          </div>
        </div>

      </div>
    </div>
  );
}
