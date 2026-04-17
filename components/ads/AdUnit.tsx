// components/ads/AdUnit.tsx
// Phase 9 — Ad Unit Component
//
// Displays ads with skip credit system and AD badge.
// Per ACTIVITY_FIRST_PROTOCOL.md §V (Ad System)

'use client';

import { useState, useEffect } from 'react';
import { AdType } from '@/lib/activity/types';

interface AdUnitProps {
  adId: string;
  adType: AdType;
  adContent: {
    title: string;
    description: string;
    imageUrl?: string;
    targetUrl: string;
  };
  postId?: string;
  onComplete?: (watched: boolean, creditsEarned: number) => void;
  skipCreditsAvailable?: number;
}

export function AdUnit({
  adId,
  adType,
  adContent,
  postId,
  onComplete,
  skipCreditsAvailable = 0,
}: AdUnitProps) {
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  const duration = adType === 'rewarded' ? 30 : 15;
  const creditsEarned = adType === 'rewarded' ? 3 : 1;
  const canSkip = skipCreditsAvailable > 0;

  useEffect(() => {
    if (!watchStartTime || completed || skipped) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - watchStartTime) / 1000);
      setWatchedSeconds(elapsed);

      // Auto-complete when duration reached
      if (elapsed >= duration) {
        handleComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [watchStartTime, completed, skipped, duration]);

  const handleStartWatching = () => {
    setWatchStartTime(Date.now());
  };

  const handleSkip = async () => {
    if (!canSkip) return;

    try {
      // Call skip credits API
      const res = await fetch('/api/skip-credits/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: adId }),
      });

      if (res.ok) {
        setSkipped(true);
        onComplete?.(false, 0);
      }
    } catch (err) {
      console.error('[AdUnit] Skip error:', err);
    }
  };

  const handleComplete = async () => {
    setCompleted(true);

    const watchedPct = Math.min(Math.round((watchedSeconds / duration) * 100), 100);

    try {
      // Track ad view
      const res = await fetch('/api/ads/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: adId,
          ad_type: adType,
          view_duration: watchedSeconds,
          watched_pct: watchedPct,
          post_id: postId,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Earn skip credits if verified
        if (data.verified && data.ad_view?.id) {
          await fetch('/api/skip-credits/earn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad_view_id: data.ad_view.id }),
          });

          onComplete?.(true, data.credits_earned ?? 0);
        } else {
          onComplete?.(false, 0);
        }
      }
    } catch (err) {
      console.error('[AdUnit] Complete error:', err);
      onComplete?.(false, 0);
    }
  };

  if (skipped) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Ad skipped</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4 text-center">
        <p className="text-green-700 dark:text-green-300 font-medium">
          ✓ Ad watched! Earned {creditsEarned} skip {creditsEarned === 1 ? 'credit' : 'credits'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-6 space-y-4">
      {/* AD Badge */}
      <div className="flex items-center justify-between">
        <span className="bg-yellow-400 text-black font-bold px-3 py-1 rounded text-sm">
          AD
        </span>
        {watchStartTime && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {watchedSeconds}s / {duration}s
          </span>
        )}
      </div>

      {/* Ad Content */}
      {adContent.imageUrl && (
        <img
          src={adContent.imageUrl}
          alt={adContent.title}
          className="w-full h-48 object-cover rounded"
        />
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {adContent.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {adContent.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!watchStartTime ? (
          <>
            <button
              onClick={handleStartWatching}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              Watch Ad ({creditsEarned} {creditsEarned === 1 ? 'credit' : 'credits'})
            </button>

            {canSkip && (
              <button
                onClick={handleSkip}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                Skip (1 credit)
              </button>
            )}
          </>
        ) : (
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Watching...
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {Math.round((watchedSeconds / duration) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${Math.min((watchedSeconds / duration) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Type Label */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {adType === 'rewarded' && 'Rewarded Ad - Earn 3 credits'}
        {adType === 'pre_roll' && 'Pre-Roll Ad - Earn 1 credit'}
        {adType === 'post_roll' && 'Post-Roll Ad - Earn 1 credit'}
      </div>
    </div>
  );
}
