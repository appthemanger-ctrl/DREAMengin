'use client';

/**
 * components/marketplace/MarketplaceRequestButton.tsx
 *
 * Client component that POSTs to /api/marketplace/request — Point 46.
 * This makes the "Request" CTA a real system action rather than a placeholder.
 *
 * Architecture: client component with server fetch; no secrets in bundle.
 * Phase 8 §E:   Point 46 — contact/request flow routes to real system action
 */

import { useState } from 'react';
import { Loader2, Send, CheckCircle } from 'lucide-react';

type Props = {
  itemId:    string;
  itemTitle: string;
};

export default function MarketplaceRequestButton({ itemId, itemTitle }: Props) {
  const [message,   setMessage]   = useState('');
  const [isOpen,    setIsOpen]    = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  const handleSend = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/marketplace/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ item_id: itemId, message }),
      });

      const body = await res.json() as { error?: string; request?: { id: string } };

      if (!res.ok) {
        throw new Error(body.error ?? 'Failed to send request.');
      }

      setSuccess(true);
      setIsOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 14px', borderRadius: 10,
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.25)',
        }}
      >
        <CheckCircle className="w-4 h-4" style={{ color: '#22c55e', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
          Request sent! The seller will contact you via DreamDM.
        </span>
      </div>
    );
  }

  if (isOpen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)' }}>
          Message the seller about <em>{itemTitle}</em>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hi, I am interested in this listing…"
          maxLength={1000}
          rows={3}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            background: 'var(--de-mist)', border: '1px solid var(--de-border)',
            color: 'var(--de-text)', fontSize: 13, outline: 'none',
            resize: 'none', boxSizing: 'border-box',
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: '#dc4444' }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => { setIsOpen(false); setError(''); }}
            className="de-btn de-btn-ghost"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="de-btn de-btn-gold"
            style={{ flex: 2, gap: 6 }}
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              : <><Send className="w-4 h-4" /> Send Request</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="de-btn de-btn-gold"
      style={{ width: '100%', gap: 8 }}
    >
      <Send className="w-4 h-4" />
      {/* Point 46 CTA label */}
      Request / Contact Seller
    </button>
  );
}
