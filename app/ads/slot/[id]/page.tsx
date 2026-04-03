import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, DollarSign, ToggleLeft, Hash } from 'lucide-react';
import type { AdSlot } from '@/types/ads';
import { connection } from 'next/server';


export default async function AdSlotPage({ params }: { params: { id: string } }) {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch slot and ensure ownership (or show not found)
  const { data, error } = await supabase
    .from('ad_slots')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return (
      <div className="de-sky-bg min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/ads" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
            </Link>
            <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Ad Slot</h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="de-notice" style={{ background: 'rgba(220,68,68,0.08)', borderColor: 'rgba(220,68,68,0.25)', color: '#dc4444' }}>
            Ad slot not found. It may have been deleted or the ID is incorrect.
          </div>
        </div>
      </div>
    );
  }

  const slot = data as unknown as AdSlot & { owner_id?: string };
  if (slot.owner_id && slot.owner_id !== user.id) {
    return (
      <div className="de-sky-bg min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/ads" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
            </Link>
            <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Ad Slot</h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="de-notice" style={{ background: 'rgba(220,68,68,0.08)', borderColor: 'rgba(220,68,68,0.25)', color: '#dc4444' }}>
            Not authorized — you do not own this slot.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/ads" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <LayoutGrid className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Manage Ad Slot</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Slot Details */}
        <div className="de-widget">
          <div className="de-widget-header">
            <LayoutGrid className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title">Slot Details</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{
              background: slot.active ? 'rgba(34,197,94,0.12)' : 'rgba(160,195,240,0.15)',
              color: slot.active ? '#22c55e' : 'var(--de-text-dim)',
            }}>
              {slot.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="de-widget-body" style={{ padding: 0 }}>
            {[
              { icon: Hash, label: 'Slot ID', value: slot.id, mono: true },
              { icon: LayoutGrid, label: 'Placement', value: slot.placement },
              { icon: ToggleLeft, label: 'Status', value: slot.active ? 'Active' : 'Inactive' },
              { icon: DollarSign, label: 'Price / Day', value: `$${slot.price_day}` },
              { icon: DollarSign, label: 'Price / Week', value: `$${slot.price_week}` },
            ].map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="de-row">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,152,26,0.1)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{label}</p>
                  <p className={`text-sm font-semibold capitalize ${mono ? 'font-mono text-xs' : ''}`} style={{ color: 'var(--de-heading)' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Management notice */}
        <div className="de-notice">
          <p>Full slot management controls (pricing changes, activation toggle, order management) will appear here when payment integration is complete.</p>
        </div>

        <div className="de-widget-actions" style={{ paddingInline: 0 }}>
          <Link href="/ads/create" className="de-btn de-btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
            Create Another Slot
          </Link>
          <Link href="/ads" className="de-btn de-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
            Back to Ads
          </Link>
        </div>
      </div>
    </div>
  );
}
