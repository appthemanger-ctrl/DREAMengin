// app/marketplace/sell/page.tsx
// DreamMarketplace — List an Item form.
//
// Auth-gated: redirects to /login if no session (AXIOM 4).
// POSTs to /api/marketplace which stores price_cents and sets
// is_published = false (LAW.md §2: nothing public by default).
//
// Pattern mirrors app/shop/sell/page.tsx for consistency.

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Loader2, DollarSign, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { value: 'widget',    label: '🧩 Widget',    desc: 'Add-on module for HomeDream' },
  { value: 'theme',     label: '🎨 Theme',     desc: 'Color scheme / glass preset' },
  { value: 'connector', label: '🔌 Connector', desc: 'Third-party integration' },
  { value: 'music',     label: '🎵 Music',     desc: 'Sample pack or sound kit' },
];

export default function MarketplaceSellPage() {
  const supabase = createClient();
  const router   = useRouter();

  // ── Auth gate ─────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.replace('/login');
    };
    void checkAuth();
  // supabase and router are stable; eslint wants them but they never change
   
  }, []);

  // ── Form state ────────────────────────────────────────────────
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('widget');
  const [price,       setPrice]       = useState('0');
  const [tags,        setTags]        = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          price: parseFloat(price) || 0,
          tags,
        }),
      });

      const body = await res.json() as { error?: string; item?: { id: string } };

      if (!res.ok) {
        throw new Error(body.error ?? 'Failed to create listing.');
      }

      setSuccess(true);
      // Small delay so the success state is visible before redirect
      setTimeout(() => router.push('/marketplace'), 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="de-sky-bg min-h-screen flex items-center justify-center">
        <div className="de-widget" style={{ maxWidth: 360, width: '90vw', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 6 }}>Listing submitted!</div>
          <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
            Your item is under review and will go live once approved. Redirecting…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="de-sky-bg min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/marketplace" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <ShoppingBag className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>List an Item</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Listing details ── */}
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Listing Details</span></div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Title */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Title *</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Glass Dark Theme Pack"
                  maxLength={120}
                  required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48, boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'right' }}>{title.length}/120</span>
              </label>

              {/* Description */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this do? What's included?"
                  rows={4}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </label>

              {/* Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Category *</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {CATEGORIES.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      style={{
                        padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                        background: category === value
                          ? 'rgba(42,138,184,0.10)'
                          : 'var(--de-mist)',
                        border: category === value
                          ? '1.5px solid rgba(42,138,184,0.4)'
                          : '1.5px solid var(--de-border)',
                        transition: 'background 0.12s, border-color 0.12s',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Price (USD) — set 0 for free
                </span>
                <div style={{ position: 'relative' }}>
                  <DollarSign style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--de-text-dim)' }} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48, boxSizing: 'border-box' }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                  {parseFloat(price) === 0 || !price ? '✦ Listed as Free' : `✦ Buyers pay $${parseFloat(price).toFixed(2)}`}
                </span>
              </label>

              {/* Tags */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Tags <span style={{ fontWeight: 400 }}>(comma-separated, optional)</span>
                </span>
                <div style={{ position: 'relative' }}>
                  <Tag style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--de-text-dim)' }} />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="dark, glass, minimal, lofi"
                    style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48, boxSizing: 'border-box' }}
                  />
                </div>
              </label>

              {/* Error */}
              {error && (
                <div className="de-notice" style={{ background: 'rgba(220,68,68,0.08)', borderColor: 'rgba(220,68,68,0.25)', color: '#dc4444' }}>
                  {error}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="de-widget-actions">
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="de-btn de-btn-gold"
                style={{ width: '100%', gap: 8 }}
              >
                {isLoading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                  : <><ShoppingBag className="w-5 h-5" /> Submit for Review</>}
              </button>
            </div>
          </div>

          {/* ── Info ── */}
          <div className="de-notice" style={{ lineHeight: 1.6 }}>
            Items are reviewed before they go live. By submitting you confirm you own the rights to this content.
          </div>

          {/* ── Tips ── */}
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Tips for a great listing</span></div>
            <div className="de-widget-body">
              <ol style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Use a clear, descriptive title that explains exactly what you are selling.',
                  'Add a detailed description — features, compatible versions, what&apos;s included.',
                  'Tags help buyers discover your listing — choose relevant keywords.',
                  'Set price to 0 to make it free and build reputation first.',
                ].map((tip, i) => (
                  <li key={i} className="de-row" style={{ borderBottom: 'none', paddingBlock: 4 }}>
                    <span style={{ color: 'var(--de-gold)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 13, color: 'var(--de-text)' }} dangerouslySetInnerHTML={{ __html: tip }} />
                  </li>
                ))}
              </ol>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
