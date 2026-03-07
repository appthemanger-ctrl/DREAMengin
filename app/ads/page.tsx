import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, ShoppingCart, BarChart3, Plus, LayoutGrid } from 'lucide-react';
import type { AdSlot, AdListing, AdOrder } from '@/types/ads';

export const dynamic = 'force-dynamic';

export default async function AdsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's ad slots
  const { data: mySlotsData } = await supabase
    .from('ad_slots')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch available listings
  const { data: marketplaceData } = await supabase
    .from('ad_listings')
    .select(`
      *,
      ad_slots!inner(*, profiles!inner(handle, display_name))
    `)
    .eq('status', 'available');

  // Fetch user's orders
  const { data: myOrdersData } = await supabase
    .from('ad_orders')
    .select(`
      *,
      ad_listings!inner(*, ad_slots!inner(*, profiles!inner(handle, display_name)))
    `)
    .eq('buyer_id', user.id);

  // Final product: no demo data. Empty arrays render explicit empty states.
  const mySlots: AdSlot[] = (mySlotsData as unknown as AdSlot[] | null) ?? [];
  const marketplace: AdListing[] = (marketplaceData as unknown as AdListing[] | null) ?? [];
  const myOrders: AdOrder[] = (myOrdersData as unknown as AdOrder[] | null) ?? [];

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <DollarSign className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Ads Marketplace</h1>
          <Link href="/ads/create" className="de-btn de-btn-gold ml-auto" style={{ gap: 6, minHeight: 40 }}>
            <Plus className="w-4 h-4" />
            Create Slot
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Revenue Summary */}
        <div className="de-widget">
          <div className="de-widget-header">
            <BarChart3 className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title">Revenue Summary</span>
          </div>
          <div className="de-widget-body">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '$0.00', label: 'Total Earned' },
                { value: String(myOrders.length), label: 'Active Orders' },
                { value: '0', label: 'Impressions' },
              ].map(({ value, label }) => (
                <div key={label} className="de-surface p-3 text-center">
                  <div className="text-xl font-bold" style={{ color: 'var(--de-heading)' }}>{value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--de-text-dim)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Slots */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">My DreamAds Slots</span>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{mySlots.length} slot{mySlots.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            {mySlots.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0' }}>
                <DollarSign className="w-8 h-8 opacity-20" style={{ color: 'var(--de-gold)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>No slots yet</p>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Create your first ad slot to start earning</p>
              </div>
            ) : (
              mySlots.map((slot) => (
                <Link key={slot.id} href={`/ads/slot/${slot.id}`} className="de-row" style={{ borderRadius: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(200,152,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LayoutGrid className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-sm font-semibold capitalize" style={{ color: 'var(--de-heading)' }}>
                      {slot.placement?.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                      ${slot.price_day}/day · ${slot.price_week}/week
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: slot.active ? 'rgba(34,197,94,0.12)' : 'rgba(160,195,240,0.15)',
                    color: slot.active ? '#22c55e' : 'var(--de-text-dim)',
                  }}>
                    {slot.active ? 'Active' : 'Inactive'}
                  </span>
                </Link>
              ))
            )}
          </div>
          {mySlots.length > 0 && (
            <div className="de-widget-actions">
              <Link href="/ads/create" className="de-btn de-btn-gold" style={{ gap: 6 }}>
                <Plus className="w-4 h-4" />
                New Slot
              </Link>
            </div>
          )}
        </div>

        {/* Available in Marketplace */}
        <div className="de-widget">
          <div className="de-widget-header">
            <ShoppingCart className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Available DreamAds Slots</span>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{marketplace.length} listing{marketplace.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            {marketplace.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0' }}>
                <ShoppingCart className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>No listings available</p>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Check back later for available ad slots</p>
              </div>
            ) : (
              marketplace.map((listing) => (
                <div key={listing.id} className="de-row">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LayoutGrid className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-sm font-semibold capitalize" style={{ color: 'var(--de-heading)' }}>
                      {listing.ad_slots?.placement?.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                      by @{listing.ad_slots?.profiles?.handle} · ${listing.ad_slots?.price_day}/day
                    </div>
                  </div>
                  <button className="de-btn de-btn-primary" style={{ minHeight: 40, gap: 4, padding: '8px 12px', fontSize: 12 }}>
                    <ShoppingCart className="w-3 h-3" />
                    Request
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Orders */}
        {myOrders.length > 0 && (
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">My Orders</span>
              <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{myOrders.length} order{myOrders.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              {myOrders.map((order) => (
                <div key={order.id} className="de-row">
                  <div style={{ flex: 1 }}>
                    <div className="text-sm font-semibold capitalize" style={{ color: 'var(--de-heading)' }}>
                      {order.ad_listings?.ad_slots?.placement?.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                      by @{order.ad_listings?.ad_slots?.profiles?.handle}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
