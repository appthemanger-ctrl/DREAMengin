'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Users, MessageSquare, Bell, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PrivacySettingsPage() {
  type PrivacySettings = {
    profileVisibility: 'public' | 'followers' | 'private';
    showActivity: boolean;
    allowMessages: 'everyone' | 'followers' | 'nobody';
    showOnlineStatus: boolean;
    allowTagging: boolean;
  };

  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showActivity: true,
    allowMessages: 'everyone',
    showOnlineStatus: true,
    allowTagging: true,
  });

  const updateSetting = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Privacy Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Visibility */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Profile Visibility</h3>
              <p className="text-sm text-muted-foreground">Control who can see your profile</p>
            </div>
          </div>
          <div className="space-y-2">
            {['public', 'followers', 'private'].map((option) => (
              <button
                key={option}
                onClick={() => updateSetting('profileVisibility', option)}
                className={`w-full p-3 rounded-xl border text-left transition-colors ${
                  settings.profileVisibility === option
                    ? 'bg-primary/10 border-primary'
                    : 'bg-background border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground capitalize">{option}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option === 'public' && 'Anyone can view your profile'}
                  {option === 'followers' && 'Only followers can view your profile'}
                  {option === 'private' && 'Only you can view your profile'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Activity Status */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Show Activity Status</h3>
                <p className="text-sm text-muted-foreground">Let others see when you are online</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('showOnlineStatus', !settings.showOnlineStatus)}
              className={`w-12 h-7 rounded-full transition-colors ${
                settings.showOnlineStatus ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Direct Messages</h3>
              <p className="text-sm text-muted-foreground">Who can send you messages</p>
            </div>
          </div>
          <div className="space-y-2">
            {['everyone', 'followers', 'nobody'].map((option) => (
              <button
                key={option}
                onClick={() => updateSetting('allowMessages', option)}
                className={`w-full p-3 rounded-xl border text-left transition-colors ${
                  settings.allowMessages === option
                    ? 'bg-primary/10 border-primary'
                    : 'bg-background border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground capitalize">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tagging */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Allow Tagging</h3>
                <p className="text-sm text-muted-foreground">Let others tag you in posts</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('allowTagging', !settings.allowTagging)}
              className={`w-12 h-7 rounded-full transition-colors ${
                settings.allowTagging ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.allowTagging ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
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
