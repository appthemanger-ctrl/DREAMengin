'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ArrowRight, Zap, Shield, Users, Music, Beaker, MessageCircle } from 'lucide-react';

// Floating particle component
function Particle({ delay, size, left }: { delay: number; size: number; left: number }) {
  return (
    <div
      className="absolute rounded-full bg-gradient-to-t from-purple-500/40 to-blue-500/40 animate-particle-float"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${8 + Math.random() * 4}s`,
      }}
    />
  );
}

// Twinkling star component
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

export default function LandingHero() {
  const [mounted, setMounted] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'walking' | 'waving'>('idle');

  useEffect(() => {
    setMounted(true);
    // Cycle through mascot states
    const interval = setInterval(() => {
      setMascotState(prev => {
        if (prev === 'idle') return 'walking';
        if (prev === 'walking') return 'waving';
        return 'idle';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Generate stars
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    size: Math.random() * 2 + 1,
  }));

  // Generate particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    size: Math.random() * 6 + 4,
    left: Math.random() * 100,
  }));

  const features = [
    { icon: Zap, label: 'AI-Powered', color: 'text-yellow-400' },
    { icon: Shield, label: 'Privacy-First', color: 'text-green-400' },
    { icon: Users, label: 'Social', color: 'text-blue-400' },
    { icon: Music, label: 'Music', color: 'text-pink-400' },
    { icon: Beaker, label: 'Labs', color: 'text-purple-400' },
    { icon: MessageCircle, label: 'Messages', color: 'text-cyan-400' },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-universe flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-universe overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <Star key={star.id} {...star} />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <Particle key={particle.id} {...particle} />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-float-gentle" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-float-gentle delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-float-gentle delay-2000" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center cosmic-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DREAMengin</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </header>

        {/* Hero section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          {/* Dr. Eams mascot */}
          <div className="relative w-full max-w-sm h-48 sm:h-64 mb-8">
            {/* Portal/Glow behind mascot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-gradient-to-r from-purple-600/30 via-blue-500/30 to-pink-500/30 blur-2xl animate-portal-spin" />
            </div>
            
            {/* Dr. Eams */}
            <div 
              className={`
                absolute inset-0 flex items-center justify-center
                ${mascotState === 'walking' ? 'animate-walk-path' : ''}
                ${mascotState === 'idle' ? 'animate-float-gentle' : ''}
              `}
            >
              <div className={`relative ${mascotState === 'waving' ? 'animate-wave' : ''}`}>
                <Image
                  src="/dr-eams.jpeg"
                  alt="Dr. Eams - Your AI Guide"
                  width={180}
                  height={180}
                  className="w-36 h-36 sm:w-44 sm:h-44 object-contain animate-glow-pulse"
                  priority
                />
                {/* Speech bubble on wave */}
                {mascotState === 'waving' && (
                  <div className="absolute -top-8 -right-4 bg-white/90 text-slate-900 px-3 py-1.5 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-bottom-4">
                    Hey there!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Dream
            </span>
            <span className="text-white">Engin</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/70 max-w-md mx-auto mb-8 leading-relaxed">
            Your privacy-first creator OS with AI-powered tools, social connections, and infinite possibilities.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full max-w-sm sm:max-w-none sm:w-auto">
            <Link
              href="/login"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl hover:from-purple-500 hover:to-blue-500 transition-all cosmic-glow active:scale-95 min-h-[56px]"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/about"
              className="flex items-center justify-center gap-2 px-8 py-4 glass-dark text-white font-semibold rounded-2xl hover:bg-white/10 transition-all active:scale-95 min-h-[56px]"
            >
              Learn More
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 max-w-lg">
            {features.map((feature, i) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2 glass-dark rounded-full text-sm text-white/80 animate-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <feature.icon className={`w-4 h-4 ${feature.color}`} />
                {feature.label}
              </div>
            ))}
          </div>
        </main>

        {/* Bottom indicator */}
        <div className="pb-8 flex justify-center">
          <div className="flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs">Scroll to explore</span>
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
              <div className="w-1.5 h-2.5 bg-white/40 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
