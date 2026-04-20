'use client';
import Link from 'next/link';

type MarketplaceListing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price_cents: number;
  preview_url: string | null;
  tags: string[];
};

const CATEGORY_EMOJI: Record<string, string> = {
  theme: '🎨', themes: '🎨',
  widget: '🧩', widgets: '🧩',
  connector: '🔌', connectors: '🔌',
  music: '🎵', sound: '🎵',
};

export default function MarketplaceListingCard({ item }: { item: MarketplaceListing }) {
  const emoji = CATEGORY_EMOJI[item.category?.toLowerCase()] ?? '📄';
  const isFree = item.price_cents === 0;
  const price = isFree ? 'Free' : `$${(item.price_cents / 100).toFixed(2)}`;

  return (
    <div className="de-surface" style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Preview */}
      <div style={{
        height: 80, borderRadius: 12, overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(42,138,184,0.1), rgba(200,152,26,0.08))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
        flexShrink: 0,
      }}>
        {item.preview_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.preview_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : emoji}
      </div>
      {/* Info */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.3, marginBottom: 4 }}>
          {item.title}
        </div>
        {item.description && (
          <div style={{
            fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.description}
          </div>
        )}
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--de-gold)',
          background: 'rgba(200,152,26,0.1)', borderRadius: 6, padding: '2px 7px',
          textTransform: 'capitalize',
        }}>
          {item.category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: isFree ? '#22c55e' : 'var(--de-heading)' }}>
            {price}
          </span>
          <Link href={`/marketplace/${item.id}`}
            className="de-btn de-btn-primary"
            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8 }}>
            {isFree ? 'Get' : 'Buy'}
          </Link>
        </div>
      </div>
    </div>
  );
}
