'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import Link from 'next/link';
import { Plus, Check, Trash2, Share2, Shuffle, Zap, User, ChevronRight, X, Edit3 } from 'lucide-react';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export type FeedPreset = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  sources: string[];       // handles, topics, or category slugs
  frequency: string;       // 'all' | 'highlights' | 'daily' | etc.
  isPublic: boolean;
  createdAt: string;
};

type AlgoMode = 'mine' | 'dream';

/* ─────────────────────────────────────────────
   localStorage helpers
───────────────────────────────────────────── */
function loadMode(): AlgoMode {
  if (typeof window === 'undefined') return 'mine';
  return (localStorage.getItem('de-algo-mode') as AlgoMode) || 'mine';
}
function saveMode(m: AlgoMode) { localStorage.setItem('de-algo-mode', m); }

function loadPresets(): FeedPreset[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('de-feed-presets') || '[]'); }
  catch { return []; }
}
function savePresets(p: FeedPreset[]) { localStorage.setItem('de-feed-presets', JSON.stringify(p)); }

function loadActive(): string { return localStorage.getItem('de-active-preset') || 'all'; }
function saveActive(id: string) { localStorage.setItem('de-active-preset', id); }

function loadMix(): string[] {
  try { return JSON.parse(localStorage.getItem('de-mix-presets') || '[]'); }
  catch { return []; }
}
function saveMix(ids: string[]) { localStorage.setItem('de-mix-presets', JSON.stringify(ids)); }

/* ─────────────────────────────────────────────
   Follow settings reader (for display)
───────────────────────────────────────────── */
type FollowSetting = { handle: string; displayName: string; frequency: string };
function loadFollows(): FollowSetting[] {
  try {
    const raw = JSON.parse(localStorage.getItem('de-follow-settings') || '{}');
    return Object.values(raw) as FollowSetting[];
  } catch { return []; }
}

/* ─────────────────────────────────────────────
   Preset Creator sub-component
───────────────────────────────────────────── */
const FREQ_OPTIONS = [
  { id: 'all',       label: '📡 Everything',   desc: 'All posts in real time'          },
  { id: 'highlights',label: '✨ Highlights',    desc: 'Best posts auto-selected'        },
  { id: 'daily',     label: '☀️ Once a Day',   desc: 'One daily digest'                },
  { id: 'weekdays',  label: '💼 Weekdays',      desc: 'Monday–Friday only'              },
  { id: 'weekends',  label: '🌴 Weekends',      desc: 'Saturday and Sunday only'        },
  { id: 'releases',  label: '🔔 New Releases',  desc: 'Only when they drop something'   },
];

const TOPIC_OPTIONS = [
  { id: 'music',    label: '🎵 Music'        },
  { id: 'games',    label: '🎮 Games'        },
  { id: 'art',      label: '🎨 Art'          },
  { id: 'tech',     label: '💻 Tech'         },
  { id: 'sports',   label: '🏈 Sports'       },
  { id: 'football', label: '🏈 Football'     },
  { id: 'basketball',label:'🏀 Basketball'   },
  { id: 'fashion',  label: '👗 Fashion'      },
  { id: 'food',     label: '🍕 Food'         },
  { id: 'travel',   label: '✈️ Travel'       },
  { id: 'business', label: '💼 Business'     },
  { id: 'vibes',    label: '😌 Chill Vibes'  },
  { id: 'news',     label: '📰 News'         },
  { id: 'comedy',   label: '😂 Comedy'       },
  { id: 'dreams',   label: '🌙 Dreams'       },
];

const EMOJIS = ['📡','✨','☀️','🌴','🏈','🎵','🎮','🎨','💼','😌','🔔','🌙','🔥','💎','🚀','🌊','🎯','⚡'];

function PresetCreator({ onSave, onCancel, editing }: {
  onSave: (p: FeedPreset) => void;
  onCancel: () => void;
  editing?: FeedPreset;
}) {
  const uid = useId();
  const [name,      setName]      = useState(editing?.name        || '');
  const [emoji,     setEmoji]     = useState(editing?.emoji       || '📡');
  const [desc,      setDesc]      = useState(editing?.description || '');
  const [sources,   setSources]   = useState<string[]>(editing?.sources   || []);
  const [frequency, setFrequency] = useState(editing?.frequency   || 'highlights');
  const [isPublic,  setIsPublic]  = useState(editing?.isPublic    ?? false);

  const toggleSource = (id: string) =>
    setSources(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      id:          editing?.id || `preset-${Date.now()}`,
      name:        name.trim(),
      emoji,
      description: desc.trim(),
      sources,
      frequency,
      isPublic,
      createdAt:   editing?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--de-heading)' }}>
          {editing ? 'Edit Setup' : 'New Setup'}
        </div>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
        </button>
      </div>

      {/* Emoji picker */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Icon</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => setEmoji(e)}
              style={{ width: 36, height: 36, borderRadius: 10, fontSize: 18, border: 'none', cursor: 'pointer',
                background: emoji === e ? 'rgba(42,138,184,0.15)' : 'rgba(255,255,255,0.5)',
                outline: emoji === e ? '2px solid var(--de-accent)' : '1px solid rgba(160,195,240,0.3)',
              }}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor={uid + '-name'} style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Name</label>
        <input id={uid + '-name'} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sunday Football, Close Friends, Chill Vibes"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(42,138,184,0.22)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor={uid + '-desc'} style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
        <input id={uid + '-desc'} type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description for sharing"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(42,138,184,0.22)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {/* Topics */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Topics &amp; Sources</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {TOPIC_OPTIONS.map(t => {
            const on = sources.includes(t.id);
            return (
              <button key={t.id} type="button" onClick={() => toggleSource(t.id)}
                style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: on ? 'linear-gradient(135deg, rgba(42,138,184,0.18), rgba(200,152,26,0.14))' : 'rgba(255,255,255,0.55)',
                  outline: on ? '1.5px solid var(--de-accent)' : '1px solid rgba(160,195,240,0.3)',
                  color: on ? 'var(--de-accent)' : 'var(--de-text)',
                  transition: 'all 0.15s',
                }}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>How Often</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {FREQ_OPTIONS.map(f => (
            <button key={f.id} type="button" onClick={() => setFrequency(f.id)}
              style={{ padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: frequency === f.id ? 'linear-gradient(135deg, rgba(42,138,184,0.12), rgba(200,152,26,0.10))' : 'rgba(255,255,255,0.55)',
                outline: frequency === f.id ? '1.5px solid var(--de-accent)' : '1px solid rgba(160,195,240,0.25)',
              }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{f.label}</div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{f.desc}</div>
              </div>
              {frequency === f.id && <Check className="w-4 h-4" style={{ color: 'var(--de-accent)', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Public toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(160,195,240,0.25)' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>Share this setup</div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Others can copy it from your profile or shop</div>
        </div>
        <button type="button" onClick={() => setIsPublic(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ width: 44, height: 26, borderRadius: 13, background: isPublic ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)', position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 3, left: isPublic ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
          </div>
        </button>
      </div>

      {/* Save */}
      <button type="button" onClick={submit} disabled={!name.trim()} className="de-btn de-btn-primary" style={{ gap: 6 }}>
        <Check className="w-4 h-4" /> {editing ? 'Save Changes' : 'Create Setup'}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main AlgorithmEngine
───────────────────────────────────────────── */
export default function AlgorithmEngine() {
  const [mode,       setMode]       = useState<AlgoMode>(loadMode);
  const [presets,    setPresets]    = useState<FeedPreset[]>(loadPresets);
  const [activeId,   setActiveId]   = useState<string>(loadActive);
  const [mixIds,     setMixIds]     = useState<string[]>(loadMix);
  const [mixOn,      setMixOn]      = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [editing,    setEditing]    = useState<FeedPreset | null>(null);
  const [follows,    setFollows]    = useState<FollowSetting[]>([]);
  const [shareAlert, setShareAlert] = useState('');

  useEffect(() => { setFollows(loadFollows()); }, []);

  const switchMode = useCallback((m: AlgoMode) => { setMode(m); saveMode(m); }, []);

  const activate = useCallback((id: string) => {
    setActiveId(id); saveActive(id);
    setMixOn(false);
  }, []);

  const toggleMix = useCallback((id: string) => {
    setMixIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev;
      saveMix(next);
      return next;
    });
  }, []);

  const savePreset = useCallback((p: FeedPreset) => {
    setPresets(prev => {
      const next = prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
      savePresets(next);
      return next;
    });
    setCreating(false); setEditing(null);
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => { const next = prev.filter(x => x.id !== id); savePresets(next); return next; });
    if (activeId === id) { setActiveId('all'); saveActive('all'); }
  }, [activeId]);

  const sharePreset = useCallback((p: FeedPreset) => {
    const text = `Check out my "${p.emoji} ${p.name}" feed setup on Dreamengin! ${p.description}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setShareAlert(`"${p.name}" copied — paste it in a new post to share!`);
    setTimeout(() => setShareAlert(''), 3500);
  }, []);

  const activePreset = presets.find(p => p.id === activeId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Algorithm Mode Toggle ── */}
      <div className="de-widget" style={{ background: 'linear-gradient(135deg, rgba(42,138,184,0.08), rgba(200,152,26,0.06))' }}>
        <div className="de-widget-header">
          <span className="de-widget-title">Who Controls Your Feed?</span>
        </div>
        <div className="de-widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { id: 'mine',  emoji: '🧠', label: 'My Algorithm',    desc: 'Your rules. Your presets. Your order.' },
              { id: 'dream', emoji: '✨', label: 'Dream Algorithm', desc: 'Dreamengin curates for you.' },
            ].map(opt => {
              const active = mode === opt.id;
              return (
                <button key={opt.id} type="button" onClick={() => switchMode(opt.id as AlgoMode)}
                  style={{
                    padding: '16px 12px', borderRadius: 18, border: 'none', cursor: 'pointer', textAlign: 'center',
                    background: active ? 'linear-gradient(135deg, var(--de-theme-btn-from, #2a8ab8), var(--de-theme-btn-to, #c8981a))' : 'rgba(255,255,255,0.55)',
                    outline: active ? 'none' : '1.5px solid rgba(160,195,240,0.3)',
                    boxShadow: active ? '0 4px 20px rgba(42,138,184,0.25)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }} aria-pressed={active}>
                  <div style={{ fontSize: 28 }}>{opt.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: active ? '#fff' : 'var(--de-heading)' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.8)' : 'var(--de-text-dim)', lineHeight: 1.3 }}>{opt.desc}</div>
                  {active && <div style={{ width: 20, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.6)', marginTop: 2 }} />}
                </button>
              );
            })}
          </div>
          {mode === 'mine' && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(42,138,184,0.06)', border: '1px solid rgba(42,138,184,0.12)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-heading)' }}>
                Active: {activePreset ? `${activePreset.emoji} ${activePreset.name}` : '📡 Everything'}
              </div>
              {mixOn && mixIds.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 3 }}>
                  Mixing: {mixIds.map(id => presets.find(p => p.id === id)?.emoji).join(' + ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Your Setups ── */}
      {mode === 'mine' && (
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Your Setups</span>
            <button type="button" onClick={() => { setCreating(true); setEditing(null); }}
              className="de-btn de-btn-ghost" style={{ fontSize: 11, padding: '5px 10px', gap: 4 }}>
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* Creator / Editor */}
            {(creating || editing) && (
              <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(42,138,184,0.2)' }}>
                <PresetCreator
                  onSave={savePreset}
                  onCancel={() => { setCreating(false); setEditing(null); }}
                  editing={editing ?? undefined}
                />
              </div>
            )}

            {/* "Everything" default */}
            <PresetRow
              emoji="📡" name="Everything" desc="All content, no filters"
              isActive={activeId === 'all' && !mixOn}
              isMixed={mixOn && mixIds.includes('all')}
              mixOn={mixOn}
              onActivate={() => activate('all')}
              onMixToggle={() => toggleMix('all')}
            />

            {/* User-created presets */}
            {presets.map(p => (
              <PresetRow
                key={p.id}
                emoji={p.emoji} name={p.name} desc={p.description || `${p.sources.length} topics · ${p.frequency}`}
                isActive={activeId === p.id && !mixOn}
                isMixed={mixOn && mixIds.includes(p.id)}
                mixOn={mixOn}
                onActivate={() => activate(p.id)}
                onMixToggle={() => toggleMix(p.id)}
                onEdit={() => { setEditing(p); setCreating(false); }}
                onDelete={() => deletePreset(p.id)}
                onShare={() => sharePreset(p)}
                isPublic={p.isPublic}
              />
            ))}

            {presets.length === 0 && !creating && (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--de-text-dim)', fontSize: 12 }}>
                No setups yet — tap <strong>New</strong> to build your first one
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mix Mode ── */}
      {mode === 'mine' && presets.length > 0 && (
        <div className="de-widget">
          <div className="de-widget-header">
            <Shuffle className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title">Mix Mode</span>
            <button type="button" onClick={() => setMixOn(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', padding: 0 }}>
              <div style={{ width: 44, height: 26, borderRadius: 13, background: mixOn ? 'var(--de-gold)' : 'rgba(160,195,240,0.3)', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: mixOn ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
              </div>
            </button>
          </div>
          {mixOn && (
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                Pick up to 3 setups. Their content blends together.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {presets.map(p => {
                  const on = mixIds.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => toggleMix(p.id)}
                      style={{ padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                        background: on ? 'linear-gradient(135deg, rgba(42,138,184,0.15), rgba(200,152,26,0.12))' : 'rgba(255,255,255,0.55)',
                        outline: on ? '2px solid var(--de-gold)' : '1px solid rgba(160,195,240,0.3)',
                        color: on ? 'var(--de-heading)' : 'var(--de-text-dim)',
                        transition: 'all 0.15s',
                      }}>
                      {p.emoji} {p.name}
                    </button>
                  );
                })}
              </div>
              {mixIds.length > 0 && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(200,152,26,0.08)', border: '1px solid rgba(200,152,26,0.2)', fontSize: 12, color: 'var(--de-heading)', fontWeight: 600 }}>
                  Now mixing: {mixIds.map(id => { const p = presets.find(x => x.id === id); return p ? `${p.emoji} ${p.name}` : ''; }).filter(Boolean).join(' + ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Who You Follow + Their Settings ── */}
      {follows.length > 0 && (
        <div className="de-widget">
          <div className="de-widget-header">
            <User className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Following Settings</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            {follows.map(f => (
              <div key={f.handle} className="de-row" style={{ borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(42,138,184,0.15), rgba(200,152,26,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--de-accent)', flexShrink: 0 }}>
                  {(f.displayName || f.handle)[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{f.displayName || f.handle}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>@{f.handle}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)', flexShrink: 0 }}>
                  {f.frequency}
                </span>
              </div>
            ))}
          </div>
          <div className="de-widget-actions">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Tap Follow on any profile to update their settings.</p>
          </div>
        </div>
      )}

      {/* ── Share Alert ── */}
      {shareAlert && (
        <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(42,138,184,0.1)', border: '1px solid rgba(42,138,184,0.2)', fontSize: 13, fontWeight: 600, color: 'var(--de-accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check className="w-4 h-4" /> {shareAlert}
          <Link href="/create" className="de-btn de-btn-primary text-xs" style={{ marginLeft: 'auto', padding: '5px 12px' }}>Post it →</Link>
        </div>
      )}

      {/* ── Discover public setups ── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <Zap className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} />
          <span className="de-widget-title">Community Setups</span>
        </div>
        <div className="de-widget-body">
          <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
            When people share their setups on their profile or in the shop, you&apos;ll see them here to copy and use.
          </p>
          <Link href="/discover" className="de-btn de-btn-ghost text-xs" style={{ marginTop: 10, display: 'inline-flex' }}>
            Browse Discover <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="de-notice">
        Your algorithm settings live on this device. Sign in on another device and they sync automatically (coming with full account sync).
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────
   Preset Row sub-component
───────────────────────────────────────────── */
function PresetRow({ emoji, name, desc, isActive, isMixed, mixOn, onActivate, onMixToggle, onEdit, onDelete, onShare, isPublic }: {
  emoji: string; name: string; desc: string;
  isActive: boolean; isMixed: boolean; mixOn: boolean;
  onActivate: () => void; onMixToggle: () => void;
  onEdit?: () => void; onDelete?: () => void; onShare?: () => void;
  isPublic?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 12, background: (isActive || isMixed) ? 'linear-gradient(135deg, rgba(42,138,184,0.10), rgba(200,152,26,0.08))' : 'rgba(255,255,255,0.55)', border: (isActive || isMixed) ? '1.5px solid rgba(42,138,184,0.3)' : '1px solid rgba(160,195,240,0.25)', padding: '10px 12px', transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {name}
            {isPublic && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)', fontWeight: 700 }}>SHARED</span>}
          </div>
          <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1 }}>{desc}</div>
        </div>

        {/* Mix checkbox or Activate */}
        {mixOn ? (
          <button type="button" onClick={onMixToggle} style={{ width: 24, height: 24, borderRadius: 6, border: isMixed ? 'none' : '1.5px solid rgba(160,195,240,0.4)', background: isMixed ? 'var(--de-gold)' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            {isMixed && <Check className="w-3 h-3 text-white" />}
          </button>
        ) : (
          <button type="button" onClick={onActivate} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0, background: isActive ? 'var(--de-accent)' : 'rgba(160,195,240,0.2)', color: isActive ? '#fff' : 'var(--de-text)' }}>
            {isActive ? '● Active' : 'Use'}
          </button>
        )}

        {/* Menu */}
        {(onEdit || onDelete || onShare) && (
          <button type="button" onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--de-text-dim)', fontSize: 16, lineHeight: 1 }}>
            ···
          </button>
        )}
      </div>

      {/* Actions menu */}
      {open && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(160,195,240,0.2)', flexWrap: 'wrap' }}>
          {onEdit   && <button type="button" onClick={() => { onEdit(); setOpen(false); }} className="de-btn de-btn-ghost" style={{ fontSize: 11, gap: 4 }}><Edit3 className="w-3 h-3" /> Edit</button>}
          {onShare  && <button type="button" onClick={() => { onShare(); setOpen(false); }} className="de-btn de-btn-ghost" style={{ fontSize: 11, gap: 4 }}><Share2 className="w-3 h-3" /> Share</button>}
          {onDelete && <button type="button" onClick={() => { onDelete(); setOpen(false); }} className="de-btn" style={{ fontSize: 11, gap: 4, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}><Trash2 className="w-3 h-3" /> Delete</button>}
        </div>
      )}
    </div>
  );
}
