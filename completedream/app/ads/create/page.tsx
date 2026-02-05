'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Loader2, LayoutGrid, Info } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/ads" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Create Ad Slot</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Placement */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Placement Location
            </label>
            <div className="space-y-2">
              {placements.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlacement(p.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-colors ${
                    placement === p.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      placement === p.id ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <LayoutGrid className={`w-5 h-5 ${placement === p.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <span className="font-medium text-foreground block">{p.label}</span>
                      <span className="text-sm text-muted-foreground">{p.description}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Pricing
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Daily Rate</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceDay}
                    onChange={(e) => setPriceDay(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Weekly Rate</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceWeek}
                    onChange={(e) => setPriceWeek(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-muted/50 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                Once created, your ad slot will be available for purchase in the marketplace. 
                You will receive payment when someone books your slot.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Create Ad Slot
              </>
            )}
          </button>
        </form>

        {/* Expected Earnings */}
        <div className="mt-8 p-4 bg-card border border-border rounded-xl">
          <h3 className="font-medium text-foreground mb-3">Estimated Earnings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily bookings (30 days)</span>
              <span className="font-medium text-foreground">${(parseFloat(priceDay || '0') * 30).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekly bookings (4 weeks)</span>
              <span className="font-medium text-foreground">${(parseFloat(priceWeek || '0') * 4).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
