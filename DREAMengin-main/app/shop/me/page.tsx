
import { supaServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export default async function MyShop(){
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) redirect('/login');
  const { data: prods } = await s.from('products').select('*').eq('owner_id', user.id).order('created_at', { ascending:false });
  async function add(formData: FormData) {
    'use server'; const sv = (await import('@/lib/supabase/server')).supaServer();
    const { data:{ user } } = await sv.auth.getUser(); if (!user) return;
    await sv.from('products').insert({ owner_id: user.id, name: String(formData.get('name')||''), price: Number(formData.get('price')||'0'), description: String(formData.get('description')||'') });
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Shop</h1>
      <form action={add} className="card p-3 grid gap-2 max-w-md">
        <input name="name" placeholder="Product name" className="border rounded px-3 py-2"/>
        <input name="price" placeholder="Price (USD)" className="border rounded px-3 py-2" />
        <textarea name="description" placeholder="Description" className="border rounded px-3 py-2" />
        <button className="btn w-max">Add Product</button>
      </form>
      <div className="grid md:grid-cols-3 gap-4">
        {(prods ?? []).map((p:any)=>(<div key={p.id} className="card p-3"><div className="font-medium">{p.name}</div><div className="text-sm">${p.price}</div></div>))}
      </div>
    </div>
  );
}
