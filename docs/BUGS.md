# DREAMengin — BUGS & Open Issues

> **Auto-generated** by `scripts/update-bugs.mjs` on every push.  
> **Do not edit manually** — your changes will be overwritten on the next push.  
> To change what appears here, update `docs/FEATURE_STATUS.md` or the source code.

**Last updated:** 2026-03-05 08:09 UTC  
**Triggered by commit:** `03d35a9` on `copilot/fix-documentation-issues` by copilot-swe-agent[bot]  
**Commit message:** wip: fix LAW.md section 1 numbering (partial)

---

## 🏆 Final Vision — What DREAMengin Is Supposed to Be

DREAMengin is a **spatial, gesture-driven creative OS** built on Next.js (App Router) + Supabase.
It is not a website. It is not a social media feed. It is a **personal operating surface** where
every element is a live, interactive widget that the user owns, arranges, and publishes.

### Core product axioms (non-negotiable)

| # | Axiom | One-line rule |
|---|-------|---------------|
| 1 | Instant Understanding | No tutorial required. Every interaction self-reveals. |
| 2 | User-Shaped Space | Control through movement (drag, place). Not settings panels. |
| 3 | Real Capability | Every widget does real work — not just display. |
| 4 | Security by Default | Least privilege, RLS everywhere, no secrets to client. |
| 5 | Privacy by Design | Users own their data. Private by default. Deletable. |

### Navigation model

- The user is always conceptually inside **Home (node 0)**.
- All navigation is **τ-only** — deterministic state transitions, not browser routing.
- The **Golden Button** (Blue + Gold floating pair) is the only travel system.
- Traditional nav bars and back-stacks are **not part of the product**.

### UI design system

- **Sky-blue + gold gradient** throughout — no dark gamer colors, no indigo.
- **Frosted glass** surfaces (`.de-surface`, `.de-widget`).
- **Space Grotesk** font. Consistent radius family (6 / 10 / 14 / 18 / 24 / 32 / 9999 px).
- Every page uses `de-sky-bg` + `de-widget` glass cards.

### AI Triad

| Agent | Role | Audience |
|-------|------|----------|
| **Dr. Eams** | User assistant / OS voice | All authenticated users |
| **IDARi** | Admin bug-fixer + optimizer | Admins only |
| **TheBoogieMan** | Policy enforcer + overwatch | System / Admins only |

All three must approve (consensus gating) before any major system update is shipped.

### What "done" looks like

When DREAMengin is complete:

- A new user opens the app, sees the animated logo, and can explore without any tutorial.
- They never feel lost — the Golden Button always takes them home.
- Every Daydream (7 total) is a fully functional mini-app.
- Their profile is a live, curated public page they can share.
- The feed shows real content from real connectors.
- All games are playable on mobile with two thumbs, on keyboard, and on PS5.
- Settings, appearance, privacy, data export/delete all work end-to-end.
- TheBoogieMan silently enforces the 100-rule policy with full audit logs and appeals.

---

## 🔶 Partly Done (31 items)

These features exist but are incomplete. They must be finished before the product ships.

| Status | Feature | Notes |
|--------|---------|-------|
| 🔶 | Gradient on all daydreams/settings | 4 daydream pages + settings/algorithm done; 11 pages still use old bg-background |
| 🔶 | Dark-mode support | CSS vars in place; not all components respect them |
| 🔶 | Performance / battery-aware rendering | Game loop throttles; general app idle-throttling pending |
| 🔶 | Widget surface grid | Layout exists; drag-to-reorder not wired |
| 🔶 | Edit mode (drag-to-reorder widgets) | Banner + context exist; actual drag not implemented |
| 🔶 | Feed widget | Widget renders; feed data is demo-only |
| 🔶 | τ-navigation (spatial state transitions) | Discrete model implemented; continuous manifold pending |
| 🔶 | Back-navigation / history | Browser back works; spatial context not preserved |
| 🔶 | Avatar upload | Upload UI exists; Supabase storage wiring needs test |
| 🔶 | Public-only widget display | Logic exists; not fully enforced |
| 🔶 | Feed resolver | `lib/widgets/feed-resolver.ts`; demo data only |
| 🔶 | Feed settings | UI at `/feed-settings`; slices not saved to DB |
| 🔶 | Post creation | `CreatePostModal.tsx` exists; full publish flow needs work |
| 🔶 | Likes | API route exists; real-time count not wired |
| 🔶 | Music Studio | Real SoundRecorder (record+waveform+playback+download); not yet connected to feed publish |
| 🔶 | Media Vault | DaydreamShell Side A+B; upload not wired to DB |
| 🔶 | Create | DaydreamShell Side A+B; ideas/tasks UI; no persistence |
| 🔶 | Brand | DaydreamShell Side A+B; profile + analytics |
| 🔶 | Analytics | Real post count from DB; fake charts removed; actionable links |
| 🔶 | Play | DaydreamShell Side A+B; player UI exists; queue/playlist not wired |
| 🔶 | Dr. Eams voice assistant | Component exists; not wired to speech API |
| 🔶 | Shop page | UI scaffold at `/shop`; no payment integration |
| 🔶 | Marketplace | Browse page exists; purchase flow not built |
| 🔶 | Sell page | Form exists; no backend |
| 🔶 | Feed settings | UI exists; not persisted |
| 🔶 | Appearance / Theme | Gradient presets UI; not all pages themed |
| 🔶 | Connectors | YouTube + demo; IG/Spotify pending |
| 🔶 | Privacy | Page exists; blocking/appeals not wired |
| 🔶 | Help / wizard | Page exists; Dr. Eams integration pending |
| 🔶 | InnerDreams (AI bug-fix) | Routes exist; demo mode only |
| 🔶 | Sky-blue + gold gradient across all pages | Core pages + 4 daydreams done; 11 pages still use old `bg-background` |

---

## 🔲 Needs Work (10 items)

These features are spec'd but not yet built. They are mandatory obligations per **docs/LAW.md §10**.

| Status | Feature | Notes |
|--------|---------|-------|
| 🔲 | Password reset flow | Route exists but UI not built |
| 🔲 | Swipe navigation | Spec'd; not yet implemented on mobile |
| 🔲 | Widget drag-to-reorder on profile canvas | Toggle visibility done; drag-to-reorder needs `@dnd-kit/core` |
| 🔲 | Comments | Not yet built |
| 🔲 | Haptic feedback (DualSense) | Gamepad vibration API not yet wired |
| 🔲 | Power-ups (spin/shoot effects) | Inputs wired; visual effects + logic pending |
| 🔲 | Leaderboard | Score exists; no persistence |
| 🔲 | More levels / worlds | 3 levels done; more planned |
| 🔲 | Widget marketplace | Spec'd in WIDGET_SYSTEM_V2.md; not built |
| 🔲 | Payments (Stripe / etc.) | Not started |

---

## ⬆️ Upgrade Queue (ordered by priority)

These are pulled from `docs/FEATURE_STATUS.md` and ordered per **docs/LAW.md §10.2**.

1. **11 remaining pages** — apply `de-sky-bg` + `de-widget` to: create, shop/sell, music, music/upload, settings/account, settings/security, settings/notifications, ads/create, lab/new
2. **Feed system** — connect feed resolver to real DB data; real-time updates
3. **Widget drag on ProfileCanvas** — wire `@dnd-kit/core` for drag-to-reorder
4. **Follow/Algorithm → DB** — persist FollowOnboarding + Algorithm presets to Supabase instead of localStorage
5. **Music Studio pipeline** — SoundRecorder → upload → publish to feed
6. **Swipe navigation** — implement spatial swipe gestures for mobile
7. **Game power-ups** — activate spin + shoot with visual effects
8. **PS5 haptics** — Gamepad vibration API on stomp/coin
9. **Leaderboard** — persist game scores to Supabase
10. **Shop / payments** — Stripe integration

---

## 🐛 Known Code Annotations (TODO / FIXME / HACK)

No TODO / FIXME / HACK annotations found in source files.

---

## 📚 Reference Docs

| Document | Purpose |
|----------|---------|
| [docs/LAW.md](./LAW.md) | Binding rules — code must conform |
| [docs/AXIOMS.md](./AXIOMS.md) | Non-negotiable product principles |
| [docs/SPEC.md](./SPEC.md) | Design system + interaction model |
| [docs/ARCHITECTURE.md](./ARCHITECTURE.md) | Navigation + platform architecture |
| [docs/SECURITY.md](./SECURITY.md) | RLS, auth boundaries, privacy |
| [docs/FEATURE_STATUS.md](./FEATURE_STATUS.md) | Live feature completion status |
| [docs/HANDOFF.md](./HANDOFF.md) | Session-by-session change log |

---

*Generated by `scripts/update-bugs.mjs` · Committed by `github-actions[bot]` · [skip ci]*
