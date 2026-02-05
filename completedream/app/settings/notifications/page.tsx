'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, MessageSquare, Heart, Users, DollarSign, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Push Notifications */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Push Notifications</h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {notifications.map((item) => (
              <div key={item.key} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-500`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting(item.key)}
                  className={`w-12 h-7 rounded-full transition-colors ${
                    settings[item.key as keyof typeof settings] ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Email Preferences */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Email Preferences</h2>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Email Digest</h3>
                <p className="text-sm text-muted-foreground">Summary of your notifications</p>
              </div>
            </div>
            <div className="space-y-2">
              {['off', 'daily', 'weekly'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSettings(prev => ({ ...prev, emailDigest: option }))}
                  className={`w-full p-3 rounded-xl border text-left transition-colors ${
                    settings.emailDigest === option
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium text-foreground capitalize">{option}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors min-h-[48px]">
          Save Changes
        </button>
      </div>
    </div>
  );
}
