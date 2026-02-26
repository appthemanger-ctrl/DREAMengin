import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plug, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Connectors – DREAMengin', description: 'Connect your favourite services.' };

type ConnectorStatus = 'connected' | 'not_connected' | 'needs_reauth' | 'error';

interface Connector {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: ConnectorStatus;
  category: 'Social' | 'Music' | 'Video' | 'Utilities';
}

function StatusBadge({ status }: { status: ConnectorStatus }) {
  const map: Record<ConnectorStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    connected:      { label: 'Connected',       color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: <CheckCircle size={12} /> },
    not_connected:  { label: 'Not Connected',   color: 'var(--de-text-dim)', bg: 'rgba(160,195,240,0.15)', icon: <Clock size={12} /> },
    needs_reauth:   { label: 'Reconnect',       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <RefreshCw size={12} /> },
    error:          { label: 'Error',           color: '#dc4444', bg: 'rgba(220,68,68,0.1)',  icon: <AlertCircle size={12} /> },
  };
  const { label, color, bg, icon } = map[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 9999, background: bg, color, fontSize: 10, fontWeight: 700 }}>
      {icon} {label}
    </span>
  );
}

const CONNECTORS: Connector[] = [
  { id: 'instagram', name: 'Instagram',   icon: '📸', description: 'See your feed, stories, and friend posts.',    status: 'not_connected', category: 'Social'    },
  { id: 'youtube',   name: 'YouTube',     icon: '📺', description: 'Subscriptions, watch history, saved videos.',  status: 'not_connected', category: 'Video'     },
  { id: 'spotify',   name: 'Spotify',     icon: '🎵', description: 'Now playing, playlists, liked songs.',         status: 'not_connected', category: 'Music'     },
  { id: 'tiktok',    name: 'TikTok',      icon: '🎬', description: 'Following feed and saved videos.',             status: 'not_connected', category: 'Social'    },
  { id: 'twitter',   name: 'X / Twitter', icon: '✖️', description: 'Home timeline and bookmarks.',                status: 'not_connected', category: 'Social'    },
  { id: 'github',    name: 'GitHub',      icon: '🐙', description: 'Repos, activity, and contributions.',         status: 'not_connected', category: 'Utilities' },
  { id: 'apple',     name: 'Apple Music', icon: '🎼', description: 'Library, playlists, and recent plays.',       status: 'not_connected', category: 'Music'     },
  { id: 'weather',   name: 'Weather',     icon: '🌤️', description: 'Current conditions and forecast (by location).', status: 'not_connected', category: 'Utilities' },
];

export default async function ConnectorsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const categories = ['Social', 'Music', 'Video', 'Utilities'] as const;

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Plug className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Connectors</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-notice">
          <span>
            Connecting a service lets you add its content as widgets or slices in your feed. 
            You control exactly what appears and where. No surprise changes.
          </span>
        </div>

        {categories.map((cat) => {
          const items = CONNECTORS.filter((c) => c.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="de-widget">
              <div className="de-widget-header"><span className="de-widget-title">{cat}</span></div>
              <div className="de-widget-body" style={{ padding: '4px 6px' }}>
                {items.map((conn) => (
                  <div key={conn.id} className="de-row">
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(42,138,184,0.08)', border: '1px solid rgba(42,138,184,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {conn.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{conn.name}</span>
                        <StatusBadge status={conn.status} />
                      </div>
                      <div className="text-xs" style={{ color: 'var(--de-text-dim)', marginTop: 1 }}>{conn.description}</div>
                    </div>
                    <button
                      type="button"
                      className="de-btn de-btn-primary"
                      style={{ fontSize: 11, padding: '6px 12px', flexShrink: 0 }}
                    >
                      {conn.status === 'connected' ? 'Manage' : conn.status === 'needs_reauth' ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">About Connectors</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { q: 'What permissions does DREAMengin request?', a: 'Read-only access to your public content and profile. We never post on your behalf.' },
                { q: 'Can I disconnect a service?', a: 'Yes. Tap Manage on any connected service and choose Disconnect. Your connector data is wiped immediately.' },
                { q: 'What if a connection expires?', a: 'The widget shows a "Reconnect" button instead of breaking. Your layout and config are preserved.' },
              ].map(({ q, a }) => (
                <div key={q} style={{ padding: '10px 0', borderBottom: '1px solid rgba(160,195,240,0.18)' }}>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--de-heading)' }}>{q}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)', lineHeight: 1.5 }}>{a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
