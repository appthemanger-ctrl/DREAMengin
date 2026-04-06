# DREAMengin Connectors

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Phase 5 — Feed & Friends Connections  
Last updated: 2026-03-10

This document describes the DREAMengin connector system: what connections exist, what data they pull, and the user experience for each.

---

## What are Connectors?

Connectors let you bring content from other platforms into your DREAMengin feed and profile. Each connector:

- Requires your explicit consent before connecting
- Only reads data — DREAMengin never posts on your behalf
- Stores credentials server-side only — never in the browser
- Shows truthful status — "Connected" is only shown after a successful verification call
- Lets you disconnect at any time (Settings → Connectors → Manage → Disconnect)

---

## Connection status model

| Status | Meaning |
|--------|---------|
| `not_connected` | No credentials stored yet |
| `connected` | Credentials verified successfully; data can be synced |
| `needs_reauth` | Credentials expired or revoked — user must reconnect |
| `requires_approval` | Provider requires app-level approval before access |
| `unsupported` | Data is not technically available via official APIs |
| `error` | Transient error; user may retry |
| `needs_admin_setup` | Admin must configure API keys first |

> **Truthfulness rule:** The system never sets status to `connected` unless a live verification call to the provider succeeds. There are no fake "connected" states or demo modes that pretend connections work.

---

## Tier 1 — Fully supported

These providers work end-to-end: Connect → Verify → Sync.

### Mastodon

| Field | Value |
|-------|-------|
| Category | Social |
| What you get | Home timeline + notification counts |
| Required credentials | Instance URL + Access Token |
| How to get credentials | Instance settings → Development → New application |
| Sync endpoint | `POST /api/connectors/mastodon/sync` |

**User experience:**
1. Tap Connect
2. Enter your instance URL (e.g. `https://mastodon.social`) and access token
3. DREAMengin calls `GET /api/v1/accounts/verify_credentials` to confirm the token
4. On success: status → `connected`, Sync Now button appears
5. Tap Sync Now to fetch your home timeline (last 40 posts)

---

### Bluesky

| Field | Value |
|-------|-------|
| Category | Social |
| What you get | Following feed + follow/follower counts |
| Required credentials | Handle + App Password |
| How to get credentials | bsky.app → Settings → App Passwords |
| Sync endpoint | `POST /api/connectors/bluesky/sync` |

> **Important:** Use an App Password, not your main account password. App passwords are scoped and can be revoked independently.

**User experience:**
1. Tap Connect
2. Enter your Bluesky handle (e.g. `alice.bsky.social`) and an app password
3. DREAMengin calls `com.atproto.server.createSession` to verify
4. On success: Sync Now button appears
5. Sync fetches up to 40 posts from your following feed

---

### GitHub

| Field | Value |
|-------|-------|
| Category | Utilities |
| What you get | Activity feed + repos + open PRs |
| Required credentials | Personal Access Token (classic or fine-grained) |
| Required scope | `read:user` |
| How to get credentials | github.com → Settings → Developer settings → Personal access tokens |
| Sync endpoint | `POST /api/connectors/github/sync` |

---

### Reddit

| Field | Value |
|-------|-------|
| Category | Social |
| What you get | Home feed (subscribed subreddits) + saved posts |
| Required credentials | Access Token (via OAuth) |
| Required scopes | `identity read mysubreddits save` |
| Sync endpoint | `POST /api/connectors/reddit/sync` |

> Admin must configure `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` in environment variables for the OAuth flow to work. Without these, the connector shows `needs_admin_setup`.

---

### Nostr

| Field | Value |
|-------|-------|
| Category | Social |
| What you get | Following feed from configured relays |
| Required credentials | Public key (npub or 64-char hex) + relay URLs |
| How to get credentials | Find your pubkey in Damus, Amethyst, Snort, or any Nostr client |
| Sync endpoint | `POST /api/connectors/nostr/sync` |

**Relay examples:**
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`

---

### Spotify

| Field | Value |
|-------|-------|
| Category | Music |
| What you get | Now playing + recently played + liked songs |
| Sync endpoint | `POST /api/connectors/spotify/sync` |

---

### YouTube

| Field | Value |
|-------|-------|
| Category | Video |
| What you get | Subscription feed + watch history + Watch Later |
| Sync endpoint | `POST /api/connectors/youtube/sync` |

---

## Tier 2 — Requires approval or setup

These providers are visible in the UI but cannot be connected until approval or admin configuration is complete.

### X / Twitter

**Status:** `needs_admin_setup`

Access to the home timeline requires a paid X API plan or partner-level access. The connector is visible but disabled until the admin configures `TWITTER_BEARER_TOKEN`.

### LinkedIn

**Status:** `requires_approval`

The LinkedIn Connections API requires LinkedIn partner program approval. Standard developer accounts cannot access friend/connection data. Contact LinkedIn directly to apply.

### Facebook

**Status:** `requires_approval`

The Facebook Graph API only returns friends who also use the same app (not all Facebook friends). Requires app review for expanded access.

### Discord

**Status:** `requires_approval`

Friends list and server activity data requires Discord Social SDK access, which requires approval from Discord.

### TikTok

**Status:** `needs_admin_setup`

TikTok's API requires developer application approval and admin-configured keys.

### Apple Music

**Status:** `needs_admin_setup`

Requires an Apple developer account and MusicKit JS developer token configured by admin.

---

## Tier 3 — Not available via official API

These are explicitly unsupported. The UI explains why and suggests alternatives.

### Instagram

The Instagram Graph API does not expose a home feed or follower list for third-party apps. Only follower/following counts are accessible.

**Alternative:** Use Mastodon or Bluesky for full follow/feed access.

### Snapchat

Snapchat does not have a public API for Stories or friend content.

---

## Privacy and security

- **Credentials are stored server-side** in `connector_accounts.token_blob` (Supabase)
- **RLS is enabled** — users can only read their own connector accounts
- **token_blob is never returned to the browser** — API routes only return status fields
- **Feed items** are stored per-user in `feed_items` — private by default, never shared
- **Syncing is user-triggered** — no background cron jobs
- **Disconnect** wipes the token_blob and resets status to `not_connected`

---

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/connectors/{provider}/connect` | Store credentials and verify with provider |
| `GET` | `/api/connectors/{provider}/verify` | Re-verify stored credentials (cached 5 min) |
| `POST` | `/api/connectors/{provider}/sync` | Fetch feed items and store in feed_items |

All routes require authentication (`auth.getUser()`). All routes return JSON.

---

## Sync now flow

1. User taps "Sync {Provider}" button (appears after connecting)
2. Browser sends `POST /api/connectors/{provider}/sync`
3. Server fetches credentials from `connector_accounts.token_blob`
4. Server calls provider API and normalises results into `UnifiedFeedItem[]`
5. Deduplication: `(user_id, provider, external_id)` — no duplicate rows
6. Items stored in `feed_items` via upsert (ON CONFLICT DO NOTHING)
7. `connector_accounts.last_synced_at` and `last_sync_count` updated
8. Response: `{ ok, fetched, stored, last_synced_at }`

---

## Data model

See `types/connector.ts` for the full type definitions:

- `ConnectorAccount` — DB row (server-only, includes token_blob)
- `ConnectorAccountPublic` — safe subset for browser (no token_blob)
- `UnifiedFeedItem` — normalised cross-provider feed item
- `FeedItemRow` — DB row in `feed_items`

See `lib/connectors/normalise.ts` for normalisation functions per provider.

See `lib/connectors/providers/` for per-provider verify + sync implementations.
