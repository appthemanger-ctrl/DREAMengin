'use client';

/**
 * HelpPanel — Help & Onboarding rendered in Surface Space.
 * Real guide content. Dr. Eams integration. Onboarding wizard link.
 * Back → openInSurface('settings'). No routing.
 */

import { ArrowLeft, HelpCircle, BookOpen, Wand2, MessageCircle } from 'lucide-react';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';

const GUIDES = [
  { icon: '🔒', title: 'How to use the Home Buttons',     desc: 'Drag the blue + gold buttons together to lock, then tap to open menus.' },
  { icon: '🏠', title: 'Setting up your Home Dream',      desc: 'Add, reorder, and pin widgets from Edit Mode.' },
  { icon: '🔌', title: 'Connecting services',             desc: 'Link Instagram, YouTube, Spotify and more in Connectors.' },
  { icon: '👤', title: 'Setting up your Public Profile',  desc: 'Publish widgets and content to your public @handle page.' },
  { icon: '∞',  title: 'Understanding Daydreams',         desc: 'Each Daydream is a dedicated space: Music, Brand, Analytics, Games, and more.' },
];

export default function HelpPanel() {
  const { openInSurface } = useDreamSystem();

  return (
    <div style={{ paddingBottom: 100 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(244,248,253,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(160,195,240,0.2)', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>
          <button type="button" onClick={() => openInSurface('settings')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} style={{ color: 'var(--de-heading)' }} />
          </button>
          <HelpCircle size={18} style={{ color: 'var(--de-accent)' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>Help & Onboarding</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <div className="de-widget">
          <div className="de-widget-header"><Wand2 className="w-4 h-4 mr-2" style={{ color: 'var(--de-gold)' }} /><span className="de-widget-title">Setup Wizard</span></div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 12 }}>The guided setup wizard walks you through choosing what appears on your Home Dream.</p>
          </div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-primary text-xs" onClick={() => { window.location.href = '/onboarding'; }}>Launch Setup Wizard</button>
          </div>
        </div>
        <div className="de-widget">
          <div className="de-widget-header"><BookOpen className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} /><span className="de-widget-title">How-It-Works Guides</span></div>
          <div className="de-widget-body">
            {GUIDES.map(({ icon, title, desc }) => (
              <div key={title} className="de-row">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{title}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="de-widget">
          <div className="de-widget-header"><MessageCircle className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} /><span className="de-widget-title">Ask Dr. Eams</span></div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 12 }}>Dr. Eams is your AI assistant. Ask about system status, how features work, or get help setting things up.</p>
          </div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-ghost text-xs" onClick={() => { window.location.href = '/dr-eams'; }}>Open Dr. Eams</button>
          </div>
        </div>
      </div>
    </div>
  );
}
