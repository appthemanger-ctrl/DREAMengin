'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import HeroSprite from './HeroSprite';

export default function LandingHero() {
  const messages = useMemo(
    () => [
      "hey… you were about to open that tab again, weren’t you",
      "you paused there… deciding or pretending to decide",
      "you always scroll a little slower at night",
      "that idea you just had… yeah, keep that one",
      "you don’t need to overthink this one",
      "you already know what you’re gonna do",
      "you almost clicked something else just now",
      "you keep coming back to this for a reason",
      "it’s fine… take your time",
      "just start… it’s easier than you think",
    ],
    []
  );

  const isValentine = useMemo(() => {
    const d = new Date();
    return d.getMonth() === 1 && d.getDate() === 14; // Feb = 1
  }, []);

  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    // TODAY: no rotation at all. Only the Valentine message all day.
    if (isValentine) return;

    const ROTATE_MS = 8000;
    const FADE_MS = 220;

    const interval = setInterval(() => {
      setFadeIn(false);
      const swap = setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % messages.length);
        setFadeIn(true);
      }, FADE_MS);

      return () => clearTimeout(swap);
    }, ROTATE_MS);

    return () => clearInterval(interval);
  }, [isValentine, messages.length]);

  const bubbleText = isValentine ? '💜 Happy Valentine’s Day Dreamer 🌹' : messages[msgIndex];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b16] text-white">
      {/* background */}
      <div className="absolute inset-0 dream-colorfield" />

      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-[0.15]"
      >
        <source src="/videos/signup-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1020]/70 via-[#080d1b]/78 to-[#06090f]/90" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        {/* header */}
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

        {/* content */}
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          {/* top line */}
          <div className="rounded-full border border-white/20 bg-white/8 px-4 py-2 text-sm text-white/85 backdrop-blur">
            Dr. Eams dreams of dreaming. You don’t have to.
          </div>

          {/* character + bubble */}
          <div className="relative flex flex-col items-center">
            <HeroSprite
              width={288}
              height={288}
              className="h-56 w-56 sm:h-72 sm:w-72"
            />

            {/* bubble (right side, attached) */}
            <div
              className="
                absolute
                top-[64px]
                right-[-6px]
                sm:right-[-84px]
                max-w-[260px]
                sm:max-w-[320px]
                text-left
                z-20
              "
            >
              <div className="relative rounded-2xl bg-white text-black px-4 py-3 shadow-2xl">
                <div
                  className={[
                    'text-sm font-medium leading-snug transition-opacity duration-200',
                    fadeIn ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                >
                  {bubbleText}
                </div>

                {/* tail */}
                <div
                  className="
                    absolute
                    left-[-6px]
                    top-[22px]
                    w-3 h-3
                    bg-white
                    rotate-45
                  "
                />
              </div>
            </div>
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Navigate your digital world as layered dreams.
          </h1>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/join"
              className="min-h-11 rounded-xl bg-indigo-500 px-6 py-3 font-medium text-white hover:opacity-95"
            >
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
