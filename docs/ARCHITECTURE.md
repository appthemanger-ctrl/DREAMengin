# DREAMengin Architecture

Status: active implementation architecture  
Last updated: 2026-03-16

`README.md` is the authoritative full product specification. This file explains how the current repo maps to that spec and where the implementation is already strong versus where it is still being aligned.

## 1. Product model

DREAMengin is a **privacy-first, dual-runtime spatial operating environment** built around three core surfaces, a six-surface Daydream network connected to six Engin runtimes via 11 named connection paths, Dream Windows, and the AI triad.

### Runtime regions
- **Surface Space** — upper active runtime region (hosts active surfaces)
- **DreamSpace** — lower modular runtime region (hosts Dream Windows, launcher)
- **DreamDM Bar** — Runtime Seam / Persistent Interaction Rail between the two regions

### Core surfaces
- **HomeDream Surface** — the main private operating surface (`/homedream`)
- **Edit ProfileDream Surface** — the private builder for profile output (`/edit-profiledream`)
- **View Profile Surface** — the shared/public output surface (`/view-profile`)

### Daydream Surface Network (multi-connection, not 1-to-1)
- Music Daydream Surface / StarMakerEngin
- Games Daydream Surface / GameEngin
- Lab Daydream Surface / LabEngin
- Code Daydream Surface / CodeEngin
- Brand Daydream Surface / BrandingEngin
- Create Daydream Surface / ContentEngin

Any Daydream Surface may connect to multiple Engin runtimes. The system is a multi-surface, multi-engin connection network with 11 named connection paths.

### Platform modules
- Dream Windows (modular runtime containers)
- DreamShop Surface
- DreamMarketplace Surface
- DreamMenu
- DreamDM Surface
- DreamAds Surface

### AI triad
- Dr. Eams
- IDARi
- TheBoogieMan.Ai

## 2. Canonical route model in the repo

| Product surface | Canonical route | Current support routes |
|---|---|---|
| HomeDream Surface | `/homedream` | `/home` |
| Edit ProfileDream Surface | `/edit-profiledream` | `/edit-profile` |
| View Profile Surface | `/view-profile` | `/profile/[handle]`, `/profile`, `/u/[handle]` |
| DreamShop Surface | `/shop` | `/shop/sell` |
| DreamMarketplace Surface | `/marketplace` | none |
| DreamDM Surface | `/messages` | none |
| DreamAds Surface | `/ads` | `/ads/create` |

The canonical product names should be used in docs, labels, and architecture conversations even when support routes still exist.

## 3. Current implementation zones

### HomeDream Surface
Primary code lives in:
- `app/homedream/page.tsx`
- `app/home/page.tsx`
- `components/home/*`
- `components/dreamnav/*`
- `components/menus/*`
- `components/HomeRadialNav.tsx`

### Edit ProfileDream Surface and View Profile Surface
Primary code lives in:
- `app/edit-profiledream/page.tsx`
- `app/edit-profile/page.tsx`
- `app/view-profile/page.tsx`
- `app/profile/[handle]/page.tsx`
- `components/profile/*`
- `components/ProfileEditor.tsx`

### Dream Windows
Canonical Dream Window layer files already exist in:
- `components/dreams/DreamShell.tsx`
- `components/dreams/DreamConnectorLayer.tsx`
- `components/dreams/DreamFeatureLayer.tsx`
- `components/dreams/DreamOutputLayer.tsx`
- `components/dreams/SuperDreamWidget.tsx`

Legacy widget implementation material still exists in:
- `components/widgets/*`
- `types/widget-system-v2.ts`

## 4. Universal Dream Window model

The repo is being aligned to one universal Dream Window model.

### Layer 1 — DreamShell
Visual shell, naming, size, placement, style, menus, and shell-level controls.

### Layer 2 — Connector / Identity
Authentication state, provider identity, capability discovery, and connector metadata.

### Layer 3 — Feature
Active modules that only appear when the connector or Dream Window actually supports them.

### Layer 4 — Output / Projection
Saved profile-safe output. This is what should be shared into View Profile Surface and other public contexts.

## 5. Privacy and projection boundaries

The architecture follows the README rule that nothing is public by default.

- **HomeDream Surface** is the private source surface.
- **Edit ProfileDream Surface** is the private builder and staging layer.
- **View Profile Surface** and public profile routes must render only saved/shared output.
- Profile output must not read unrestricted private HomeDream data.
- Any visibility change with public effect must require explicit user intent.

## 6. Combined profile output

Compatible Dream Windows may combine into automatic profile output blocks.

Implementation rule:
- the user chooses what to expose
- the system decides the default composition template
- the public/shared surface receives a projection, not the source Dream Window internals

## 7. DreamAds separation

DREAMengin uses two distinct advertising concepts:

- **DreamAds** = user-controlled ad space or promotion slots attached to their surfaces where allowed
- **Platform promotions** = platform-run promotional inventory

These must remain separate in docs and code language.

## 8. Design system direction

The repo design language should use the README palette and intent model:
- **Gold** = save, confirm, action, premium emphasis
- **Light Blue** = live state, connected state, signal state
- **White** = base surface, clarity, space

Minimal clutter, intentional motion, mobile-first polish.

## 9. Current alignment gaps

These remain open and should be documented honestly:
- legacy route names still exist beside canonical spec routes
- legacy widget naming still appears in code and docs (use Dream Window canonically)
- extra daydream routes still exist outside the six canonical pairs
- some profile editing behavior still uses owner-facing profile workspace patterns rather than fully isolated Edit ProfileDream Surface language

## 10. Build/runtime assumptions

- Next.js 16+
- App Router
- TypeScript
- Node 24
- pnpm 10.30.0
- Supabase for auth, database, storage, and realtime

These assumptions should remain stable unless a change is truly required.

## 11. AI Rate-Limiting System

All AI API routes use a **single, unified rate-limit system**. There must be no deviation from this in future builds.

| Component | Canonical name |
|-----------|---------------|
| Supabase RPC | `check_ai_rate_limit` |
| Supabase table | `ai_rate_limits` |

**Removed / must not be used:**
- RPC `rate_limit_hit` — replaced by `check_ai_rate_limit`
- Table `rate_limit_counters` — replaced by `ai_rate_limits`

The TypeScript entry-point is `lib/ai/rateLimit.ts`:
- `checkRateLimit(userId, endpoint, limit, windowSeconds)` → `RateLimitResult`
- `getCurrentRPM(userId, endpoint)` → `number`

`RateLimitResult` interface:
```ts
{ allowed: boolean; rpm: number; retry_after_seconds?: number }
```

`checkRateLimit` is fail-closed: any RPC error or invalid response returns
`{ allowed: false, rpm: 0, retry_after_seconds }`.

The `lib/ai/rate-limiter.ts` file is a separate higher-level service that also
uses `check_ai_rate_limit` + `ai_rate_limits` and is not a replacement for
`rateLimit.ts` — both must stay consistent with the canonical table/RPC above.

`README.md` is the authoritative full product specification. This file explains how the current repo maps to that spec and where the implementation is already strong versus where it is still being aligned.

## 1. Product model

DREAMengin is a privacy-first modular platform built around three core surfaces, six Daydream/Engin pairs, modular Dreams, and the AI triad.

### Core surfaces
- **HomeDream** — the main private operating surface
- **EditProfileDream** — the private builder for profile output
- **ViewProfile** — the shared/public output surface

### Daydream pair system
- Music / StarMakerEngin
- Games / GameEngin
- Lab / LabEngin
- Code / CodeEngin
- Brand / BrandingEngin
- Create / ContentEngin

### Platform modules
- Dreams
- DreamShop
- DreamMarketplace
- DreamMenu
- DreamDM
- DreamAds

### AI triad
- Dr. Eams
- IDARi
- TheBoogieMan.Ai

## 2. Canonical route model in the repo

| Product surface | Canonical route | Current support routes |
|---|---|---|
| HomeDream | `/homedream` | `/home` |
| EditProfileDream | `/edit-profiledream` | `/edit-profile` |
| ViewProfile | `/view-profile` | `/profile/[handle]`, `/profile`, `/u/[handle]` |
| DreamShop | `/shop` | `/shop/sell` |
| DreamMarketplace | `/marketplace` | none |
| DreamDM | `/messages` | none |
| DreamAds | `/ads` | `/ads/create` |

The canonical product names should be used in docs, labels, and architecture conversations even when support routes still exist.

## 3. Current implementation zones

### HomeDream
Primary code lives in:
- `app/homedream/page.tsx`
- `app/home/page.tsx`
- `components/home/*`
- `components/dreamnav/*`
- `components/menus/*`
- `components/HomeRadialNav.tsx`

### EditProfileDream and ViewProfile
Primary code lives in:
- `app/edit-profiledream/page.tsx`
- `app/edit-profile/page.tsx`
- `app/view-profile/page.tsx`
- `app/profile/[handle]/page.tsx`
- `components/profile/*`
- `components/ProfileEditor.tsx`

### Dreams
Canonical Dream-layer files already exist in:
- `components/dreams/DreamShell.tsx`
- `components/dreams/DreamConnectorLayer.tsx`
- `components/dreams/DreamFeatureLayer.tsx`
- `components/dreams/DreamOutputLayer.tsx`
- `components/dreams/SuperDreamWidget.tsx`

Legacy widget implementation material still exists in:
- `components/widgets/*`
- `types/widget-system-v2.ts`

## 4. Universal Dreams model

The repo is being aligned to one universal Dream model.

### Layer 1 — DreamShell
Visual shell, naming, size, placement, style, menus, and shell-level controls.

### Layer 2 — Connector / Identity
Authentication state, provider identity, capability discovery, and connector metadata.

### Layer 3 — Feature
Active modules that only appear when the connector or Dream actually supports them.

### Layer 4 — Output / Projection
Saved profile-safe output. This is what should be shared into ViewProfile and other public contexts.

## 5. Privacy and projection boundaries

The architecture follows the README rule that nothing is public by default.

- **HomeDream** is the private source surface.
- **EditProfileDream** is the private builder and staging layer.
- **ViewProfile** and public profile routes must render only saved/shared output.
- Profile output must not read unrestricted private HomeDream state.
- Any visibility change with public effect must require explicit user intent.

## 6. Combined profile output

Compatible Dreams may combine into automatic profile Super Widgets.

Implementation rule:
- the user chooses what to expose
- the system decides the default composition template
- the public/shared surface receives a projection, not the source Dream internals

## 7. DreamAds separation

DREAMengin uses two distinct advertising concepts:

- **DreamAds** = user-controlled ad space or promotion slots attached to their surfaces where allowed
- **Platform promotions** = platform-run promotional inventory

These must remain separate in docs and code language.

## 8. Design system direction

The repo design language should use the README palette and intent model:
- **Gold** = save, confirm, action, premium emphasis
- **Light Blue** = live state, connected state, signal state
- **White** = base surface, clarity, space

Minimal clutter, intentional motion, mobile-first polish.

## 9. Current alignment gaps

These remain open and should be documented honestly:
- legacy route names still exist beside canonical spec routes
- legacy widget naming still appears in code and docs
- extra daydream routes still exist outside the six canonical pairs
- some profile editing behavior still uses owner-facing profile workspace patterns rather than fully isolated EditProfileDream language

## 10. Build/runtime assumptions

- Next.js 16+
- App Router
- TypeScript
- Node 24
- pnpm 10.30.0
- Supabase for auth, database, storage, and realtime

These assumptions should remain stable unless a change is truly required.

## 11. AI Rate-Limiting System

All AI API routes use a **single, unified rate-limit system**. There must be no deviation from this in future builds.

| Component | Canonical name |
|-----------|---------------|
| Supabase RPC | `check_ai_rate_limit` |
| Supabase table | `ai_rate_limits` |

**Removed / must not be used:**
- RPC `rate_limit_hit` — replaced by `check_ai_rate_limit`
- Table `rate_limit_counters` — replaced by `ai_rate_limits`

The TypeScript entry-point is `lib/ai/rateLimit.ts`:
- `checkRateLimit(userId, endpoint, limit, windowSeconds)` → `RateLimitResult`
- `getCurrentRPM(userId, endpoint)` → `number`

`RateLimitResult` interface:
```ts
{ allowed: boolean; rpm: number; retry_after_seconds?: number }
```

`checkRateLimit` is fail-closed: any RPC error or invalid response returns
`{ allowed: false, rpm: 0, retry_after_seconds }`.

The `lib/ai/rate-limiter.ts` file is a separate higher-level service that also
uses `check_ai_rate_limit` + `ai_rate_limits` and is not a replacement for
`rateLimit.ts` — both must stay consistent with the canonical table/RPC above.
