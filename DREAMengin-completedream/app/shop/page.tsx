import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Plus, ArrowLeft, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const supabase = await createServerClient();
  
  // Require authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }

  // Fetch all merch items
  const { data: merchData } = await supabase
    .from('merch')
    .select(`
      *,
      profiles!inner(handle, display_name)
    `)
    .order('created_at', { ascending: false });

  // Demo items to show UI when no real data exists
  const demoMerch = [
    {
      id: 'demo-1',
      title: 'DreamEngin Hoodie',
      description: 'Premium quality hoodie with the DreamEngin logo. Perfect for late night coding sessions.',
      price: 59.99,
      stock: 25,
      image_url: null,
      profiles: { handle: 'dreamengin', display_name: 'DreamEngin' }
    },
    {
      id: 'demo-2',
      title: 'Infinity Tee',
      description: 'Soft cotton t-shirt featuring the iconic infinity symbol design.',
      price: 29.99,
      stock: 100,
      image_url: null,
      profiles: { handle: 'dreamengin', display_name: 'DreamEngin' }
    },
    {
      id: 'demo-3',
      title: 'Creator Mug',
      description: 'Ceramic mug for your morning coffee. "Dream. Create. Ship." design.',
      price: 19.99,
      stock: 50,
      image_url: null,
      profiles: { handle: 'dreamengin', display_name: 'DreamEngin' }
    },
    {
      id: 'demo-4',
      title: 'Lab Notebook',
      description: 'Premium notebook for sketching ideas and documenting experiments.',
      price: 24.99,
      stock: 75,
      image_url: null,
      profiles: { handle: 'dreamengin', display_name: 'DreamEngin' }
    },
  ];

  const merch = merchData && merchData.length > 0 ? merchData : demoMerch;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Shop</h1>
          </div>
          <Link
            href="/shop/sell"
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mr-3">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Shop</h1>
          </div>
          <Link
            href="/shop/sell"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Sell Item
          </Link>
        </div>

        {/* Merch Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {merch?.map((item) => (
            <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all group">
              {item.image_url ? (
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.title || ''}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              
              <div className="p-3 md:p-4">
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1 text-sm md:text-base">{item.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2 hidden md:block">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base md:text-lg font-bold text-foreground">${item.price}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {item.stock || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 hidden md:block">
                  by @{item.profiles?.handle}
                </p>
                <button className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl hover:bg-primary/90 transition-colors active:scale-95 text-sm font-medium min-h-[44px]">
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Demo banner when showing demo items */}
        {(!merchData || merchData.length === 0) && (
          <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
            <p className="text-sm text-primary font-medium">
              These are sample items. Create your first listing to start selling!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
