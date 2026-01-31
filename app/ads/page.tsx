import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, ShoppingCart, BarChart3, Plus } from 'lucide-react';

export default async function AdsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's ad slots
  const { data: mySlots } = await supabase
    .from('ad_slots')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch available listings
  const { data: marketplace } = await supabase
    .from('ad_listings')
    .select(`
      *,
      ad_slots!inner(*, profiles!inner(handle, display_name))
    `)
    .eq('status', 'available');

  // Fetch user's orders
  const { data: myOrders } = await supabase
    .from('ad_orders')
    .select(`
      *,
      ad_listings!inner(*, ad_slots!inner(*, profiles!inner(handle, display_name)))
    `)
    .eq('buyer_id', user.id);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 mr-3 text-slate-700" />
            <h1 className="text-3xl font-bold text-slate-900">Ads Marketplace</h1>
          </div>
          <Link
            href="/ads/create"
            className="flex items-center bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Slot
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-slate-100 p-1 rounded-lg w-fit">
          <button className="px-4 py-2 bg-white rounded-md text-sm font-medium text-slate-900 shadow-sm">
            My Slots
          </button>
          <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            Marketplace
          </button>
          <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            My Orders
          </button>
        </div>

        {/* My Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {mySlots?.map((slot) => (
            <div key={slot.id} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 capitalize">
                  {slot.placement?.replace('_', ' ')}
                </h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  slot.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {slot.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Daily</span>
                  <span className="font-medium">${slot.price_day}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Weekly</span>
                  <span className="font-medium">${slot.price_week}</span>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/ads/slot/${slot.id}`}
                  className="flex-1 text-center px-3 py-2 bg-slate-800 text-white text-sm rounded-md hover:bg-slate-700"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Revenue Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">$0.00</p>
              <p className="text-sm text-slate-600">Total Earned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">0</p>
              <p className="text-sm text-slate-600">Active Orders</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">0</p>
              <p className="text-sm text-slate-600">Impressions</p>
            </div>
          </div>
        </div>

        {/* Marketplace Listings */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Slots</h2>
          <div className="space-y-4">
            {marketplace?.map((listing) => (
              <div key={listing.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 capitalize">
                      {listing.ad_slots?.placement?.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-slate-600">
                      by @{listing.ad_slots?.profiles?.handle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ${listing.ad_slots?.price_day}/day
                    </p>
                    <button className="mt-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-md hover:bg-slate-700">
                      <ShoppingCart className="w-4 h-4 inline mr-1" />
                      Request
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
