'use client';

/**
 * useDreamBarContext — detects the active surface from the current pathname
 * and returns the appropriate dream-bar behaviour for that context.
 *
 * Architecture: Logic layer (lib/) — no UI, no DB access.
 *
 * The dream bar is a universal input; its meaning changes with the active
 * surface (CONSTITUTION Art. I — "one coherent living interface").
 *
 * Surface map
 * ──────────────────────────────────────────────────────────────────────
 *  messages   /messages/**         → send a direct message
 *  feed       /homedream /home /   → create a feed post
 *  code       /codespace /daydream/code /daydream/lab
 *                                  → open code snippet composer
 *  dreams     /dreamengin          → send to Dr. Eams as chat
 *  music      /music /daydream/music
 *                                  → open music context
 *  create     /daydream/create /create
 *                                  → open content composer
 *  discover   /discover /analytics → search / explore
 *  general    (everything else)    → open messages compose fallback
 */

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DreamBarSurface =
  | 'messages'
  | 'feed'
  | 'code'
  | 'dreams'
  | 'music'
  | 'create'
  | 'discover'
  | 'general';

export interface DreamBarContext {
  /** Detected surface for the active pathname */
  surface: DreamBarSurface;
  /** Placeholder text for the dream bar input */
  placeholder: string;
  /** Short verb label shown next to the input (e.g. "Post", "Send") */
  actionLabel: string;
  /** Aria-label for the send/action button */
  actionAriaLabel: string;
  /**
   * Icon name hint — the UI layer maps this to an actual icon.
   * Using a string keeps this module free of React/lucide imports.
   */
  iconHint: 'send' | 'pen-line' | 'code' | 'bot' | 'music' | 'sparkles' | 'search';
}

// ── Surface detection (pure function — testable without React) ────────────────

export function detectSurface(pathname: string): DreamBarSurface {
  const p = pathname.toLowerCase();

  if (p.startsWith('/messages')) return 'messages';
  if (p === '/homedream' || p === '/home' || p === '/') return 'feed';
  if (p.startsWith('/codespace') || p.startsWith('/daydream/code') || p.startsWith('/daydream/lab')) return 'code';
  if (p.startsWith('/dreamengin')) return 'dreams';
  if (p.startsWith('/music') || p.startsWith('/daydream/music')) return 'music';
  if (p.startsWith('/daydream/create') || p.startsWith('/create')) return 'create';
  if (p.startsWith('/discover') || p.startsWith('/analytics')) return 'discover';

  return 'general';
}

// ── Context map ───────────────────────────────────────────────────────────────

const CONTEXT_MAP: Record<DreamBarSurface, Omit<DreamBarContext, 'surface'>> = {
  messages: {
    placeholder:    'Send a message…',
    actionLabel:    'Send',
    actionAriaLabel: 'Send message',
    iconHint:       'send',
  },
  feed: {
    placeholder:    'Share something…',
    actionLabel:    'Post',
    actionAriaLabel: 'Create post',
    iconHint:       'pen-line',
  },
  code: {
    placeholder:    'Describe code or paste a snippet…',
    actionLabel:    'Code',
    actionAriaLabel: 'Open code composer',
    iconHint:       'code',
  },
  dreams: {
    placeholder:    'Ask Dr. Eams anything…',
    actionLabel:    'Ask',
    actionAriaLabel: 'Send to Dr. Eams',
    iconHint:       'bot',
  },
  music: {
    placeholder:    'Describe your music idea…',
    actionLabel:    'Create',
    actionAriaLabel: 'Open music composer',
    iconHint:       'music',
  },
  create: {
    placeholder:    'What are you creating?',
    actionLabel:    'Create',
    actionAriaLabel: 'Open content composer',
    iconHint:       'sparkles',
  },
  discover: {
    placeholder:    'Search or explore…',
    actionLabel:    'Search',
    actionAriaLabel: 'Search',
    iconHint:       'search',
  },
  general: {
    placeholder:    'Dream something…',
    actionLabel:    'Go',
    actionAriaLabel: 'Send dream',
    iconHint:       'sparkles',
  },
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDreamBarContext(): DreamBarContext {
  const pathname = usePathname();

  return useMemo<DreamBarContext>(() => {
    const surface = detectSurface(pathname ?? '/');
    return { surface, ...CONTEXT_MAP[surface] };
  }, [pathname]);
}
