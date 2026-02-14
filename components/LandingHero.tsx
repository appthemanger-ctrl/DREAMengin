'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingHero() {
  const isValentines = useMemo(() => {
    const d = new Date();
    return d.getMonth() === 1 && d.getDate() === 14; // Feb 14 only
  }, []);

  const mindReads = useMemo(
    () => [
      'hey… did you mean to leave that other tab open?',
      'quick question… were you gonna reply to that text?',
      'you’re doing that thing where you open an app and forget why.',
      'friendly reminder: drink water. i’m annoying, sorry.',
      '…you left a light on somewhere. i can feel it.',
      'your charger is not where you think it is.',
      'you’re hungry, but you don’t want “food.” you want something.',
      'did you set a timer… or just trust yourself?',
      'you’re thinking about tomorrow. don’t. not yet.',
      'ok. you can breathe. then continue.',
    ],
    []
  );

  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (isValentines) return; // keep Valentine bubble steady today
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % mindReads.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [isValentines, mindReads.length]);

  const bubbleTitle = isValentines ? '💜 Happy Valentine’s Day Dreamer 🌹' : 'Dr. Eams…';
  const bubbleLine = isValentines ? '💜 Happy Valentine’s Day Dreamer 🌹' : mindReads[lineIndex];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b16] text-white">
      <div className="absolute inset-0 dream-colorfield" />

      <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-[0.10]">
        <source src="/videos/signup-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1020]/70 via-[#080d1b]/78 to-[#06090f]/90" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="text-lg font-semibold tracking-wide">DREAMengin</div>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/85 backdrop-blur hover:bg-white/10"
            >
              About
            </Link>
            <Link
              href="/login"
              className="min-h-11 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-95"
            >
              Sign In
            </Link>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div className="rounded-full border border-white/20 bg-white/8 px-4 py-2 text-sm text-white/85 backdrop-blur">
            Dr. Eams dreams of dreaming. You don’t have to.
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-white/10 blur-3xl" />
            <Image
              src="/IMG_3362.png"
              alt="Dr. Eams"
              width={320}
              height={320}
              priority
              className="h-56 w-56 sm:h-72 sm:w-72 object-contain"
            />

            <div className="absolute -right-10 top-4 hidden sm:block rounded-2xl border border-white/25 bg-white/90 px-4 py-3 text-left text-sm text-slate-900 shadow-sm">
              <p className="font-semibold">{bubbleTitle}</p>
              <p
                key={isValentines ? 'val' : lineIndex}
                className="mt-1 text-slate-600 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
              >
                {bubbleLine}
              </p>
              {!isValentines ? <p className="mt-2 text-[11px] text-slate-500">…just a thought.</p> : null}
            </div>
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Navigate your digital world as layered dreams.
          </h1>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/join" className="min-h-11 rounded-xl bg-indigo-500 px-6 py-3 font-medium text-white hover:opacity-95">
              Get Started
            </Link>
            <Link
              href="/about"
              className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-white/90 backdrop-blur hover:bg-white/10"
            >
              About
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
