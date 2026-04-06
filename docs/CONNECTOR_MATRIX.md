# DREAMengin Connector Matrix

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Phase 5 — Feed & Friends Connections  
Last updated: 2026-03-10

This matrix documents every connector's capabilities, access requirements, and current status.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Available and working |
| ⚠️ | Available but gated (needs approval or admin setup) |
| ❌ | Not available via official API |
| 🔑 | Requires admin-configured API keys |
| 📋 | Requires partner/approval program |

---

## Full connector matrix

| Provider | Tier | Feed | Follow list | Follower list | Post count | Requirements | Status |
|----------|------|------|-------------|---------------|------------|--------------|--------|
| **Mastodon** | 1 | ✅ | ✅ | ✅ | ✅ | Instance URL + access token | Ready |
| **Bluesky** | 1 | ✅ | ✅ | ✅ | ✅ | Handle + app password | Ready |
| **GitHub** | 1 | ✅ (events) | ✅ (following) | ✅ (followers) | ✅ | Personal access token (read:user) | Ready |
| **Reddit** | 1 | ✅ (subscribed) | ✅ (subreddits) | ❌ | ✅ | OAuth — 🔑 REDDIT_CLIENT_ID required | Ready (needs admin keys) |
| **Nostr** | 1 | ✅ | ✅ | ✅ | ✅ | Public key + relay URLs (no account needed) | Ready |
| **Spotify** | 1 | ✅ (recent) | ❌ | ❌ | ✅ | OAuth | Ready |
| **YouTube** | 1 | ✅ (subscriptions) | ❌ | ❌ | ✅ | Google OAuth | Ready |
| **X / Twitter** | 2 | ⚠️ (timeline) | ⚠️ | ⚠️ | ⚠️ | 🔑 Bearer token + paid API plan | Needs admin setup |
| **LinkedIn** | 2 | ⚠️ | ⚠️ | ⚠️ | ⚠️ | 📋 LinkedIn partner program | Requires approval |
| **Facebook** | 2 | ⚠️ (mutual-app friends only) | ⚠️ (mutual-app only) | ❌ | ⚠️ | 📋 App review | Requires approval |
| **Discord** | 2 | ⚠️ | ⚠️ (friends) | ❌ | ⚠️ | 📋 Social SDK access | Requires approval |
| **TikTok** | 2 | ⚠️ | ❌ | ❌ | ⚠️ | 🔑 TikTok developer approval + keys | Needs admin setup |
| **Apple Music** | 2 | ⚠️ (recent) | ❌ | ❌ | ⚠️ | 🔑 Apple developer + MusicKit key | Needs admin setup |
| **Instagram** | 3 | ❌ | ❌ | ❌ | ✅ (counts only) | N/A | Unsupported |
| **Snapchat** | 3 | ❌ | ❌ | ❌ | ❌ | N/A | Unsupported |

---

## Detailed notes per provider

### Mastodon
- Home timeline: `GET /api/v1/timelines/home` — full support ✅
- Follows: `GET /api/v1/accounts/relationships` — full support ✅
- Followers: `GET /api/v1/accounts/{id}/followers` — full support ✅
- No client ID/secret required — user provides their own access token
- Compatible with all Mastodon-compatible instances (Pleroma, Pixelfed, Misskey via API compat layer)

### Bluesky (AT Protocol)
- Feed: `app.bsky.feed.getTimeline` — full support ✅
- Follows: `app.bsky.graph.getFollows` — full support ✅
- Followers: `app.bsky.graph.getFollowers` — full support ✅
- Uses app passwords — safer than main password, scoped and revocable
- Works with any AT Protocol PDS (bsky.social is default)

### GitHub
- Activity feed: `GET /users/{login}/events` — up to 40 events ✅
- Following: `GET /users/{login}/following` ✅
- Followers: `GET /users/{login}/followers` ✅
- Requires `read:user` scope on the Personal Access Token

### Reddit
- Home feed: `GET /` (personalised when authenticated) ✅
- Saved posts: `GET /user/{username}/saved` ✅
- **Friends list:** Reddit does not expose a "friend feed" in the same sense — users subscribe to subreddits, not follow people
- **Admin note:** Requires `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` env vars for OAuth exchange
- Scopes needed: `identity read mysubreddits save`

### Nostr
- Feed: queries `kind:1` events from user's follow list via WebSocket relay ✅
- Follows: queries `kind:3` contact list ✅
- Followers: technically possible but requires querying many relays — currently shows follow list only
- Completely decentralised — no single API server, no account required beyond a key pair
- **Note:** Sync quality depends on relay availability and relay gossip propagation

### X / Twitter
- Home timeline endpoint exists: `GET /2/tweets/search/recent` or `/2/timelines/home`
- **Access pricing:** Basic tier ($100/mo) provides 10,000 tweets/month read; higher tiers for more
- **DREAMengin default:** `needs_admin_setup` — disabled until `TWITTER_BEARER_TOKEN` is configured
- Bookmarks: `GET /2/users/{id}/bookmarks` — requires OAuth 2.0 user context

### LinkedIn
- Connections API (`/v2/connections`): requires LinkedIn Partner Program membership
- **Standard developer accounts cannot access the connections list**
- Plain text: "Apply at linkedin.com/developers/apps for partner review"
- Network feed (`/v2/ugcPosts`): available with approved API access
- **DREAMengin default:** `requires_approval`

### Facebook
- Friends list via Graph API: **only returns friends who also have the app installed**
  - Endpoint: `GET /me/friends` — returns mutual-app friends, not all friends
  - Source: [Facebook Developers documentation](https://developers.facebook.com/docs/graph-api/reference/user/friends/)
- Home feed: not accessible to third-party apps without special partner access
- **DREAMengin default:** `requires_approval` — even if implemented, severely limited

### Discord
- Friends list: requires `relationships.read` scope — part of Discord Social SDK
- Social SDK: requires approval from Discord (not available to all developers)
  - Source: [Discord OAuth2 docs — Social Layer SDK](https://docs.discord.com/developers/topics/oauth2)
- **DREAMengin default:** `requires_approval`

### TikTok
- Following feed: available via TikTok API but requires developer application and approval
- Saved videos: available post-approval
- **DREAMengin default:** `needs_admin_setup`

### Apple Music
- `MusicKit JS` provides access to user's library and recently played
- Requires an Apple developer account and a MusicKit developer token (server-generated)
- **DREAMengin default:** `needs_admin_setup` — requires `APPLE_MUSICKIT_PRIVATE_KEY` and `APPLE_TEAM_ID`

### Instagram
- **Follower list:** Not available via Instagram Graph API for standard apps
  - Source: [Instagram Graph API — User fields](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/)
  - `followers_count` field is available, but not the list of followers
- **Home feed:** Not accessible to third-party apps
- **Alternative:** Use Mastodon or Bluesky for full follow/feed functionality
- **DREAMengin default:** `unsupported`

### Snapchat
- No public API for Stories, memories, or friend content
- Snap Kit is limited to specific use cases (logins, Bitmoji, Creative Kit)
- **DREAMengin default:** `unsupported`

---

## Environment variables

| Variable | Provider | Required | Notes |
|----------|----------|----------|-------|
| `REDDIT_CLIENT_ID` | Reddit | Optional | Without this, Reddit shows `needs_admin_setup` |
| `REDDIT_CLIENT_SECRET` | Reddit | Optional | Pair with CLIENT_ID for OAuth |
| `TWITTER_BEARER_TOKEN` | X/Twitter | Optional | Without this, X shows `needs_admin_setup` |
| `APPLE_TEAM_ID` | Apple Music | Optional | Apple developer team ID |
| `APPLE_MUSICKIT_PRIVATE_KEY` | Apple Music | Optional | MusicKit key for token generation |

> All of these are optional. The UI degrades gracefully to `needs_admin_setup` when they are absent. No new **required** environment variables were introduced in Phase 5.

---

## Alternative recommendations

For users who want full social follow/feed functionality, these open alternatives are fully supported:

| Use case | Recommended alternative |
|----------|------------------------|
| Open social feed + full follower list | Mastodon |
| Decentralised social + follows | Bluesky (AT Protocol) |
| Censorship-resistant + cryptographic identity | Nostr |
| Developer activity feed | GitHub |
| Community/interest feed | Reddit |

---

*Source of truth: `docs/CONNECTORS.md` for implementation details.*  
*Provider limitation sources: linked inline above to official documentation.*
