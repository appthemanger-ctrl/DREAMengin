'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, Monitor, Type, Palette, Check } from 'lucide-react';

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState('system');
  const [fontSize, setFontSize] = useState('medium');
  const [accentColor, setAccentColor] = useState('purple');

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  const fontSizes = [
    { id: 'small', label: 'Small' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Large' },
  ];

  const accentColors = [
    { id: 'purple', color: 'bg-purple-500' },
    { id: 'blue', color: 'bg-blue-500' },
    { id: 'green', color: 'bg-green-500' },
    { id: 'red', color: 'bg-red-500' },
    { id: 'orange', color: 'bg-orange-500' },
    { id: 'pink', color: 'bg-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Appearance</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Theme */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Moon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Theme</h3>
              <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-xl border text-center transition-colors ${
                  theme === t.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-background border-border hover:border-primary/50'
                }`}
              >
                <t.icon className={`w-6 h-6 mx-auto mb-2 ${theme === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium text-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Type className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Font Size</h3>
              <p className="text-sm text-muted-foreground">Adjust text size for readability</p>
            </div>
          </div>
          <div className="flex gap-3">
            {fontSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => setFontSize(size.id)}
                className={`flex-1 py-3 rounded-xl border text-center transition-colors ${
                  fontSize === size.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-background border-border hover:border-primary/50'
                }`}
              >
                <span className={`font-medium text-foreground ${
                  size.id === 'small' ? 'text-sm' : size.id === 'large' ? 'text-lg' : 'text-base'
                }`}>
                  {size.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Accent Color</h3>
              <p className="text-sm text-muted-foreground">Choose your favorite color</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {accentColors.map((color) => (
              <button
                key={color.id}
                onClick={() => setAccentColor(color.id)}
                className={`w-12 h-12 rounded-xl ${color.color} flex items-center justify-center transition-transform ${
                  accentColor === color.id ? 'scale-110 ring-2 ring-offset-2 ring-offset-background ring-white/50' : 'hover:scale-105'
                }`}
              >
                {accentColor === color.id && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-medium text-foreground mb-3">Preview</h3>
          <div className="p-4 bg-muted rounded-xl">
            <p className={`text-foreground mb-2 ${
              fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'
            }`}>
              This is how your content will look with the current settings.
            </p>
            <button className={`px-4 py-2 ${
              accentColor === 'purple' ? 'bg-purple-500' :
              accentColor === 'blue' ? 'bg-blue-500' :
              accentColor === 'green' ? 'bg-green-500' :
              accentColor === 'red' ? 'bg-red-500' :
              accentColor === 'orange' ? 'bg-orange-500' :
              'bg-pink-500'
            } text-white rounded-lg text-sm font-medium`}>
              Sample Button
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
