// DrEamsPanel.tsx
// Dr. Eams chat interface with animated mascot and theme-aware styling.
// Implements DR_EAMS.md requirements 11–20 (UI/interaction) and related onboarding hints.

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import DrEamsCanvas from './DrEamsCanvas';

interface DrEamsPanelProps {
  onClose: () => void;
}

type Message = { role: 'user' | 'ai'; text: string; image?: string };

// Quick-action chips (DR_EAMS req 13: supports quick actions)
const QUICK_ACTIONS = [
  { label: 'Add widget',      prompt: 'How do I add a widget?' },
  { label: 'Customize theme', prompt: 'How do I customize my theme?' },
  { label: 'Connect IG',      prompt: 'How do I connect Instagram?' },
  { label: 'What is a Dream?',prompt: 'What is a Dream?' },
];

function getDemoResponse(text: string): { text: string; image?: string } | null {
  const t = text.trim().toLowerCase();
  if (t === 'hello' || t === 'hi') {
    return { text: "Hey there! ✨ I'm Dr. Eams — your dream AI guide. Ask me anything, or tap a quick action below!" };
  }
  if (t === 'how are you') {
    return { text: "Dreaming big and running smooth! Every node in DREAMengin is humming. How can I power your creative journey today? 🚀" };
  }
  if (t === 'what is a dream?' || t === 'what is a dream') {
    return { text: 'A Dream is your personalized Home space — think of it as your base camp in DREAMengin. Daydreams are the full-powered mini-apps (Music Studio, Brand, etc.).' };
  }
  if (t === 'how do i add a widget?' || t === 'how do i add a widget') {
    return { text: 'Tap the System button → Settings → Widgets to open the widget library. Pick a widget, choose a slot, and it\'s live. Need more help? I can walk you through it step by step.' };
  }
  return null;
}

export default function DrEamsPanel({ onClose }: DrEamsPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hello! What are you daydreaming about today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  // Auto-scroll to bottom on new messages (DR_EAMS req 17)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    const demo = getDemoResponse(text);
    if (demo) {
      setMessages((m) => [...m, { role: 'ai', text: demo.text, image: demo.image }]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/dr-eams/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          ui: {
            route: typeof window !== 'undefined' ? window.location.pathname : '/home',
            nav: { overlay: 'HOME_MENU' },
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      // Supports both triad (/run => response_text) and legacy (/hf => reply/error) payload keys.
      const reply =
        (data && typeof data.response_text === 'string' && data.response_text) ||
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
          ref={scrollRef}
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
              {m.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.image}
                  alt="Dr. Eams"
                  style={{ display: 'block', marginTop: 8, width: '100%', maxWidth: 180, borderRadius: 12, objectFit: 'cover' }}
                />
              )}
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

        {/* Quick-action chips (DR_EAMS req 13–14) */}
        {messages.length <= 1 && (
          <div style={{ padding: '6px 16px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={() => void send(qa.prompt)}
                style={{
                  padding: '6px 14px', borderRadius: 9999,
                  background: 'var(--de-mist)', border: '1px solid var(--de-border)',
                  color: 'var(--de-accent)', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 10, borderTop: '1px solid var(--de-border)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void send(); } }}
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
