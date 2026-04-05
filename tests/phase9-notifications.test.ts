/**
 * tests/phase9-notifications.test.ts
 *
 * Tests for Phase 9 notification extensions — remix type, asset-aware
 * action URLs, and Engin routing.
 */

import { describe, expect, it } from 'vitest';
import {
  mapNotificationType,
  getNotificationTitle,
  getNotificationActionUrl,
  extractNotificationMessage,
  normalizeDbRow,
  type DbNotificationRow,
} from '@/lib/notifications/notificationHelpers';

// ─── Remix notification type ──────────────────────────────────────────────────

describe('Phase 9 Notifications — remix type', () => {
  it('maps "remix" DB type to remix UI type', () => {
    expect(mapNotificationType('remix')).toBe('remix');
    expect(mapNotificationType('Remix')).toBe('remix');
    expect(mapNotificationType(' remix ')).toBe('remix');
  });

  it('getNotificationTitle returns correct title for remix', () => {
    expect(getNotificationTitle('remix')).toBe('Your Dream was Remixed');
  });

  it('extractNotificationMessage returns remix message', () => {
    const msg = extractNotificationMessage('remix', {
      actor_display_name: 'Alice',
    });
    expect(msg).toBe('Alice remixed your Dream.');
  });

  it('extractNotificationMessage falls back for remix with no actor', () => {
    const msg = extractNotificationMessage('remix', {});
    expect(msg).toBe('Someone remixed your Dream.');
  });
});

// ─── Asset-aware action URLs ──────────────────────────────────────────────────

describe('Phase 9 Notifications — asset-aware action URLs', () => {
  it('routes remix notifications to the Engin with asset param', () => {
    const url = getNotificationActionUrl('remix', {
      engin_name: 'StarMakerEngin',
      asset_id: 'dream-123',
    });
    expect(url).toBe('/daydream/StarMakerEngin?asset=dream-123');
  });

  it('uses remix_id as fallback asset identifier', () => {
    const url = getNotificationActionUrl('remix', {
      engin: 'GameEngin',
      remix_id: 'remix-456',
    });
    expect(url).toBe('/daydream/GameEngin?asset=remix-456');
  });

  it('falls back to post URL when no engin info', () => {
    const url = getNotificationActionUrl('remix', {
      post_id: 'post-789',
    });
    expect(url).toBe('/post/post-789');
  });

  it('returns undefined when remix has no useful content', () => {
    const url = getNotificationActionUrl('remix', {});
    expect(url).toBeUndefined();
  });

  it('returns undefined when remix content is null', () => {
    const url = getNotificationActionUrl('remix', null);
    expect(url).toBeUndefined();
  });
});

// ─── normalizeDbRow with remix ────────────────────────────────────────────────

describe('Phase 9 Notifications — normalizeDbRow remix', () => {
  it('normalises a remix notification row', () => {
    const row: DbNotificationRow = {
      id: 'notif-1',
      type: 'remix',
      content: {
        actor_display_name: 'Bob',
        engin_name: 'CodeEngin',
        asset_id: 'asset-abc',
      },
      read: false,
      created_at: '2026-01-15T12:00:00Z',
    };

    const ui = normalizeDbRow(row);
    expect(ui.type).toBe('remix');
    expect(ui.title).toBe('Your Dream was Remixed');
    expect(ui.message).toBe('Bob remixed your Dream.');
    expect(ui.actionUrl).toBe('/daydream/CodeEngin?asset=asset-abc');
    expect(ui.read).toBe(false);
  });
});
