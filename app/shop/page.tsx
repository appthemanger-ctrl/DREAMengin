import { createServerClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Plus } from 'lucide-react';

export default async function ShopPage() {
  const supabase = await createServerClient();

  // Fetch all merch items
  const { data: merch } = await supabase
    .from('merch')
    .select(`
      *,
      profiles!inner(handle, display_name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <ShoppingBag className="w-8 h-8 mr-3 text-slate-700" />
            <h1 className="text-3xl font-bold text-slate-900">Shop</h1>
          </div>
          <Link
            href="/shop/sell"
            className="flex items-center bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Sell Item
          </Link>
        </div>

        {/* Merch Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {merch?.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title || ''}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-slate-200 flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-slate-400" />
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">${item.price}</span>
                  <span className="text-sm text-slate-500">
                    {item.stock || 0} in stock
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  by @{item.profiles?.handle}
                </p>
                <button className="w-full mt-4 bg-slate-800 text-white py-2 rounded-md hover:bg-slate-700">
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {merch?.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No items yet</h2>
            <p className="text-slate-600 mb-4">Be the first to list an item!</p>
            <Link
              href="/shop/sell"
              className="inline-flex items-center bg-slate-800 text-white px-6 py-3 rounded-md hover:bg-slate-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Start Selling
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
