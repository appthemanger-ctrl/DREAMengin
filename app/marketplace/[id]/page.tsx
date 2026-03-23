/**
 * app/marketplace/[id]/page.tsx
 *
 * DreamMarketplace slot detail surface.
 * Renders from a real marketplace_items database record — Point 43.
 *
 * Architecture: docs/ARCHITECTURE.md §2 — DreamMarketplace Surface canonical route
 * Security:     docs/SECURITY.md — RLS governs read; auth required
 * Phase 8 §E:   Point 43 (real DB record), Point 44 (auth-required read),
 *               Point 46 (contact/request CTA linked to real API)
 */

import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Tag,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import DreamWord from '@/components/ui/DreamWord';
import MarketplaceRequestButton from '@/components/marketplace/MarketplaceRequestButton';
import { formatMarketplacePrice } from '@/lib/marketplace/listings';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

const CATEGORY_EMOJI: Record<string, string> = {
  theme:     '🎨',
  themes:    '🎨',
  widget:    '🧩',
  widgets:   '🧩',
  connector: '🔌',
  connectors:'🔌',
  music:     '🎵',
  sound:     '🎵',
};

export default async function MarketplaceDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Point 44: auth required for marketplace reads
  if (!user) redirect('/login');

  // Point 43: render from a real database record
  const { data: item, error } = await supabase
    .from('marketplace_items')
    .select(`
      id,
      title,
      description,
      category,
      price_cents,
      preview_url,
      file_url,
      tags,
      is_published,
      created_at,
      seller_id,
      profiles:seller_id (
        id,
        handle,
        display_name,
        avatar_url
      )
    `)
    .eq('id', id)
    // RLS enforces: published OR own item — no extra app-layer check needed
    .single();

  if (error || !item) {
    // Either genuinely missing or RLS blocked — surface a 404
    notFound();
  }

  const emoji   = CATEGORY_EMOJI[item.category?.toLowerCase()] ?? '📄';
  const price   = formatMarketplacePrice(item.price_cents);
  const isFree  = item.price_cents === 0;
  const isOwner = item.seller_id === user.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seller = item.profiles as any;

  return (
    <div className="de-sky-bg min-h-screen">
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(245,243,238,0.92)', borderBottom: '1px solid rgba(200,165,80,0.18)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/marketplace"
            className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(200,152,26,0.10)' }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <ShoppingBag className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold truncate">
            <DreamWord />Marketplace
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* ── Preview ── */}
        <div className="de-widget" style={{ overflow: 'hidden' }}>
          <div
            style={{
              height: 200,
              background: item.preview_url
                ? `url(${item.preview_url}) center/cover no-repeat`
                : 'linear-gradient(135deg, rgba(42,138,184,0.12), rgba(200,152,26,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 72,
            }}
          >
            {!item.preview_url && emoji}
          </div>
        </div>

        {/* ── Main info ── */}
        <div className="de-widget">
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Title + price */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.25, margin: 0 }}>
                  {item.title}
                </h2>
                <span
                  style={{
                    display: 'inline-block', marginTop: 6,
                    fontSize: 11, fontWeight: 700, color: 'var(--de-gold)',
                    background: 'rgba(200,152,26,0.1)', borderRadius: 6, padding: '2px 8px',
                    textTransform: 'capitalize',
                  }}
                >
                  {emoji} {item.category}
                </span>
              </div>
              <div
                style={{
                  fontSize: 22, fontWeight: 800, flexShrink: 0,
                  color: isFree ? '#22c55e' : 'var(--de-heading)',
                }}
              >
                {price}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <p style={{ fontSize: 14, color: 'var(--de-text)', lineHeight: 1.6, margin: 0 }}>
                {item.description}
              </p>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Tag className="w-3 h-3" style={{ color: 'var(--de-text-dim)', alignSelf: 'center' }} />
                {item.tags.map((tag: string) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11, color: 'var(--de-text-dim)',
                      background: 'var(--de-mist)',
                      border: '1px solid var(--de-border)',
                      borderRadius: 6, padding: '2px 8px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Seller */}
            {seller && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: 'var(--de-mist)',
                  borderRadius: 10,
                  border: '1px solid var(--de-border)',
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: seller.avatar_url
                      ? `url(${seller.avatar_url as string}) center/cover`
                      : 'linear-gradient(135deg, rgba(42,138,184,0.2), rgba(200,152,26,0.15))',
                    border: '1px solid rgba(160,195,240,0.3)',
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                    {(seller.display_name as string) || (seller.handle as string)}
                  </div>
                  {seller.handle && (
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      @{seller.handle as string}
                    </div>
                  )}
                </div>
                {!isOwner && (
                  <Link
                    href={`/messages?to=${item.seller_id}`}
                    className="ml-auto de-btn de-btn-ghost"
                    style={{ fontSize: 11, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <MessageCircle className="w-3 h-3" />
                    DM
                  </Link>
                )}
              </div>
            )}

          </div>

          {/* ── CTA ── */}
          {!isOwner && (
            <div className="de-widget-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Point 46: real contact/request action */}
              <MarketplaceRequestButton
                itemId={item.id}
                itemTitle={item.title}
              />
              {item.file_url && (
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="de-btn de-btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', gap: 6 }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview File
                </a>
              )}
            </div>
          )}

          {isOwner && (
            <div className="de-widget-actions">
              <div className="de-notice" style={{ margin: 0 }}>
                This is your listing. It will go live after review.
              </div>
            </div>
          )}
        </div>

        {/* ── Notice ── */}
        <div className="de-notice">
          Items on <DreamWord />Marketplace are community-created.
          By requesting or purchasing, you confirm you have read the listing details.
        </div>

      </div>
    </div>
  );
}
