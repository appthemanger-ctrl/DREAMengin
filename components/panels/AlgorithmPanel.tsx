'use client';

/**
 * AlgorithmPanel — My Algorithm settings rendered in Surface Space.
 * Wraps the real AlgorithmEngine component.
 * Back → openInSurface('settings'). No routing.
 */

import { ArrowLeft, Cpu } from 'lucide-react';
import AlgorithmEngine    from '@/components/feed/AlgorithmEngine';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';

export default function AlgorithmPanel() {
  const { openInSurface } = useDreamSystem();

  return (
    <div style={{ paddingBottom: 100 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(244,248,253,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(160,195,240,0.2)', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>
          <button type="button" onClick={() => openInSurface('settings')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} style={{ color: 'var(--de-heading)' }} />
          </button>
          <Cpu size={18} style={{ color: 'var(--de-accent)' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.1 }}>My Algorithm</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>You own your feed</div>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-5 pb-24">
        <AlgorithmEngine />
      </div>
    </div>
  );
}
