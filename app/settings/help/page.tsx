import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, BookOpen, Wand2, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Help – Dreamengin Settings' };

export default async function HelpPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const guides = [
    { icon: '🔒', title: 'How to use the Home Buttons', desc: 'Drag the blue + gold buttons together to lock, then tap to open menus.' },
    { icon: '🏠', title: 'Setting up your Home Dream', desc: 'Add, reorder, and pin widgets from Edit Mode.' },
    { icon: '🔌', title: 'Connecting services', desc: 'Link Instagram, YouTube, Spotify and more in Connectors.' },
    { icon: '👤', title: 'Setting up your Public Profile', desc: 'Publish widgets and content to your public @handle page.' },
    { icon: '∞',  title: 'Understanding Daydreams', desc: 'Each Daydream is a dedicated space (Music, Brand, Analytics, etc).' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <HelpCircle className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Help & Onboarding</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-widget">
          <div className="de-widget-header">
            <Wand2 className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title">Setup Wizard</span>
          </div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 12 }}>
              The guided setup wizard walks you through choosing what appears on your Home Dream. It's optional — you can always customize manually.
            </p>
          </div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-primary text-xs">Launch Setup Wizard</button>
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <BookOpen className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">How-It-Works Guides</span>
          </div>
          <div className="de-widget-body">
            {guides.map(({ icon, title, desc }) => (
              <div key={title} className="de-row">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{title}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <MessageCircle className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Ask Dr. Eams</span>
          </div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 12 }}>
              Dr. Eams is your AI assistant. Ask about system status, how features work, or get help setting things up.
            </p>
          </div>
          <div className="de-widget-actions">
            <Link href="/homedream" className="de-btn de-btn-primary text-xs">Open Dr. Eams →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
