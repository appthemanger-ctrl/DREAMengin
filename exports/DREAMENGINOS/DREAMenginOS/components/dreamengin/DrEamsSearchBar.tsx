/**
 * components/dreamengin/DrEamsSearchBar.tsx
 *
 * Dr. Eams–powered search bar for HomeDream.
 *
 * Phase 6 item #4: "Integrate Dr. Eams as HomeDream search bar with
 * send-to-DreamDM routing." — docs/FEATURE_STATUS.md
 *
 * Architecture justification:
 *   - docs/ARCHITECTURE.md §1  — Dr. Eams is the user-facing AI agent
 *   - docs/AXIOMS.md           — every visible action must do something real
 *   - docs/LAW.md §3           — every visible action must do something real
 *
 * Behaviour:
 *   1. Typing shows navigation suggestions (fast, client-side).
 *   2. Selecting a suggestion routes directly (no AI call needed).
 *   3. Pressing Enter with no exact match — or clicking "Ask Dr. Eams ◈" —
 *      calls POST /api/ai/eams and shows an inline reply card.
 *   4. The reply card offers two real actions:
 *      a. "Full Chat ◈"        → opens DrEamsPanel (full conversation surface)
 *      b. "Send to DreamDM 💬" → navigates to /messages with query context
 *         so the user can share the insight via DreamDM.
 *
 * Performance: render-on-demand; no continuous render loops.
 * All heavy logic lives in lib/dreamengin/drEamsSearch.ts (pure, tested).
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageCircle, Search, Sparkles, X } from 'lucide-react';
import {
  buildDreamDMUrl,
  buildDrEamsRequest,
  matchNavSuggestions,
  parseDrEamsReply,
  truncatePreview,
  type NavSuggestion,
} from '@/lib/dreamengin/drEamsSearch';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DrEamsBadge({ size = 28 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4A90D9 0%, #2a8ab8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        color: '#fff',
        fontWeight: 700,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(74,144,217,0.30)',
      }}
    >
      ◈
    </div>
  );
}

function SpinningDot() {
  return (
    <>
      <style>{`@keyframes de-spin{to{transform:rotate(360deg)}}`}</style>
      <div
        aria-label="Loading…"
        style={{
          width: 13,
          height: 13,
          borderRadius: '50%',
          border: '2px solid rgba(74,144,217,0.25)',
          borderTopColor: '#4A90D9',
          animation: 'de-spin 0.65s linear infinite',
          flexShrink: 0,
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InlineReply = {
  text: string;
  query: string;
  isError: boolean;
};

export interface DrEamsSearchBarProps {
  /** Called when the user clicks "Full Chat ◈" or selects "Dr. Eams" from nav. */
  onOpenDrEams: () => void;
}

// ---------------------------------------------------------------------------
// DrEamsSearchBar
// ---------------------------------------------------------------------------

export default function DrEamsSearchBar({ onOpenDrEams }: DrEamsSearchBarProps) {
  const router = useRouter();

  const [query, setQuery]         = useState('');
  const [dropOpen, setDropOpen]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [reply, setReply]         = useState<InlineReply | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Nav suggestions filtered by current query
  const suggestions: NavSuggestion[] = query.trim()
    ? matchNavSuggestions(query)
    : [];

  const showAskChip = query.trim().length > 0;
  const hasDropdown = dropOpen && (suggestions.length > 0 || showAskChip);

  // ── Ask Dr. Eams ──────────────────────────────────────────────────────────

  const askDrEams = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setDropOpen(false);
    setQuery('');
    setLoading(true);
    setReply(null);

    try {
      const res = await fetch('/api/ai/eams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildDrEamsRequest(trimmed, '/homedream')),
      });
      const data: unknown = await res.json().catch(() => ({}));
      const parsed = parseDrEamsReply(data);
      setReply({ ...parsed, query: trimmed });
    } catch {
      setReply({
        text: 'Network error — check your connection and try again.',
        query: trimmed,
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // ── Nav suggestion click ──────────────────────────────────────────────────

  const selectSuggestion = useCallback((s: NavSuggestion) => {
    setDropOpen(false);
    setQuery('');
    if (s.href) {
      router.push(s.href);
    } else {
      // "Dr. Eams" entry → open full panel
      onOpenDrEams();
    }
  }, [router, onOpenDrEams]);

  // ── Keyboard handling ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !query.trim()) return;
    e.preventDefault();

    // Exact single match → navigate directly
    if (suggestions.length === 1) {
      selectSuggestion(suggestions[0]);
      return;
    }

    // Otherwise → ask Dr. Eams
    void askDrEams(query);
  }, [query, suggestions, askDrEams, selectSuggestion]);

  // ── Close dropdown on outside pointer ────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Clear state when user starts typing again ─────────────────────────────

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setDropOpen(true);
    if (reply) setReply(null); // dismiss previous reply when user types again
  }, [reply]);

  const clearAll = useCallback(() => {
    setQuery('');
    setReply(null);
    setDropOpen(false);
    inputRef.current?.focus();
  }, []);

  // ── "Send to DreamDM" handler ─────────────────────────────────────────────

  const sendToDreamDM = useCallback(() => {
    if (!reply) return;
    const url = buildDreamDMUrl(reply.query);
    setReply(null);
    router.push(url);
  }, [reply, router]);

  // ── Render ────────────────────────────────────────────────────────────────

  const pillBorderColor = reply
    ? 'rgba(74,144,217,0.40)'
    : 'rgba(160,195,240,0.30)';

  const pillRadius = hasDropdown ? '16px 16px 0 0' : 9999;

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>

      {/* ── Search pill ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255,255,255,0.75)',
        borderRadius: pillRadius,
        padding: '9px 14px',
        border: `1px solid ${pillBorderColor}`,
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        transition: 'border-color 0.18s ease',
      }}>
        {loading ? <SpinningDot /> : (
          <Search
            size={13}
            style={{ color: reply ? '#4A90D9' : 'var(--de-text-dim)', flexShrink: 0 }}
          />
        )}

        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setDropOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Dr. Eams is thinking…' : 'Search or ask Dr. Eams ◈'}
          aria-label="Search or ask Dr. Eams"
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: 'var(--de-heading)',
            width: '100%',
            cursor: loading ? 'wait' : 'text',
          }}
          disabled={loading}
        />

        {(query.length > 0 || reply) && !loading && (
          <button
            type="button"
            onClick={clearAll}
            aria-label="Clear search"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={12} style={{ color: 'var(--de-text-dim)' }} />
          </button>
        )}
      </div>

      {/* ── Dropdown: navigation suggestions + "Ask Dr. Eams" chip ── */}
      {hasDropdown && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(160,195,240,0.30)',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {/* Navigation matches */}
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => selectSuggestion(s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(160,195,240,0.12)',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 16 }} aria-hidden="true">{s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                {s.label}
              </span>
            </button>
          ))}

          {/* "Ask Dr. Eams ◈" chip — always shown when there is a query */}
          {showAskChip && (
            <button
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => void askDrEams(query)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 14px',
                background: 'linear-gradient(135deg, rgba(74,144,217,0.07), rgba(74,144,217,0.02))',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <DrEamsBadge size={24} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4A90D9' }}>
                  Ask Dr. Eams ◈
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'var(--de-text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  &ldquo;{truncatePreview(query)}&rdquo;
                </div>
              </div>
              <ArrowRight size={13} style={{ color: '#4A90D9', flexShrink: 0 }} />
            </button>
          )}
        </div>
      )}

      {/* ── Inline Dr. Eams reply card ── */}
      {reply && !dropOpen && (
        <div
          role="region"
          aria-label="Dr. Eams reply"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 6px)',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: reply.isError
              ? '1px solid rgba(239,68,68,0.25)'
              : '1px solid rgba(74,144,217,0.22)',
            borderRadius: 18,
            boxShadow: '0 8px 28px rgba(74,144,217,0.12)',
            padding: '14px 16px',
            zIndex: 100,
            animation: 'de-reply-in 0.22s cubic-bezier(0.34,1.22,0.64,1)',
          }}
        >
          <style>{`
            @keyframes de-reply-in {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0)    scale(1);    }
            }
          `}</style>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}>
            <DrEamsBadge size={28} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
              Dr. Eams
            </span>
            <span style={{
              fontSize: 10,
              color: 'var(--de-text-dim)',
              marginLeft: 'auto',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 140,
            }}>
              re: &ldquo;{truncatePreview(reply.query, 28)}&rdquo;
            </span>
          </div>

          {/* Response text */}
          <div style={{
            fontSize: 13,
            color: reply.isError ? 'var(--de-text-dim)' : 'var(--de-heading)',
            lineHeight: 1.58,
            marginBottom: 12,
            padding: '10px 12px',
            background: reply.isError
              ? 'rgba(239,68,68,0.04)'
              : 'rgba(74,144,217,0.05)',
            borderRadius: 12,
            border: reply.isError
              ? '1px solid rgba(239,68,68,0.10)'
              : '1px solid rgba(74,144,217,0.10)',
          }}>
            {reply.text}
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Full Chat — opens DrEamsPanel */}
            <button
              type="button"
              onClick={onOpenDrEams}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '9px 12px',
                borderRadius: 99,
                background: 'linear-gradient(135deg, #4A90D9 0%, #2a8ab8 100%)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                boxShadow: '0 3px 12px rgba(74,144,217,0.32)',
                WebkitTapHighlightColor: 'transparent',
                transition: 'opacity 0.12s',
              }}
              aria-label="Open full Dr. Eams chat panel"
            >
              <Sparkles size={12} aria-hidden="true" />
              Full Chat ◈
            </button>

            {/* Send to DreamDM — routes to /messages with query context */}
            <button
              type="button"
              onClick={sendToDreamDM}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '9px 12px',
                borderRadius: 99,
                background: 'rgba(255,255,255,0.90)',
                border: '1px solid rgba(74,144,217,0.22)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--de-heading)',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.12s',
              }}
              aria-label="Share this Dr. Eams exchange via DreamDM"
            >
              <MessageCircle size={12} aria-hidden="true" />
              Send to DreamDM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
