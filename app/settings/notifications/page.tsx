'use client';
// SURFACE: dreamsurface.SettingsNotifications  (framework-mandated basename: page.tsx)

import AuthenticatedPageHeader from '@/components/ui/dream.AuthenticatedPageHeader';
import { Bell, Check, DollarSign, Heart, Loader2, MessageSquare, Sparkles, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';


const STORAGE_KEY = 'de-notification-settings';

interface NotificationSettings {
  messages: boolean;
  likes: boolean;
  follows: boolean;
  comments: boolean;
  sales: boolean;
  updates: boolean;
  emailDigest: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  messages: true,
  likes: true,
  follows: true,
  comments: true,
  sales: true,
  updates: false,
  emailDigest: 'weekly',
};

export default function NotificationSettingsPage( ){
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Load settings on mount — try DB first, fall back to localStorage cache
  useEffect(() => {
    // Immediately apply localStorage cache for fast paint
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings((p) => ({ ...p, ...(JSON.parse(raw) as Partial<NotificationSettings>) }));
    } catch (err) {
      console.warn('[NotificationSettings] Failed to load from localStorage:', err);
    }

    // Then fetch real stored settings from Supabase
    fetch('/api/settings/notifications')
      .then((r) => r.json())
      .then((data: { ok: boolean; notifications: Partial<NotificationSettings> | null }) => {
        if (data.ok && data.notifications) {
          setSettings((p) => ({ ...p, ...data.notifications }));
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...data.notifications })); } catch (err) {
            console.warn('[NotificationSettings] Failed to persist to localStorage:', err);
          }
        }
      })
      .catch((err) => {
        console.warn('[NotificationSettings] Failed to fetch from server, using localStorage values:', err);
      });
  }, []);

  const toggleSetting = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Persist to Supabase
      await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      // Update localStorage cache
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (err) {
        console.warn('[NotificationSettings] Failed to persist to localStorage:', err);
      }
      setSaved(true);
      if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // Network failed — fall back to localStorage only
      console.warn('[NotificationSettings] Save to server failed, falling back to localStorage:', err);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (lsErr) {
        console.warn('[NotificationSettings] localStorage fallback also failed:', lsErr);
      }
      setSaved(true);
      if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [settings]);

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
      <AuthenticatedPageHeader
        backHref="/settings"
        title="Notifications"
        subtitle="Tune messages, follows, likes, sales, and digest behavior for your operating surface."
        icon={<Bell className="w-4 h-4" />}
        accentColor="var(--de-accent)"
        badge="Settings"
      />

      <div className="de-auth-content space-y-4">
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
                  role="switch"
                  aria-checked={!!settings[item.key as keyof typeof settings]}
                  aria-label={item.label}
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
                  onClick={() => setSettings((prev) => ({ ...prev, emailDigest: option }))}
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
            <button
              type="button"
              className="de-btn de-btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : null}
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
