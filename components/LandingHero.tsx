'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Twitter } from 'lucide-react';

export default function LandingHero() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [hasLanded, setHasLanded] = useState(false);

  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);

  const bubbleLines: string[] = [
    "Wonderful day—Feb’s perfect grid finally fixed my brain.",
    "Unpredictable chaos: 4 Mondays? Universe just pranked us.",
    "What a day: calendar symmetry hit like free therapy.",
    "Glorious glitch—Feb 2026 aligned and my OCD peaked.",
    "Wonderful weirdness: rectangle month feels cursed & holy.",
    "Unpredictable day: grid so clean it hurts my soul.",
    "Alive for the month reality forgot to leave leftovers.",
    "Wonderful ruin—perfect calendar, still quietly drowning.",
    "Unscripted beauty: knew you’d screenshot that Feb grid at 8:41.",
    "What a day—scrolled symmetry memes while life kept glitching.",
    "beep. boop. bop...\n...\n...\nha! just kidding i got you didn’t I?"
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hasLanded) return;

    let bag: string[] = [];

    const refill = () => {
      bag = [...bubbleLines];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    };

    const nextLine = () => {
      if (bag.length === 0) refill();
      return bag.pop() as string;
    };

    let hideTimer: number | null = null;

    const tick = () => {
      if (document.visibilityState !== 'visible') return;

      setBubbleText(nextLine());
      setShowBubble(true);

      hideTimer = window.setTimeout(() => {
        setShowBubble(false);
      }, 2200);
    };

    const first = window.setTimeout(tick, 1200);
    const interval = window.setInterval(tick, 12000);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [hasLanded]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-universe overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 h-full w-full object-cover z-0 opacity-100"
      >
        <source src="/videos/signup-bg.mp4" type="video/mp4" />
      </video>

      <div className="fixed inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.22)_55%,rgba(0,0,0,0.55)_100%)]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-nebula-flow flex items-center justify-center cosmic-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DREAMengin</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://x.com/dreamenginx"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-white/60 hover:text-white transition-colors"
              aria-label="Follow on X"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="relative w-full max-w-sm h-64 mb-10 flex items-center justify-center">
            <div
              className={!hasLanded ? 'relative animate-eams-land' : 'relative animate-eams-wobble'}
              onAnimationEnd={() => setHasLanded(true)}
            >
              <Image
                src="/IMG_3362.png"
                alt="Dr. Eams"
                width={240}
                height={240}
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain animate-glow-pulse"
                priority
              />

              {hasLanded && showBubble && bubbleText && (
                <div className="absolute -top-16 -right-6 max-w-[260px] bg-white/90 text-slate-900 px-3 py-2 rounded-xl text-sm font-medium shadow-lg">
                  <span className="whitespace-pre-line">{bubbleText}</span>
                </div>
              )}
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-nebula-flow bg-clip-text text-transparent">Dream</span>
            <span className="text-white">Engin</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-md mb-8 leading-relaxed">
            A living interface system that turns your digital life into a navigable universe of connected spaces.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.push('/join')}
              className="px-8 py-4 bg-sunrise-heat text-white font-semibold rounded-2xl hover:opacity-95 transition-all active:scale-[0.99]"
            >
              Get Started
            </button>

            <button
              type="button"
              onClick={() => router.push('/about')}
              className="px-8 py-4 glass-dark text-white font-semibold rounded-2xl hover:bg-white/10 transition-all active:scale-[0.99]"
            >
              Learn More
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
