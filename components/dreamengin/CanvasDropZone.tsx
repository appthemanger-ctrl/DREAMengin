'use client';

/**
 * components/dreamengin/CanvasDropZone.tsx
 *
 * Phase 9 §5: Drag-and-drop asset import — drag any image, audio, or 3D
 * file from your desktop or phone storage directly onto the DREAMenginOS
 * canvas. The component wraps children with a drop zone overlay.
 *
 * Supported file types:
 *   - Images: png, jpg, jpeg, webp, gif, svg
 *   - Audio:  mp3, wav, ogg, m4a, flac, aac
 *   - 3D:    glb, gltf, obj, fbx, stl
 *
 * Architecture justification:
 *   - docs/LAW.md §3: every visible action must do something real.
 *     Dropped files are cached to IndexedDB via the offline cache and
 *     dispatched as a CustomEvent for the active Engin to handle.
 *   - docs/ARCHITECTURE.md §8: Gold/blue design system.
 *     The drop overlay uses the canonical gold accent.
 */

import { useCallback, useState, type ReactNode } from 'react';
import { v4 as uuid } from 'uuid';
import { cacheAsset, enqueueSyncAction } from '@/lib/offline/offlineCache';

// ─── File classification ──────────────────────────────────────────────────────

export type AssetCategory = 'image' | 'audio' | '3d' | 'unknown';

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac']);
const MODEL_EXTS = new Set(['glb', 'gltf', 'obj', 'fbx', 'stl']);

export function classifyFile(filename: string): AssetCategory {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (AUDIO_EXTS.has(ext)) return 'audio';
  if (MODEL_EXTS.has(ext)) return '3d';
  return 'unknown';
}

function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    m4a: 'audio/mp4', flac: 'audio/flac', aac: 'audio/aac',
    glb: 'model/gltf-binary', gltf: 'model/gltf+json',
    obj: 'model/obj', fbx: 'application/octet-stream',
    stl: 'model/stl',
  };
  return map[ext] ?? 'application/octet-stream';
}

// ─── Accepted file extensions ─────────────────────────────────────────────────

const ALL_ACCEPTED = [
  ...Array.from(IMAGE_EXTS),
  ...Array.from(AUDIO_EXTS),
  ...Array.from(MODEL_EXTS),
];

export function isAcceptedFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return ALL_ACCEPTED.includes(ext);
}

// ─── Import event ─────────────────────────────────────────────────────────────

export interface AssetImportPayload {
  id: string;
  filename: string;
  category: AssetCategory;
  mimeType: string;
  size: number;
}

/**
 * Custom event dispatched when an asset is imported via drag-and-drop.
 * Engins listen for this to add the asset to the active scene.
 */
export const ASSET_IMPORT_EVENT = 'dreamengin:asset-import';

// ─── Component ────────────────────────────────────────────────────────────────

interface CanvasDropZoneProps {
  children: ReactNode;
  /** Called after each file is cached and the event is dispatched */
  onImport?: (payload: AssetImportPayload) => void;
  /** Custom className for the wrapper */
  className?: string;
  /** Disable the drop zone */
  disabled?: boolean;
}

export default function CanvasDropZone({
  children,
  onImport,
  className,
  disabled = false,
}: CanvasDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setDragActive(true);
    },
    [disabled],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only deactivate when leaving the container itself
      if (e.currentTarget === e.target) {
        setDragActive(false);
      }
    },
    [],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        isAcceptedFile(f.name),
      );

      for (const file of files) {
        const id = uuid();
        const category = classifyFile(file.name);
        const mimeType = getMimeType(file);
        const data = await file.arrayBuffer();
        const now = new Date().toISOString();

        // Cache to IndexedDB
        await cacheAsset({
          id,
          mimeType,
          data,
          cachedAt: now,
          modifiedAt: now,
          synced: false,
          meta: {
            filename: file.name,
            category,
            size: file.size,
          },
        });

        // Queue for server sync
        await enqueueSyncAction({
          entityType: 'asset',
          entityId: id,
          action: 'create',
          queuedAt: now,
        });

        const payload: AssetImportPayload = {
          id,
          filename: file.name,
          category,
          mimeType,
          size: file.size,
        };

        // Dispatch custom event for Engins to handle
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(ASSET_IMPORT_EVENT, { detail: payload }),
          );
        }

        onImport?.(payload);
      }
    },
    [disabled, onImport],
  );

  return (
    <div
      className={className}
      style={{ position: 'relative' }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => void handleDrop(e)}
    >
      {children}

      {/* Drop overlay */}
      {dragActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(200, 152, 26, 0.12)',
            backdropFilter: 'blur(8px)',
            border: '2px dashed rgba(200, 152, 26, 0.6)',
            borderRadius: 16,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(200, 152, 26, 0.2)',
                border: '1px solid rgba(200, 152, 26, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              📥
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--de-heading)',
                letterSpacing: '-0.01em',
              }}
            >
              Drop to Import
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--de-text-dim)',
                opacity: 0.8,
              }}
            >
              Images · Audio · 3D Models
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
