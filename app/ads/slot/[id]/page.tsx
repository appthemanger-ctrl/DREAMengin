import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { AdSlot } from '@/types/ads';

export const dynamic = 'force-dynamic';

export default async function AdSlotPage({ params }: { params: { id: string } }) {
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
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/ads" className="text-sm underline text-slate-700">← Back</Link>
          <h1 className="mt-4 text-2xl font-semibold">Ad Slot not found</h1>
          <p className="mt-2 text-slate-600">Slot ID: {params.id}</p>
        </div>
      </main>
    );
  }

  const slot = data as unknown as AdSlot & { owner_id?: string };
  if (slot.owner_id && slot.owner_id !== user.id) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/ads" className="text-sm underline text-slate-700">← Back</Link>
          <h1 className="mt-4 text-2xl font-semibold">Not authorized</h1>
          <p className="mt-2 text-slate-600">You do not own this slot.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/ads" className="text-sm underline text-slate-700">← Back</Link>
          <Link href="/ads/create" className="text-sm underline text-slate-700">Create another</Link>
        </div>

        <h1 className="mt-4 text-2xl font-bold">Manage Ad Slot</h1>
        <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Slot ID</span>
            <span className="font-mono text-slate-900">{slot.id}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-600">Placement</span>
            <span className="text-slate-900">{slot.placement}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-600">Active</span>
            <span className="text-slate-900">{slot.active ? 'Yes' : 'No'}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-600">Price/day</span>
            <span className="text-slate-900">${slot.price_day}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-600">Price/week</span>
            <span className="text-slate-900">${slot.price_week}</span>
          </div>
        </div>

        <p className="mt-6 text-slate-700">
          Slot management controls will appear here for real listings (pricing, activation, orders).
        </p>
      </div>
    </main>
  );
}
