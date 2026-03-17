'use client';

/**
 * WidgetsPanel — Dream widget management rendered in Surface Space.
 * Real client-side state with Supabase fetch for persisted widget config.
 * Back → openInSurface('settings'). No routing.
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, LayoutGrid, Pin, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient }    from '@/lib/supabase/client';
import { useDreamSystem }  from '@/lib/dreamdm/DreamSystemContext';
import DreamWord           from '@/components/ui/DreamWord';

interface WidgetEntry { name: string; pinned: boolean; visible: boolean; }

const DEFAULT_WIDGETS: WidgetEntry[] = [
  { name: 'Main Feed', pinned: true, visible: true },
  { name: 'YouTube',   pinned: false, visible: true },
  { name: 'Spotify',   pinned: false, visible: true },
  { name: 'Weather',   pinned: false, visible: true },
  { name: 'Portfolio', pinned: false, visible: false },
];

export default function WidgetsPanel() {
  const { openInSurface } = useDreamSystem();
  const [widgets, setWidgets] = useState<WidgetEntry[]>(DEFAULT_WIDGETS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await sb.from('profiles').select('profile_dream_widgets').eq('id', user.id).single();
        if (data?.profile_dream_widgets && Array.isArray(data.profile_dream_widgets) && data.profile_dream_widgets.length > 0) {
          // Map stored ProfileDream format to WidgetEntry
          const mapped: WidgetEntry[] = (data.profile_dream_widgets as Array<{ label?: string; title?: string; pinned?: boolean; visible?: boolean }>).map(w => ({
            name:    w.label ?? w.title ?? 'Dream',
            pinned:  w.pinned  ?? false,
            visible: w.visible ?? true,
          }));
          setWidgets(mapped);
        }
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
  }, []);

  const toggle = (idx: number, key: 'pinned' | 'visible') => {
    setWidgets(prev => prev.map((w, i) => i === idx ? { ...w, [key]: !w[key] } : w));
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(244,248,253,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(160,195,240,0.2)', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>
          <button type="button" onClick={() => openInSurface('settings')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} style={{ color: 'var(--de-heading)' }} />
          </button>
          <LayoutGrid size={18} style={{ color: 'var(--de-accent)' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}><DreamWord />s</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--de-accent)' }} /></div>
        ) : (
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">HomeDream Dreams</span></div>
            <div className="de-widget-body">
              <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 12 }}>
                Manage which Dreams appear on your HomeDream. Removing only hides — your config is preserved.
              </p>
              {widgets.map(({ name, pinned, visible }, idx) => (
                <div key={name} className="de-row">
                  <div style={{ flex: 1 }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{name}</span>
                    {pinned && <span className="ml-2 text-xs" style={{ color: 'var(--de-gold)' }}>📌 Pinned</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="de-icon-btn" title={pinned ? 'Unpin' : 'Pin'} onClick={() => toggle(idx, 'pinned')} aria-label={pinned ? `Unpin ${name}` : `Pin ${name}`}>
                      <Pin className="w-3 h-3" />
                    </button>
                    <button type="button" className="de-icon-btn" title={visible ? 'Hide' : 'Show'} onClick={() => toggle(idx, 'visible')} aria-label={visible ? `Hide ${name}` : `Show ${name}`}>
                      {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Edit Mode</span></div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>
              Enter Edit Mode from the HomeDream to drag, reorder, resize, and pin Dreams. Changes auto-save.
            </p>
          </div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-ghost text-xs" onClick={() => openInSurface('profile')}>Go to ProfileDream →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
