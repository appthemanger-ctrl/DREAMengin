import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marketplace – Dreamengin', description: 'Discover tools, themes, and widgets.' };

export default async function MarketplacePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const categories = [
    { icon: '🎨', label: 'Themes',    href: '/shop', desc: 'Gradient packs and glass presets' },
    { icon: '🧩', label: 'Widgets',   href: '/shop', desc: 'Add-on widgets for your spaces' },
    { icon: '🔌', label: 'Connectors',href: '/connectors', desc: 'Third-party service integrations' },
    { icon: '🎵', label: 'Music',     href: '/daydream/music', desc: 'Sample packs and sound kits' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <ShoppingBag className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Marketplace</h1>
          <Link href="/shop/sell" className="ml-auto de-btn de-btn-primary text-xs" style={{ padding: '6px 12px', gap: 5 }}>
            <PlusCircle className="w-3 h-3" /> Sell
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Hero */}
        <div className="de-widget" style={{ background: 'linear-gradient(135deg, rgba(42,138,184,0.1), rgba(200,152,26,0.08))', borderColor: 'rgba(42,138,184,0.2)' }}>
          <div className="de-widget-body text-center py-5">
            <div style={{ fontSize: 38, marginBottom: 8 }}>∞</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>Dreamengin Marketplace</div>
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.5, maxWidth: 320, margin: '0 auto 16px' }}>
              Sell your themes, widgets, sounds, and tools. The first creator is you.
            </p>
            <Link href="/shop/sell" className="de-btn de-btn-gold" style={{ fontSize: 13, padding: '10px 24px', gap: 6 }}>
              <PlusCircle className="w-4 h-4" /> List Your First Item
            </Link>
          </div>
        </div>

        {/* Categories — each links somewhere real */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Browse</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 gap-3">
              {categories.map(({ icon, label, href, desc }) => (
                <Link key={label} href={href} className="de-surface text-left p-3 flex flex-col gap-1" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Shop link */}
        <div className="de-widget">
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <Link href="/shop" className="de-row" style={{ borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🛍️</div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Your Shop</div>
                <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Manage your listings and sales</div>
              </div>
              <ShoppingBag className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
