'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, MessageSquare, Heart, Users, DollarSign, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    messages: true,
    likes: true,
    follows: true,
    comments: true,
    sales: true,
    updates: false,
    emailDigest: 'weekly',
  });

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const notifications = [
    { key: 'messages', label: 'Direct Messages', description: 'When someone sends you a message', icon: MessageSquare, color: 'blue' },
    { key: 'likes', label: 'Likes', description: 'When someone likes your content', icon: Heart, color: 'red' },
    { key: 'follows', label: 'New Followers', description: 'When someone follows you', icon: Users, color: 'purple' },
    { key: 'comments', label: 'Comments', description: 'When someone comments on your posts', icon: MessageSquare, color: 'green' },
    { key: 'sales', label: 'Sales & Purchases', description: 'Order updates and payment notifications', icon: DollarSign, color: 'emerald' },
    { key: 'updates', label: 'Platform Updates', description: 'New features and announcements', icon: Sparkles, color: 'yellow' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Bell className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Notifications</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {/* Push Notifications */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Push Notifications</span></div>
          <div className="de-widget-body" style={{ padding: 0 }}>
            {notifications.map((item) => (
              <div key={item.key} className="de-row">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.1)' }}>
                  <item.icon className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{item.label}</h3>
                  <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{item.description}</p>
                </div>
                <button
                  onClick={() => toggleSetting(item.key)}
                  style={{
                    width: 44, height: 26, borderRadius: 13, flexShrink: 0,
                    background: settings[item.key as keyof typeof settings] ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
                    position: 'relative', cursor: 'pointer', border: 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3,
                    left: settings[item.key as keyof typeof settings] ? 21 : 3,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.15s',
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Email Preferences */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Email Preferences</span></div>
          <div className="de-widget-body">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                <Bell className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Email Digest</h3>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Summary of your notifications</p>
              </div>
            </div>
            <div className="space-y-2">
              {['off', 'daily', 'weekly'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSettings(prev => ({ ...prev, emailDigest: option }))}
                  className="w-full p-3 rounded-xl text-left transition-colors"
                  style={{
                    background: settings.emailDigest === option ? 'rgba(42,138,184,0.12)' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${settings.emailDigest === option ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)'}`,
                    minHeight: 44,
                  }}
                >
                  <span className="text-sm font-medium capitalize" style={{ color: 'var(--de-heading)' }}>{option}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="de-widget-actions">
            <button className="de-btn de-btn-primary" style={{ width: '100%' }}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
