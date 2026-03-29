import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, PlusCircle, Package } from 'lucide-react';
import DreamWord from '@/components/ui/DreamWord';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DreamShop – Dreamengin', description: 'Sell and discover digital products.' };

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
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(245,243,238,0.92)', borderBottom: '1px solid rgba(200,165,80,0.18)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(200,152,26,0.10)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Store className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold"><DreamWord />Shop</h1>
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
                    <Link
                      href={`/messages?to=${item.user_id}`}
                      className="de-btn de-btn-ghost text-xs"
                      style={{ padding: '4px 10px', marginTop: 2, display: 'inline-flex', width: '100%', justifyContent: 'center' }}
                    >
                      Contact Seller
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="de-notice">
          Sellers set their own prices and manage checkout directly. Use &ldquo;Contact Seller&rdquo; to arrange purchase via DreamDM.
        </div>

        {/* ── Platform Feature Tiers ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>✦</span>
            <span className="de-widget-title ml-2">Platform Feature Tiers</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 14 }}>
              Every engine and daydream now ships with 20 industry features. Here&apos;s what you unlock at each tier.
            </p>

            {/* Tier comparison */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { tier: 'Free', color: '#22c55e', features: 10 },
                { tier: 'Pro',  color: '#6366f1', features: 16 },
                { tier: 'Elite',color: '#c8981a', features: 20 },
              ].map(t => (
                <div key={t.tier} style={{ flex: 1, padding: '12px 10px', borderRadius: 12, background: `${t.color}0e`, border: `1.5px solid ${t.color}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.color }}>{t.tier}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: t.color, marginTop: 4 }}>{t.features}</div>
                  <div style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>features per engine</div>
                </div>
              ))}
            </div>

            {/* Per-engine breakdown */}
            {[
              { emoji: '🎮', name: 'GameEngin',     accent: '#c8981a', features: ['Console Home', 'Tournament Mode', 'AI Director', 'Season Pass', 'Dream Economy', 'Daily Quests', 'Multiplayer Lobby', 'World Builder (Elite)', 'Speedrun Timer', 'Neon Drift + Echo Arena (Elite)'] },
              { emoji: '🎨', name: 'BrandingEngin', accent: '#ec4899', features: ['Brand Kit', 'Brand Voice AI', 'Competitor Watch', 'Press Kit Builder (Elite)', 'Sponsorship Pitch (Elite)', 'Color Palette Generator', 'Typography Kit', 'Persona Builder', 'Bio Optimizer', 'Game Engine Visual Presets (Elite)'] },
              { emoji: '📝', name: 'ContentEngin',  accent: '#f59e0b', features: ['Smart Draft Generator', 'Hashtag Optimizer', 'Viral Hook Builder', 'Multi-Platform Scheduler', 'Ad Copy Generator (Elite)', 'Content Repurposer', 'SEO Optimizer', 'Short Video Editor', 'Performance Predictor', 'Cinematic Intros (Elite)'] },
              { emoji: '💻', name: 'CodeEngin',     accent: '#6366f1', features: ['Live Notebook', 'CI Pipeline', 'AI Code Assist', 'Security Scanner', 'Performance Profiler', 'Package Manager', 'Database Browser', 'REST Client', 'Pair Programming (Pro)', 'Game Engine Integration (Elite)'] },
              { emoji: '🔬', name: 'LabEngin',      accent: '#22c55e', features: ['Simulation Runner', 'Data Visualization', 'WebGPU Monitor (Elite)', 'Benchmark Suite', 'Neural Visualizer', 'Quantum Circuit Simulator (Elite)', 'Parameter Sweep', 'Hypothesis Tracker', 'Resource Monitor', 'CI/CD Integration'] },
              { emoji: '📊', name: 'AnalyticsEngin',accent: '#6366f1', features: ['Social Media Overview', 'Engagement Funnel', 'A/B Post Comparison', 'Content Gap Analysis', 'Competitor Benchmark', 'Audience Demographics', 'Brand Sentiment', 'Revenue from Content', 'Growth Projection', 'Game Engine Telemetry (Elite)'] },
            ].map(eng => (
              <div key={eng.name} style={{ marginBottom: 12, padding: '12px 14px', borderRadius: 14, background: `${eng.accent}07`, border: `1px solid ${eng.accent}18` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{eng.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)' }}>{eng.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: eng.accent, background: `${eng.accent}15`, padding: '2px 7px', borderRadius: 5 }}>20 features</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {eng.features.map(f => (
                    <span key={f} style={{ fontSize: 10, fontWeight: f.includes('(Elite)') ? 700 : f.includes('(Pro)') ? 600 : 500, padding: '3px 8px', borderRadius: 6, background: f.includes('(Elite)') ? `${eng.accent}18` : f.includes('(Pro)') ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.6)', color: f.includes('(Elite)') ? eng.accent : f.includes('(Pro)') ? '#6366f1' : 'var(--de-text)', border: `1px solid ${f.includes('(Elite)') ? eng.accent + '30' : f.includes('(Pro)') ? 'rgba(99,102,241,0.2)' : 'rgba(0,0,0,0.07)'}` }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', textAlign: 'center', marginTop: 6 }}>
              Features marked <strong style={{ color: '#c8981a' }}>(Elite)</strong> require EliteGameEngine. Features marked <strong style={{ color: '#6366f1' }}>(Pro)</strong> require Pro tier.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
