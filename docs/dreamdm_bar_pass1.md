# DreamDM Bar — Pass 1

**Document type:** Implementation spec (retroactive)
**Scope:** DreamDM (`/messages`) foundational pass
**Status:** Complete — all deliverables shipped; this document records the accepted implementation
**Authority:** Anchored to `README.md` §16, `docs/CONSTITUTION.md`, `docs/PRODUCT_DEFINITION.md`, `docs/GENERATION_LAW.md`

---

## 1. Scope and Goal

### 1.1 What Pass 1 delivers

Pass 1 builds the **foundational DreamDM messaging surface** — a full-page private direct messaging system inside DREAMengin:

1. **Full-page DM surface** — `/messages` route: server-side auth gate, initial conversation fetch, passes to client component.
2. **Conversation list with search** — left panel; inline string filter; shows other participant's avatar, name, and a preview of the last message.
3. **Message composition** — text input with Send button; `POST /api/messages` on submit; optimistic display before server confirmation.
4. **Optional email-style subject field** — toggled via a Mail icon button; subject formatted into message content via `formatMessageContent()`.
5. **File/media attachments** — file picker uploads to Supabase Storage; public URL passed as `media_url` in message POST body.
6. **Demo conversation fallback** — when the user has no real conversations, two demo conversations (`Dr. Eams`, `Night Producer`) are shown so the UI is never empty on first load.
7. **REST API** — `GET /api/messages` (conversations list or messages for a conversation), `POST /api/messages` (send + auto-create conversation).
8. **Notifications API** — `GET /api/notifications`, `PUT /api/notifications` (mark read), `DELETE /api/notifications`.
9. **Database schema** — `conversations` and `messages` tables with RLS, migration `20260307000001`.

### 1.2 What is out of scope (Pass 2+)

- Supabase Realtime subscription (polling only in Pass 1 — realtime added in Pass 2)
- Draft persistence across page reloads (added in Pass 2)
- Unread badge / `DreamDMBar` component (added in Pass 2)
- `media_url` / `media_type` DB columns (added in Pass 2 migration)
- `drafts` table (added in Pass 2 migration)
- Notifications insert `content` JSONB bug fix (resolved in Pass 2)
- Modular `lib/dreamdm/` hook layer (extracted in Pass 2)

---

## 2. Core Features

### 2.1 Full-Page DM Surface

**Behaviour:** `app/messages/page.tsx` is a Next.js server component. It:
1. Calls `createServerClient()` and gets the authenticated user.
2. Redirects to `/` if unauthenticated.
3. Fetches conversations joined to `profiles` for both participants.
4. Falls back to `demoConversations` if the user has no real conversations.
5. Renders `<MessagesClient>` with `userId` and `initialConversations` props.

**Auth guard:** server-side `redirect('/')` — no unauthenticated render of `/messages`.

### 2.2 Conversation List and Search

**Behaviour:** The left panel shows a scrollable list of conversations. A search input filters by the other participant's `display_name` or `handle`. Selecting a conversation fetches its messages from `GET /api/messages?conversation_id={id}`.

**Rules:**
- Demo conversations have IDs prefixed `demo-` and are handled client-side only (no real DB fetch on select).
- Search filter is client-side; no server round-trip required.
- Active conversation is highlighted; clicking the back arrow on mobile clears selection.

### 2.3 Message Composition

**Behaviour:** A bottom compose bar contains a text `<textarea>`, an optional subject input (toggled by the Mail icon), a file attachment button, and a Send button.

**Rules:**
- Send is disabled while `isSending === true` or the message body is empty (after trim).
- On submit: `POST /api/messages` with `{ conversation_id, content, media_url?, media_type? }`.
- On success: the message is appended to the view; the compose fields are cleared; the attachment preview is removed.
- On failure: an alert is shown (no silent failure per `CONSTITUTION.md` Rule 8).
- Demo conversations block real sends — the Send button is disabled and shows a tooltip.

### 2.4 Optional Subject Field

**Behaviour:** The Mail icon button toggles `showSubjectField`. When shown, a subject `<input>` appears above the compose area.

**Format:** `formatMessageContent(subject, body)` encodes the subject:

```
**Subject:** {subject}

{body}
```

**Parsing:** `parseSubject(content)` decodes the format. Used when displaying messages and generating conversation previews.

### 2.5 File/Media Attachments

**Behaviour:** Clicking the attachment icon opens a file picker. The selected file is uploaded to Supabase Storage (`message-attachments/{userId}/{filename}`). The returned public URL is included as `media_url` in the message POST.

**Rules:**
- Preview thumbnail shown for image files; file icon shown for other types.
- Clicking the preview's X removes the selection.
- Upload happens on Send, not on file select (to avoid orphaned uploads).

### 2.6 Demo Conversation Fallback

**Behaviour:** When `formattedConversations.length === 0`, the server passes `demoConversations` to the client. These are non-interactive: selecting a demo conversation shows placeholder messaging explaining how to start a real conversation; the Send button is disabled.

**Demo participants:**
- `Dr. Eams` (`/dr-eams.jpeg`) — the in-app AI assistant
- `Night Producer` (`handle: nightbeats`) — representative music collaborator

---

## 3. Data Model

### 3.1 `conversations` table

Migration: `supabase/migrations/20260307000001_conversations_messages.sql`

```sql
CREATE TABLE IF NOT EXISTS public.conversations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversations_participants_unique UNIQUE (participant1_id, participant2_id)
);
```

**RLS policies (3):**

| Policy | Operation | Condition |
|--------|-----------|-----------|
| `conversations_select_participant` | SELECT | `auth.uid() IN (participant1_id, participant2_id)` |
| `conversations_insert_participant` | INSERT | `auth.uid() IN (participant1_id, participant2_id)` |
| `conversations_update_participant` | UPDATE | `auth.uid() IN (participant1_id, participant2_id)` |

### 3.2 `messages` table

```sql
CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content          TEXT        NOT NULL,
  is_read          BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **Note:** `media_url TEXT` and `media_type TEXT` are referenced in the API and client in Pass 1 but are **not yet DB columns** — they are sent in POST bodies and stored in-memory only. Pass 2 migration `20260310000010` adds these columns.

**RLS policies (4):**

| Policy | Operation | Condition |
|--------|-----------|-----------|
| `messages_select_participant` | SELECT | Sender is a participant in the message's conversation |
| `messages_insert_sender` | INSERT | `auth.uid() = sender_id` |
| `messages_update_sender` | UPDATE | `auth.uid() = sender_id` |
| `messages_delete_sender` | DELETE | `auth.uid() = sender_id` |

### 3.3 `notifications` table (pre-existing)

The `notifications` table (schema: `id UUID, user_id UUID, type TEXT, content JSONB, read BOOLEAN, created_at TIMESTAMPTZ`) is used for new-message notifications. Pass 1 inserts into `content` correctly; Pass 2 confirms this is the right field.

---

## 4. Component and API Architecture

```
app/
  messages/
    page.tsx                  — Server component; auth gate; initial fetch; passes to client

components/
  MessagesClient.tsx          — Client component; full DM surface
    parseSubject()            — Pure helper: decode subject from content string
    formatMessageContent()    — Pure helper: encode subject into content string
    MessageContent            — Inner component: renders message with optional subject heading
    getConversationPreview()  — Pure helper: generate conversation list preview string

app/api/
  messages/
    route.ts                  — GET (conversations or messages), POST (send + create conv)
  notifications/
    route.ts                  — GET (list + unread_count), PUT (mark read), DELETE
```

### Layer rules (per `GENERATION_LAW.md §3.1`)

| Layer | What goes here |
|-------|----------------|
| `app/messages/page.tsx` | Server component; auth gate, initial data fetch, passes to client |
| `components/MessagesClient.tsx` | Monolithic client component; data fetching + UI in Pass 1 |
| `app/api/messages/route.ts` | REST handlers; server-only Supabase client |
| `app/api/notifications/route.ts` | REST handlers; server-only Supabase client |

> **Architecture residual:** `MessagesClient.tsx` mixes data-fetching logic with UI rendering. This is resolved in Pass 2 by extracting `lib/dreamdm/` hooks.

---

## 5. Behaviour Specification

### 5.1 Conversation selection lifecycle

```
user selects conversation
  → GET /api/messages?conversation_id={id}
  → setMessages(response.messages)
  → scroll to bottom of message list
```

### 5.2 Message send lifecycle

```
user clicks Send (or presses Enter + Shift)
  → validate: body non-empty, not demo conversation
  → if file selected: uploadFile() → get public URL
  → setIsSending(true)
  → POST /api/messages { conversation_id, content, media_url?, media_type? }
  → on success: append message to list, clear compose fields
  → on error: alert(error.message)
  → setIsSending(false)
```

### 5.3 Conversation auto-create

```
POST /api/messages with recipient_id (no conversation_id)
  → check for existing conversation between user and recipient
  → if none: INSERT conversations { participant1_id: user, participant2_id: recipient }
  → INSERT messages { conversation_id, sender_id, content }
  → UPDATE conversations SET updated_at = now()
  → if recipient_id provided: INSERT notifications { user_id: recipient, type: 'message', content: JSONB }
```

---

## 6. Real-Capability Verification

Per `CONSTITUTION.md` Rule 8 (Action Honesty): every visible action maps to a real system effect.

| Action | Real system effect |
|--------|--------------------|
| Send message | `POST /api/messages` → `messages` table INSERT |
| File attachment | Supabase Storage upload → public URL in `media_url` POST field |
| Subject field toggle | Encodes subject into `content` via `formatMessageContent()` |
| Search conversations | Client-side filter of `conversations` state |
| Select conversation | `GET /api/messages?conversation_id={id}` → `messages` table SELECT |
| Mark notifications read | `PUT /api/notifications { mark_all: true }` → `notifications` table UPDATE |
| Delete notification | `DELETE /api/notifications?id={id}` → `notifications` table DELETE |

**Anti-patterns not present in Pass 1:**
- No buttons that fire `console.log('todo')` or do nothing
- No hardcoded notification counts
- No conversations shown that cannot be interacted with (except clearly-labelled demo fallback)

---

## 7. UI / UX Specifications

### 7.1 Design tokens (from `docs/THEME.md`)

| Token | Use |
|-------|-----|
| `var(--de-heading)` | Sent message bubble background |
| `var(--de-accent)` | Avatar initials, links, icons |
| `var(--de-text-dim)` | Secondary text, timestamps |
| `var(--de-sky-bg)` | Page background |

### 7.2 Layout

- **Two-panel layout:** conversation list (left, min-width 280 px) + message thread (right, flex-1).
- **Mobile:** single-panel — list or thread; back arrow returns to list.
- **Message bubbles:** sent messages right-aligned with `var(--de-heading)` background; received messages left-aligned.
- **Avatar:** 36 × 36 px circle; first character of `display_name` if no `avatar_url`.

### 7.3 Timestamps

- Relative time via `formatRelativeTime()` from `lib/utils`.
- Shown below each bubble.

---

## 8. Testing Checklist

### Unit tests (`pnpm exec vitest run`)

- [x] `parseSubject`: plain body → `{ subject: null, body }` (no mutation)
- [x] `parseSubject`: formatted content → `{ subject, body }` correctly split
- [x] `formatMessageContent`: empty subject → returns body unchanged
- [x] `formatMessageContent`: non-empty subject → correct `**Subject:**` prefix
- [x] `getConversationPreview`: subject message → `Re: {subject}`; plain → body

### Integration (manual smoke test)

- [x] `GET /api/messages` returns conversations for authenticated user
- [x] `POST /api/messages` creates conversation and message; returns 201
- [x] `GET /api/notifications` returns `unread_count`
- [x] `/messages` redirects to `/` when unauthenticated
- [x] Demo fallback appears when user has no conversations
- [x] File attachment uploads and message includes `media_url`

---

## 9. Residual Audit (per `GENERATION_LAW.md §3`)

### Architecture residuals deferred to Pass 2

| Residual | Deferred resolution |
|---------|---------------------|
| Logic mixed with UI in `MessagesClient.tsx` | Hooks extracted to `lib/dreamdm/` in Pass 2 |
| `media_url`/`media_type` sent to API but no DB columns | DB columns added in Pass 2 migration `20260310000010` |
| No realtime subscription — fetch on select only | Supabase Realtime subscription added in Pass 2 |
| No draft persistence | `localStorage`-backed draft hook added in Pass 2 |
| No unread badge / compact DM entry point | `DreamDMBar` component added in Pass 2 |

### Naming residuals

- Component file is `MessagesClient.tsx` — canonical rename to `DreamDMClient.tsx` deferred to a future cleanup pass to avoid breaking imports; all new Pass 2 files use canonical `dreamdm` naming.

### Privacy residuals

- RLS on `conversations` and `messages`: participant-only access (shipped in this pass).
- No message content sent to third-party services.

---

## 10. Acceptance Criteria

| # | Criterion | Pass condition |
|---|-----------|---------------|
| 1 | Auth gate | Unauthenticated request to `/messages` redirects to `/` |
| 2 | Conversation list | Authenticated user sees their conversations; demo fallback shown when none |
| 3 | Message fetch | Selecting a conversation loads its messages from `messages` table |
| 4 | Send message | POST creates DB row; message appears in view; compose field clears |
| 5 | Auto-create conversation | POST with `recipient_id` and no `conversation_id` creates new conversation |
| 6 | Subject field | Toggle shows subject input; send encodes subject into content |
| 7 | File attachment | Selected file uploads to Storage; `media_url` included in message |
| 8 | Search | Typing in search input filters conversation list client-side |
| 9 | RLS | Users cannot read conversations or messages they are not participants in |
| 10 | Notifications | `GET /api/notifications` returns `unread_count`; `PUT` marks read; `DELETE` removes |

---

## 11. What Pass 2 Builds On

Pass 2 (`docs/dreamdm_bar_pass2.md`) extends this foundation by:

- Extracting `lib/dreamdm/useDreamDMMessages.ts` — Supabase Realtime subscription for live message delivery.
- Extracting `lib/dreamdm/useDreamDMDraft.ts` — `localStorage` draft save/restore per conversation.
- Extracting `lib/dreamdm/useDreamDMConversations.ts` — conversations fetch with realtime updates.
- Adding `lib/dreamdm/useNotifications.ts` — unread count polling hook.
- Adding `components/dreamdm/DreamDMBar.tsx` — compact DM badge + link embeddable in any layout.
- Adding migration `20260310000010` — `messages.media_url`, `messages.media_type` columns and `drafts` table.
- Fixing `notifications` insert field names in the API.
