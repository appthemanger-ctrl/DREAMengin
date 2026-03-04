import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sliders } from 'lucide-react';
import PositionIndicatorToggle from './PositionIndicatorToggle';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Controls – DREAMengin Settings' };

export default async function ControlsSettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const settings = [
    { label: 'Drag to lock buttons',     desc: 'Drag both buttons together to lock and access menus.',   value: true  },
    { label: 'Show lock hint once',       desc: 'Display the lock hint the first time you open the app.', value: true  },
    { label: 'Persist button positions',  desc: 'Remember where you placed the buttons after each session.', value: true },
    { label: 'Haptic feedback',           desc: 'Vibrate on lock/unlock (mobile only).',                 value: false },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Sliders className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Controls</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Home Button Behavior</span></div>
          <div className="de-widget-body">
            <p className="text-sm mb-4" style={{ color: 'var(--de-text-dim)' }}>
              The two floating buttons (blue + gold) are your system controls. Drag them together to lock, then single-tap to open menus or double-tap to unlock.
            </p>
            {settings.map(({ label, desc, value }) => (
              <div key={label} className="de-row">
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{label}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <div
                  role="switch"
                  aria-checked={value}
                  aria-label={label}
                  style={{
                    width: 44, height: 26, borderRadius: 13, flexShrink: 0,
                    background: value ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
                    position: 'relative', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: value ? 21 : 3,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Navigation Display</span></div>
          <div className="de-widget-body">
            <PositionIndicatorToggle />
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">How It Works</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { step: '1', text: 'Drag the blue button and the gold button close together.' },
                { step: '2', text: 'They snap and lock at the center of the screen.' },
                { step: '3', text: 'Single tap either button to open both menus side-by-side.' },
                { step: '4', text: 'Double-tap either button to unlock and snap back to corners.' },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(42,138,184,0.15)', border: '1px solid rgba(42,138,184,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--de-accent)', flexShrink: 0 }}>
                    {step}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--de-text)', lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
