'use client';

/**
 * AvatarMaker — upload a photo and generate your in-game avatar.
 *
 * Workflow:
 *   1. User taps "Upload Photo" → selects an image file.
 *   2. A preview is shown.  User taps "Create Avatar".
 *   3. The image is resized (256 × 256) and saved to localStorage.
 *   4. Success state: "Avatar created! Now go to any game and tap Play as Yourself."
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { User, Upload, CheckCircle, RefreshCw, X } from 'lucide-react';
import {
  clearAvatar,
  getAvatarDataUrl,
  resizeImageToDataUrl,
  setAvatarDataUrl,
} from '@/lib/games/avatar';

export default function AvatarMaker() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const [creating, setCreating]     = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Load existing avatar on mount
  useEffect(() => {
    const existing = getAvatarDataUrl();
    if (existing) setAvatarUrl(existing);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP, etc.).');
      return;
    }
    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!fileInputRef.current?.files?.[0]) return;
    setCreating(true);
    setError(null);
    try {
      const file = fileInputRef.current.files[0];
      const dataUrl = await resizeImageToDataUrl(file, 256);
      setAvatarDataUrl(dataUrl);
      setAvatarUrl(dataUrl);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setError('Could not process that image. Try another file.');
    } finally {
      setCreating(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    clearAvatar();
    setAvatarUrl(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const hasAvatar    = !!avatarUrl;
  const hasPreview   = !!previewUrl && !hasAvatar;
  const showUploadCta = !hasAvatar && !hasPreview;

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 16,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(15,23,42,0.06))',
        border: '1px solid rgba(124,58,237,0.22)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <User style={{ width: 16, height: 16, color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)' }}>
            Your Game Avatar
          </div>
          <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
            Upload a photo · play as yourself
          </div>
        </div>

        {hasAvatar && (
          <button
            type="button"
            onClick={handleClear}
            title="Remove avatar"
            style={{
              marginLeft: 'auto',
              width: 26, height: 26, borderRadius: '50%',
              border: '1px solid rgba(239,68,68,0.24)',
              background: 'rgba(254,242,242,0.72)',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Remove avatar"
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>

      {/* ── Created state ── */}
      {hasAvatar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              border: '3px solid #7c3aed',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 0 0 4px rgba(124,58,237,0.18)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl!} alt="Your avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 800, color: '#15803d',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.24)',
                borderRadius: 999, padding: '3px 10px',
                marginBottom: 6,
              }}
            >
              <CheckCircle style={{ width: 10, height: 10 }} />
              Avatar Created!
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.55 }}>
              Your avatar is ready. Click any game below and tap{' '}
              <span style={{ fontWeight: 700, color: '#7c3aed' }}>Play as Yourself</span>{' '}
              to see yourself inside the game.
            </div>
            <button
              type="button"
              onClick={() => { setAvatarUrl(null); setPreviewUrl(null); }}
              style={{
                marginTop: 8,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 10, fontWeight: 700,
                color: 'var(--de-text-dim)',
                background: 'rgba(255,255,255,0.56)',
                border: '1px solid rgba(160,195,240,0.2)',
                borderRadius: 999, padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              <RefreshCw style={{ width: 10, height: 10 }} />
              Change photo
            </button>
          </div>
        </div>
      )}

      {/* ── Preview state (image selected, not yet created) ── */}
      {hasPreview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              border: '2px dashed rgba(124,58,237,0.5)',
              overflow: 'hidden', flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl!} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
              Looking good! Tap <strong>Create Avatar</strong> to confirm.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                style={{
                  flex: 1,
                  fontSize: 11, fontWeight: 800,
                  color: '#fff',
                  background: creating
                    ? 'rgba(124,58,237,0.5)'
                    : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  border: 'none',
                  borderRadius: 10, padding: '8px 0',
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? 'Creating…' : 'Create Avatar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                style={{
                  fontSize: 11, fontWeight: 700,
                  color: 'var(--de-text-dim)',
                  background: 'rgba(255,255,255,0.56)',
                  border: '1px solid rgba(160,195,240,0.2)',
                  borderRadius: 10, padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload CTA (no avatar, no preview) ── */}
      {showUploadCta && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              border: '2px dashed rgba(124,58,237,0.3)',
              background: 'rgba(124,58,237,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <User style={{ width: 28, height: 28, color: 'rgba(124,58,237,0.4)' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5, maxWidth: 260 }}>
            Upload a photo of yourself and we&apos;ll create a game avatar so you can{' '}
            <span style={{ fontWeight: 700 }}>play as yourself</span> in any game.
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontSize: 12, fontWeight: 800,
              color: '#7c3aed',
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.28)',
              borderRadius: 12, padding: '9px 18px',
              cursor: 'pointer',
            }}
          >
            <Upload style={{ width: 13, height: 13 }} />
            Upload Photo
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Upload photo for avatar"
      />

      {error && (
        <div
          style={{
            fontSize: 11, color: '#dc2626',
            background: 'rgba(254,242,242,0.85)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '8px 12px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
