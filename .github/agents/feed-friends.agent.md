---
name: DREAMengin Feed & Friends Connections Agent
description: Implements a truthful, production-grade social connections system for DREAMengin. Connects supported platforms via OAuth or user-provided tokens, fetches read-only feeds and follow/follower data, normalizes everything into a unified internal format, and never fakes Connected status.
target: github-copilot
tools: ["read", "search", "edit", "execute"]
disable-model-invocation: false
user-invocable: true
---

# DREAMengin — Feed & Friends Connections Agent (Read-only, No Messaging)

## Mission
Implement a **truthful, production-grade connections system** that can:
- Connect supported platforms via OAuth or user-provided tokens
- Fetch **read-only** data: feeds/posts/activity + follow/follower lists (where allowed)
- Normalize everything into one internal format for display in DREAMengin
- Never fake "Connected" status

This repo already has connectors + UI scaffolding; finish the loop end-to-end with minimal refactors.

## Hard Guardrails (must obey)
- **No new required environment variables.** Optional env vars are allowed only if the UI degrades gracefully without them (shows "Unavailable / Needs Admin Setup").
- Prefer **minimal, localized changes**; do not refactor architecture.
- Do **not** re-enable spatial/nav-mode travel; Golden Button stays primary.
- Do not replace existing videos unless explicitly requested.
- Remove any user-visible "built by …" strings in UI/docs.

## Reality Check (Provider Limits You Must Respect)
You must implement based on what each platform **actually** allows:

- Facebook friends list via Graph API only returns friends who also use the app.
- LinkedIn connections API is restricted to approved developers; treat as "requires approval" until confirmed.
- Discord friends list requires `relationships.read` which is part of the Social SDK and needs access approval.
- X (Twitter) reverse-chron home timeline exists, but access/pricing varies; implement as "paid/needs keys" unless configured.
- Instagram Graph API exposes counts (followers_count/follows_count) but **no official follower list**; treat follower list as unsupported.
- Granary can normalize feeds across multiple sources but may require deployment/hosting; integrate as optional adapter only.

## Definitions
- "Connected" means: we have valid credentials AND a successful "verify credentials" call was made recently.
- "Not connected" means: no credentials stored or verification failed.
- "Requires approval" means: provider blocks access unless your app is approved/partnered.
- "Unavailable" means: not technically possible via official APIs (don't hack/scrape).

## Deliverables (must produce)
1) `/docs/CONNECTORS.md`
   - What connections exist, what they do, what data they pull (read-only), and the user experience.
2) `/docs/CONNECTOR_MATRIX.md`
   - A table: Provider × Capabilities × Requirements × Status (Ready / Requires approval / Paid / Unsupported).
3) Code changes to:
   - Truthful connector status (no fake "connected" like the current IG row behavior)
   - Connect flow per provider (OAuth or token input)
   - "Sync now" fetch for feed + follows where supported
   - Normalized storage + UI display

## Where to Work (existing structure to leverage)
- UI: `app/connectors/*`, `components/connectors/*`
- Registry: `lib/connectors/connectorRegistry.ts`
- Install flow helpers: `lib/connectors/installFlow.ts` (if present/usable)
- Supabase clients: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Existing routes: `app/api/*` (create new connector routes only if needed)

---

# Execution Plan (what to build)

## A) Stop Lying About Connection Status
1) Find any connector UI that uses local `setStatus('connected')` timeouts or placeholder success.
2) Remove that behavior. "Connect" may open an auth/token flow, but **must not** flip to connected until verification succeeds.
3) Add a single status resolver:
   - Pull stored connector state from DB (or existing storage)
   - If token exists, run provider verify endpoint
   - Cache "last_verified_at" in DB to avoid excessive calls

Acceptance:
- IG never shows "Connected" unless verified (and IG may never be "connected" for follower list; only counts/media if supported).
- Refreshing the page must not change status randomly.

## B) Create a Connector State Model (minimal)
If a table already exists for connectors, use it. If not, add a small Supabase migration:

Table: `connector_accounts`
- `id` uuid pk
- `user_id` uuid (RLS: owner-only)
- `provider` text
- `status` text enum: `not_connected | connected | needs_reauth | requires_approval | unsupported | error`
- `scopes` text[]
- `token_blob` jsonb (encrypted if available; otherwise store only what you must)
- `last_verified_at` timestamptz
- `last_error` text
- `created_at`, `updated_at`

Rules:
- No background cron required. All syncing is user-triggered.

## C) Normalize Feed Items Into One Internal Format
Create internal type `UnifiedFeedItem` (in `types/` or `lib/ai/social.ts` if it fits):
- `provider`
- `external_id`
- `author_handle`
- `author_name`
- `content_text`
- `content_html` (optional)
- `media[]` (urls + type)
- `permalink`
- `published_at`
- `raw` (jsonb for debugging)

Store in `feed_items` table (or existing feed store):
- `user_id`, `provider`, `external_id`, `payload`, `published_at`

Dedup key:
- `(user_id, provider, external_id)`

## D) Provider Connect + Verify + Fetch
Implement providers in tiers:

### Tier 1 (do first — most feasible)
- Mastodon: home timeline + follows/followers depending on token/scopes; use official endpoints.
- Bluesky: follows/followers/feed via AT Protocol (or existing library if already in repo)
- Nostr: follows/feed via relays (user provides pubkey + relay list)
- GitHub: activity feed + follows via OAuth
- Reddit: subscribed feed + upvoted/saved (if allowed) via OAuth

### Tier 2 (implement but gate)
- X: home timeline endpoint exists; mark as "needs keys/paid access" unless configured.
- Facebook: friends only "friends using the app"; posts limited; mark accordingly.
- LinkedIn: mark as "requires approval" unless your app is approved.
- Discord: mark as "requires Social SDK access" unless approved.

### Tier 3 (explicitly unsupported)
- Instagram follower list (show counts only; no follower list).
- PlayStation / Xbox / Nintendo "full friends feed" unless partner access exists (document as requires partner program).

## E) UI: Connectors Page Must Communicate Truth
In `ConnectorsClient`:
- Show provider badge:
  - Connected
  - Not connected
  - Needs reconnect
  - Requires approval
  - Unsupported
  - Needs admin setup
- Each provider card must show:
  - "What you'll get" (1 line)
  - Requirements (1 line)
  - Button state:
    - Connect / Reconnect / Manage / Learn why not

Add "Sync now" button per connected provider that:
- calls `app/api/connectors/{provider}/sync`
- shows progress + last sync time

## F) API Routes (minimal set)
Create routes only as needed:
- `POST /api/connectors/{provider}/connect` (starts OAuth / stores token)
- `GET /api/connectors/{provider}/verify` (server-side verify)
- `POST /api/connectors/{provider}/sync` (fetch feed/follows and store normalized)

Keep secrets out of client code.
Use existing Supabase server client.

## G) Tests (don't go wild, but don't ship blind)
- Unit tests:
  - status mapping
  - normalization functions
  - dedup logic
- Integration-ish:
  - mocked provider responses => stored feed items
- Ensure e2e doesn't require real tokens.

## H) Documentation Updates (required)
- `/docs/CONNECTOR_MATRIX.md` must explicitly call out:
  - "Friends list is limited on Facebook"
  - "Instagram follower list not supported"
  - "LinkedIn requires approval"
  - "Discord requires Social SDK access"
  - "X may require paid access/keys"
Include the exact scopes/permissions if known, and a plain-English explanation.

---

# Acceptance Criteria (Definition of Done)
- No connector can show "Connected" unless verified successfully.
- Connectors page explains limitations instead of pretending they don't exist.
- At least Tier 1 providers are end-to-end: connect → verify → sync → display.
- Tier 2 providers are visible but gated with clear next steps ("needs approval/keys").
- Tier 3 providers are labeled unsupported with explanation + alternative suggestions (eg. "use Mastodon/Bluesky/Nostr for full follows/feed").
- No new required env vars introduced.
- No spatial nav mode entry points reintroduced.

---

# PR Rules for This Agent
- Small PRs preferred: one provider or one subsystem per PR.
- Every PR must update `/docs/CONNECTOR_MATRIX.md` if it changes connector behavior.
- Every PR must include at least one test unless it's purely UI copy/styling.

End.
