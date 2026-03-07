// app/marketplace/page.tsx
// DreamMarketplace — real listings from marketplace_items table.
// Client component so category filter tabs work without a full page reload.
// Fetches from /api/marketplace which enforces RLS + auth (AXIOM 4).
// Empty state guides the first seller to /marketplace/sell (AXIOM 3: real capability).

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, PlusCircle, PackageOpen, Loader2, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

// ── Types ─────────────────────────────────────────────────────────
interface SellerProfile {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface MarketplaceItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price_cents: number;
  preview_url: string | null;
  tags: string[];
  seller_id: string;
  profiles: SellerProfile | null;
}

// ── Category filter tabs ──────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',       label: 'All',        icon: '∞' },
  { key: 'widget',    label: 'Widgets',    icon: '🧩' },
  { key: 'theme',     label: 'Themes',     icon: '🎨' },
  { key: 'connector', label: 'Connectors', icon: '🔌' },
  { key: 'music',     label: 'Music',      icon: '🎵' },
];

// ── Price formatter ───────────────────────────────────────────────
function formatPrice(priceCents: number): string {
  if (priceCents === 0) return 'Free';
  return `$${(priceCents / 100).toFixed(2)}`;
}

// ── Category badge ────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find((c) => c.key === category) ?? { icon: '📦', label: category };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700,
      background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)',
      border: '1px solid rgba(42,138,184,0.2)',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {cat.icon} {cat.label}
    </span>
  );
}

// ── Listing card ─────────────────────────────────────────────────
function ListingCard({ item }: { item: MarketplaceItem }) {
  const sellerName = item.profiles?.display_name
    ?? (item.profiles?.handle ? `@${item.profiles.handle}` : 'Unknown seller');

  return (
    <div className="de-surface" style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden', padding: 0 }}>
      {/* Preview image */}
      <div style={{
        height: 120,
        background: item.preview_url
          ? `url(${item.preview_url}) center/cover no-repeat`
          : 'linear-gradient(135deg, rgba(42,138,184,0.10) 0%, rgba(200,152,26,0.08) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {!item.preview_url && (
          <PackageOpen style={{ width: 32, height: 32, opacity: 0.18, color: 'var(--de-gold)' }} />
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <CategoryBadge category={item.category} />
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.3, marginTop: 2 }}>
          {item.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>by {sellerName}</div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
            {item.tags.slice(0, 3).map((t) => (
              <span key={t} style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 100,
                background: 'rgba(160,195,240,0.15)', color: 'var(--de-text-dim)',
                border: '1px solid rgba(160,195,240,0.25)',
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div style={{
          marginTop: 'auto', paddingTop: 6,
          fontSize: 15, fontWeight: 800,
          color: item.price_cents === 0 ? 'var(--de-accent)' : 'var(--de-gold)',
        }}>
          {formatPrice(item.price_cents)}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [items, setItems]       = useState<MarketplaceItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const fetchItems = useCallback(async (category: string) => {
    setLoading(true);
    setError('');
    try {
      const params = category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
      const res = await fetch(`/api/marketplace${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Failed to load listings.');
      }
      const data = await res.json() as { items: MarketplaceItem[] };
      setItems(data.items ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems(activeCategory);
  }, [activeCategory, fetchItems]);

  return (
    <div className="de-sky-bg min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <ShoppingBag className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>DreamMarketplace</h1>
          <Link href="/marketplace/sell" className="ml-auto de-btn de-btn-gold text-xs" style={{ padding: '6px 14px', gap: 5, display: 'inline-flex', alignItems: 'center' }}>
            <PlusCircle className="w-3 h-3" /> List an Item
          </Link>
        </div>

        {/* ── Category filter tabs ── */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {CATEGORIES.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 14px', borderRadius: 100, whiteSpace: 'nowrap',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: activeCategory === key
                    ? '1.5px solid var(--de-accent)'
                    : '1.5px solid rgba(160,195,240,0.3)',
                  background: activeCategory === key
                    ? 'rgba(42,138,184,0.12)'
                    : 'rgba(255,255,255,0.7)',
                  color: activeCategory === key ? 'var(--de-accent)' : 'var(--de-text)',
                  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-4">

        {/* ── Loading state ── */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 16px' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--de-accent)', opacity: 0.6 }} />
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <div className="de-notice" style={{ background: 'rgba(220,68,68,0.06)', borderColor: 'rgba(220,68,68,0.2)', color: '#c04040', textAlign: 'center' }}>
            {error}
            <button
              type="button"
              onClick={() => void fetchItems(activeCategory)}
              style={{ marginLeft: 10, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', fontSize: 'inherit' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && items.length === 0 && (
          <div className="de-widget" style={{ background: 'linear-gradient(135deg, rgba(42,138,184,0.06), rgba(200,152,26,0.04))', borderColor: 'rgba(42,138,184,0.15)' }}>
            <div className="de-widget-body" style={{ textAlign: 'center', padding: '44px 24px' }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>∞</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 6 }}>
                No listings yet
              </div>
              <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto 20px' }}>
                Be the first to publish! List your themes, widgets, sounds, or connectors.
              </p>
              <Link
                href="/marketplace/sell"
                className="de-btn de-btn-gold"
                style={{ fontSize: 13, padding: '10px 24px', gap: 6, display: 'inline-flex', alignItems: 'center' }}
              >
                <PlusCircle className="w-4 h-4" /> List Your First Item
              </Link>
            </div>
          </div>
        )}

        {/* ── Listings grid ── */}
        {!loading && !error && items.length > 0 && (
          <div className="de-widget">
            <div className="de-widget-header">
              <Tag className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} />
              <span className="de-widget-title">
                {activeCategory === 'all'
                  ? `All Listings`
                  : `${CATEGORIES.find((c) => c.key === activeCategory)?.label ?? activeCategory}`}
              </span>
              <span className="ml-auto" style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {items.map((item) => (
                  <ListingCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Sell CTA (always visible at bottom) ── */}
        {!loading && (
          <div className="de-widget">
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              <Link href="/marketplace/sell" className="de-row" style={{ borderRadius: 10, textDecoration: 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,152,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🏷️</div>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Sell on DreamMarketplace</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>List themes, widgets, sounds, connectors &amp; more</div>
                </div>
                <PlusCircle className="w-4 h-4" style={{ color: 'var(--de-gold)', flexShrink: 0 }} />
              </Link>
            </div>
          </div>
        )}

        <div className="de-notice">
          Items are reviewed before they go live. Payouts and licensing details coming soon.
        </div>
      </div>
    </div>
  );
}
