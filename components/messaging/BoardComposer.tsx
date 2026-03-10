'use client';
import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function BoardComposer({ boardId, userId }: { boardId: string; userId: string }) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  // Suppress unused var warning — userId may be needed for optimistic UI in future
  void userId;

  const handleSubmit = async () => {
    if (!content.trim() || isSending) return;
    setIsSending(true); setError('');
    try {
      const res = await fetch('/api/messages/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board_id: boardId, content: content.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error || 'Failed to post.');
        return;
      }
      setContent('');
      setSent(true);
      setTimeout(() => setSent(false), 2500);
      // Reload posts — simplest way in a server component page is a full reload
      window.location.reload();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      padding: '12px 16px 28px',
      background: 'rgba(220,232,248,0.95)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(160,195,240,0.3)',
    }}>
      {error && (
        <div style={{ fontSize: 11, color: '#dc4444', marginBottom: 6 }}>{error}</div>
      )}
      {sent && (
        <div style={{ fontSize: 11, color: '#22c55e', marginBottom: 6 }}>✓ Posted</div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 600, margin: '0 auto' }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Write a post… (Ctrl+Enter to send)"
          rows={2}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 12, resize: 'none',
            background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(160,195,240,0.35)',
            color: 'var(--de-heading)', fontSize: 13, outline: 'none', lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSending}
          style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: content.trim() ? 'linear-gradient(135deg, #c8981a, #e0b830)' : 'rgba(200,152,26,0.2)',
            border: 'none', cursor: content.trim() && !isSending ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: content.trim() ? '0 4px 14px rgba(200,152,26,0.35)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {isSending
            ? <Loader2 size={16} style={{ color: '#fff' }} className="animate-spin" />
            : <Send size={16} style={{ color: content.trim() ? '#fff' : 'rgba(200,152,26,0.5)' }} />
          }
        </button>
      </div>
    </div>
  );
}
