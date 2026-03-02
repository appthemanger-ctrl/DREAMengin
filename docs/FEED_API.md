# Feed API

The Feed API provides normalised multi-source content to the Home Feed and Widget layer. It is **stateless** – all pagination state lives in the opaque `cursor` parameter.

---

## Base URL

```
/api/feed
```

---

## Endpoints

### `GET /api/feed/home`

Fetch a themed feed of items from all enabled providers.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | string | `play` | One of `analytics`, `brand`, `games`, `media-vault`, `music`, `play` |
| `limit` | number | `40` | Items per page (1–100) |
| `cursor` | string | – | Opaque base64url pagination token from a previous response |
| `sourceType` | string | `mixed` | Filter source type: `news`, `social`, or `mixed` |
| `maxAgeHours` | number | `48` | Reject items older than N hours |
| `safeMode` | `1` / `0` | `0` | Apply extra content sanitisation |

#### Response

```json
{
  "items": [FeedItem],
  "nextCursor": "base64url-string-or-null",
  "partialErrors": [{ "providerId": "rss", "message": "HTTP 503" }],
  "assembledAt": "2024-01-15T12:00:00.000Z",
  "fromCache": false
}
```

**HTTP status codes:**
- `200` – success (may have `partialErrors` for degraded sources)
- `400` – invalid `theme` value
- `502` – all providers failed and no stale cache available

**Caching:** responses are cached server-side for 10 minutes (stale-while-revalidate 2 minutes). The `Cache-Control` header is set accordingly.

---

### `GET /api/feed/providers/status`

Returns health information for all registered providers. Intended for dev/admin use only – do not expose to end users.

#### Response

```json
{
  "providers": [
    {
      "providerId": "rss",
      "enabled": true,
      "lastSuccessAt": "2024-01-15T12:00:00.000Z",
      "lastError": null,
      "rollingFailures": 0,
      "pausedUntil": null,
      "statusExplainer": "OK"
    }
  ]
}
```

---

### `POST /api/feed/refresh`

Bypasses the cache once per user action (pull-to-refresh). Returns a fresh `FeedResponse`.

#### Request Body

```json
{
  "theme": "music",
  "limit": 40,
  "sourceType": "mixed"
}
```

#### Response

Same shape as `GET /api/feed/home`.

---

## FeedItem Shape

```ts
interface FeedItem {
  id: string;          // "providerId:externalId"
  source: string;      // display name, e.g. "mastodon.social"
  sourceType: 'news' | 'social' | 'internal';
  providerId: string;  // internal provider id
  title?: string;
  text: string;        // plain text excerpt
  html?: string;       // safe HTML (optional)
  url?: string;        // canonical link (tracking params removed)
  author: {
    name: string;
    handle?: string;
    avatar?: string;
    profileUrl?: string;
  };
  media: Array<{
    url: string;
    type: 'image' | 'video' | 'audio' | 'link';
    width?: number;
    height?: number;
    alt?: string;
  }>;
  publishedAt: string; // ISO 8601
  tags: string[];
}
```

---

## Providers

| Provider ID | Type | Auth | Notes |
|-------------|------|------|-------|
| `rss` | news | None | RSS 2.0 + Atom 1.0; per-theme feed list |
| `gdelt` | news | None | GDELT 2.0 free API; keyword-based |
| `mastodon-public` | social | None | Trending posts from mastodon.social |
| `bluesky-public` | social | None | "What's hot" via public AppView |
| `nostr-public` | social | None | Trending notes via nostr.band REST API |

All providers are free-first. Optional providers can be added later as additive layers.

---

## Widget Reuse

The same `/api/feed/home` endpoint can power widgets by passing a `theme` parameter. No session state is required; widgets pass the cursor for pagination.

---

## Attribution

Every `FeedItem` includes `source`, `url`, and `author` fields. The UI **must** display the source and provide an external link. Copying full article content is not permitted.
