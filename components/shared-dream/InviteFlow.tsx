'use client';

/**
 * components/shared-dream/InviteFlow.tsx — §38 Invite Flow
 *
 * "Launch Shared Dream" button:
 *   1. Generates an invite link
 *   2. Opens a modal displaying the link with copy-to-clipboard
 *   3. Accept flow initialises sync automatically (handled via URL param)
 */

import React, { useCallback, useState } from 'react';
import { useSharedDream } from './SharedDreamProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InviteFlowProps {
  /** Optional className for the trigger button. */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteFlow({ className = '' }: InviteFlowProps) {
  const { getInviteLink, channelId, connected } = useSharedDream();
  const [open,    setOpen]    = useState(false);
  const [copied,  setCopied]  = useState(false);

  const inviteLink = open ? getInviteLink() : '';

  const handleOpen = useCallback(() => {
    setOpen(true);
    setCopied(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input
      const input = document.getElementById('sd-invite-input') as HTMLInputElement | null;
      input?.select();
    }
  }, [inviteLink]);

  return (
    <>
      {/* ── Trigger button ─────────────────────────────────────────────────── */}
      <button
        onClick={handleOpen}
        disabled={!connected}
        className={[
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold',
          'bg-violet-600 hover:bg-violet-500 text-white',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          className,
        ].join(' ')}
      >
        <span>🔗</span>
        Launch Shared Dream
      </button>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Dialog */}
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Shared Dream Invite</h2>
              <button
                onClick={handleClose}
                className="text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Channel ID */}
            <p className="text-xs text-white/40 mb-1">Channel</p>
            <p className="text-xs font-mono text-violet-300 mb-4 truncate">
              {channelId}
            </p>

            {/* Invite link */}
            <p className="text-xs text-white/40 mb-1">Invite link</p>
            <div className="flex gap-2 mb-4">
              <input
                id="sd-invite-input"
                readOnly
                value={inviteLink}
                className={[
                  'flex-1 min-w-0 rounded-lg px-3 py-2 text-xs font-mono',
                  'bg-white/5 border border-white/10 text-white/70',
                  'focus:outline-none focus:ring-1 focus:ring-violet-500',
                ].join(' ')}
              />
              <button
                onClick={handleCopy}
                className={[
                  'px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-violet-600 hover:bg-violet-500 text-white',
                ].join(' ')}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Instructions */}
            <p className="text-[11px] text-white/30 leading-relaxed">
              Share this link with collaborators. Opening the link automatically
              joins the session and initialises real-time sync.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
