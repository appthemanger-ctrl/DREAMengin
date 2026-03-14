import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, PlusCircle, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shop – Dreamengin', description: 'Sell and discover digital products.' };

export default async function ShopPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch this user's listings
  const { data: myItems } = await supabase
    .from('merch')
    .select('id, name, description, price, image_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch all other listings for browsing
  const { data: allItems } = await supabase
    .from('merch')
    .select('id, name, description, price, image_url, user_id')
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Store className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Shop</h1>
          <Link href="/shop/sell" className="ml-auto de-btn de-btn-primary text-xs" style={{ padding: '6px 12px', gap: 5 }}>
            <PlusCircle className="w-3 h-3" /> Sell
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* ── Your Listings ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Package className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title">Your Listings</span>
            <Link href="/shop/sell" className="ml-auto de-btn de-btn-ghost text-xs" style={{ padding: '4px 10px' }}>+ Add</Link>
          </div>
          {myItems && myItems.length > 0 ? (
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              {myItems.map((item) => (
                <div key={item.id} className="de-row" style={{ borderRadius: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: item.image_url ? `url(${item.image_url}) center/cover` : 'linear-gradient(135deg, rgba(42,138,184,0.15), rgba(200,152,26,0.12))',
                    border: '1px solid rgba(160,195,240,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {!item.image_url && <Package className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      ${Number(item.price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="de-widget-body" style={{ textAlign: 'center', padding: '28px 16px' }}>
              <Store className="w-8 h-8 mx-auto opacity-15 mb-3" style={{ color: 'var(--de-gold)' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--de-heading)', marginBottom: 6 }}>Nothing listed yet</p>
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>Sell music, art, presets, services — anything digital.</p>
              <Link href="/shop/sell" className="de-btn de-btn-primary text-xs" style={{ marginTop: 14, display: 'inline-flex' }}>Create Your First Listing</Link>
            </div>
          )}
        </div>

        {/* ── Browse ── */}
        {allItems && allItems.length > 0 && (
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Browse</span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {allItems.map((item) => (
                  <div key={item.id} className="de-surface" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                      height: 80, borderRadius: 10,
                      background: item.image_url ? `url(${item.image_url}) center/cover` : 'linear-gradient(135deg, rgba(42,138,184,0.1), rgba(200,152,26,0.08))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!item.image_url && <Package className="w-6 h-6 opacity-30" style={{ color: 'var(--de-gold)' }} />}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.3 }}>{item.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-gold)' }}>${Number(item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="de-notice">
          Products sold here go through Dreamengin secure checkout. Payouts processed weekly.
        </div>

      </div>
    </div>
  );
}
