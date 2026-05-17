'use client';

import { useState } from 'react';
import { useAgentSession } from './useAgentSession';

/**
 * AgentPanel – AI Co‑pilot panel for CodeEngin.
 *
 * Renders a "Start AI Co‑pilot" button when no session is active, and a
 * full chat interface once a session is running.  All communication happens
 * via /api/agent/session so no agent-os imports are needed on the client.
 */
export function AgentPanel() {
  const {
    messages,
    isLoading,
    startSession,
    sendPrompt,
    closeSession,
    isActive,
  } = useAgentSession();
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    void sendPrompt(trimmed);
  };

  if (!isActive) {
    return (
      <button
        type="button"
        onClick={() => void startSession()}
        className="de-btn de-btn-primary"
      >
        Start AI Co‑pilot
      </button>
    );
  }

  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <span className="de-widget-title">🤖 AI Co‑pilot</span>
        <button
          type="button"
          onClick={() => void closeSession()}
          className="de-btn de-btn-ghost text-xs"
        >
          Close
        </button>
      </div>

      <div className="de-widget-body h-64 overflow-y-auto">
        {messages.map(msg: Record<string, unknown>, i: number => (
          <div
            key={i}
            className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <span className="inline-block p-2 rounded-lg bg-de-surface/50 max-w-[80%]">
              {msg.content}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="text-center text-de-text-dim">AI is thinking…</div>
        )}
      </div>

      <div className="de-widget-actions flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-1 de-input"
          placeholder="Ask the AI to write code, explain, or refactor…"
        />
        <button
          type="button"
          onClick={handleSend}
          className="de-btn de-btn-primary"
        >
          Send
        </button>
      </div>
    </div>
  );
}
