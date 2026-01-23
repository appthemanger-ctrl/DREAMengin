'use client';
import { useState } from 'react';

const swatches = ['#dc2626','#fb7185','#0ea5e9','#22c55e','#f59e0b','#8b5cf6'];

export default function AccentPicker({ value, onChange }:{ value?: string; onChange?: (v:string)=>void }){
  const [v, setV] = useState<string>(value ?? '#dc2626');
  function pick(c:string) {
    setV(c);
    onChange?.(c);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--brand', c);
    }
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {swatches.map(c => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={()=>pick(c)}
          className="w-8 h-8 rounded-full border"
          style={{ background: c }}
          title={c}
        />
      ))}
      <input
        aria-label="custom color"
        type="color"
        value={v}
        onChange={(e)=>pick(e.target.value)}
        className="w-10 h-8 p-0 border rounded"
      />
    </div>
  );
}
