import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, PlusCircle, Package, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shop – DREAMengin', description: 'Sell and discover digital products.' };

export default async function ShopPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Store className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Shop</h1>
          <Link href="/shop/sell" className="ml-auto de-btn de-btn-primary text-xs" style={{ padding: '6px 12px' }}>
            <PlusCircle className="w-3 h-3" /> Sell
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-widget">
          <div className="de-widget-header">
            <Package className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title">Your Shop</span>
          </div>
          <div className="de-widget-body flex flex-col items-center py-6 gap-3">
            <Store className="w-10 h-10 opacity-15" style={{ color: 'var(--de-gold)' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--de-heading)' }}>Set up your shop</p>
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Sell digital products, music, art, or services directly through DREAMengin.
            </p>
          </div>
          <div className="de-widget-actions">
            <Link href="/shop/sell" className="de-btn de-btn-primary text-xs">Create Your First Product</Link>
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <TrendingUp className="w-4 h-4 mr-2" style={{ color: '#22c55e' }} />
            <span className="de-widget-title">Browse Products</span>
          </div>
          <div className="de-widget-body flex flex-col items-center py-6 gap-2">
            <TrendingUp className="w-8 h-8 opacity-20" style={{ color: '#22c55e' }} />
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)' }}>No products available yet</p>
          </div>
        </div>

        <div className="de-notice">
          Products sold here go through the DREAMengin secure checkout. Payouts are processed weekly.
        </div>

      </div>
    </div>
  );
}
