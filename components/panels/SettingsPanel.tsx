'use client';

/**
 * SettingsPanel — inline settings navigation panel.
 * Opens sub-panels via openPanel() — no routing whatsoever.
 */

import { useEffect, useState }  from 'react';
import { ChevronRight, Crown, User, Rss, LayoutGrid, Palette, Plug, Sliders,
         Shield, Database, HelpCircle, LogOut, Bot, Cpu }  from 'lucide-react';
import { createClient }          from '@/lib/supabase/client';
import { useDreamSystem }        from '@/lib/dreamdm/DreamSystemContext';
import type { SystemPanelId }    from '@/lib/panels/panelTypes';: Array<{
  heading: string;
  items: Array<{ panel: SystemPanelId; icon: React.ElementType; label: string; desc: string; iconBg: string }>;
}> = [
  {
    heading: 'Your Space',
    items: [
      { panel: 'profile',              icon: User,       label: 'Edit ProfileDream',    desc: 'Build and save what ViewProfile can show',           iconBg: '#2a8ab8' },
      { panel: 'settings/feed',        icon: Rss,        label: 'Feed',                 desc: 'Control what appears in your feed',                  iconBg: '#10b981' },
      { panel: 'settings/algorithm',   icon: Cpu,        label: 'My Algorithm',         desc: 'Your presets, your order — you own it',              iconBg: '#6366f1' },
      { panel: 'settings/widgets',     icon: LayoutGrid, label: 'Widgets',              desc: 'Manage widget layout and pinned cards',              iconBg: '#f59e0b' },
      { panel: 'settings/appearance',  icon: Palette,    label: 'Theme',                desc: 'Gradient presets, background, live preview',        iconBg: '#ec4899' },
    ],
  },
  {
    heading: 'Connections',
    items: [
      { panel: 'connectors',           icon: Plug,       label: 'Connectors',           desc: 'Connect Instagram, YouTube, Spotify and more',      iconBg: '#0ea5e9' },
      { panel: 'settings/controls',    icon: Sliders,    label: 'Controls',             desc: 'Customize the Home Button behaviors',               iconBg: '#8b5cf6' },
    ],
  },
  {
    heading: 'Privacy & Data',
    items: [
      { panel: 'settings/privacy',     icon: Shield,     label: 'Privacy',              desc: 'Visibility, blocking, public profile settings',     iconBg: '#22c55e' },
      { panel: 'settings/data',        icon: Database,   label: 'Data',                 desc: 'Export, delete data, delete account',               iconBg: '#dc4444' },
    ],
  },
  {
    heading: 'Help',
    items: [
      { panel: 'settings/help',        icon: HelpCircle, label: 'Help & Onboarding',   desc: 'Re-open tips, how-it-works guides, wizard',         iconBg: '#c8981a' },
      { panel: 'settings/safety',      icon: Shield,     label: 'Policy & Safety',     desc: 'Safety log, appeals, and community policy',         iconBg: '#64748b' },
    ],
  },
];

export default function SettingsPanel() {
  const { openInSurface } = useDreamSystem();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        const { data: profile } = await sb.from('profiles').select('handle').eq('id', user.id).single();
        setIsAdmin(user.user_metadata?.role === 'admin' || profile?.handle === 'admin');
      } catch { /* noop */ }
    })();
  }, []);

  async function handleSignOut() {
    const sb = createClient();
    await sb.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div style={{ padding: '12px 0 100px' }}>

      {/* Admin section */}
      {isAdmin && (
        <div className="de-widget" style={{
          margin: '0 16px 12px',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(139,92,246,0.25)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div className="de-widget-header" style={{ background: 'rgba(139,92,246,0.05)' }}>
            <Crown className="w-4 h-4 mr-2" style={{ color: '#8b5cf6' }} />
            <span className="de-widget-title" style={{ color: '#8b5cf6' }}>Admin Access</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <button
              type="button"
              onClick={() => { window.location.href = '/admin'; }}
              className="de-row"
              style={{ borderRadius: 12, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(139,92,246,0.3)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Admin Dashboard</div>
                <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>AI triad, system health, proposals</div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation groups */}
      {NAV_GROUPS.map((group) => (
        <div key={group.heading} className="de-widget" style={{
          margin: '0 16px 12px',
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div className="de-widget-header">
            <span className="de-widget-title">{group.heading}</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            {group.items.map(({ panel, icon: Icon, label, desc, iconBg }, idx) => (
              <button
                key={panel}
                type="button"
                onClick={() => openInSurface(panel)}
                className="de-row"
                style={{
                  borderRadius: 12,
                  borderBottom: idx < group.items.length - 1 ? '1px solid rgba(160,195,240,0.15)' : 'none',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${iconBg}40` }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{label}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--de-text-dim)', opacity: 0.5 }} />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <div className="de-widget" style={{
        margin: '0 16px 12px',
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div className="de-widget-body" style={{ padding: '4px 6px' }}>
          <button
            type="button"
            onClick={handleSignOut}
            className="de-row"
            style={{ borderRadius: 12, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#dc4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(220,68,68,0.3)' }}>
              <LogOut className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#dc4444' }}>Sign Out</span>
          </button>
        </div>
      </div>

    </div>
  );
}
