
import { supaServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Ads(){
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  const { data: slots } = await s.from('ad_slots').select('*').eq('visibility','public').order('created_at', { ascending:false });
  async function createSlot(formData: FormData) {
    'use server';
    const sv = (await import('@/lib/supabase/server')).supaServer();
    const { data:{ user } } = await sv.auth.getUser();
    if (!user) return;
    await sv.from('ad_slots').insert({
      owner_id: user.id,
      location: String(formData.get('location')||'sidebar'),
      title: String(formData.get('title')||'Ad Slot'),
      price_per_day: Number(formData.get('price')||'5'),
      visibility: 'public'
    });
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Ads Marketplace</h1>
      {user && (
        <form action={createSlot} className="card p-3 grid gap-2 max-w-md">
          <div className="font-medium">Price my ad space</div>
          <select name="location" className="border rounded px-2 py-1">
            <option value="header">Header</option>
            <option value="sidebar">Sidebar</option>
            <option value="between_feed">Between Feed Cards</option>
          </select>
          <input name="title" placeholder="Slot title" className="border rounded px-2 py-1"/>
          <input name="price" placeholder="Price per day (USD)" className="border rounded px-2 py-1"/>
          <button className="btn w-max">Create Slot</button>
        </form>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        {(slots ?? []).map((slt:any)=>(
          <div key={slt.id} className="card p-3">
            <div className="font-medium">{slt.title}</div>
            <div className="text-sm">Location: {slt.location}</div>
            <div className="text-sm">${slt.price_per_day}/day</div>
            <form action={async ()=>{ 'use server'; }}><button className="btn mt-2" disabled>Buy Ad Space (Soon)</button></form>
          </div>
        ))}
      </div>
    </div>
  );
}
