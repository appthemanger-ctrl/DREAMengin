# DREAMengin

**Customizable UI OS · Widget Space · Social Feed · AI Triad**

A Next.js 15 App Router application with a Babylon.js animated logo, gesture-driven spatial navigation, widget space, social feed, and an AI triad (Dr. Eams · IDARi · TheBoogieMan).

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — animated DREAMengin logo |
| `/home` | Home Dream (widget space + feed) |
| `/profile` | Profile Dream (private editing surface) |
| `/u/[handle]` | Public profile mirror |
| `/marketplace` | Browse widgets / themes |
| `/shop` | Purchase premium content |
| `/settings` | Settings hub |
| `/settings/controls` | Customize home-button gesture controls |
| `/settings/feed` | Feed source slices |
| `/settings/connectors` | Connect external services (IG, etc.) |
| `/settings/appearance` | Theme + layout editor |
| `/settings/data` | Delete My Data (keeps login) |
| `/settings/account` | Delete My Dream (full account delete) |

### API routes

| Route | Description | Auth |
|---|---|---|
| `POST /api/ai/eams` | Chat with Dr. Eams | Public |
| `POST /api/ai/idari` | IDARi system optimizer | Admin only |
| `POST /api/ai/boogieman` | TheBoogieMan policy AI | Internal |

---

## Animated logo

The DREAMengin logo is rendered in a Babylon.js WebGL canvas. Use the component anywhere:

```tsx
import { DreamEnginLogo } from "@/components/DreamEnginLogo";

<DreamEnginLogo width={480} height={240} />
```

### What it does

- **DREAM plane** — slow y-float, ±1.5° rotation, gold emissive shine pulse (loop).
- **ENGIN plane** — micro-bob synced at half the DREAM amplitude; stays steady.
- **Texture sampling** — `NEAREST` so crisp pixel-art / vector PNGs stay sharp.
- **Battery-aware** — pauses when the canvas scrolls offscreen (`IntersectionObserver`) or the tab is hidden (`visibilitychange`). Runs at 60 fps when visible; drops to 30 fps when idle.

### Using the sprite sheet (if needed)

Load `sprite_2x_transparent.png` and set sampling to `NEAREST` (no linear blur). Match the sprite cell size exactly so Babylon never scales individual frames.

---

## AI Triad

Three server-side AI agents with distinct roles:

| Agent | Role | Exposed to |
|---|---|---|
| **Dr. Eams** | User-facing assistant / chat | All users |
| **IDARi** | Admin bug-fixer + optimiser | Admins only |
| **TheBoogieMan** | Policy enforcer + system overwatch | Internal / server |

### Consensus gating

Major system-update recommendations require unanimous approval from all three agents before they are applied.

### Env vars

Copy `.env.example` → `.env.local` and fill in:

```
AI_PROVIDER=openai        # or "mock" for local dev
AI_API_KEY=sk-...
ADMIN_TOKEN=...           # guards /api/ai/idari
```

Keys are **server-side only** — never shipped to the client.

---

## Home Buttons

Two independent draggable buttons manage lock/unlock and menus:

- **Drag together** → snap + lock (light blue + gold visual).
- **Single tap while locked** → both menus open side-by-side (System left, Daydream right).
- **Double tap while locked** → unlock.
- After menus open, buttons snap back to saved corner positions.
- Buttons **never drive navigation**.
- Positions persisted to `localStorage` (Supabase later).

Gesture behaviour is configurable at `/settings/controls`.

---

## Profile / Public profile

- `/profile` → private editing surface. Save publishes to the public mirror.
- `/u/[handle]` → public profile; mirrors exactly what was last saved.

---

## Dev auth bypass

```bash
# .env.local
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
DEV_ADMIN=true
```

**Never enable in production.**

---

## Zip asset uploads

Pushing a `.zip` triggers `.github/workflows/deploy-artifact.yml`, which extracts and merges files into the repo root. Source code (`src/`, `package.json`, etc.) is **never overwritten** — only new/updated asset files are added.
