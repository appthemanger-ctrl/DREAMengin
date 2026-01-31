'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Star component for background
function Star({ top, left, delay, size }: { top: number; left: number; delay: number; size: number }) {
  return (
    <div
      className="absolute rounded-full bg-white animate-star-twinkle"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: size,
        height: size,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate stars
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    size: Math.random() * 2 + 1,
  }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Check your email for the magic link!');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-universe px-4 relative overflow-hidden">
      {/* Stars background */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {stars.map((star) => (
            <Star key={star.id} {...star} />
          ))}
        </div>
      )}

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-float-gentle" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-float-gentle delay-1000" />

      {/* Back button */}
      <Link 
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors z-20 p-2"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <div className="w-full max-w-sm space-y-8 relative z-10">
        {/* Dr. Eams mascot */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-pink-500/30 blur-2xl scale-150" />
            <Image
              src="/dr-eams.jpeg"
              alt="Dr. Eams"
              width={140}
              height={140}
              className="relative w-32 h-32 object-contain animate-float-gentle animate-glow-pulse"
              priority
            />
          </div>
          
          {/* Branding */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center cosmic-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">Dream</span>
              <span>Engin</span>
            </h1>
          </div>
          
          <p className="text-base text-white/60 text-center">
            Enter your email for a magic link
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-4 glass-dark border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all min-h-[56px] text-base"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all min-h-[56px] cosmic-glow active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Send magic link
              </>
            )}
          </button>

          {message && (
            <div className={`p-4 rounded-2xl text-sm animate-in slide-in-from-bottom-4 ${
              message.includes('Error') 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {message}
            </div>
          )}
        </form>

        <p className="text-center text-sm text-white/40">
          Privacy-first creator OS powered by Inner Dreams AI
        </p>
      </div>
    </div>
  );
}
