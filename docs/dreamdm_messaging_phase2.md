# DreamDMessaging + DreamDM Bar — Phase 2

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


**Document type:** Implementation spec  
**Scope:** DreamDMessaging and DreamDM Bar — shared messaging/search architecture  
**Status:** Active  
**Authority:** Anchored to `README.md`, `docs/CONSTITUTION.md`, `docs/PRODUCT_DEFINITION.md`, `docs/GENERATION_LAW.md`

---

## 1. Goal

Wire DreamDMessaging and DreamDM Bar so both support the same core messaging and searchable-entry feature set, while preserving their different form factors:

- **DreamDMessaging** (`/messages`) = full / expanded messaging surface
- **DreamDM Bar** (`dreamdmbar/DreamDMBar.tsx`) = compact / persistent messaging interaction rail

Both surfaces share the **same source of truth** for messaging, search, drafts, and the Dr. Eams toggle.

---

## 2. What Phase 2 Delivers

| # | Feature | Status |
|---|---------|--------|
| 1 | Shared conversation/message source of truth | ✅ shared `lib/dreamdm/` hooks |
| 2 | Real direct messaging on both surfaces | ✅ `useMessagingCore` + `/api/messages` |
| 3 | Conversation selection on both surfaces | ✅ |
| 4 | Message composition and send on both surfaces | ✅ |
| 5 | Inline attachment support on both surfaces | ✅ (50 MB limit, image/video/audio/file) |
| 6 | Draft persistence on both surfaces | ✅ `useDreamDMDraft` (shared) |
| 7 | Draft restore on conversation open | ✅ |
| 8 | Unread count badge on DreamDM Bar rail | ✅ `useNotifications` |
| 9 | Universal search with suggestions on both surfaces | ✅ `useDreamSearch` |
| 10 | Search result types: person, conversation, board | ✅ |
| 11 | Search suggestions appear under the search field | ✅ |
| 12 | Tapping a suggestion opens the correct flow | ✅ |
| 13 | Dr. Eams mode toggle on both surfaces | ✅ persisted to `de-dreams-mode` localStorage |
| 14 | Standard search is the default mode | ✅ |
| 15 | Dr. Eams mode is explicitly toggled by the user | ✅ Bot icon button |
| 16 | File validation is identical on both surfaces | ✅ shared `validateFile` in `useMessagingCore` |
| 17 | Privacy rules: drafts local-only, messages via RLS | ✅ |

---

## 3. Hook Architecture

All shared logic lives in `lib/dreamdm/`. Components import from hooks — no logic is duplicated.

### 3.1 `lib/dreamdm/useDreamSearch.ts` (NEW)

Universal search hook shared by both surfaces.

```typescript
export function useDreamSearch(query: string): UseDreamSearchReturn
```

**Returns:**
- `results: SearchResult[]` — up to 8 mixed-type results
- `isSearching: boolean`
- `drEamsMode: boolean` — Dr. Eams mode state (persisted)
- `toggleDrEams: () => void` — toggle Dr. Eams on/off
- `clearResults: () => void`

**Search targets:**
- `person` — profiles table (`handle`, `display_name`)
- `conversation` — conversations table (matched by participant name)
- `board` — message_boards table (if present)

**Dr. Eams persistence key:** `de-dreams-mode` (localStorage)

### 3.2 `lib/dreamdm/useMessagingCore.ts` (NEW)

Shared send / attach / validate logic.

```typescript
export function useMessagingCore(
  onOptimistic?, onReplace?, onRemove?
): UseMessagingCoreReturn
```

**Returns:**
- `isSending: boolean`
- `sendError: string | null`
- `validateFile: (file: File) => string | null` — 50 MB limit
- `getFileType: (file: File) => MediaType`
- `sendMessage: (params: SendMessageParams) => Promise<DMMessage | null>`
- `clearSendError: () => void`

**File size limit:** 50 MB (identical on both surfaces — spec §74).

### 3.3 Existing hooks (unchanged)

- `lib/dreamdm/useDreamDMMessages.ts` — realtime message subscription
- `lib/dreamdm/useDreamDMDraft.ts` — per-conversation draft persistence
- `lib/dreamdm/useDreamDMConversations.ts` — conversation list + realtime updates
- `lib/dreamdm/useNotifications.ts` — unread count

---

## 4. Component Changes

### 4.1 `dreamdmbar/DreamDMBar.tsx` — Pass 2 upgrade

**New in Pass 2:**
- Real inline send via `useMessagingCore` (no longer redirects to `/messages`)
- Compact conversation list in Dream Space panel
- Search field with `useDreamSearch` suggestions pop-under list
- Dr. Eams toggle (`<Bot>` icon button, `aria-pressed`)
- Unread count badge on the bar rail (from `useNotifications`)
- Attachment picker in Dream Space compose form
- Draft restore indicator in Dream Space compose form
- Conversation selection in Dream Space
- "Open DreamDMessaging →" link when no conversation is selected

**Preserved from Pass 1:**
- Spatial divider behaviour (drag to resize)
- Three snap positions (surface-focus / balanced / dream-focus)
- Spring snap transition
- Quick compose field in the bar rail
- localStorage draft for quick compose (`dreamengin:dreamdm-draft`)

### 4.2 `components/MessagesClient.tsx` (DreamDMessaging surface)

**New in Phase 2:**
- `useDreamSearch` hook wired to the search input
- Dr. Eams toggle button next to search (`<Bot>` icon, `aria-pressed`)
- Search suggestions dropdown (listbox) under the search field
- Tapping a person result routes to `/messages/new?recipient=<id>`
- Tapping a conversation result selects the conversation in-panel
- Tapping a board/topic result navigates to the correct route

**Preserved:**
- All existing DM send / attach / draft / realtime functionality
- Boards tab
- Desktop / mobile responsive layout

---

## 5. Search Behaviour (spec §31–50)

```
User types in search field
  → useDreamSearch debounces 300ms
  → queries Supabase: profiles + conversations + boards
  → returns SearchResult[] (up to 8)
  → results shown as tappable pop-under list below the field
  → tapping a result:
      person       → /messages/new?recipient=<id>
      conversation → open conversation in panel
      board        → /messages/boards/<id>
      topic        → board href
```

Standard search is the default. Dr. Eams mode is activated by the Bot button and persisted.

---

## 6. Testing

Test file: `tests/dreamdm-messaging-phase2.test.ts` (22 tests)

Covers:
- Dr. Eams toggle localStorage contract
- `SearchResult` shape contract (person, conversation, board, topic)
- File validation logic (50 MB limit)
- `getFileType` MIME mapping
- Feature parity contracts (shared key, shared limit)

---

## 7. Privacy and Security

- Drafts are localStorage-only on both surfaces (never sent to server in this phase)
- Messages are sent via `/api/messages` which enforces participant auth
- File uploads stored under `userId/messages/` path in Supabase Storage
- RLS on `conversations` and `messages` tables enforces participant-only access
- Search queries go to Supabase via the client (RLS enforced at DB layer)
- `de-dreams-mode` is a preference key; contains no user data

---

## 8. Out of Scope (Phase 3+)

- Typing indicators
- Message reactions
- Group conversations
- Full-text message search
- Voice messages
- Push notifications
- Board moderation tools in compact bar
- Deep forum nesting in compact bar
- Dr. Eams assistant actions (full implementation)
