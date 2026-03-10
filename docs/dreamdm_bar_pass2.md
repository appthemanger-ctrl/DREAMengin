# DreamDM Bar — Pass 2

**Document type:** Implementation spec  
**Scope:** DreamDM (`/messages`) enhancement pass  
**Status:** Active — implements Phase 6 item 4 (Dr. Eams → DreamDM routing)  
**Authority:** Anchored to `README.md` §16, `docs/CONSTITUTION.md`, `docs/PRODUCT_DEFINITION.md`, `docs/GENERATION_LAW.md`

---

## 1. Scope and Goal

### 1.1 What Pass 1 delivered

- Full-page DM surface at `/messages`
- Conversation list with search
- Message composition with file/media attachments
- Optional email-style subject field
- Demo conversation fallback when no real conversations exist
- `conversations` and `messages` tables with RLS (migration `20260307000001`)

### 1.2 What Pass 2 delivers

Pass 2 upgrades DreamDM from a standalone page into a **real-time, persistent, notification-aware** messaging system by:

1. **Realtime messaging** — Supabase Realtime channel subscriptions replace polling; messages appear instantly without page refresh.
2. **Draft persistence** — Compose drafts survive page refresh and navigation via `localStorage`; per-conversation keyed storage.
3. **Notification integration** — Unread message counts and notification data flow from the existing `notifications` table through a shared hook.
4. **DreamDM Bar component** — A compact, reusable `<DreamDMBar>` renders the unread count badge and provides quick-access to `/messages` from any surface.
5. **Media column migration** — `messages.media_url` and `messages.media_type` columns added to the database so media attachments are fully persisted.
6. **Modular hook layer** — Logic extracted from `MessagesClient.tsx` into `lib/dreamdm/` hooks, separating concerns per `GENERATION_LAW.md §3.1`.
7. **Notifications insert fix** — API-layer bug corrected: notification inserts now use the `content` JSONB field per the schema.

### 1.3 What is out of scope (Pass 3+)

- Typing indicators
- Reactions / emoji responses
- Group conversations (3+ participants)
- Message search / full-text index
- Voice messages
- Push notifications (browser or mobile)
- Spatial divider / dual-surface layout (future architecture change)

---

## 2. Core Features

### 2.1 Realtime Messaging

**Behaviour:** When a user has a conversation open in `MessagesClient`, a Supabase Realtime subscription on the `messages` table (filtered by `conversation_id`) delivers new messages instantly to all participants.

**Rules:**
- Subscription is established when a conversation is selected, torn down when deselected or component unmounts.
- Incoming messages from the current user (already optimistically added) are deduplicated by `id`.
- On subscription error or disconnection, the component falls back to the last fetched state without crashing.

**Hook:** `lib/dreamdm/useDreamDMMessages.ts`

### 2.2 Draft Persistence

**Behaviour:** As the user types in the message compose field, the draft (body + optional subject) is auto-saved to `localStorage` under a key of `de-dm-draft:{conversationId}`. On selecting a conversation with a saved draft, the compose field is pre-populated and a subtle "Draft restored" indicator is shown for 2 seconds.

**Rules:**
- Draft is cleared from `localStorage` on successful send.
- Maximum draft length stored is 5 000 characters; longer content is silently truncated at 4 999 to avoid storage quota errors.
- No draft content is sent to any server; it is local-only.

**Hook:** `lib/dreamdm/useDreamDMDraft.ts`

### 2.3 Unread Count and Notification Integration

**Behaviour:** `useNotifications` polls `/api/notifications?unread_only=true` on mount and every 60 seconds, returning the unread count. The `<DreamDMBar>` component shows a count badge when `unreadCount > 0`.

**Rules:**
- Badge disappears immediately when user navigates to `/messages` (optimistic clear).
- Hook is independent of `MessagesClient`; it can be mounted in any layout.
- Zero-state: no badge rendered when `unreadCount === 0`.

**Hook:** `lib/dreamdm/useNotifications.ts`

### 2.4 DreamDM Bar Component

**Behaviour:** `<DreamDMBar>` is a lightweight presentational component: a button with the DM icon, an optional unread count badge, and a link to `/messages`. It is designed to be embedded in any persistent layout (e.g., a sidebar, header, or floating dock).

**Rules:**
- Renders nothing if `unreadCount` is undefined (loading state) — avoids layout shift.
- Badge is gold (`var(--de-gold)`) when count > 0; absent otherwise.
- Accessible: `aria-label` includes the unread count when present.
- Does not own data-fetching state — receives `unreadCount` as a prop or uses `useNotifications` internally.

**Component:** `components/dreamdm/DreamDMBar.tsx`

---

## 3. Data Model

### 3.1 New columns on `messages`

```sql
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url  TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'file'));
```

These columns are already referenced in `MessagesClient.tsx` and `app/api/messages/route.ts` but were missing from the schema. Pass 2 adds them with an idempotent migration.

### 3.2 New `drafts` table

```sql
CREATE TABLE IF NOT EXISTS public.drafts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID        REFERENCES public.conversations(id) ON DELETE CASCADE,
  subject         TEXT,
  body            TEXT        NOT NULL DEFAULT '',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, conversation_id)
);
```

RLS: user-only select, insert, update, delete.

> **Note:** `useDreamDMDraft` in Pass 2 uses `localStorage` for simplicity and zero-latency restore. The `drafts` table is provisioned in this migration for Pass 3 server-side sync (e.g., cross-device draft continuity). It is not written to in Pass 2 client code.

### 3.3 Notifications schema fix

The existing `notifications` table uses `type TEXT` and `content JSONB`. The messages API was incorrectly inserting `message TEXT` and `data JSONB` (non-existent columns). Pass 2 corrects the API insert to use `content` as the JSONB payload carrier.

---

## 4. Component and Hook Architecture

```
lib/dreamdm/
  useDreamDMConversations.ts   — fetch + realtime conversations list
  useDreamDMMessages.ts        — fetch + realtime messages for a conversation
  useDreamDMDraft.ts           — localStorage draft save/restore for a conversation
  useNotifications.ts          — unread notification count polling

components/dreamdm/
  DreamDMBar.tsx               — compact bar: DM icon + unread badge + link
```

### Layer rules (per `GENERATION_LAW.md §3.1`)

| Layer | What goes here |
|-------|---------------|
| `lib/dreamdm/` | All data-fetching, state management, side effects |
| `components/dreamdm/` | Presentational components; receive data via props or hooks |
| `components/MessagesClient.tsx` | Full-surface view; composes hooks + presentational components |
| `app/messages/page.tsx` | Server component; auth gate, initial data fetch, passes to client |

---

## 5. Behaviour Specification

### 5.1 Realtime subscription lifecycle

```
selectConversation(id)
  → useDreamDMMessages subscribes to channel `messages:${id}`
  → incoming INSERT events: append if not duplicate
  → component unmount / conversation deselect: unsubscribe channel
```

### 5.2 Draft lifecycle

```
user types → debounce 500 ms → saveDraft(conversationId, { subject, body })
selectConversation(id) → restoreDraft(id) → pre-populate compose fields
sendMessage success → clearDraft(conversationId)
```

### 5.3 Unread count lifecycle

```
useNotifications mounts → fetch /api/notifications?unread_only=true
  → every 60 s: refetch
user navigates to /messages → setUnreadCount(0) optimistically
```

---

## 6. Real-Capability Verification

Per `CONSTITUTION.md` Rule 8 (Action Honesty): every visible action must map to a real system effect.

| Feature | Real system effect |
|---------|-------------------|
| Send message | POST `/api/messages` → `messages` table INSERT |
| File attachment | Supabase Storage upload → public URL persisted in `messages.media_url` |
| Subject field | Stored in `messages.content` as `**Subject:** {subject}\n\n{body}` |
| Draft save | Written to `localStorage` key `de-dm-draft:{conversationId}` |
| Draft restore | Read from `localStorage` on conversation select |
| Draft clear | `localStorage.removeItem` on send success |
| Unread count | Fetched from `notifications` table via `/api/notifications` |
| Realtime message | Supabase Realtime channel subscription on `messages` table |

**Anti-patterns not present in Pass 2:**
- No `console.log('todo')` handlers
- No buttons that render as interactive but do nothing
- No hardcoded counters or fake notification numbers

---

## 7. UI / UX Specifications

### 7.1 Design tokens (from `docs/THEME.md`)

| Token | Use |
|-------|-----|
| `var(--de-heading)` | Sent message bubble background |
| `var(--de-accent)` | Avatar initials, links, icons |
| `var(--de-gold)` / `#c8981a` | Unread badge, active tab underline |
| `var(--de-text-dim)` | Secondary text, timestamps |
| `var(--de-sky-bg)` | Page background |

### 7.2 DreamDM Bar sizing

- Icon: 20×20 px
- Badge: 16 px diameter circle, `#c8981a` fill, white text, `font-size: 10px`
- Minimum tap target: 44×44 px
- Badge hidden (not `display: none` — use `opacity: 0`) when count is 0 to avoid layout shift

### 7.3 Motion

- Draft restored indicator: fade in 150 ms, hold 1 500 ms, fade out 300 ms
- No animation on message list append (avoid scroll jank)
- Badge count update: no animation (instant)

---

## 8. Testing Checklist

### Unit tests (`pnpm exec vitest run`)

- [ ] `useDreamDMDraft`: save, restore, clear cycle with mock `localStorage`
- [ ] `parseSubject` / `formatMessageContent`: existing helpers
- [ ] `getConversationPreview`: existing helper
- [ ] `useNotifications`: mock fetch, verify polling interval

### Integration (manual smoke test)

- [ ] Open `/messages`; select demo conversation; type draft; reload page; verify draft restored
- [ ] Send message; verify draft cleared
- [ ] Two tabs: send message in tab A; verify it appears in tab B within 5 s (realtime)
- [ ] `/api/notifications` returns `unread_count`; `DreamDMBar` renders badge

---

## 9. Residual Audit (per `GENERATION_LAW.md §3`)

### Architecture residuals resolved in Pass 2

| Residual | Resolution |
|---------|-----------|
| Logic mixed with UI in `MessagesClient.tsx` | Hooks extracted to `lib/dreamdm/`; client file composes hooks |
| `media_url`/`media_type` fields sent to API but no DB columns | Migration adds columns |
| `notifications` insert uses wrong field names | API corrected to use `content` JSONB |

### Naming residuals

- Component file remains `MessagesClient.tsx` (canonical rename to `DreamDMClient.tsx` deferred to a future cleanup pass to avoid breaking imports; internal class/function names updated)
- All new files use canonical `dreamdm` naming

### Privacy residuals

- RLS on `messages`: participant-only select (existing)
- RLS on `drafts`: user-only (new migration)
- No draft content sent to server in Pass 2

---

## 10. Acceptance Criteria

| # | Criterion | Pass condition |
|---|-----------|---------------|
| 1 | Realtime messages | New message from another tab/device appears in open conversation within 5 s without reload |
| 2 | Draft persistence | Draft survives page refresh; restored on conversation re-select |
| 3 | Draft clear | Successful send removes draft from `localStorage` |
| 4 | Media columns | `messages.media_url` and `messages.media_type` columns exist in migration |
| 5 | Drafts table | `drafts` table with RLS exists in migration |
| 6 | Notifications fix | API insert uses `content` JSONB field; no unknown column errors |
| 7 | DreamDM Bar | Component renders with unread badge; links to `/messages` |
| 8 | useNotifications | Hook returns `unreadCount` from `/api/notifications` |
| 9 | No fake actions | No button or control does nothing in Pass 2 code |
| 10 | Tests pass | `pnpm exec vitest run` exits 0 with all tests passing |

---

## 11. Future Work (Pass 3+)

- Server-side draft sync via `drafts` table (cross-device draft continuity)
- Typing indicators (Supabase Realtime presence channel)
- Message reactions
- Group conversations
- Full-text message search
- Spatial divider / dual-surface integration
- Push notification delivery
- Message read receipts via `messages.is_read`
