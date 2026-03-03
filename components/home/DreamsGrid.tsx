// DO NOT USE in primary Home flow — legacy launcher grid (tiny-tile pattern).
// Home is a TV feed experience; use DreamCardLarge rows instead.
// See docs/HOME_FEED_TV_SPEC.md §4 and docs/PRIMARY_FLOW.md §"Components to Dead-End".
// CI tripwire scripts/check-home-launcher-grid.mjs enforces this.
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DREAMS } from '@/lib/dreams/catalog';
import DreamWidget from '@/components/home/DreamWidget';

type DreamsGridMode = 'home' | 'profile';

const FAV_KEY    = 'dreamengin:dreams:favorites';
const PINNED_KEY = 'dreamengin:profile:pinned';

function loadSet(key: string): Set<string> {
  try { const r = localStorage.getItem(key); return r ? new Set(JSON.parse(r) as string[]) : new Set(); }
  catch { return new Set(); }
}
function saveSet(key: string, s: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...s])); } catch { /* noop */ }
}

type Props = {
  mode: DreamsGridMode;
  /** feed mode: which dreams are currently active live sources */
  active?: Set<string>;
  onActiveToggle?: (id: string) => void;
};

export default function DreamsGrid({ mode, active = new Set(), onActiveToggle }: Props) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pinned,    setPinned]    = useState<Set<string>>(new Set());
  const [filterOn,  setFilterOn]  = useState(false);
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    setFavorites(loadSet(FAV_KEY));
    setPinned(loadSet(PINNED_KEY));
    setMounted(true);
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveSet(FAV_KEY, next);
      return next;
    });
  }, []);

  const togglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveSet(PINNED_KEY, next);
      // Background sync to Supabase
      void fetch('/api/profile/pinned-dreams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned_dreams: [...next] }),
      }).catch(() => { /* offline-safe */ });
      return next;
    });
  }, []);

  const displayed = filterOn
    ? DREAMS.filter((d) => mode === 'profile' ? pinned.has(d.id) : favorites.has(d.id))
    : DREAMS;

  const filterCount = mode === 'profile' ? pinned.size : favorites.size;
  const filterLabel = mode === 'profile' ? '📌 Pinned' : '★ Favorites';

  return (
    <section style={{ width: '100%' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.8)' }}>
            {mode === 'profile' ? 'Pin to your public profile' : 'Dreams'}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(160,185,255,0.35)' }}>{DREAMS.length}</span>
        </div>
        {mounted && (
          <button
            type="button"
            onClick={() => setFilterOn((v) => !v)}
            style={{
              background: filterOn ? 'rgba(212,168,67,0.18)' : 'rgba(160,185,255,0.07)',
              border: filterOn ? '1px solid rgba(212,168,67,0.4)' : '1px solid rgba(100,150,255,0.15)',
              borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
              fontSize: 10, fontWeight: 700,
              color: filterOn ? 'rgba(212,168,67,0.9)' : 'rgba(160,185,255,0.5)',
            }}
          >
            {filterLabel}{filterCount > 0 ? ` (${filterCount})` : ''}
          </button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(160,185,255,0.35)', fontSize: 12 }}>
          {mode === 'profile' ? 'No dreams pinned yet — tap 📌 on any dream' : 'No favorites yet — tap ☆ on any dream'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))',
          gap: 8,
        }}>
          {displayed.map((dream) => (
            <DreamWidget
              key={dream.id}
              dream={dream}
              mode={mode}
              isFavorite={mounted && favorites.has(dream.id)}
              isPinned={mounted && pinned.has(dream.id)}
              isActive={mounted && active.has(dream.id)}
              onFavoriteToggle={() => toggleFav(dream.id)}
              onPinToggle={() => togglePin(dream.id)}
              onActiveToggle={() => onActiveToggle?.(dream.id)}
              mounted={mounted}
            />
          ))}
        </div>
      )}
    </section>
  );
}
