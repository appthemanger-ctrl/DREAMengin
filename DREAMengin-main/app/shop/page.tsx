
import { supaServer } from '@/lib/supabase/server';
export default async function Shop(){
  const s = supaServer();
  const { data: prods } = await s.from('products').select('*').eq('active', true).order('created_at', { ascending:false }).limit(50);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Shop</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {(prods ?? []).map((p:any)=>(
          <div key={p.id} className="card p-3">
            {p.image_url && <img src={p.image_url} alt="" className="rounded mb-2"/>}
            <div className="font-medium">{p.name}</div>
            <div className="text-sm">${p.price}</div>
            <form action={async ()=>{ 'use server'; }}><button className="btn mt-2" disabled>Request Purchase (Soon)</button></form>
          </div>
        ))}
      </div>
    </div>
  );
}
