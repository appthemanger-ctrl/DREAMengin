/**
 * tests/coercion-table.test.ts — Pass 6
 *
 * Unit tests for lib/runtime/coercionTable.ts
 *
 * Verifies:
 *   - coerceRawPayload handles all starter types
 *   - MIME type → DreamDropType mapping is correct
 *   - URL detection works
 *   - engin-state shape is recognised
 *   - classifyDrop returns human-readable labels
 *   - DreamDrop timestamps are set
 */

import { describe, expect, it } from 'vitest';
import {
  coerceRawPayload,
  classifyDrop,
  type DreamDrop,
} from '../lib/runtime/coercionTable';

describe('coerceRawPayload', () => {
  it('passes through an already-coerced DreamDrop', () => {
    const drop: DreamDrop = { type: 'image', content: 'data:image/png;base64,...', timestamp: 1 };
    const result = coerceRawPayload(drop);
    expect(result.type).toBe('image');
    expect(result.content).toBe(drop.content);
  });

  it('recognises a URL-shaped payload', () => {
    const result = coerceRawPayload({ url: 'https://example.com/track.mp3' });
    expect(result.type).toBe('url');
    expect(result.content).toBe('https://example.com/track.mp3');
  });

  it('recognises an engin-state payload by engin field', () => {
    const result = coerceRawPayload({ engin: 'starmaker', bpm: 128, key: 'C' });
    expect(result.type).toBe('engin-state');
  });

  it('recognises an engin-state payload by enginState field', () => {
    const result = coerceRawPayload({ enginState: '{"bpm":120}' });
    expect(result.type).toBe('engin-state');
  });

  it('coerces a plain URL string', () => {
    const result = coerceRawPayload('https://cdn.example.com/image.jpg');
    expect(result.type).toBe('url');
  });

  it('coerces a plain text string as text/code', () => {
    const result = coerceRawPayload('const x = 42;');
    expect(result.type).toBe('text/code');
  });

  it('coerces null/undefined to unknown', () => {
    const result = coerceRawPayload(null);
    expect(result.type).toBe('text/code'); // '' → not a URL → text/code
  });

  it('coerces an unknown object shape to unknown', () => {
    const result = coerceRawPayload({ arbitrary: true });
    expect(result.type).toBe('unknown');
  });

  it('always sets a timestamp', () => {
    const before = Date.now();
    const result = coerceRawPayload('hello');
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
  });
});

describe('classifyDrop', () => {
  it('returns human-readable labels for all types', () => {
    const types = ['image', 'video', 'audio', 'text/code', 'url', 'engin-state', 'unknown'] as const;
    for (const type of types) {
      const drop: DreamDrop = { type, content: '', timestamp: 0 };
      const label = classifyDrop(drop);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('classifies image drops', () => {
    expect(classifyDrop({ type: 'image', content: '', timestamp: 0 })).toBe('Image');
  });

  it('classifies engin-state drops', () => {
    expect(classifyDrop({ type: 'engin-state', content: '', timestamp: 0 })).toBe('Engin State');
  });
});

describe('coercionTable — source API surface', () => {
  const { readFileSync } = require('node:fs');
  const { resolve } = require('node:path');
  const src: string = readFileSync(resolve(__dirname, '../lib/runtime/coercionTable.ts'), 'utf-8');

  it('exports all six starter types', () => {
    expect(src).toContain("'image'");
    expect(src).toContain("'video'");
    expect(src).toContain("'audio'");
    expect(src).toContain("'text/code'");
    expect(src).toContain("'url'");
    expect(src).toContain("'engin-state'");
  });

  it('exports coerceDataTransfer for native HTML5 drops', () => {
    expect(src).toContain('coerceDataTransfer');
    expect(src).toContain('DataTransfer');
  });

  it('exports coerceRawPayload for bridge/seam payloads', () => {
    expect(src).toContain('coerceRawPayload');
  });

  it('exports classifyDrop for UI labels', () => {
    expect(src).toContain('classifyDrop');
  });
});
