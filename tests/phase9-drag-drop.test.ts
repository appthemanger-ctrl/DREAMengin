/**
 * tests/phase9-drag-drop.test.ts
 *
 * Tests for components/dreamengin/CanvasDropZone.tsx — drag-and-drop
 * asset import with file classification.
 */

import { describe, expect, it } from 'vitest';
import {
  classifyFile,
  isAcceptedFile,
  ASSET_IMPORT_EVENT,
  type AssetCategory,
} from '@/components/dreamengin/CanvasDropZone';

// ─── classifyFile ─────────────────────────────────────────────────────────────

describe('CanvasDropZone — classifyFile', () => {
  it('classifies image files', () => {
    const images = ['photo.png', 'image.jpg', 'img.jpeg', 'pic.webp', 'anim.gif', 'icon.svg'];
    for (const name of images) {
      expect(classifyFile(name)).toBe('image' as AssetCategory);
    }
  });

  it('classifies audio files', () => {
    const audio = ['track.mp3', 'sample.wav', 'clip.ogg', 'song.m4a', 'hi-fi.flac', 'voice.aac'];
    for (const name of audio) {
      expect(classifyFile(name)).toBe('audio' as AssetCategory);
    }
  });

  it('classifies 3D model files', () => {
    const models = ['model.glb', 'scene.gltf', 'mesh.obj', 'character.fbx', 'print.stl'];
    for (const name of models) {
      expect(classifyFile(name)).toBe('3d' as AssetCategory);
    }
  });

  it('returns unknown for unrecognised extensions', () => {
    expect(classifyFile('readme.txt')).toBe('unknown');
    expect(classifyFile('doc.pdf')).toBe('unknown');
    expect(classifyFile('noext')).toBe('unknown');
  });

  it('is case-insensitive for extensions', () => {
    expect(classifyFile('photo.PNG')).toBe('image');
    expect(classifyFile('track.MP3')).toBe('audio');
    expect(classifyFile('model.GLB')).toBe('3d');
  });
});

// ─── isAcceptedFile ───────────────────────────────────────────────────────────

describe('CanvasDropZone — isAcceptedFile', () => {
  it('accepts supported image formats', () => {
    expect(isAcceptedFile('photo.png')).toBe(true);
    expect(isAcceptedFile('photo.jpg')).toBe(true);
  });

  it('accepts supported audio formats', () => {
    expect(isAcceptedFile('track.mp3')).toBe(true);
    expect(isAcceptedFile('sample.wav')).toBe(true);
  });

  it('accepts supported 3D formats', () => {
    expect(isAcceptedFile('model.glb')).toBe(true);
    expect(isAcceptedFile('scene.gltf')).toBe(true);
  });

  it('rejects unsupported formats', () => {
    expect(isAcceptedFile('readme.txt')).toBe(false);
    expect(isAcceptedFile('doc.pdf')).toBe(false);
    expect(isAcceptedFile('archive.zip')).toBe(false);
  });
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe('CanvasDropZone — constants', () => {
  it('exports the asset import event name', () => {
    expect(ASSET_IMPORT_EVENT).toBe('dreamengin:asset-import');
  });
});
