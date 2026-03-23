/**
 * DreamMarketplace slot detail surface — /marketplace/[id]
 *
 * Renders a real marketplace item from a database record (marketplace_items table).
 * "Request" / contact flow routes to DreamDM compose — no placeholder handler.
 *
 * Phase 8 §E:
 *   Point 43 — DreamMarketplace slot detail surface renders from a real DB record.
 *   Point 46 — "Request" contact flow routes to DreamDM (real system action).
 *
 * Security: authenticated users only; item must be published OR owned by the viewer.
 * Architecture: ARCHITECTURE.md §5 (projection boundaries), LAW.md §2 (nothing public by default).
 */

import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, MessageCircle, Tag, User, Calendar } from 'lucide-react';
import DreamWord from '@/components/ui/DreamWord';

export const dynamic = 'force-dynamic';

const CATEGORY_EMOJI: Record<string, string> = {
  theme: '🎨', themes: '🎨',
  widget: '🧩', widgets: '🧩',
  connector: '🔌', connectors: '🔌',
  music: '🎵', sound: '🎵',
  tool: '🔧', tools: '🔧',
  template: '📄', templates: '📄',
};

type Params = { id: string };

export default async function MarketplaceItemPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch the item — must be published OR owned by the current viewer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: item, error } = await db
    .from('marketplace_items')
    .select(`
      id,
      title,
      description,
      category,
      price_cents,
      preview_url,
      tags,
      is_published,
      created_at,
      seller_id
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !item) {
    notFound();
  }

  // Enforce: only published items visible to non-owners
  if (!item.is_published && item.seller_id !== user.id) {
    notFound();
  }

  const emoji = CATEGORY_EMOJI[item.category?.toLowerCase()] ?? '📄';
  const isFree = item.price_cents === 0;
  const price = isFree ? 'Free' : `$${(item.price_cents / 100).toFixed(2)}`;
  const isOwner = item.seller_id === user.id;

  // Fetch seller profile
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('handle, display_name, avatar_url')
    .eq('id', item.seller_id)
    .maybeSingle();

  const sellerName = sellerProfile?.display_name ?? sellerProfile?.handle ?? 'Unknown seller';

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(245,243,238,0.92)', borderBottom: '1px solid rgba(200,165,80,0.18)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/marketplace" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(200,152,26,0.10)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <ShoppingBag className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold"><DreamWord />Marketplace</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Preview */}
        <div className="de-widget" style={{ overflow: 'hidden' }}>
          <div style={{
            height: 200,
            background: item.preview_url
              ? `url(${item.preview_url}) center/cover`
              : 'linear-gradient(135deg, rgba(42,138,184,0.1), rgba(200,152,26,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72,
          }}>
            {!item.preview_url && emoji}
          </div>
        </div>

        {/* Details */}
        <div className="de-widget">
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Title + price */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.25, marginBottom: 4 }}>
                  {item.title}
                </h2>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--de-gold)',
                  background: 'rgba(200,152,26,0.1)', borderRadius: 6, padding: '2px 8px',
                  textTransform: 'capitalize',
                }}>
                  {item.category}
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: isFree ? '#22c55e' : 'var(--de-gold)', flexShrink: 0 }}>
                {price}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <p style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.6 }}>
                {item.description}
              </p>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(item.tags as string[]).map((tag) => (
                  <span key={tag} style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--de-accent)',
                    background: 'rgba(42,138,184,0.1)', borderRadius: 999, padding: '2px 8px',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Seller info */}
            <div className="de-row" style={{ borderBottom: 'none' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: sellerProfile?.avatar_url ? `url(${sellerProfile.avatar_url}) center/cover` : 'rgba(42,138,184,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!sellerProfile?.avatar_url && <User className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-heading)' }}>{sellerName}</div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Seller</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--de-text-dim)' }}>
                <Calendar className="w-3 h-3" />
                {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* CTA */}
          {!isOwner && (
            <div className="de-widget-actions">
              <Link
                href={`/messages?to=${item.seller_id}&subject=${encodeURIComponent(`Re: ${item.title}`)}`}
                className="de-btn de-btn-gold"
                style={{ flex: 1, justifyContent: 'center', gap: 8 }}
              >
                <MessageCircle className="w-4 h-4" />
                {isFree ? 'Request Access' : 'Contact Seller'}
              </Link>
            </div>
          )}

          {isOwner && (
            <div className="de-widget-actions">
              <div className="de-notice" style={{ width: '100%', textAlign: 'center' }}>
                This is your listing. Buyers will contact you via DreamDM.
              </div>
            </div>
          )}
        </div>

        <div className="de-notice">
          Purchases are arranged directly between buyers and sellers via DreamDM. DREAMengin does not process payments.
        </div>

      </div>
    </div>
  );
}
