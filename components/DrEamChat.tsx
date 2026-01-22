
'use client';
import { useState } from 'react';

export default function DrEamChat(){
  const [q,setQ]=useState(''); const [a,setA]=useState<string[]>([]);
  const respond = async () => {
    const text = q.trim();
    // try command endpoint first
    const cmdRes = await fetch('/api/eam/command', { method:'POST', body: JSON.stringify({ q: text }) });
    if (cmdRes.ok) {
      const data = await cmdRes.json();
      if (data?.a) { setA(x=>[...x, data.a]); setQ(''); return; }
    }
    // fall back to assistant chat
    const res = await fetch('/api/assistant', { method:'POST', body: JSON.stringify({ q: text })});
    const data = await res.json();
    setA(x=>[...x, data.a ?? 'Hi! I’m Dr. Eam.']);
    setQ('');
  };
  return (
    <div className="space-y-2">
      <div className="font-semibold">Ask Dr. Eam</div>
      <div className="space-y-2 max-h-64 overflow-auto pr-1">{a.map((m,i)=><div key={i} className="text-sm">{m}</div>)}</div>
      <div className="flex gap-2">
        <input className="border flex-1 rounded px-2 py-1" value={q} onChange={e=>setQ(e.target.value)} placeholder='Type "next phase" (admin) or ask a question'/>
        <button className="btn" onClick={respond}>Send</button>
      </div>
    </div>
  );
}
