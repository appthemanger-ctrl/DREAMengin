'use client';

import type { Node } from '@/lib/dreamnav/tau';

const NODE_LABELS: Record<string, string> = {
  '0':  'HOME',
  '1':  'Forward',
  '2':  'Backward',
  '3':  'Left',
  '4':  'Right',
  '5':  'Depth · In',
  '6':  'Depth · Out',
  '1b': 'Music',
  '2b': 'Lab',
  '3b': 'Code',
  '4b': 'Brand',
  '5b': 'Games',
  '6b': 'Create',
};

export default function NavIndicator({ node }: { node: Node }) {
  const label = NODE_LABELS[String(node)] ?? String(node);
  return (
    <div
      className="pointer-events-none fixed left-1/2 top-5 z-40 -translate-x-1/2"
      aria-live="polite"
      aria-label={`Current node: ${label}`}
    >
      <div
        className="flex items-center gap-2 rounded-full px-4 py-[5px] text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{
          background: 'rgba(5,15,45,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(100,150,255,0.15)',
          color: 'rgba(160,185,255,0.7)',
        }}
      >
        <span
          className="h-[6px] w-[6px] rounded-full"
          style={{ background: 'var(--de-gold)', boxShadow: '0 0 6px var(--de-gold)' }}
        />
        {label}
      </div>
    </div>
  );
}
