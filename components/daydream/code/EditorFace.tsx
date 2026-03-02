'use client';
import React, { useState } from 'react';
import { DSection, DCard, DBtn, FACE_WRAPPER } from '../DayDreamShell';
const A = '#38bdf8';
type File = { name: string; content: string };
const STARTER: File[] = [
  { name: 'index.html', content: '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello DREAMengin</h1>\n</body>\n</html>' },
  { name: 'style.css',  content: 'body { font-family: sans-serif; background: #020818; color: #f0f4ff; }' },
  { name: 'main.js',    content: 'console.log("Dream big");' },
];
export default function EditorFace({ onPreview }: { onPreview: (code: string) => void }) {
  const [files, setFiles] = useState<File[]>(STARTER);
  const [active, setActive] = useState('index.html');
  const [newName, setNewName] = useState('');
  const file = files.find(f => f.name === active)!;
  const update = (content: string) => setFiles(fs => fs.map(f => f.name === active ? { ...f, content } : f));
  return (
    <div style={{ ...FACE_WRAPPER, paddingTop: 12 }}>
      {/* File tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 8, paddingBottom: 4, alignItems: 'center' }}>
        {files.map(f => (
          <button key={f.name} type="button" onClick={() => setActive(f.name)} style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: active === f.name ? `${A}22` : 'rgba(100,150,255,0.06)',
            border: active === f.name ? `1px solid ${A}55` : '1px solid rgba(100,150,255,0.1)',
            color: active === f.name ? 'rgba(200,230,255,0.95)' : 'rgba(160,185,255,0.45)',
          }}>{f.name}</button>
        ))}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="new-file.js" style={{ background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.15)', borderRadius: 6, padding: '4px 8px', color: 'rgba(240,244,255,0.85)', fontSize: 10, outline: 'none', width: 90 }}
            onKeyDown={e => { if (e.key==='Enter' && newName.trim()) { setFiles(fs => [...fs, { name: newName.trim(), content: '' }]); setActive(newName.trim()); setNewName(''); }}} />
        </div>
      </div>
      {/* Editor */}
      <DCard accent={A} style={{ padding: 0, overflow: 'hidden' }}>
        <textarea value={file.content} onChange={e => update(e.target.value)} spellCheck={false}
          style={{ width: '100%', minHeight: 320, background: 'transparent', border: 'none', outline: 'none', padding: '14px 16px', color: 'rgba(200,230,255,0.9)', fontFamily: '"Fira Code",monospace', fontSize: 12, lineHeight: 1.7, resize: 'vertical' }} />
      </DCard>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <DBtn label="▶ Preview" accent={A} onClick={() => {
          const html = files.find(f=>f.name==='index.html')?.content ?? '';
          const css  = files.find(f=>f.name==='style.css')?.content ?? '';
          const js   = files.find(f=>f.name==='main.js')?.content ?? '';
          onPreview(`<style>${css}</style>${html}<script>${js}</script>`);
        }} />
        <DBtn label="Auto-save ✓" accent={A} ghost small />
        <DBtn label="Lint" accent={A} ghost small />
      </div>
      {/* Error panel placeholder */}
      <DSection title="Console">
        <DCard accent={A} style={{ padding: '8px 12px', minHeight: 48 }}>
          <span style={{ fontSize: 11, color: 'rgba(160,185,255,0.3)', fontFamily: 'monospace' }}>No errors</span>
        </DCard>
      </DSection>
    </div>
  );
}
