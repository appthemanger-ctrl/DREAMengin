'use client';

/**
 * MarketplacePanel — inline marketplace, client-side Supabase fetch.
 * No routing. No server components. Everything renders here.
 */

import { useEffect, useState }            from 'react';
import { ShoppingBag, PlusCircle, Loader2 } from 'lucide-react';
import { createClient }                   from '@/lib/supabase/client';
import MarketplaceListingCard             from '@/components/marketplace/MarketplaceListingCard';
import DreamWord                          from '@/components/ui/DreamWord';
import { useDreamSystem }                 from '@/lib/dreamdm/DreamSystemContext';

type Listing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price_cents: number;
  preview_url: string | null;
  tags: string[];
};

const FALLBACK_CATEGORIES = [
  { icon: '🎨', label: 'Themes',     desc: 'Gradient packs and glass presets' },
  { icon: '🧩', label: 'Widgets',    desc: 'Add-on widgets for your spaces' },
  { icon: '🔌', label: 'Connectors', desc: 'Third-party service integrations' },
  { icon: '🎵', label: 'Music',      desc: 'Sample packs and sound kits' },
];

export default function MarketplacePanel() {
  const { openPanel } = useDreamSystem();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb
          .from('marketplace_items')
          .select('id, title, description, category, price_cents, preview_url, tags')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(24);
        setListings(data ?? []);
      } catch { /* noop */ }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ padding: '12px 0 100px' }}>

      {/* Hero */}
      <div className="de-widget" style={{
        margin: '0 16px 12px',
        background: 'linear-gradient(135deg, rgba(42,138,184,0.1), rgba(200,152,26,0.08))',
        borderColor: 'rgba(42,138,184,0.2)',
      }}>
        <div className="de-widget-body text-center" style={{ padding: '20px 16px' }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>∞</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>
            <DreamWord />Marketplace
          </div>
          <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.5, maxWidth: 280, margin: '0 auto 16px' }}>
            Sell your themes, widgets, sounds, and tools. The first creator is you.
          </p>
          <button
            type="button"
            onClick={() => { window.location.href = '/shop/sell'; }}
            className="de-btn de-btn-gold"
            style={{ fontSize: 13, padding: '10px 24px', gap: 6 }}
          >
            <PlusCircle className="w-4 h-4" /> List Your First Item
          </button>
        </div>
      </div>

      {/* Listings or fallback */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--de-accent)' }} />
        </div>
      ) : listings.length > 0 ? (
        <div className="de-widget" style={{ margin: '0 16px 12px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Browse Listings</span>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{listings.length} item{listings.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 gap-3">
              {listings.map((item) => (
                <MarketplaceListingCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="de-widget" style={{ margin: '0 16px 12px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="de-widget-header"><span className="de-widget-title">Explore Categories</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 gap-3">
              {FALLBACK_CATEGORIES.map(({ icon, label, desc }) => (
                <div key={label} className="de-surface p-3 flex flex-col gap-1" style={{ borderRadius: 10 }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Your shop */}
      <div className="de-widget" style={{ margin: '0 16px 12px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="de-widget-body" style={{ padding: '4px 6px' }}>
          <button
            type="button"
            onClick={() => { window.location.href = '/shop'; }}
            className="de-row"
            style={{ borderRadius: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🛍️</div>
            <div style={{ flex: 1 }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Your Shop</div>
              <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Manage your listings and sales</div>
            </div>
            <ShoppingBag className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
          </button>
        </div>
      </div>

    </div>
  );
}
