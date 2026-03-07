'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Loader2, LayoutGrid, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CreateAdSlotPage() {
  const [placement, setPlacement] = useState('sidebar_banner');
  const [priceDay, setPriceDay] = useState('5.00');
  const [priceWeek, setPriceWeek] = useState('25.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const placements = [
    { id: 'sidebar_banner', label: 'Sidebar Banner', description: 'Shown in sidebar on all pages' },
    { id: 'feed_inline', label: 'Feed Inline', description: 'Appears between feed items' },
    { id: 'profile_header', label: 'Profile Header', description: 'Banner on your profile page' },
    { id: 'music_page', label: 'Music Page', description: 'Shown on your music page' },
    { id: 'lab_sidebar', label: 'Lab Sidebar', description: 'Appears in lab projects' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { error: insertError } = await supabase
        .from('ad_slots')
        .insert({
          owner_id: user.id,
          placement,
          price_day: parseFloat(priceDay),
          price_week: parseFloat(priceWeek),
          active: true
        });

      if (insertError) throw insertError;

      router.push('/ads');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create ad slot';
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
          <Link href="/ads" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <DollarSign className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Create DreamAds Slot</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Placement */}
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Placement Location</span></div>
            <div className="de-widget-body" style={{ padding: 0 }}>
              {placements.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlacement(p.id)}
                  className="de-row"
                  style={{
                    width: '100%',
                    borderRadius: 0,
                    background: placement === p.id ? 'rgba(42,138,184,0.1)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: placement === p.id ? 'rgba(42,138,184,0.2)' : 'rgba(42,138,184,0.08)' }}
                  >
                    <LayoutGrid className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block" style={{ color: 'var(--de-heading)' }}>{p.label}</span>
                    <span className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{p.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Pricing</span></div>
            <div className="de-widget-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Daily Rate ($)</span>
                <div style={{ position: 'relative' }}>
                  <DollarSign style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--de-text-dim)' }} />
                  <input
                    type="number" step="0.01" min="0"
                    value={priceDay} onChange={(e) => setPriceDay(e.target.value)} required
                    style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48 }}
                  />
                </div>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Weekly Rate ($)</span>
                <div style={{ position: 'relative' }}>
                  <DollarSign style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--de-text-dim)' }} />
                  <input
                    type="number" step="0.01" min="0"
                    value={priceWeek} onChange={(e) => setPriceWeek(e.target.value)} required
                    style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48 }}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Info notice */}
          <div className="de-notice">
            <Info className="w-4 h-4 flex-shrink-0" style={{ marginTop: 1, color: 'var(--de-gold)' }} />
            <p>Once created, your DreamAds slot will be visible to buyers. You control the placement and pricing — this is your ad space, not a platform ad.</p>
          </div>

          {error && <div className="de-notice error">{error}</div>}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="de-btn de-btn-gold"
            style={{ width: '100%', gap: 8 }}
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Creating…</>
            ) : (
              <><DollarSign className="w-5 h-5" /> Create DreamAds Slot</>
            )}
          </button>
        </form>

        {/* Estimated Earnings */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Estimated Earnings</span></div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--de-text-dim)' }}>Daily bookings (30 days)</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>${(parseFloat(priceDay || '0') * 30).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--de-text-dim)' }}>Weekly bookings (4 weeks)</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>${(parseFloat(priceWeek || '0') * 4).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
