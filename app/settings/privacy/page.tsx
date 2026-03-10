import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, EyeOff, UserX, Flag } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Privacy – Dreamengin Settings' };

export default async function PrivacySettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Shield className="w-5 h-5" style={{ color: '#22c55e' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Privacy</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Profile Visibility</span></div>
          <div className="de-widget-body">
            {[
              { label: 'Public profile',         desc: 'Allow anyone to view your /u/handle page.',       on: true  },
              { label: 'Appear in search',        desc: 'Show in Discover search results.',               on: true  },
              { label: 'Allow followers',         desc: 'Let others follow your public profile.',         on: true  },
              { label: 'Show activity status',    desc: 'Show when you were last active (friends only).', on: false },
            ].map(({ label, desc, on }) => (
              <div key={label} className="de-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <div style={{ width: 44, height: 26, borderRadius: 13, background: on ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <EyeOff className="w-4 h-4 mr-2" style={{ color: 'var(--de-text-dim)' }} />
            <span className="de-widget-title">Content Privacy</span>
          </div>
          <div className="de-widget-body">
            {[
              { label: 'Private by default',       desc: 'New posts start as private. You choose what to publish.', on: true  },
              { label: 'Hide connector data',       desc: 'Never reveal which services you use to other users.',    on: true  },
            ].map(({ label, desc, on }) => (
              <div key={label} className="de-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <div style={{ width: 44, height: 26, borderRadius: 13, background: on ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <UserX className="w-4 h-4 mr-2" style={{ color: '#dc4444' }} />
            <span className="de-widget-title">Blocked Users</span>
          </div>
          <div className="de-widget-body flex flex-col items-center py-4 gap-2">
            <UserX className="w-8 h-8 opacity-15" style={{ color: '#dc4444' }} />
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)' }}>No blocked users</p>
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <Flag className="w-4 h-4 mr-2" style={{ color: '#f59e0b' }} />
            <span className="de-widget-title">Reports & Appeals</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
              If you&apos;ve received a policy action, you can submit an appeal below. BoogieMan reviews all appeals with a clear reason and timeline.
            </p>
          </div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-ghost text-xs">Submit Appeal</button>
          </div>
        </div>

      </div>
    </div>
  );
}
