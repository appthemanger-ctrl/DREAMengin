'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const schema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  url: z.string().url().optional(),
  type: z.enum(['text', 'link', 'promo']).default('text'),
});
type Values = z.infer<typeof schema>;

export default function AddWidget() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Values) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login');
    await supabase.from('widgets').insert({ ...data, owner: session.user.id, position: 0 });
    router.push('/home');
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <h1 className="font-display text-2xl">Add widget</h1>

        <label className="block text-sm font-medium">Title</label>
        <input {...register('title')} className="w-full rounded-lg px-4 py-2 bg-white/10" />
        {errors.title && <p className="text-rose-400 text-sm">{errors.title.message}</p>}

        <label className="block text-sm font-medium">Body (optional)</label>
        <textarea {...register('body')} className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />

        <label className="block text-sm font-medium">URL (optional)</label>
        <input {...register('url')} type="url" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        {errors.url && <p className="text-rose-400 text-sm">{errors.url.message}</p>}

        <label className="block text-sm font-medium">Type</label>
        <select {...register('type')} className="w-full rounded-lg px-4 py-2 bg-white/10">
          <option value="text">Text</option>
          <option value="link">Link</option>
          <option value="promo">Promo</option>
        </select>

        <button className="bg-brandA text-white px-4 py-2 rounded-lg">Save</button>
      </form>
    </main>
  );
}
