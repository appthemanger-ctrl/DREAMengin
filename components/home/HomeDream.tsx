'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Music,
  Gamepad2,
  FlaskConical,
  Code2,
  Palette,
  Video,
  FileText,
  Grid3x3,
  Globe,
  User,
  Image,
  Link2,
  X,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { WidgetInstance, getWidgetType } from '@/types/widgets';
import DreamNavControls from '@/components/dreamnav/DreamNavControls';
import DreamRadialMenu from '@/components/menus/DreamRadialMenu';
import SystemRadialMenu, { type SystemMenuAction } from '@/components/menus/SystemRadialMenu';
import DreamWidgetGrid from './DreamWidgetGrid';

import '@/components/v1-ui/widget-feed-screen.css';
import '@/styles/home-dream.css';

interface HomeDreamProps {
  userId: string;
  userWidgets: WidgetInstance[];
  followingWidgets: WidgetInstance[];
}

/** Small icon component used in the rails */
function RailWidgetIcon({
  widget,
  onTap,
  onLongPress,
  accentClass,
}: {
  widget: WidgetInstance;
  onTap: () => void;
  onLongPress: () => void;
  accentClass?: string;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const label = widget.title ?? getWidgetType(widget) ?? 'Widget';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`widget-icon w-12 h-12 rounded-xl bg-de-card/80 border border-de-border flex items-center justify-center transition-colors ${accentClass ?? 'hover:border-de-gold/40'}`}
      onPointerDown={() => {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          onLongPress();
        }, 500);
      }}
      onPointerUp={() => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
          onTap();
        }
      }}
      onPointerCancel={() => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }}
      onPointerLeave={() => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }}
    >
      <span className="text-lg" aria-hidden="true">{getRailEmoji(getWidgetType(widget))}</span>
    </button>
  );
}

function getRailEmoji(type: string | undefined): string {
  const map: Record<string, string> = {
    music: '🎵', games: '🎮', lab: '🔬', code: '💻', brand: '✦',
    media: '🎥', youtube: '▶', text: '📝', social_feed: '📡',
    profile_info: '👤', gallery: '🖼', link_tree: '🔗', feed: '📰',
  };
  return type ? (map[type] ?? '⬡') : '⬡';
}

function getIconForType(type: string | undefined): React.ReactNode {
  const cls = 'w-5 h-5';
  switch (type) {
    case 'music':        return <Music className={cls} />;
    case 'games':        return <Gamepad2 className={cls} />;
    case 'lab':          return <FlaskConical className={cls} />;
    case 'code':         return <Code2 className={cls} />;
    case 'brand':        return <Palette className={cls} />;
    case 'media':        return <Video className={cls} />;
    case 'youtube':      return <Video className={cls} />;
    case 'text':         return <FileText className={cls} />;
    case 'social_feed':  return <Globe className={cls} />;
    case 'profile_info': return <User className={cls} />;
    case 'gallery':      return <Image className={cls} />;
    case 'link_tree':    return <Link2 className={cls} />;
    default:             return <Grid3x3 className={cls} />;
  }
}

export default function HomeDream({ userId: _userId, userWidgets, followingWidgets }: HomeDreamProps) {
  const router = useRouter();

  const [selectedWidget, setSelectedWidget] = useState<WidgetInstance | null>(null);
  const [feedStarted, setFeedStarted] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bothMenusOpen, setBothMenusOpen] = useState(false);

  const centerRef = useRef<HTMLElement>(null);
  const hasWidgets = userWidgets.length > 0;

  /* ── Actions ─────────────────────────────────────────────────────────────── */

  const handleStartFeed = useCallback(() => {
    setFeedStarted(true);
    setBannerVisible(true);
  }, []);

  const handleGoHome = useCallback(() => {
    setSelectedWidget(null);
    setBothMenusOpen(false);
    centerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSystemAction = useCallback(
    (action: SystemMenuAction) => {
      setBothMenusOpen(false);
      switch (action) {
        case 'settings':      router.push('/settings');          break;
        case 'account':       router.push('/edit-profiledream'); break;
        case 'feed-settings': router.push('/feed-settings');     break;
        case 'connectors':    router.push('/connectors');        break;
        case 'go-home':       handleGoHome();                    break;
        case 'dr-eams':       /* Dr. Eams panel — wired in full impl */ break;
      }
    },
    [router, handleGoHome]
  );

  const handleWidgetTapFromRail = useCallback((widget: WidgetInstance) => {
    /* Tap on left rail = dispatch createPost event (spec §rail model) */
    window.dispatchEvent(new CustomEvent('createPost', { detail: { widgetId: widget.id } }));
  }, []);

  const handleWidgetLongPressFromRail = useCallback((widget: WidgetInstance) => {
    /* Long press on left rail = open widget in center */
    setSelectedWidget(widget);
  }, []);

  /* ── Render ──────────────────────────────────────────────────────────────── */

  const widgetType = selectedWidget ? getWidgetType(selectedWidget) : undefined;

  return (
    <div className="home-dream-surface page-enter min-h-screen bg-sky-gradient">

      {/* Feed onboarding banner — slides in from top after "Start Feed" */}
      {bannerVisible && (
        <div className="feed-banner flex items-center justify-between gap-3 text-sm">
          <span className="text-de-gold/90 leading-snug">
            You&apos;re viewing the default feed. Tap the gold button, then{' '}
            <strong className="text-de-gold font-medium">Settings</strong> to switch to your
            hand-picked sources.
          </span>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            className="flex-shrink-0 text-white/50 hover:text-white transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-de-border px-6 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(8, 18, 36, 0.80)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 1px 0 rgba(125,211,252,0.1), 0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <h1 className="text-2xl font-light tracking-widest text-de-gold select-none">
          dreamengin
        </h1>
        <Link
          href="/edit-profiledream"
          className="text-sm text-de-sky hover:text-de-gold transition-colors"
        >
          Edit Profile
        </Link>
      </header>

      {/* ── Main layout: left rail · center · right rail ────────────────────── */}
      <div className="flex" style={{ minHeight: 'calc(100vh - 64px)' }}>

        {/* Left rail — user's own widget icons */}
        <aside
          className="widget-rail flex-shrink-0 w-[72px] md:w-20 overflow-y-auto overflow-x-hidden flex flex-col items-center gap-3 py-4 scrollbar-hide"
          aria-label="Your widgets"
        >
          {userWidgets.map((widget) => (
            <RailWidgetIcon
              key={widget.id}
              widget={widget}
              onTap={() => handleWidgetTapFromRail(widget)}
              onLongPress={() => handleWidgetLongPressFromRail(widget)}
              accentClass="hover:border-de-gold/40"
            />
          ))}
        </aside>

        {/* Center content area */}
        <main
          ref={centerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden pb-24"
        >
          {selectedWidget ? (
            /* ── Inline widget content ─────────────────────────────────────── */
            <div className="p-4 feed-area-transition">
              <button
                type="button"
                onClick={() => setSelectedWidget(null)}
                className="mb-4 flex items-center gap-1 text-sm text-de-sky hover:text-de-gold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <div className="premium-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-de-sky/15 to-de-gold/10 flex items-center justify-center text-de-sky">
                    {getIconForType(widgetType)}
                  </div>
                  <div>
                    <h2 className="text-base font-medium text-white/90">
                      {selectedWidget.title ?? widgetType ?? 'Widget'}
                    </h2>
                    {selectedWidget.space && (
                      <p className="text-xs text-de-sky/50 capitalize">{selectedWidget.space}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-white/40 font-light">
                  Widget content will appear here once connected.
                </p>
              </div>
            </div>
          ) : hasWidgets ? (
            /* ── Populated widget grid ─────────────────────────────────────── */
            <DreamWidgetGrid
              widgets={userWidgets}
              onWidgetOpen={setSelectedWidget}
              onWidgetLongPress={setSelectedWidget}
              selectedWidgetId={selectedWidget ? (selectedWidget as WidgetInstance).id : null}
            />
          ) : (
            /* ── First-login empty state ───────────────────────────────────── */
            <div className="flex flex-col items-center justify-center min-h-full py-20 px-8 text-center">
              <h2 className="text-5xl font-light tracking-widest text-de-gold mb-3 select-none">
                dreamengin
              </h2>
              <p className="text-white/40 text-sm font-light mb-12 tracking-wide">
                Your world starts here.
              </p>

              {!feedStarted ? (
                <motion.button
                  type="button"
                  onClick={handleStartFeed}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  className="premium-btn premium-btn-primary px-10 py-3 text-sm font-medium mb-8"
                >
                  Start Feed
                </motion.button>
              ) : (
                <div className="flex items-center gap-2 text-de-gold/70 text-sm mb-8">
                  <Sparkles className="w-4 h-4" />
                  <span>Feed active</span>
                </div>
              )}

              <p className="text-white/20 text-xs tracking-wide font-light">
                or tap any widget to open it
              </p>
            </div>
          )}
        </main>

        {/* Right rail — following / social widgets */}
        <aside
          className="widget-rail widget-rail-right flex-shrink-0 w-[72px] md:w-20 overflow-y-auto overflow-x-hidden flex flex-col items-center gap-3 py-4 scrollbar-hide"
          aria-label="Following widgets"
        >
          {followingWidgets.map((widget) => (
            <RailWidgetIcon
              key={widget.id}
              widget={widget}
              onTap={() => setSelectedWidget(widget)}
              onLongPress={() => setSelectedWidget(widget)}
              accentClass="hover:border-de-sky/40"
            />
          ))}
        </aside>

      </div>

      {/* ── Persistent Gold Button ─────────────────────────────────────────── */}
      <div className={`relative ${bothMenusOpen ? '' : 'gold-button-pulse'}`}>
        <DreamNavControls
          onHome={handleGoHome}
          onBothMenus={() => setBothMenusOpen(true)}
        />
      </div>

      {/* ── Dual menus (Daydreams left · System right) ────────────────────── */}
      <DreamRadialMenu
        open={bothMenusOpen}
        onClose={() => setBothMenusOpen(false)}
        side="left"
      />
      <SystemRadialMenu
        open={bothMenusOpen}
        onClose={() => setBothMenusOpen(false)}
        side="right"
        onAction={handleSystemAction}
      />

    </div>
  );
}
