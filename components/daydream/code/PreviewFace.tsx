'use client';
import React, { useState } from 'react';
import { DBtn, FACE_WRAPPER } from '../DayDreamShell';
const A = '#38bdf8';
export default function PreviewFace({ previewCode, onBack }: { previewCode: string; onBack: () => void }) {
  const [mode, setMode] = useState<'mobile'|'desktop'>('mobile');
  return (
    <div style={{ ...FACE_WRAPPER, paddingTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <DBtn label="← Code" accent={A} small ghost onClick={onBack} />
        {(['mobile','desktop'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)} style={{ padding: '6px 14px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'capitalize', background: mode===m?`${A}22`:'rgba(100,150,255,0.06)', border: mode===m?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)', color: mode===m?'rgba(200,230,255,0.9)':'rgba(160,185,255,0.45)' }}>{m===`mobile`?'📱':'🖥'} {m}</button>
        ))}
        <DBtn label="↺ Reload" accent={A} small ghost />
        <DBtn label="Share Link" icon="↗" accent={A} small ghost />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: mode==='mobile'?390:'100%', maxWidth: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(100,150,255,0.2)', boxShadow: `0 8px 40px rgba(0,0,0,0.5)` }}>
          {previewCode
            ? <iframe srcDoc={previewCode} style={{ width: '100%', height: 480, border: 'none' }} title="preview" sandbox="allow-scripts" />
            : <div style={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020818', color: 'rgba(160,185,255,0.3)', fontSize: 13 }}>Click ▶ Preview from Code Space</div>}
        </div>
      </div>
    </div>
  );
}
