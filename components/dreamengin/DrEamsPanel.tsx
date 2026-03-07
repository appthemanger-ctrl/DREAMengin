// DrEamsPanel.tsx — Dr. Eams universal panel: search bar + AI chat.
// Dr. Eams is the primary search interface AND message launcher.
// Capabilities adapt to the user's role on the server side.

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DrEamsPanelProps {
  onClose: () => void;
  /** When true (e.g. opened from the right DreamMenu), show a "Send to DreamDM" button */
  showDMButton?: boolean;
}

type Message = { role: 'user' | 'ai'; text: string };

// ── Search route map ──────────────────────────────────────────────
// Maps user-typed keywords → canonical DREAMengin routes (LAW.md §Route law)
const ROUTE_MAP: Array<{ keywords: string[]; label: string; route: string; icon: string }> = [
  { keywords: ['shop', 'store', 'sell', 'buy'],          label: 'DreamShop',       route: '/shop',                    icon: '🛍️' },
  { keywords: ['marketplace', 'market', 'listing'],      label: 'DreamMarketplace', route: '/marketplace',             icon: '∞' },
  { keywords: ['settings', 'setting', 'preferences'],   label: 'Settings',         route: '/settings',                icon: '⚙️' },
  { keywords: ['profile', 'edit profile', 'builder'],   label: 'EditProfileDream', route: '/edit-profiledream',       icon: '✏️' },
  { keywords: ['home', 'homedream', 'dashboard'],       label: 'HomeDream',        route: '/homedream',               icon: '🏠' },
  { keywords: ['music', 'starmaker', 'beats'],          label: 'Music Daydream',   route: '/daydream/music',          icon: '🎵' },
  { keywords: ['games', 'game', 'gaming', 'play'],      label: 'Games Daydream',   route: '/daydream/games',          icon: '🎮' },
  { keywords: ['lab', 'laboratory', 'experiment'],      label: 'Lab Daydream',     route: '/daydream/lab',            icon: '🔬' },
  { keywords: ['code', 'coding', 'dev', 'develop'],     label: 'Code Daydream',    route: '/daydream/code',           icon: '💻' },
  { keywords: ['brand', 'branding', 'logo'],            label: 'Brand Daydream',   route: '/daydream/brand',          icon: '🎨' },
  { keywords: ['create', 'content', 'create content'],  label: 'Create Daydream',  route: '/daydream/create',         icon: '✨' },
  { keywords: ['messages', 'dm', 'dreamdm', 'chat'],   label: 'DreamDM',          route: '/messages',                icon: '💬' },
  { keywords: ['ads', 'dreamads', 'advertise'],         label: 'DreamAds',         route: '/ads',                     icon: '📢' },
  { keywords: ['analytics', 'algorithm', 'insights'],  label: 'Analytics',        route: '/settings/algorithm',      icon: '📊' },
  { keywords: ['appearance', 'theme', 'colors'],       label: 'Appearance',       route: '/settings/appearance',     icon: '🌈' },
  { keywords: ['connectors', 'connect', 'integrations'],label: 'Connectors',      route: '/connectors',              icon: '🔌' },
];

function getRouteSuggestions(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return ROUTE_MAP.filter(({ keywords }) =>
    keywords.some((kw) => kw.includes(q) || q.includes(kw))
  ).slice(0, 5);
}

// Quick-action chips — shown before the first user message
const QUICK_ACTIONS = [
  { label: '✨ Explore DREAMengin', prompt: 'Give me a quick tour of what DREAMengin can do.' },
  { label: '🎨 Customize my theme',  prompt: 'How do I change my theme and colors?' },
  { label: '🔗 Connect my socials',  prompt: 'How do I connect Instagram, TikTok, or Spotify?' },
  { label: '🧩 Add a widget',        prompt: 'How do I add and arrange widgets on my home?' },
];

/* ── Dr. Eams avatar ── */
function DrEamsAvatar({ size = 44 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2a8ab8 0%, #c8981a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        flexShrink: 0,
        boxShadow: '0 2px 12px rgba(42,138,184,0.3)',
      }}
      aria-hidden="true"
    >
      ✦
    </div>
  );
}

/* ── IDARi avatar ── (kept for backward compat) */
function IDARiAvatar({ size = 44 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2a8ab8 0%, #c8981a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        flexShrink: 0,
        boxShadow: '0 2px 12px rgba(42,138,184,0.3)',
      }}
      aria-hidden="true"
    >
      ✦
    </div>
  );
}

/* ── Typing indicator ── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--de-text-dim)',
            animation: `idari-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function DrEamsPanel({ onClose, showDMButton = false }: DrEamsPanelProps) {
  const router = useRouter();

  // ── Search state ──
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestions = useMemo(() => getRouteSuggestions(searchQuery), [searchQuery]);

  // ── Chat state ──
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hey! I'm Dr. Eams — your AI companion inside DREAMengin. What are you dreaming up today? ✦" },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSent, setLastSent] = useState(false); // tracks whether a message was just sent (for DM button)
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);
  const showChips = messages.length === 1;

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus search input on open (Axiom 1 — instant understanding)
  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, []);

  const navigateTo = (route: string) => {
    onClose();
    router.push(route);
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setLastSent(true);
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/eams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));

      // Dr. Eams / IDARi return { response_text } or { error: { message } }
      const reply =
        (data?.response_text && typeof data.response_text === 'string')
          ? data.response_text
          : (data?.error?.message && typeof data.error.message === 'string')
            ? `⚠️ ${data.error.message}`
            : "I'm here! Could you rephrase that?";

      setMessages((m) => [...m, { role: 'ai', text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Network error — please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Keyframes injected inline once */}
      <style>{`
        @keyframes idari-dot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes de-suggestion-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(8,20,50,0.32)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
        onPointerDown={onClose}
      >
        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Dr. Eams"
          style={{
            width: 'min(30rem, 96vw)',
            maxHeight: '92vh',
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(160,195,240,0.4)',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -8px 48px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'de-dual-menu-up 0.28s cubic-bezier(0.34,1.22,0.64,1)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div style={{
            padding: '16px 20px 12px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '1px solid rgba(160,195,240,0.25)',
          }}>
            <DrEamsAvatar size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.2 }}>Dr. Eams</div>
              <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 2 }}>Your DREAMengin AI · always on</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Dr. Eams"
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(160,195,240,0.15)',
                border: '1px solid rgba(160,195,240,0.3)',
                color: 'var(--de-text)', fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 1 — SEARCH BAR
              Axiom 1: instant understanding — search is front and centre.
              Shows live route suggestions as the user types.
          ══════════════════════════════════════════ */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(160,195,240,0.2)' }}>
            {/* Label */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              🔍 Search DREAMengin
            </div>

            {/* Search input */}
            <div style={{ position: 'relative' }}>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && suggestions.length > 0) {
                    e.preventDefault();
                    navigateTo(suggestions[0].route);
                  }
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                    setSearchFocused(false);
                  }
                }}
                placeholder="Search DREAMengin…"
                aria-label="Search DREAMengin"
                style={{
                  width: '100%', padding: '11px 16px 11px 40px', borderRadius: 100,
                  background: 'rgba(240,245,255,0.9)',
                  border: `1px solid ${searchFocused ? 'rgba(42,138,184,0.5)' : 'rgba(160,195,240,0.4)'}`,
                  color: 'var(--de-heading)', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
              />
              {/* Search icon */}
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', opacity: 0.5 }}>🔍</span>
              {/* Clear button */}
              {searchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setSearchQuery(''); searchRef.current?.focus(); }}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(160,195,240,0.3)', border: 'none',
                    color: 'var(--de-text)', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Route suggestions */}
            {suggestions.length > 0 && (searchFocused || searchQuery.length > 0) && (
              <div
                role="listbox"
                aria-label="Navigation suggestions"
                style={{
                  marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4,
                  animation: 'de-suggestion-in 0.15s ease-out',
                }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s.route}
                    role="option"
                    type="button"
                    aria-selected={false}
                    onClick={() => navigateTo(s.route)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 12,
                      background: 'rgba(42,138,184,0.06)',
                      border: '1px solid rgba(160,195,240,0.25)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.1s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,138,184,0.12)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,138,184,0.06)'; }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{s.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)', fontFamily: 'monospace' }}>{s.route}</div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--de-text-dim)', flexShrink: 0 }}>→</span>
                  </button>
                ))}
              </div>
            )}

            {/* No results nudge */}
            {searchQuery.trim().length > 1 && suggestions.length === 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', padding: '6px 0' }}>
                No pages match — try asking Dr. Eams below ↓
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════
              Visual separator between search and chat
          ══════════════════════════════════════════ */}
          <div style={{
            padding: '8px 16px 6px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,195,240,0.2)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              💬 Message Eams
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,195,240,0.2)' }} />
          </div>

          {/* ══════════════════════════════════════════
              SECTION 2 — AI CHAT
              The existing Dr. Eams conversation interface.
          ══════════════════════════════════════════ */}

          {/* ── Messages ── */}
          <div
            ref={scrollRef}
            style={{
              flex: 1, overflowY: 'auto', padding: '8px 18px 12px',
              display: 'flex', flexDirection: 'column', gap: 10,
              minHeight: 140,
              scrollbarWidth: 'none',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                }}
              >
                {m.role === 'ai' && <IDARiAvatar size={28} />}
                <div style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #0f2a5c, #1a4a8a)'
                    : 'rgba(240,245,255,0.95)',
                  border: m.role === 'ai' ? '1px solid rgba(160,195,240,0.3)' : 'none',
                  color: m.role === 'user' ? '#fff' : 'var(--de-text)',
                  fontSize: 14,
                  lineHeight: 1.55,
                  boxShadow: m.role === 'user' ? '0 2px 12px rgba(15,42,92,0.2)' : '0 1px 6px rgba(0,0,0,0.04)',
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <IDARiAvatar size={28} />
                <div style={{
                  background: 'rgba(240,245,255,0.95)',
                  border: '1px solid rgba(160,195,240,0.3)',
                  borderRadius: '18px 18px 18px 4px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          {/* ── Quick-action chips (before first user message) ── */}
          {showChips && (
            <div style={{ padding: '2px 16px 6px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => void send(qa.prompt)}
                  style={{
                    padding: '6px 14px', borderRadius: 100,
                    background: 'rgba(240,245,255,0.9)',
                    border: '1px solid rgba(160,195,240,0.4)',
                    color: 'var(--de-heading)', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Input bar ── */}
          <div style={{
            padding: '10px 14px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
            borderTop: '1px solid rgba(160,195,240,0.25)',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder="Ask Dr. Eams anything…"
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 100,
                  background: 'rgba(240,245,255,0.9)',
                  border: '1px solid rgba(160,195,240,0.4)',
                  color: 'var(--de-heading)', fontSize: 15, outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!canSend}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: canSend
                    ? 'linear-gradient(135deg, #0f2a5c, #2a8ab8)'
                    : 'rgba(160,195,240,0.2)',
                  border: 'none',
                  color: canSend ? 'white' : 'var(--de-text-dim)',
                  fontSize: 18, cursor: canSend ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s, transform 0.1s',
                  boxShadow: canSend ? '0 2px 12px rgba(42,138,184,0.3)' : 'none',
                }}
                aria-label="Send message"
              >
                ↑
              </button>
            </div>

            {/* "Send to DreamDM" — shown in DreamMenu context after a message is composed,
                or always in showDMButton mode (Axiom 3: real capability) */}
            {showDMButton && lastSent && (
              <button
                type="button"
                onClick={() => navigateTo('/messages')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  width: '100%', padding: '10px 16px', borderRadius: 100,
                  background: 'linear-gradient(135deg, rgba(42,138,184,0.12), rgba(200,152,26,0.08))',
                  border: '1px solid rgba(42,138,184,0.3)',
                  color: 'var(--de-heading)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                💬 Continue in DreamDM →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

