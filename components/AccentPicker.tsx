'use client';
import { useState, useEffect } from 'react';

const SWATCHES = [
  '#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280'
];

export default function AccentPicker({ value, onChange }: { value?: string, onChange?: (v: string)=>void }) {
  const [accent, setAccent] = useState<string>(value || SWATCHES[0]);

  useEffect(()=>{ if (value) setAccent(value); }, [value]);

  function pick(v: string) {
    setAccent(v);
    onChange?.(v);
    try {
      document.documentElement.style.setProperty('--brand', v);
    } catch {}
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((v)=> (
        <button
          key={v}
          type="button"
          onClick={()=>pick(v)}
          className="h-8 w-8 rounded-full ring-2 ring-white/70 shadow"
          style={{ backgroundColor: v }}
          aria-label={`Pick ${v}`}
        />
      ))}
    </div>
  );
}
