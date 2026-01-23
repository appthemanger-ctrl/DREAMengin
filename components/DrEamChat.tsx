'use client';
import { useState } from 'react';
export default function DrEamChat(){
  const [msg, setMsg] = useState('');
  return (
    <div className="card p-4">
      <div className="font-medium mb-2">Inner Dreams (chat)</div>
      <form onSubmit={e=>{e.preventDefault(); setMsg('')}} className="flex gap-2">
        <input className="input flex-1 border rounded px-3 py-2" value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Ask a question..." />
        <button className="btn">Send</button>
      </form>
    </div>
  );
}
