'use client';

/**
 * components/gameengin/dream.cartridge.CartridgeBrowser.tsx
 *
 * Browsable cartridge catalogue rendered at /gameengin/cartridges.
 * Lists every game in `CARTRIDGE_MANIFEST` with search, category, and tier
 * filters, and a launch link straight into `/gameengin/cartridges/[id]`.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CARTRIDGE_MANIFEST,
  getCartridgeCategories,
  type CartridgeManifestEntry,
} from '@/lib/gameengin/cartridges/manifest';

const ALL = 'All';
const TIER_ORDER = ['flagship', 'advanced', 'classic', 'casual'] as const;
const TIER_LABEL: Record<typeof TIER_ORDER[number], string> = {
  flagship: 'Flagship', advanced: 'Advanced', classic: 'Classic', casual: 'Casual',
};

export interface CartridgeBrowserProps {
  /** Optional preset category (e.g. "Strategy") to seed the filter. */
  initialCategory?: string;
}

export default function CartridgeBrowser({ initialCategory = ALL }: CartridgeBrowserProps {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [tier, setTier]         = useState<string>(ALL);

  const categories = useMemo(() => [ALL, ...getCartridgeCategories()], []);
  const tiers      = useMemo(() => [ALL, ...TIER_ORDER], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CARTRIDGE_MANIFEST.filter((c: Record<string, unknown>) => {
      if (category !== ALL && c.category !== category) return false;
      if (tier !== ALL && c.tier !== tier) return false;
      if (!q) return true;
      return (
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.subtitle?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [search, category, tier]);

  const grouped = useMemo(() => {
    const out = new Map<string, CartridgeManifestEntry[]>();
    for (const t of TIER_ORDER) out.set(t, []);
    for (const c of filtered) out.get(c.tier)?.push(c);
    return out;
  }, [filtered]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0a1226 0%, #04060f 60%, #02030a 100%)',
      color: '#e8eef9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Header */}
        <header style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', color: '#7c3aed', fontWeight: 800, textTransform: 'uppercase' }}>
            GameEngin · Console-class browser platform
          </div>
          <h1 style={{
            margin: '6px 0 4px', fontSize: 34, fontWeight: 900,
            letterSpacing: '0.02em', color: '#f5f8ff',
            textShadow: '0 0 24px rgba(124,58,237,0.25)',
          }}>
            🎮 Cartridges
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', maxWidth: 720, lineHeight: 1.55 }}>
            Every game in the repo, packaged as a <code style={{ color: '#a78bfa' }}>GameCartridge</code> running on the
            single GameEngin platform. Pick one to launch it on the platform's <code style={{ color: '#a78bfa' }}>GameRuntime</code>.
            Older URLs at <code>/engines/games/library</code> still work — this is the new canonical home.
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#64748b', maxWidth: 720, lineHeight: 1.5 }}>
            Cartridge foundation active: native <code style={{ color: '#a78bfa' }}>.dreamr</code> archives validate
            <code style={{ color: '#a78bfa' }}> DRMR</code> magic bytes, parse their ustar payload, and hand a validated
            <code style={{ color: '#a78bfa' }}> MANIFEST.json</code> to the WebGPU runtime shell when binary cartridges land.
          </p>
        </header>

        {/* Toolbar */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          padding: 12, background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(124,58,237,0.18)', borderRadius: 12,
          marginBottom: 18,
        }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cartridges…"
            aria-label="Search cartridges"
            style={{
              flex: '1 1 220px', minWidth: 200,
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f5f8ff', fontSize: 13, outline: 'none',
            }}
          />
          <FilterRow label="Category" options={categories} value={category} onChange={setCategory} />
          <FilterRow label="Tier"     options={tiers}      value={tier}     onChange={setTier} />
        </div>

        {/* Counts */}
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14, letterSpacing: '0.04em' }}>
          {filtered.length} of {CARTRIDGE_MANIFEST.length} cartridge{CARTRIDGE_MANIFEST.length === 1 ? '' : 's'}
        </div>

        {/* Grid grouped by tier */}
        {filtered.length === 0 ? (
          <div style={{
            padding: 48, textAlign: 'center',
            color: '#475569', fontSize: 14,
            border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 12,
          }}>
            No cartridges match. Try a different search.
          </div>
        ) : (
          TIER_ORDER.map((t: Record<string, unknown>) => {
            const items = grouped.get(t) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={t} style={{ marginBottom: 30 }}>
                <h2 style={{
                  margin: '0 0 10px', fontSize: 12, letterSpacing: '0.18em',
                  color: tierColor(t), textTransform: 'uppercase', fontWeight: 800,
                }}>
                  {TIER_LABEL[t]} <span style={{ color: '#475569', fontWeight: 500 }}>· {items.length}</span>
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 14,
                }}>
                  {items.map((c: Record<string, unknown>) => <CartridgeCard key={c.id} cartridge={c} />)}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Filter pill row ─────────────────────────────────────────────────────────

function FilterRow({
  label, options, value, onChange,
}: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      {options.map((opt: Record<string, unknown>) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '4px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer',
              background: active ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
              color:      active ? '#c4b5fd' : '#94a3b8',
              border:     `1px solid ${active ? 'rgba(124,58,237,0.55)' : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 120ms',
            }}
          >
            {opt[0].toUpperCase() + opt.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────

function CartridgeCard({ cartridge: c }: { cartridge: CartridgeManifestEntry } {
  return (
    <Link
      href={`/gameengin/cartridges/${c.id}`}
      style={{
        textDecoration: 'none', color: 'inherit',
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: 14, borderRadius: 14,
        background: `linear-gradient(160deg, ${c.color}1c 0%, rgba(255,255,255,0.02) 60%)`,
        border: `1px solid ${c.color}33`,
        boxShadow: `0 12px 28px ${c.color}18`,
        transition: 'transform 140ms, border-color 140ms, box-shadow 140ms',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{c.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f5f8ff', letterSpacing: '0.01em' }}>{c.label}</div>
          <div style={{ fontSize: 10, color: c.color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {c.category} · {c.renderMode}
          </div>
        </div>
      </div>
      {c.subtitle && (
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{c.subtitle}</div>
      )}
      <div style={{
        fontSize: 11, color: '#94a3b8', lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {c.description}
      </div>
      <div style={{
        marginTop: 4, padding: '6px 10px', borderRadius: 999,
        background: c.color + '22', color: c.color,
        fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
        textAlign: 'center', textTransform: 'uppercase',
      }}>
        ▶ Launch on GameEngin
      </div>
    </Link>
  );
}

function tierColor(t: typeof TIER_ORDER[number]: string {
  switch (t) {
    case 'flagship': return '#fbbf24';
    case 'advanced': return '#a78bfa';
    case 'classic':  return '#7dd3fc';
    case 'casual':   return '#94a3b8';
  }
}
