/**
 * tests/notifications.test.ts
 *
 * Unit tests for lib/notifications/notificationHelpers.ts — the pure logic
 * layer for the notification system.
 *
 * Architecture justification:
 *   - docs/AXIOMS.md: every visible action must do something real. The
 *     notification bell in WorkspaceDashboard showed a fake static dot.
 *     These helpers drive the real wiring.
 *   - docs/ARCHITECTURE.md §8: Gold = save/confirm/action; Light Blue =
 *     live state/signal state. A live notification count is exactly the
 *     "signal state" the design system intends.
 *   - docs/LAW.md §3: every visible action must do something real.
 *
 * All functions under test are pure — no DOM, no network, no React needed.
 */

import { describe, expect, it } from 'vitest';
import {
  applyOptimisticDelete,
  applyOptimisticMarkAll,
  applyOptimisticRead,
  extractNotificationMessage,
  getNotificationActionUrl,
  getNotificationTitle,
  getUnreadCount,
  mapNotificationType,
  normalizeDbRow,
  sortByRecent,
  type DbNotificationRow,
  type UiNotification,
} from '@/lib/notifications/notificationHelpers';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<DbNotificationRow> = {}): DbNotificationRow {
  return {
    id: 'row-1',
    type: 'like',
    content: { message: 'Someone liked your post.' },
    read: false,
    created_at: new Date('2025-01-15T12:00:00Z').toISOString(),
    ...overrides,
  };
}

function makeUiNotif(overrides: Partial<UiNotification> = {}): UiNotification {
  return {
    id: 'n-1',
    type: 'like',
    title: 'New Like',
    message: 'Someone liked your post.',
    timestamp: new Date('2025-01-15T12:00:00Z'),
    read: false,
    ...overrides,
  };
}

// ── mapNotificationType ────────────────────────────────────────────────────────

describe('mapNotificationType', () => {
  it('maps known types exactly', () => {
    expect(mapNotificationType('like')).toBe('like');
    expect(mapNotificationType('comment')).toBe('comment');
    expect(mapNotificationType('follow')).toBe('follow');
    expect(mapNotificationType('trending')).toBe('trending');
    expect(mapNotificationType('revenue')).toBe('revenue');
    expect(mapNotificationType('mention')).toBe('mention');
    expect(mapNotificationType('message')).toBe('message');
  });

  it('is case-insensitive', () => {
    expect(mapNotificationType('LIKE')).toBe('like');
    expect(mapNotificationType('Follow')).toBe('follow');
    expect(mapNotificationType('MESSAGE')).toBe('message');
  });

  it('trims whitespace', () => {
    expect(mapNotificationType(' like ')).toBe('like');
    expect(mapNotificationType('\tcomment\t')).toBe('comment');
  });

  it('falls back to "other" for unknown types', () => {
    expect(mapNotificationType('unknown')).toBe('other');
    expect(mapNotificationType('')).toBe('other');
    expect(mapNotificationType('purchase')).toBe('other');
  });
});

// ── getNotificationTitle ───────────────────────────────────────────────────────

describe('getNotificationTitle', () => {
  it('returns a non-empty string for every known type', () => {
    const types = ['like', 'comment', 'follow', 'trending', 'revenue', 'mention', 'message', 'other'] as const;
    for (const t of types) {
      const title = getNotificationTitle(t);
      expect(typeof title).toBe('string');
      expect(title.length).toBeGreaterThan(0);
    }
  });

  it('returns distinct titles for each type', () => {
    const types = ['like', 'comment', 'follow', 'trending', 'revenue', 'mention', 'message', 'other'] as const;
    const titles = types.map(getNotificationTitle);
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });
});

// ── getNotificationActionUrl ───────────────────────────────────────────────────

describe('getNotificationActionUrl', () => {
  it('returns /messages?conversation_id=... for message type with conversation_id', () => {
    const url = getNotificationActionUrl('message', { conversation_id: 'conv-abc' });
    expect(url).toBe('/messages?conversation_id=conv-abc');
  });

  it('returns /messages for message type without conversation_id', () => {
    const url = getNotificationActionUrl('message', { message: 'text only' });
    expect(url).toBe('/messages');
  });

  it('returns profile URL for follow with actor_handle', () => {
    const url = getNotificationActionUrl('follow', { actor_handle: 'jsmith' });
    expect(url).toBe('/profile/jsmith');
  });

  it('returns profile URL for follow with handle field (legacy)', () => {
    const url = getNotificationActionUrl('follow', { handle: 'jdoe' });
    expect(url).toBe('/profile/jdoe');
  });

  it('returns post URL for like with post_id', () => {
    const url = getNotificationActionUrl('like', { post_id: 'post-123' });
    expect(url).toBe('/post/post-123');
  });

  it('returns post URL for comment with content_id fallback', () => {
    const url = getNotificationActionUrl('comment', { content_id: 'post-456' });
    expect(url).toBe('/post/post-456');
  });

  it('returns /ads for revenue type', () => {
    expect(getNotificationActionUrl('revenue', {})).toBe('/ads');
    expect(getNotificationActionUrl('revenue', null)).toBe('/ads');
  });

  it('returns undefined when content is null and no default URL exists', () => {
    expect(getNotificationActionUrl('follow', null)).toBeUndefined();
    expect(getNotificationActionUrl('like', null)).toBeUndefined();
  });

  it('returns undefined for unknown type with no content', () => {
    expect(getNotificationActionUrl('other', {})).toBeUndefined();
  });

  it('URL-encodes the conversation_id', () => {
    const url = getNotificationActionUrl('message', { conversation_id: 'conv with spaces' });
    expect(url).toContain(encodeURIComponent('conv with spaces'));
  });
});

// ── extractNotificationMessage ─────────────────────────────────────────────────

describe('extractNotificationMessage', () => {
  it('prefers an explicit "message" field in content', () => {
    const msg = extractNotificationMessage('like', { message: 'Sarah liked your post.' });
    expect(msg).toBe('Sarah liked your post.');
  });

  it('trims the message field', () => {
    const msg = extractNotificationMessage('like', { message: '  hello  ' });
    expect(msg).toBe('hello');
  });

  it('derives a sensible fallback for follow with actor_display_name', () => {
    const msg = extractNotificationMessage('follow', { actor_display_name: 'Alice' });
    expect(msg).toContain('Alice');
    expect(msg.toLowerCase()).toContain('follow');
  });

  it('uses "Someone" when no actor name is available', () => {
    const msg = extractNotificationMessage('follow', {});
    expect(msg.toLowerCase()).toContain('someone');
  });

  it('returns a non-empty string for null content', () => {
    const msg = extractNotificationMessage('like', null);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns appropriate text for each type', () => {
    const types = ['like', 'comment', 'follow', 'mention', 'message', 'trending', 'revenue'] as const;
    for (const t of types) {
      const msg = extractNotificationMessage(t, null);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});

// ── normalizeDbRow ─────────────────────────────────────────────────────────────

describe('normalizeDbRow', () => {
  it('produces a UiNotification with correct shape', () => {
    const n = normalizeDbRow(makeRow());
    expect(typeof n.id).toBe('string');
    expect(typeof n.type).toBe('string');
    expect(typeof n.title).toBe('string');
    expect(typeof n.message).toBe('string');
    expect(n.timestamp).toBeInstanceOf(Date);
    expect(typeof n.read).toBe('boolean');
  });

  it('preserves the row id', () => {
    const n = normalizeDbRow(makeRow({ id: 'xyz-789' }));
    expect(n.id).toBe('xyz-789');
  });

  it('maps the type field', () => {
    expect(normalizeDbRow(makeRow({ type: 'follow' })).type).toBe('follow');
    expect(normalizeDbRow(makeRow({ type: 'message' })).type).toBe('message');
    expect(normalizeDbRow(makeRow({ type: 'unknown_type' })).type).toBe('other');
  });

  it('sets read from the row', () => {
    expect(normalizeDbRow(makeRow({ read: true })).read).toBe(true);
    expect(normalizeDbRow(makeRow({ read: false })).read).toBe(false);
  });

  it('parses the created_at into a Date', () => {
    const ts = '2025-06-01T09:30:00Z';
    const n = normalizeDbRow(makeRow({ created_at: ts }));
    expect(n.timestamp).toEqual(new Date(ts));
  });

  it('derives message from content.message when present', () => {
    const n = normalizeDbRow(makeRow({ content: { message: 'Alex liked your photo.' } }));
    expect(n.message).toBe('Alex liked your photo.');
  });

  it('handles null content gracefully', () => {
    const n = normalizeDbRow(makeRow({ content: null }));
    expect(typeof n.message).toBe('string');
    expect(n.message.length).toBeGreaterThan(0);
    expect(n.actionUrl).toBeUndefined();
  });

  it('sets actionUrl for message type with conversation_id in content', () => {
    const n = normalizeDbRow(makeRow({
      type: 'message',
      content: { conversation_id: 'c-1', message: 'Hi!' },
    }));
    expect(n.actionUrl).toContain('/messages');
    expect(n.actionUrl).toContain('c-1');
  });
});

// ── getUnreadCount ─────────────────────────────────────────────────────────────

describe('getUnreadCount', () => {
  it('returns 0 for an empty list', () => {
    expect(getUnreadCount([])).toBe(0);
  });

  it('counts only unread notifications', () => {
    const list = [
      makeUiNotif({ id: '1', read: false }),
      makeUiNotif({ id: '2', read: true }),
      makeUiNotif({ id: '3', read: false }),
    ];
    expect(getUnreadCount(list)).toBe(2);
  });

  it('returns 0 when all are read', () => {
    const list = [
      makeUiNotif({ id: '1', read: true }),
      makeUiNotif({ id: '2', read: true }),
    ];
    expect(getUnreadCount(list)).toBe(0);
  });
});

// ── sortByRecent ───────────────────────────────────────────────────────────────

describe('sortByRecent', () => {
  it('sorts newest-first', () => {
    const older  = makeUiNotif({ id: '1', timestamp: new Date('2025-01-01') });
    const newer  = makeUiNotif({ id: '2', timestamp: new Date('2025-06-01') });
    const newest = makeUiNotif({ id: '3', timestamp: new Date('2025-12-01') });

    const sorted = sortByRecent([older, newest, newer]);
    expect(sorted[0].id).toBe('3');
    expect(sorted[1].id).toBe('2');
    expect(sorted[2].id).toBe('1');
  });

  it('does not mutate the original array', () => {
    const a = makeUiNotif({ id: '1', timestamp: new Date('2025-01-01') });
    const b = makeUiNotif({ id: '2', timestamp: new Date('2025-06-01') });
    const original = [a, b];
    sortByRecent(original);
    expect(original[0].id).toBe('1'); // unchanged
  });

  it('handles empty array', () => {
    expect(sortByRecent([])).toEqual([]);
  });

  it('handles single-item array', () => {
    const single = makeUiNotif({ id: 'solo' });
    expect(sortByRecent([single])).toHaveLength(1);
    expect(sortByRecent([single])[0].id).toBe('solo');
  });
});

// ── applyOptimisticRead ────────────────────────────────────────────────────────

describe('applyOptimisticRead', () => {
  it('marks the target notification as read', () => {
    const list = [
      makeUiNotif({ id: 'a', read: false }),
      makeUiNotif({ id: 'b', read: false }),
    ];
    const result = applyOptimisticRead(list, 'a');
    expect(result.find((n) => n.id === 'a')?.read).toBe(true);
    expect(result.find((n) => n.id === 'b')?.read).toBe(false);
  });

  it('does not mutate the original array', () => {
    const list = [makeUiNotif({ id: 'x', read: false })];
    applyOptimisticRead(list, 'x');
    expect(list[0].read).toBe(false);
  });

  it('is a no-op for unknown id', () => {
    const list = [makeUiNotif({ id: 'a', read: false })];
    const result = applyOptimisticRead(list, 'z');
    expect(result[0].read).toBe(false);
  });

  it('is safe when already read', () => {
    const list = [makeUiNotif({ id: 'a', read: true })];
    const result = applyOptimisticRead(list, 'a');
    expect(result[0].read).toBe(true);
  });
});

// ── applyOptimisticMarkAll ─────────────────────────────────────────────────────

describe('applyOptimisticMarkAll', () => {
  it('marks all notifications as read', () => {
    const list = [
      makeUiNotif({ id: '1', read: false }),
      makeUiNotif({ id: '2', read: false }),
      makeUiNotif({ id: '3', read: true }),
    ];
    const result = applyOptimisticMarkAll(list);
    expect(result.every((n) => n.read)).toBe(true);
  });

  it('does not mutate the original', () => {
    const list = [makeUiNotif({ id: '1', read: false })];
    applyOptimisticMarkAll(list);
    expect(list[0].read).toBe(false);
  });

  it('handles empty list', () => {
    expect(applyOptimisticMarkAll([])).toEqual([]);
  });
});

// ── applyOptimisticDelete ──────────────────────────────────────────────────────

describe('applyOptimisticDelete', () => {
  it('removes the notification with the matching id', () => {
    const list = [
      makeUiNotif({ id: 'a' }),
      makeUiNotif({ id: 'b' }),
      makeUiNotif({ id: 'c' }),
    ];
    const result = applyOptimisticDelete(list, 'b');
    expect(result.map((n) => n.id)).toEqual(['a', 'c']);
  });

  it('does not mutate the original', () => {
    const list = [makeUiNotif({ id: 'a' }), makeUiNotif({ id: 'b' })];
    applyOptimisticDelete(list, 'a');
    expect(list).toHaveLength(2);
  });

  it('is a no-op for unknown id', () => {
    const list = [makeUiNotif({ id: 'a' })];
    const result = applyOptimisticDelete(list, 'z');
    expect(result).toHaveLength(1);
  });

  it('handles empty list', () => {
    expect(applyOptimisticDelete([], 'anything')).toEqual([]);
  });
});

// ── Integration: normalizeDbRow + getUnreadCount ───────────────────────────────

describe('integration: normalise + aggregate', () => {
  it('normalising a batch of rows then counting unread gives correct result', () => {
    const rows: DbNotificationRow[] = [
      makeRow({ id: '1', read: false, type: 'like' }),
      makeRow({ id: '2', read: true,  type: 'follow' }),
      makeRow({ id: '3', read: false, type: 'message', content: { conversation_id: 'c1', message: 'Hey!' } }),
    ];
    const normalised = rows.map(normalizeDbRow);
    expect(getUnreadCount(normalised)).toBe(2);
  });

  it('sortByRecent keeps the newest-first order after normalisation', () => {
    const rows: DbNotificationRow[] = [
      makeRow({ id: 'a', created_at: '2025-01-01T00:00:00Z' }),
      makeRow({ id: 'b', created_at: '2025-12-01T00:00:00Z' }),
      makeRow({ id: 'c', created_at: '2025-06-01T00:00:00Z' }),
    ];
    const normalised = rows.map(normalizeDbRow);
    const sorted = sortByRecent(normalised);
    expect(sorted.map((n) => n.id)).toEqual(['b', 'c', 'a']);
  });
});
