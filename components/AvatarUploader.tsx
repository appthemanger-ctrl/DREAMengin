
'use client';
import { useState } from 'react';
import { supa } from '@/lib/supabase/client';

export default function AvatarUploader({ initial }:{ initial?: string }){
  const [url, setUrl] = useState(initial || '');
  async function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if (!f) return;
    const ext = f.name.split('.').pop(); const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supa.storage.from('avatars').upload(path, f);
    if (!error) {
      const { data: pub } = supa.storage.from('avatars').getPublicUrl(path);
      setUrl(pub.publicUrl);
      // Save to profile
      await fetch('/api/profile/avatar', { method:'POST', body: JSON.stringify({ url: pub.publicUrl }) });
    } else alert(error.message);
  }
  return (
    <div className="flex items-center gap-3">
      {url && <img src={url} alt="" className="w-12 h-12 rounded-full border"/>}
      <input type="file" accept="image/*" onChange={onFile} />
    </div>
  );
}
