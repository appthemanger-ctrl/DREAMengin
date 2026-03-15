/**
 * lib/notifications/notificationHelpers.ts
 *
 * Pure, side-effect-free helpers for the notification system.
 *
 * Architecture justification:
 *   - docs/AXIOMS.md: every visible action must do something real. The
 *     notification bell in WorkspaceDashboard currently shows a fake static
 *     dot. These helpers are the pure logic layer that drives the real wiring.
 *   - docs/ARCHITECTURE.md §8: Gold = save/confirm/action; Light Blue = live
 *     state/connected state/signal state. A live notification count is exactly
 *     the "signal state" the design system intends.
 *   - docs/LAW.md §3: every visible action must do something real. A bell
 *     with a fake badge dot is not honesty-compliant.
 *
 * All functions in this file are pure (no side effects, no imports from
 * React, Next.js, or Supabase) so they can be unit-tested in isolation.
 */

// ---------------------------------------------------------------------------
// DB row shape (mirrors what /api/notifications returns)
// ---------------------------------------------------------------------------

export type DbNotificationContent = Record<string, unknown>;

export interface DbNotificationRow {
  id: string;
  user_id?: string;
  type: string;
  /** Free-form JSON content — shape varies by notification type */
  content: DbNotificationContent | null;
  read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// UI notification shape (what the NotificationCenter consumes)
// ---------------------------------------------------------------------------

/**
 * Canonical UI notification types that map to the design system icons.
 * 'other' is the safe fallback for any DB type not explicitly mapped.
 */
export type UiNotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'trending'
  | 'revenue'
  | 'mention'
  | 'message'
  | 'other';

export interface UiNotification {
  id: string;
  type: UiNotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// ---------------------------------------------------------------------------
// Type mapping
// ---------------------------------------------------------------------------

/** Map a raw DB type string to a canonical UI type. */
export function mapNotificationType(dbType: string): UiNotificationType {
  const t = dbType.toLowerCase().trim();
  if (t === 'like')      return 'like';
  if (t === 'comment')   return 'comment';
  if (t === 'follow')    return 'follow';
  if (t === 'trending')  return 'trending';
  if (t === 'revenue')   return 'revenue';
  if (t === 'mention')   return 'mention';
  if (t === 'message')   return 'message';
  return 'other';
}

// ---------------------------------------------------------------------------
// Title derivation
// ---------------------------------------------------------------------------

/** Return a short, human-readable title for each notification type. */
export function getNotificationTitle(type: UiNotificationType): string {
  switch (type) {
    case 'like':     return 'New Like';
    case 'comment':  return 'New Comment';
    case 'follow':   return 'New Follower';
    case 'trending': return 'Trending';
    case 'revenue':  return 'Revenue Update';
    case 'mention':  return 'You were mentioned';
    case 'message':  return 'New Message';
    case 'other':    return 'Notification';
  }
}

// ---------------------------------------------------------------------------
// Action URL derivation
// ---------------------------------------------------------------------------

/**
 * Derive a navigation URL for a notification based on its type and content.
 * Returns `undefined` when no meaningful URL can be formed — callers must
 * guard against this before navigating.
 */
export function getNotificationActionUrl(
  type: UiNotificationType,
  content: DbNotificationContent | null,
): string | undefined {
  // Revenue always routes to /ads regardless of content
  if (type === 'revenue') return '/ads';

  if (!content) return undefined;

  switch (type) {
    case 'message': {
      const convId = content.conversation_id;
      if (typeof convId === 'string' && convId.trim()) {
        return `/messages?conversation_id=${encodeURIComponent(convId.trim())}`;
      }
      return '/messages';
    }
    case 'follow': {
      const handle = content.actor_handle ?? content.from_handle ?? content.handle;
      if (typeof handle === 'string' && handle.trim()) {
        return `/profile/${encodeURIComponent(handle.trim())}`;
      }
      return undefined;
    }
    case 'like':
    case 'comment':
    case 'mention': {
      const postId = content.post_id ?? content.content_id;
      if (typeof postId === 'string' && postId.trim()) {
        return `/post/${encodeURIComponent(postId.trim())}`;
      }
      return undefined;
    }
    case 'trending': {
      const postId = content.post_id;
      if (typeof postId === 'string' && postId.trim()) {
        return `/post/${encodeURIComponent(postId.trim())}`;
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Message text extraction
// ---------------------------------------------------------------------------

/**
 * Extract a human-readable message string from a DB notification row.
 * Falls back gracefully when content is missing or malformed.
 */
export function extractNotificationMessage(
  type: UiNotificationType,
  content: DbNotificationContent | null,
): string {
  if (content) {
    // Prefer an explicit "message" field in the content blob
    if (typeof content.message === 'string' && content.message.trim()) {
      return content.message.trim();
    }
    // Derive a sensible fallback per type
    const actor = content.actor_display_name ?? content.from_display_name ?? content.actor_handle ?? content.from_handle;
    const actorStr = typeof actor === 'string' && actor.trim() ? actor.trim() : 'Someone';

    switch (type) {
      case 'like':    return `${actorStr} liked your post.`;
      case 'comment': return `${actorStr} commented on your post.`;
      case 'follow':  return `${actorStr} started following you.`;
      case 'mention': return `${actorStr} mentioned you.`;
      case 'message': return `${actorStr} sent you a message.`;
      case 'trending':return 'Your post is trending!';
      case 'revenue': return 'You have a new revenue update.';
      default:        return 'You have a new notification.';
    }
  }

  // No content at all — absolute fallback
  return 'You have a new notification.';
}

// ---------------------------------------------------------------------------
// Row → UI normalisation
// ---------------------------------------------------------------------------

/**
 * Convert a raw Supabase `notifications` row into a typed `UiNotification`
 * ready for consumption by the NotificationCenter component.
 */
export function normalizeDbRow(row: DbNotificationRow): UiNotification {
  const uiType   = mapNotificationType(row.type);
  const content  = row.content ?? null;
  const title    = getNotificationTitle(uiType);
  const message  = extractNotificationMessage(uiType, content);
  const actionUrl = getNotificationActionUrl(uiType, content);

  return {
    id:        row.id,
    type:      uiType,
    title,
    message,
    timestamp: new Date(row.created_at),
    read:      row.read ?? false,
    actionUrl,
  };
}

// ---------------------------------------------------------------------------
// Aggregate helpers
// ---------------------------------------------------------------------------

/** Count unread notifications in a list. */
export function getUnreadCount(notifications: UiNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

/** Sort notifications newest-first. Mutates a copy, does not mutate input. */
export function sortByRecent(notifications: UiNotification[]): UiNotification[] {
  return [...notifications].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
}

/**
 * Apply an optimistic read update — mark one notification as read locally.
 * Used by the hook before the API call resolves so the UI feels instant.
 */
export function applyOptimisticRead(
  notifications: UiNotification[],
  id: string,
): UiNotification[] {
  return notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
}

/**
 * Apply an optimistic "mark all read" update.
 */
export function applyOptimisticMarkAll(
  notifications: UiNotification[],
): UiNotification[] {
  return notifications.map((n) => ({ ...n, read: true }));
}

/**
 * Remove one notification by id (optimistic delete).
 */
export function applyOptimisticDelete(
  notifications: UiNotification[],
  id: string,
): UiNotification[] {
  return notifications.filter((n) => n.id !== id);
}
