// components/activity/ActivityPostForm.tsx
// Phase 9 — Activity Post Form
//
// Form for creating posts with activity tier classification and verification.
// Per ACTIVITY_FIRST_PROTOCOL.md §II (Activity Types and Tiers)

'use client';

import { useState } from 'react';
import { ActivityTier, VerificationMethod } from '@/lib/activity/types';
import { getTierDisplayName, getTierDescription, calculateActivityPoints } from '@/lib/activity/scoring';
import { TierBadge } from './TierBadge';

interface ActivityPostFormProps {
  onSubmit: (data: ActivityPostData) => Promise<void>;
  onCancel?: () => void;
}

export interface ActivityPostData {
  content: string;
  tier: ActivityTier;
  activity_type: string;
  verification_method?: VerificationMethod;
  evidence_url?: string;
  media_url?: string;
}

export function ActivityPostForm({ onSubmit, onCancel }: ActivityPostFormProps) {
  const [content, setContent] = useState('');
  const [tier, setTier] = useState<ActivityTier>(ActivityTier.REFLECTION);
  const [activityType, setActivityType] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(VerificationMethod.TEXT);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pointsEstimate = calculateActivityPoints(tier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || !activityType.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        tier,
        activity_type: activityType.trim(),
        verification_method: verificationMethod,
        evidence_url: evidenceUrl.trim() || undefined,
        media_url: mediaUrl.trim() || undefined,
      });

      // Reset form
      setContent('');
      setActivityType('');
      setEvidenceUrl('');
      setMediaUrl('');
    } catch (err) {
      console.error('[ActivityPostForm] Submit error:', err);
      alert('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What did you do? *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your activity..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          required
        />
      </div>

      {/* Activity Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Activity Type *
        </label>
        <input
          type="text"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          placeholder="e.g., skate_trick, game_build, music_composition"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          required
        />
      </div>

      {/* Tier Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Activity Tier * (Will earn {pointsEstimate} points)
        </label>
        <div className="space-y-2">
          {Object.values(ActivityTier)
            .filter((t) => typeof t === 'number')
            .map((t) => {
              const tierNum = t as ActivityTier;
              return (
                <label
                  key={tierNum}
                  className="flex items-start gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <input
                    type="radio"
                    name="tier"
                    value={tierNum}
                    checked={tier === tierNum}
                    onChange={() => setTier(tierNum)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <TierBadge tier={tierNum} size="sm" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {getTierDescription(tierNum)}
                    </p>
                  </div>
                </label>
              );
            })}
        </div>
      </div>

      {/* Verification Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Verification Method
        </label>
        <select
          value={verificationMethod}
          onChange={(e) => setVerificationMethod(e.target.value as VerificationMethod)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        >
          <option value={VerificationMethod.TEXT}>Text Only (0 bonus)</option>
          <option value={VerificationMethod.PHOTO}>Photo Evidence (+100 visibility)</option>
          <option value={VerificationMethod.AUDIO}>Audio Recording (+300 visibility)</option>
          <option value={VerificationMethod.VIDEO}>Video Evidence (+500 visibility)</option>
          <option value={VerificationMethod.ON_PLATFORM}>On-Platform Project (+500 visibility, auto-verified)</option>
        </select>
      </div>

      {/* Evidence URL */}
      {verificationMethod !== VerificationMethod.TEXT && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Evidence URL
          </label>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      {/* Media URL (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Media URL (optional)
        </label>
        <input
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition"
        >
          {submitting ? 'Posting...' : 'Post Activity'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          <strong>Tier {tier}</strong> will earn <strong>{pointsEstimate} points</strong> (decay in 30 days)
        </p>
        <p>
          Higher tiers and better verification = more algorithmic visibility
        </p>
        <p className="text-yellow-600 dark:text-yellow-400">
          ⚠️ Nothing is public by default. Choose visibility after posting.
        </p>
      </div>
    </form>
  );
}
