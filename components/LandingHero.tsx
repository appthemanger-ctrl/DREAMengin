'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import HeroSprite from './HeroSprite';
import PlatformBadge from './ui/PlatformBadge';

/** Social icons shown in the landing strip — link to /join (sign-up required) */
const STRIP_ICONS: Array<{ name: string; label: string }> = [
  { name: 'facebook',   label: 'Facebook'   },
  { name: 'twitter',    label: 'Twitter'    },
  { name: 'instagram',  label: 'Instagram'  },
  { name: 'linkedin',   label: 'LinkedIn'   },
  { name: 'youtube',    label: 'YouTube'    },
  { name: 'tiktok',     label: 'TikTok'     },
  { name: 'messenger',  label: 'Messenger'  },
  { name: 'discord',    label: 'Discord'    },
  { name: 'spotify',    label: 'Spotify'    },
  { name: 'snapchat',   label: 'Snapchat'   },
  { name: 'reddit',     label: 'Reddit'     },
  { name: 'whatsapp',   label: 'WhatsApp'   },
  { name: 'twitch',     label: 'Twitch'     },
  { name: 'pinterest',  label: 'Pinterest'  },
  { name: 'soundcloud', label: 'SoundCloud' },
  { name: 'dropbox',    label: 'Dropbox'    },
  { name: 'figma',      label: 'Figma'      },
  { name: 'medium',     label: 'Medium'     },
];

export default function LandingHero() {
  const messages = useMemo(
    () => [
      "hey… you were about to open that tab again, weren't you",
      "you paused there… deciding or pretending to decide",
      "you always scroll a little slower at night",
      "that idea you just had… yeah, keep that one",
      "you don't need to overthink this one",
      "you already know what you're gonna do",
      "you almost clicked something else just now",
      "you keep coming back to this for a reason",
      "it's fine… take your time",
      "just start… it's easier than you think",
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

  const bubbleText = isValentine ? '💜 Happy Valentine\u2019s Day Dreamer 🌹' : messages[msgIndex];

  return (
    <main className="relative min-h-screen overflow-hidden dream-bg">
      {/* Radial glow accents */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(42,138,184,0.22) 0%, transparent 70%),' +
            'radial-gradient(ellipse 50% 40% at 90% 80%, rgba(200,152,26,0.12) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        {/* header */}
        <header className="flex items-center justify-between">
          <div className="text-lg font-bold tracking-wide" style={{ color: 'var(--de-heading)' }}>
            DREAMengin
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="de-btn de-btn-ghost text-sm"
            >
              About
            </Link>
            <Link
              href="/login"
              className="de-btn de-btn-primary text-sm"
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* content */}
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          {/* top badge */}
          <div className="de-badge text-xs">
            ✦ Easy to use · Premium design · Light blue &amp; gold
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
              <div
                className="relative rounded-2xl px-4 py-3 shadow-xl"
                style={{
                  background: 'var(--de-glass)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--de-border)',
                }}
              >
                <div
                  className={[
                    'text-sm font-medium leading-snug transition-opacity duration-200',
                    fadeIn ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                  style={{ color: 'var(--de-text)' }}
                >
                  {bubbleText}
                </div>

                {/* tail */}
                <div
                  className="absolute left-[-6px] top-[22px] w-3 h-3 rotate-45"
                  style={{
                    background: 'var(--de-glass)',
                    borderLeft: '1px solid var(--de-border)',
                    borderBottom: '1px solid var(--de-border)',
                  }}
                />
              </div>
            </div>
          </div>

          <h1
            className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl"
            style={{ color: 'var(--de-heading)' }}
          >
            Your digital life as{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, var(--de-accent), var(--de-gold))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              layered dreams
            </span>
            .
          </h1>

          <p className="max-w-lg text-base" style={{ color: 'var(--de-text-dim)' }}>
            Widget-powered feed. 6 Daydreams (12 sides). Premium spatial design.
            One place to create, connect, and never leave.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/join"
              className="de-btn de-btn-gold min-h-11 px-8 py-3 text-base font-bold"
            >
              ✦ Get Started Free
            </Link>
            <Link
              href="/about"
              className="de-btn de-btn-ghost min-h-11 px-8 py-3 text-base"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* Feature pills */}
        <section className="w-full max-w-3xl mx-auto pb-6">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              '⌂ Widget Feed',
              '◉ 6 Daydreams',
              '✦ Premium Design',
              '🎵 Music Integration',
              '🔒 Privacy-First',
              '🤖 AI-Powered',
            ].map((pill) => (
              <span
                key={pill}
                className="de-badge text-xs"
              >
                {pill}
              </span>
            ))}
          </div>
        </section>

        {/* Icon strip: connect everything */}
        <section className="w-full max-w-3xl mx-auto px-4 pb-10 text-center">
          <p className="de-tag mb-4">Connect everything</p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {STRIP_ICONS.map(({ name, label }) => (
              <Link
                key={name}
                href="/join"
                aria-label={`Connect ${label}`}
                style={{ display: 'inline-block', outline: 'none' }}
                className="opacity-75 hover:opacity-100 focus-visible:ring-2 focus-visible:opacity-100 transition-opacity duration-150"
              >
                <PlatformBadge name={name} size={44} label={label} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
