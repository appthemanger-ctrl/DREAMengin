'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DREAMS_BY_ID } from '@/lib/dreams/catalog';
import { loadBoard, saveBoard, SIZE_META, defaultBoard } from '@/lib/dreams/board';
import type { BoardTile, TileSize, DreamWidgetKind } from '@/lib/dreams/board';
import type { FeedItem } from '@/lib/dreams/types';
import { loadBackground, type BackgroundConfig } from '@/lib/themes/background';
import BackgroundEditor from '@/components/home/BackgroundEditor';
import WidgetDesignPanel, { loadWidgetStyle, widgetStyleToCSS, type WidgetStyle } from '@/components/home/WidgetDesignPanel';

// ── Moods ─────────────────────────────────────────────────────────────────────
const MOODS = ['🔥','✨','🌊','🎵','🌙','💡','⚡','🎮','🧪','💫','🌈','🎯','🌀','💎','🦋','🌺'];

// ── Grid span helpers ─────────────────────────────────────────────────────────
function gridSpan(size: TileSize): React.CSSProperties {
  const m = SIZE_META[size];
  return {
    gridColumn: `span ${m.col}`,
    gridRow: `span ${m.row}`,
  };
}

function lShape(): React.CSSProperties {
  return { clipPath: 'polygon(0 0,100% 0,100% 50%,50% 50%,50% 100%,0 100%)' };
}

// ── Content storage ───────────────────────────────────────────────────────────
const CONTENT_KEY = (scope: string) => `dreamengin:board:content:${scope}`;
function loadContent(scope: string): Record<string, Record<string, string>> {
  try { const r = localStorage.getItem(CONTENT_KEY(scope)); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveContent(scope: string, data: Record<string, Record<string, string>>) {
  try { localStorage.setItem(CONTENT_KEY(scope), JSON.stringify(data)); } catch { /* noop */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
type Props = {
  scope: 'home' | 'profile';
  profileName?: string | null;
  feedItems?: FeedItem[];
  activeDreams?: Set<string>;
  onDreamActivate?: (id: string) => void;
  isPinned?: (id: string) => boolean;
  onPinToggle?: (id: string) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// DreamBoard
// ─────────────────────────────────────────────────────────────────────────────
export default function DreamBoard({
  scope,
  profileName,
  feedItems = [],
  activeDreams = new Set(),
  onDreamActivate,
  isPinned,
  onPinToggle,
}: Props) {
  const [tiles,    setTiles]    = useState<BoardTile[]>([]);
  const [editing,  setEditing]  = useState(false);
  const [selected, setSelected] = useState<string | null>(null); // tile id with size picker open
  const [content,  setContent]  = useState<Record<string, Record<string, string>>>({});
  const [themeId,  setThemeId]  = useState('space');
  const [showThemes, setShowThemes] = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const dragIdx  = useRef<number | null>(null);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  // ── Hydrate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setTiles(loadBoard(scope));
    setContent(loadContent(scope));
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) setThemeId(saved);
    } catch { /* noop */ }
    setMounted(true);
  }, [scope]);

  // ── Persist ───────────────────────────────────────────────────────────────
  const persist = useCallback((next: BoardTile[]) => {
    setTiles(next);
    saveBoard(scope, next);
  }, [scope]);

  const persistContent = useCallback((next: Record<string, Record<string, string>>) => {
    setContent(next);
    saveContent(scope, next);
  }, [scope]);

  const setTileContent = useCallback((id: string, key: string, value: string) => {
    setContent((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), [key]: value } };
      saveContent(scope, next);
      return next;
    });
  }, [scope]);

  // ── Resize ────────────────────────────────────────────────────────────────
  const resize = useCallback((id: string, size: TileSize) => {
    persist(tiles.map((t) => t.id === id ? { ...t, size } : t));
    setSelected(null);
  }, [tiles, persist]);

  // ── Drag reorder ──────────────────────────────────────────────────────────
  const onDragStart = useCallback((idx: number) => { dragIdx.current = idx; }, []);
  const onDragOver  = useCallback((e: React.DragEvent, overIdx: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === overIdx) return;
    const next = [...tiles];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(overIdx, 0, moved);
    dragIdx.current = overIdx;
    persist(next);
  }, [tiles, persist]);
  const onDragEnd = useCallback(() => { dragIdx.current = null; }, []);

  // ── Add / remove tile ─────────────────────────────────────────────────────
  const removeTile = useCallback((id: string) => {
    persist(tiles.filter((t) => t.id !== id));
  }, [tiles, persist]);

  const resetBoard = useCallback(() => {
    const def = defaultBoard(scope);
    persist(def);
    persistContent({});
  }, [scope, persist, persistContent]);

  const changeTheme = useCallback((id: string) => {
    setThemeId(id);
    try { localStorage.setItem(THEME_KEY, id); } catch { /* noop */ }
    setShowThemes(false);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, gap: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.45)' }}>
          {scope === 'profile' ? 'Your Profile Board' : 'Your Space'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Theme picker toggle */}
          <button type="button" onClick={() => setShowThemes((v) => !v)}
            title="Change theme"
            style={{
              background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.15)',
              borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
              fontSize: 12, color: 'rgba(160,185,255,0.6)',
            }}>
            🎨
          </button>
          {/* Edit toggle */}
          <button type="button"
            onClick={() => { setEditing((v) => !v); setSelected(null); }}
            style={{
              background: editing ? 'rgba(212,168,67,0.2)' : 'rgba(100,150,255,0.08)',
              border: editing ? '1px solid rgba(212,168,67,0.5)' : '1px solid rgba(100,150,255,0.15)',
              borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              color: editing ? 'rgba(212,168,67,0.95)' : 'rgba(160,185,255,0.6)',
            }}>
            {editing ? '✓ Done' : '✏ Edit'}
          </button>
        </div>
      </div>

      {/* ── Theme picker ───────────────────────────────────────────────── */}
      {showThemes && (
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12,
          padding: '10px 12px',
          background: 'rgba(5,15,45,0.7)', borderRadius: 14,
          border: '1px solid rgba(100,150,255,0.12)',
        }}>
          {THEMES.map((t) => (
            <button key={t.id} type="button" onClick={() => changeTheme(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: t.bg, border: themeId === t.id ? `2px solid ${t.accent}` : '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}>
              {t.label}
            </button>
          ))}
          <button type="button" onClick={resetBoard}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 11,
              background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
              color: 'rgba(255,150,150,0.7)', marginLeft: 'auto',
            }}>
            ↺ Reset
          </button>
        </div>
      )}

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          padding: editing ? 4 : 0,
          borderRadius: 16,
          outline: editing ? '2px dashed rgba(212,168,67,0.3)' : 'none',
          transition: 'outline 0.2s',
        }}
        onClick={() => { if (editing) setSelected(null); }}
      >
        {tiles.map((tile, idx) => (
          <TileShell
            key={tile.id}
            tile={tile}
            idx={idx}
            editing={editing}
            selected={selected === tile.id}
            theme={theme}
            content={content[tile.id] ?? {}}
            feedItems={feedItems}
            activeDreams={activeDreams}
            isPinned={isPinned}
            profileName={profileName}
            onSelect={() => setSelected(selected === tile.id ? null : tile.id)}
            onResize={(size) => resize(tile.id, size)}
            onRemove={() => removeTile(tile.id)}
            onContentChange={(key, val) => setTileContent(tile.id, key, val)}
            onDreamActivate={onDreamActivate}
            onPinToggle={onPinToggle}
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TileShell — wrapper that handles edit controls around any widget
// ─────────────────────────────────────────────────────────────────────────────
type TileShellProps = {
  tile: BoardTile; idx: number; editing: boolean; selected: boolean;
  theme: typeof THEMES[0]; content: Record<string, string>; feedItems: FeedItem[];
  activeDreams: Set<string>; profileName?: string | null;
  isPinned?: (id: string) => boolean;
  onSelect: () => void; onResize: (s: TileSize) => void;
  onRemove: () => void; onContentChange: (k: string, v: string) => void;
  onDreamActivate?: (id: string) => void; onPinToggle?: (id: string) => void;
  onDragStart: () => void; onDragOver: (e: React.DragEvent) => void; onDragEnd: () => void;
};

function TileShell({ tile, editing, selected, theme, content, feedItems, activeDreams, profileName, isPinned, onSelect, onResize, onRemove, onContentChange, onDreamActivate, onPinToggle, onDragStart, onDragOver, onDragEnd }: TileShellProps) {
  const isL    = tile.size === 'L';

  return (
    <div
      draggable={editing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={(e) => { e.stopPropagation(); if (editing) onSelect(); }}
      style={{
        ...gridSpan(tile.size),
        position: 'relative',
        borderRadius: 16,
        minHeight: tile.size === 'sm' || tile.size === 'wide' ? 90 : tile.size === 'hero' ? 64 : 180,
        cursor: editing ? 'grab' : 'default',
        animation: editing ? 'dream-wiggle 0.25s ease-in-out infinite' : 'none',
        outline: selected ? `2px solid ${theme.accent}` : 'none',
        outlineOffset: 2,
        transition: 'outline 0.1s',
        ...(isL ? lShape() : {}),
      }}
    >
      <WidgetBody
        tile={tile} content={content} feedItems={feedItems}
        activeDreams={activeDreams} profileName={profileName}
        theme={theme} editing={editing}
        isPinned={isPinned} onDreamActivate={onDreamActivate}
        onPinToggle={onPinToggle} onContentChange={onContentChange}
      />

      {/* ── Edit overlays ── */}
      {editing && (
        <>
          {/* Remove button */}
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label="Remove tile"
            style={{
              position: 'absolute', top: -8, right: -8, zIndex: 10,
              width: 22, height: 22, borderRadius: '50%',
              background: '#1a0818', border: '2px solid rgba(255,100,100,0.6)',
              color: 'rgba(255,150,150,0.9)', fontSize: 12, lineHeight: 1,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>

          {/* Size picker — shown when tile is selected */}
          {selected && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute', bottom: '105%', left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20, display: 'flex', gap: 5, padding: '6px 8px',
                background: 'rgba(2,8,24,0.96)',
                border: `1px solid ${theme.accent}44`,
                borderRadius: 20, boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
                whiteSpace: 'nowrap',
              }}
            >
              {(Object.entries(SIZE_META) as [TileSize, typeof SIZE_META[TileSize]][]).map(([id, m]) => (
                <button key={id} type="button" onClick={() => onResize(id)}
                  title={m.label}
                  style={{
                    background: tile.size === id ? `${theme.accent}33` : 'rgba(100,150,255,0.08)',
                    border: tile.size === id ? `1px solid ${theme.accent}` : '1px solid rgba(100,150,255,0.2)',
                    borderRadius: 10, padding: '4px 8px', cursor: 'pointer',
                    fontSize: 13, color: tile.size === id ? theme.accent : 'rgba(160,185,255,0.6)',
                  }}>
                  {m.icon}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WidgetBody — renders the actual content of each tile kind
// ─────────────────────────────────────────────────────────────────────────────
type WidgetBodyProps = {
  tile: BoardTile; content: Record<string, string>; feedItems: FeedItem[];
  activeDreams: Set<string>; theme: typeof THEMES[0]; editing: boolean;
  profileName?: string | null;
  isPinned?: (id: string) => boolean;
  onDreamActivate?: (id: string) => void; onPinToggle?: (id: string) => void;
  onContentChange: (k: string, v: string) => void;
};

function WidgetBody({ tile, content, feedItems, activeDreams, theme, editing, profileName, isPinned, onDreamActivate, onPinToggle, onContentChange }: WidgetBodyProps) {
  switch (tile.kind) {
    case 'launcher':    return <LauncherWidget    tile={tile} theme={theme} activeDreams={activeDreams} isPinned={isPinned} onActivate={onDreamActivate} onPin={onPinToggle} />;
    case 'status':      return <StatusWidget      tile={tile} content={content} theme={theme} editing={editing} profileName={profileName} onContentChange={onContentChange} />;
    case 'about':       return <AboutWidget       tile={tile} content={content} theme={theme} editing={editing} onContentChange={onContentChange} />;
    case 'mood':        return <MoodWidget        tile={tile} content={content} theme={theme} editing={editing} onContentChange={onContentChange} />;
    case 'quote':       return <QuoteWidget       tile={tile} content={content} theme={theme} editing={editing} onContentChange={onContentChange} />;
    case 'music':       return <MusicWidget       theme={theme} />;
    case 'feed':        return <FeedWidget        feedItems={feedItems} theme={theme} />;
    case 'links':       return <LinksWidget       tile={tile} content={content} theme={theme} editing={editing} onContentChange={onContentChange} />;
    default:            return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual widget renderers
// ─────────────────────────────────────────────────────────────────────────────

function glass(alpha = 0.55): React.CSSProperties {
  return {
    height: '100%', borderRadius: 16, overflow: 'hidden',
    background: `rgba(5,15,45,${alpha})`,
    border: '1px solid rgba(100,150,255,0.1)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', flexDirection: 'column',
  };
}

// ── Launcher ──────────────────────────────────────────────────────────────────
function LauncherWidget({ tile, theme, activeDreams, isPinned, onActivate, onPin }: {
  tile: BoardTile; theme: typeof THEMES[0]; activeDreams: Set<string>;
  isPinned?: (id: string) => boolean; onActivate?: (id: string) => void; onPin?: (id: string) => void;
}) {
  const router = useRouter();
  const dream  = DREAMS_BY_ID[tile.id];
  if (!dream) return null;
  const isActive = activeDreams.has(tile.id);
  const pinned   = isPinned?.(tile.id) ?? false;

  return (
    <div
      role="button" tabIndex={0}
      onClick={() => router.push(dream.route)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(dream.route); }}
      style={{
        ...glass(),
        padding: '10px 8px 8px', alignItems: 'center', justifyContent: 'center',
        background: isActive
          ? `linear-gradient(145deg,${theme.accent}22,rgba(5,15,45,0.7))`
          : 'rgba(5,15,45,0.55)',
        border: isActive ? `1px solid ${theme.accent}55` : '1px solid rgba(100,150,255,0.1)',
        cursor: 'pointer', userSelect: 'none', textAlign: 'center',
        animation: isActive ? 'dream-pulse 2.8s ease-in-out infinite' : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(100,150,255,0.12)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isActive ? `linear-gradient(145deg,${theme.accent}22,rgba(5,15,45,0.7))` : 'rgba(5,15,45,0.55)'; }}
    >
      {isActive && <span style={{ position: 'absolute', top: 7, left: 8, width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />}
      {pinned && <span style={{ position: 'absolute', top: 5, right: 6, fontSize: 9, color: theme.accent }}>📌</span>}
      <div style={{ fontSize: tile.size === 'sm' ? 22 : 28, marginBottom: 5, lineHeight: 1 }}>{dream.icon}</div>
      <div style={{ fontSize: tile.size === 'sm' ? 10 : 12, fontWeight: 700, color: 'rgba(240,244,255,0.9)', lineHeight: 1.2 }}>{dream.label}</div>
      <div style={{ fontSize: 8, color: 'rgba(160,185,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{dream.tag}</div>
      {/* Feed / pin toggles */}
      {(onActivate || onPin) && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
          {onActivate && (
            <button type="button" onClick={() => onActivate(tile.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, padding: 2,
                color: isActive ? '#22c55e' : 'rgba(160,185,255,0.3)' }}>
              {isActive ? '●' : '○'}
            </button>
          )}
          {onPin && (
            <button type="button" onClick={() => onPin(tile.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, padding: 2,
                color: pinned ? theme.accent : 'rgba(160,185,255,0.3)' }}>
              📌
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Status ────────────────────────────────────────────────────────────────────
function StatusWidget({ tile, content, theme, editing, profileName, onContentChange }: {
  tile: BoardTile; content: Record<string, string>; theme: typeof THEMES[0];
  editing: boolean; profileName?: string | null; onContentChange: (k: string, v: string) => void;
}) {
  const name = profileName ?? 'You';
  const text = content.text ?? '';
  return (
    <div style={{ ...glass(0.5), padding: '10px 14px', justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>⚡</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: `${theme.accent}`, marginRight: 6 }}>{name}</span>
        <span style={{ fontSize: 11, color: 'rgba(160,185,255,0.45)', marginRight: 6 }}>is</span>
        {editing ? (
          <input
            type="text" value={text} placeholder="currently…"
            onChange={(e) => onContentChange('text', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'transparent', border: 'none',
              borderBottom: `1px solid ${theme.accent}66`,
              color: 'rgba(240,244,255,0.9)', fontSize: 11, outline: 'none',
              width: '55%', padding: '2px 0',
            }}
          />
        ) : (
          <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.75)', fontStyle: text ? 'normal' : 'italic' }}>
            {text || 'tap ✏️ to set status…'}
          </span>
        )}
      </div>
    </div>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────
function AboutWidget({ content, theme, editing, onContentChange }: {
  tile: BoardTile; content: Record<string, string>; theme: typeof THEMES[0];
  editing: boolean; onContentChange: (k: string, v: string) => void;
}) {
  const text = content.text ?? '';
  return (
    <div style={{ ...glass(), padding: '12px 14px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: `${theme.accent}bb`, marginBottom: 8 }}>About Me</div>
      {editing ? (
        <textarea
          value={text} placeholder="Tell your story…"
          onChange={(e) => onContentChange('text', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1, background: 'rgba(100,150,255,0.06)', border: `1px solid ${theme.accent}33`,
            borderRadius: 8, color: 'rgba(240,244,255,0.85)', fontSize: 12, lineHeight: 1.6,
            padding: 8, resize: 'none', outline: 'none', width: '100%', minHeight: 80,
          }}
        />
      ) : (
        <p style={{ fontSize: 12, color: 'rgba(200,220,255,0.7)', lineHeight: 1.65, margin: 0, flex: 1,
          fontStyle: text ? 'normal' : 'italic' }}>
          {text || 'tap ✏️ to write about yourself…'}
        </p>
      )}
    </div>
  );
}

// ── Mood ──────────────────────────────────────────────────────────────────────
function MoodWidget({ content, theme, editing, onContentChange }: {
  tile: BoardTile; content: Record<string, string>; theme: typeof THEMES[0];
  editing: boolean; onContentChange: (k: string, v: string) => void;
}) {
  const mood = content.mood ?? '✨';
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...glass(), padding: '8px 10px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: `${theme.accent}bb`, marginBottom: 6 }}>Mood</div>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, lineHeight: 1 }}>
        {mood}
      </button>
      {(open || editing) && (
        <div onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, justifyContent: 'center' }}>
          {MOODS.map((m) => (
            <button key={m} type="button" onClick={() => { onContentChange('mood', m); setOpen(false); }}
              style={{ background: mood === m ? `${theme.accent}33` : 'none', border: 'none',
                cursor: 'pointer', fontSize: 16, padding: 3, borderRadius: 6 }}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Quote ─────────────────────────────────────────────────────────────────────
function QuoteWidget({ content, theme, editing, onContentChange }: {
  tile: BoardTile; content: Record<string, string>; theme: typeof THEMES[0];
  editing: boolean; onContentChange: (k: string, v: string) => void;
}) {
  const text   = content.text   ?? '';
  const author = content.author ?? '';
  return (
    <div style={{ ...glass(), padding: '12px 14px', justifyContent: 'center' }}>
      {editing ? (
        <>
          <textarea value={text} placeholder="Your quote…" onChange={(e) => onContentChange('text', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'rgba(100,150,255,0.06)', border: `1px solid ${theme.accent}33`,
              borderRadius: 8, color: 'rgba(240,244,255,0.85)', fontSize: 12, lineHeight: 1.6,
              padding: 8, resize: 'none', outline: 'none', width: '100%', minHeight: 48, marginBottom: 6 }} />
          <input type="text" value={author} placeholder="— Author" onChange={(e) => onContentChange('author', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'transparent', border: `none`, borderBottom: `1px solid ${theme.accent}33`,
              color: 'rgba(160,185,255,0.6)', fontSize: 11, outline: 'none', width: '100%', padding: '2px 0' }} />
        </>
      ) : (
        <>
          <p style={{ fontSize: 12, color: 'rgba(220,235,255,0.8)', lineHeight: 1.6, margin: '0 0 6px',
            fontStyle: 'italic', borderLeft: `2px solid ${theme.accent}`, paddingLeft: 10 }}>
            {text || '✏️ tap Edit to add a quote'}
          </p>
          {author && <div style={{ fontSize: 10, color: `${theme.accent}99`, textAlign: 'right' }}>— {author}</div>}
        </>
      )}
    </div>
  );
}

// ── Music ─────────────────────────────────────────────────────────────────────
function MusicWidget({ theme }: { theme: typeof THEMES[0] }) {
  const router = useRouter();
  return (
    <div role="button" tabIndex={0}
      onClick={() => router.push('/daydream/music')}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push('/daydream/music'); }}
      style={{ ...glass(), padding: '10px 12px', cursor: 'pointer', userSelect: 'none',
        background: `linear-gradient(145deg,${theme.accent}18,rgba(5,15,45,0.7))`,
        border: `1px solid ${theme.accent}44`,
        animation: 'dream-pulse 3s ease-in-out infinite',
      }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>🎵</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,244,255,0.9)' }}>Music</div>
      {/* Waveform bars */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', marginTop: 8, height: 20 }}>
        {[0.4,0.8,0.5,1,0.6,0.9,0.5,0.7].map((h, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: 2,
            background: theme.accent,
            opacity: 0.6,
            height: `${h * 100}%`,
            animation: `waveform-${i % 4} 0.8s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Feed snippet ──────────────────────────────────────────────────────────────
function FeedWidget({ feedItems, theme }: { feedItems: FeedItem[]; theme: typeof THEMES[0] }) {
  const visible = feedItems.slice(0, 5);
  return (
    <div style={{ ...glass(), overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', gap: 6,
        borderBottom: '1px solid rgba(100,150,255,0.08)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
          boxShadow: '0 0 6px rgba(34,197,94,0.7)', flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,244,255,0.7)', letterSpacing: '0.06em' }}>Live Feed</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {visible.length === 0 && (
          <div style={{ padding: '16px 12px', fontSize: 11, color: 'rgba(160,185,255,0.35)', fontStyle: 'italic' }}>
            Activate dreams to populate feed
          </div>
        )}
        {visible.map((item) => (
          <a key={item.id} href={item.url ?? '#'} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', padding: '7px 12px', textDecoration: 'none', color: 'inherit',
              borderBottom: '1px solid rgba(100,150,255,0.06)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(100,150,255,0.06)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,244,255,0.82)', lineHeight: 1.3, marginBottom: 2 }}>
              <span style={{ fontSize: 11, marginRight: 5 }}>{item.dreamIcon}</span>{item.title}
            </div>
            {item.subtitle && <div style={{ fontSize: 9, color: `${theme.accent}88` }}>{item.subtitle}</div>}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Links ─────────────────────────────────────────────────────────────────────
function LinksWidget({ content, theme, editing, onContentChange }: {
  tile: BoardTile; content: Record<string, string>; theme: typeof THEMES[0];
  editing: boolean; onContentChange: (k: string, v: string) => void;
}) {
  const raw   = content.links ?? '';
  const lines = raw.split('\n').filter(Boolean);
  return (
    <div style={{ ...glass(), padding: '12px 14px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: `${theme.accent}bb`, marginBottom: 8 }}>Links</div>
      {editing ? (
        <textarea value={raw} placeholder={"label|url\nlabel|url\n…"}
          onChange={(e) => onContentChange('links', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, background: 'rgba(100,150,255,0.06)', border: `1px solid ${theme.accent}33`,
            borderRadius: 8, color: 'rgba(240,244,255,0.85)', fontSize: 11, lineHeight: 1.6,
            padding: 8, resize: 'none', outline: 'none', width: '100%', minHeight: 60 }} />
      ) : lines.length === 0 ? (
        <p style={{ fontSize: 11, color: 'rgba(160,185,255,0.35)', fontStyle: 'italic', margin: 0 }}>
          ✏️ tap Edit to add links (label|url)
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lines.map((line, i) => {
            const [label, url] = line.split('|');
            return url ? (
              <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: theme.accent, textDecoration: 'none', fontWeight: 600 }}>
                ↗ {label?.trim()}
              </a>
            ) : (
              <span key={i} style={{ fontSize: 11, color: 'rgba(160,185,255,0.6)' }}>{label}</span>
            );
          })}
        </div>
      )}
    </div>
  );
}
