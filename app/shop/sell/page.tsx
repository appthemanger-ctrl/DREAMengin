'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Loader2, DollarSign, Package, ImageIcon } from 'lucide-react';


export default function SellItemPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Point 45: sell flow goes through the real API route so we get
      // a real API response (including the new item record) confirming success.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          stock: parseInt(stock),
          image_url: imageUrl || null,
        }),
      });

      const body = await res.json() as { error?: string; item?: { id: string } };

      if (!res.ok) {
        throw new Error(body.error ?? 'Failed to create listing.');
      }

      router.push('/shop');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create listing';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/shop" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <ShoppingBag className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Sell an Item</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Listing Details</span></div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Title */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Item Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter item title"
                  required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48 }}
                />
              </label>

              {/* Description */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item..."
                  rows={4}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', resize: 'none' }}
                />
              </label>

              {/* Price and Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Price ($)</span>
                  <div style={{ position: 'relative' }}>
                    <DollarSign style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--de-text-dim)' }} />
                    <input
                      type="number" step="0.01" min="0"
                      value={price} onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00" required
                      style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48 }}
                    />
                  </div>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Stock</span>
                  <div style={{ position: 'relative' }}>
                    <Package style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--de-text-dim)' }} />
                    <input
                      type="number" min="1"
                      value={stock} onChange={(e) => setStock(e.target.value)}
                      placeholder="1" required
                      style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48 }}
                    />
                  </div>
                </label>
              </div>

              {/* Image URL */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Image URL (optional)</span>
                <div style={{ position: 'relative' }}>
                  <ImageIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--de-text-dim)' }} />
                  <input
                    type="url"
                    value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48 }}
                  />
                </div>
              </label>

              {/* Image Preview */}
              {imageUrl && (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--de-border)' }}>
                  <img
                    src={imageUrl} alt="Preview"
                    style={{ width: '100%', height: 192, objectFit: 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}

              {error && (
                <div className="de-notice" style={{ background: 'rgba(220,68,68,0.08)', borderColor: 'rgba(220,68,68,0.25)', color: '#dc4444' }}>
                  {error}
                </div>
              )}
            </div>
            <div className="de-widget-actions">
              <button type="submit" disabled={isLoading || !title || !price} className="de-btn de-btn-gold" style={{ width: '100%', gap: 8 }}>
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating Listing…</> : <><ShoppingBag className="w-5 h-5" /> Create Listing</>}
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Tips for a great listing</span></div>
            <div className="de-widget-body">
              <ol style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Use clear, descriptive titles that explain what you are selling',
                  'Add detailed descriptions including dimensions, materials, etc.',
                  'Price competitively by checking similar items in the shop',
                  'High-quality images help items sell faster',
                ].map((tip, i) => (
                  <li key={i} className="de-row" style={{ borderBottom: 'none', paddingBlock: 4 }}>
                    <span style={{ color: 'var(--de-gold)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 13, color: 'var(--de-text)' }}>{tip}</span>
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
