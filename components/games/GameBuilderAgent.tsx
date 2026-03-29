'use client';

/**
 * GameBuilderAgent — AI chat assistant embedded in GameEngin.
 *
 * Sends user messages to /api/ai/game-builder and displays:
 *   - A text response from the agent.
 *   - An optional code snippet with copy/insert actions.
 *   - Suggested follow-up questions.
 *
 * Props:
 *   currentGameId       – the game currently selected in GameEngin (optional).
 *   scriptContext       – the current script editor contents (optional).
 *   worldContext        – serialised world/tile grid (optional).
 *   onInsertCode        – callback invoked when the user taps "Insert into editor".
 */

import { useCallback, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface GameBuilderResponse {
  response_text: string;
  code_snippet?: string;
  code_language?: 'GameScript' | 'Lua' | 'JS';
  code_title?: string;
  suggestions?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeSnippet?: string;
  codeLanguage?: string;
  codeTitle?: string;
  suggestions?: string[];
  timestamp: number;
}

interface Props {
  currentGameId?: string;
  scriptContext?: string;
  worldContext?: string;
  onInsertCode?: (code: string, language: string) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ACCENT = '#2a8ab8';
const CODE_BG = 'rgba(5,8,16,0.85)';

const STARTER_SUGGESTIONS = [
  'How do I make a character jump?',
  'Show me a basic collision script',
  'What physics preset should I use for a platformer?',
  'How do I detect game-input events?',
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function GameBuilderAgent({
  currentGameId,
  scriptContext,
  worldContext,
  onInsertCode,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue]   = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // ── Send message ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setError(null);
    setIsLoading(true);

    // Scroll to bottom after adding user message
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const body: Record<string, string> = { message: trimmed };
      if (currentGameId)  body.game_id        = currentGameId;
      if (scriptContext)  body.script_context = scriptContext.slice(0, 3000);
      if (worldContext)   body.world_context  = worldContext.slice(0, 2000);

      const res = await fetch('/api/ai/game-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((errData.message as string | undefined) ?? `Error ${res.status}`);
      }

      const data = await res.json() as GameBuilderResponse;

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.response_text,
        codeSnippet:  data.code_snippet,
        codeLanguage: data.code_language,
        codeTitle:    data.code_title,
        suggestions:  data.suggestions,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [isLoading, currentGameId, scriptContext, worldContext]);

  // ── Copy code ─────────────────────────────────────────────────────────────────

  const handleCopy = useCallback(async (msgId: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, []);

  // ── Keyboard submit ───────────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }, [inputValue, sendMessage]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', minHeight: 0 }}>

      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '4px 2px 8px',
          minHeight: 0,
          maxHeight: 340,
        }}
        aria-label="Game Builder AI conversation"
        aria-live="polite"
      >
        {messages.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎮</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>
              Game Builder AI
            </div>
            <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.65)', lineHeight: 1.6, marginBottom: 16 }}>
              Ask me anything about building games — mechanics, code, tiles, physics, and more.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {STARTER_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    border: `1px solid ${ACCENT}35`,
                    background: `${ACCENT}10`,
                    color: 'rgba(226,232,240,0.8)',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* Bubble */}
            <div
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user'
                  ? `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}88)`
                  : 'rgba(255,255,255,0.07)',
                border: msg.role === 'user'
                  ? 'none'
                  : '1px solid rgba(125,211,252,0.14)',
                color: '#f0f6ff',
                fontSize: 12,
                lineHeight: 1.65,
              }}
            >
              {msg.content}
            </div>

            {/* Code snippet */}
            {msg.codeSnippet && (
              <div
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${ACCENT}35`,
                  background: CODE_BG,
                  alignSelf: 'flex-start',
                  maxWidth: '100%',
                  width: '100%',
                }}
              >
                {/* Code header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    background: `${ACCENT}18`,
                    borderBottom: `1px solid ${ACCENT}25`,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, flex: 1 }}>
                    {msg.codeTitle || msg.codeLanguage || 'Code'}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(125,211,252,0.55)',
                    }}
                  >
                    {msg.codeLanguage}
                  </span>

                  {onInsertCode && (
                    <button
                      type="button"
                      onClick={() => onInsertCode(msg.codeSnippet!, msg.codeLanguage ?? 'GameScript')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 5,
                        border: `1px solid ${ACCENT}55`,
                        background: `${ACCENT}22`,
                        color: ACCENT,
                        fontSize: 9,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ↓ Insert
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.codeSnippet!)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 5,
                      border: '1px solid rgba(125,211,252,0.25)',
                      background: 'rgba(125,211,252,0.08)',
                      color: copiedId === msg.id ? '#4ade80' : 'rgba(125,211,252,0.8)',
                      fontSize: 9,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copiedId === msg.id ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                {/* Code body */}
                <pre
                  style={{
                    margin: 0,
                    padding: '10px 12px',
                    fontSize: 10,
                    lineHeight: 1.6,
                    color: 'rgba(200,230,255,0.88)',
                    overflowX: 'auto',
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.codeSnippet}
                </pre>
              </div>
            )}

            {/* Suggestions */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                {msg.suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 999,
                      border: '1px solid rgba(125,211,252,0.2)',
                      background: 'rgba(125,211,252,0.06)',
                      color: 'rgba(226,232,240,0.7)',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 2px' }}>
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: '8px 14px',
                borderRadius: '14px 14px 14px 4px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(125,211,252,0.12)',
              }}
            >
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: ACCENT,
                    display: 'inline-block',
                    animation: `game-builder-bounce 0.9s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 10, color: 'rgba(226,232,240,0.4)' }}>Building…</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              fontSize: 11,
            }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          paddingTop: 8,
          borderTop: '1px solid rgba(125,211,252,0.1)',
          marginTop: 2,
        }}
      >
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about game mechanics, request code…"
          disabled={isLoading}
          rows={2}
          style={{
            flex: 1,
            resize: 'none',
            borderRadius: 10,
            border: `1px solid ${inputValue ? ACCENT + '60' : 'rgba(125,211,252,0.18)'}`,
            background: 'rgba(255,255,255,0.05)',
            color: '#f0f6ff',
            fontSize: 11,
            padding: '8px 10px',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            transition: 'border-color 0.2s',
          }}
          aria-label="Game Builder AI message input"
        />
        <button
          type="button"
          onClick={() => sendMessage(inputValue)}
          disabled={isLoading || !inputValue.trim()}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: 'none',
            background: inputValue.trim() && !isLoading ? ACCENT : 'rgba(255,255,255,0.06)',
            color: inputValue.trim() && !isLoading ? '#fff' : 'rgba(226,232,240,0.3)',
            fontSize: 12,
            fontWeight: 700,
            cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            flexShrink: 0,
            alignSelf: 'flex-end',
            height: 36,
          }}
          aria-label="Send message to Game Builder AI"
        >
          ▶
        </button>
      </div>

      {/* Bounce animation keyframes injected once */}
      <style>{`
        @keyframes game-builder-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
