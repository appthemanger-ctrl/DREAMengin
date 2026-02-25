// DrEamsPanel.tsx
// Dr. Eams chat interface with animated mascot and theme-aware styling.

'use client';

import React, { useMemo, useState } from 'react';
import DrEamsCanvas from './DrEamsCanvas';

interface DrEamsPanelProps {
  onClose: () => void;
}

export default function DrEamsPanel({ onClose }: DrEamsPanelProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hello! What are you daydreaming about today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/dr-eams/hf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      const reply =
        (data && typeof data.reply === 'string' && data.reply) ||
        (data && typeof data.error === 'string' && `${data.error}${data.hint ? ` — ${data.hint}` : ''}`) ||
        'No response.';
      setMessages((m) => [...m, { role: 'ai', text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Network error.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)' }}
      onPointerDown={onClose}
    >
      <div
        className="de-glass"
        style={{
          width: 'min(28rem, 96vw)',
          maxHeight: '85vh',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header with mascot */}
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <DrEamsCanvas width={56} height={64} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--de-heading)' }}>Dr. Eams</div>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>AI Assistant</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--de-mist)', border: '1px solid var(--de-border)',
              color: 'var(--de-text)', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close Dr. Eams"
          >
            x
          </button>
        </div>

        <div className="de-divider" style={{ margin: 0 }} />

        {/* Messages */}
        <div
          data-scrollable="y"
          style={{
            flex: 1, overflowY: 'auto', padding: '14px 20px',
            display: 'flex', flexDirection: 'column', gap: 10,
            minHeight: 200, maxHeight: '50vh',
            touchAction: 'pan-y',
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? 'var(--de-accent)' : 'var(--de-mist)',
                border: m.role === 'user' ? 'none' : '1px solid var(--de-border)',
                color: m.role === 'user' ? 'white' : 'var(--de-text)',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div
              style={{
                alignSelf: 'flex-start', maxWidth: '80%',
                padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                background: 'var(--de-mist)', border: '1px solid var(--de-border)',
                color: 'var(--de-text-dim)', fontSize: 14,
              }}
            >
              Thinking...
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 10, borderTop: '1px solid var(--de-border)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
            placeholder="Ask Dr. Eams anything..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 14,
              background: 'var(--de-mist)', border: '1px solid var(--de-border)',
              color: 'var(--de-text)', fontSize: 16, outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSend}
            style={{
              padding: '12px 20px', borderRadius: 14,
              background: canSend ? 'var(--de-accent)' : 'var(--de-mist)',
              border: '1px solid var(--de-border)',
              color: canSend ? 'white' : 'var(--de-text-dim)',
              fontSize: 14, fontWeight: 600, cursor: canSend ? 'pointer' : 'default',
              minWidth: 64,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
