import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, Sparkles, Package, ShoppingCart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Marketplace – DREAMengin',
  description: 'Discover and install widgets, connectors, and extensions.',
};

export default async function MarketplacePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const categories = [
    { id: 'widgets', label: 'Widgets', icon: Package, description: 'Add capabilities to your Daydreams and Home.' },
    { id: 'connectors', label: 'Connectors', icon: Sparkles, description: 'Link external services to your feed and profile.' },
    { id: 'themes', label: 'Themes', icon: Store, description: 'Customize the visual language of your space.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Marketplace</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Hero */}
        <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Extend Your Dream</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Browse widgets, connectors, and themes built for DREAMengin. Everything you add
            becomes part of your personal space.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {categories.map(({ id, label, icon: Icon, description }) => (
            <div
              key={id}
              className="bg-card rounded-2xl border border-border p-4 flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0 self-center">
                Coming soon
              </span>
            </div>
          ))}
        </div>

        {/* Shop link */}
        <div className="mt-6">
          <Link
            href="/shop"
            className="flex items-center justify-between bg-card rounded-2xl border border-border p-4 hover:bg-muted/50 transition-colors min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Shop</p>
                <p className="text-xs text-muted-foreground">Merch and physical goods</p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
