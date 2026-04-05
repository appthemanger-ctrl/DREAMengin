# DREAMengin — BUGS & Open Issues

> **Auto-generated** by `scripts/update-bugs.mjs` on every push.  
> **Do not edit manually** — your changes will be overwritten on the next push.  
> To change what appears here, update `docs/FEATURE_STATUS.md` or the source code.

**Last updated:** 2026-04-05 07:25 UTC  
**Triggered by commit:** `6e137b2` on `copilot/create-code-dream-engine` by appthemanger-ctrl  
**Commit message:** Merge branch 'completedream' into copilot/create-code-dream-engine

---

## 🏆 Final Vision — What DREAMengin Is Supposed to Be

DREAMengin is a **dual-runtime, spatial creative operating environment** built on Next.js (App Router) + Supabase.

It is not defined as a conventional page-based website. It is a **personal operating surface** where users move through connected live surfaces, modular runtime containers, and powered Engin layers while preserving context.

### Core product axioms (non-negotiable)

| # | Axiom | One-line rule |
|---|-------|---------------|
| 1 | Instant Understanding | No tutorial required. Every interaction self-reveals. |
| 2 | User-Shaped Space | Control through movement, placement, and direct interaction. |
| 3 | Real Capability | Every visible action does real work. |
| 4 | Security by Default | Least privilege, RLS everywhere, no secrets to client. |
| 5 | Privacy by Design | Users own their data. Private by default. Deletable. |

### Runtime model

- DREAMengin operates as a **dual-runtime spatial system**.
- **Surface Space** is the upper active runtime region.
- **DreamSpace** is the lower modular runtime region.
- The **DreamDM Bar** is the persistent interaction rail, runtime seam, and draggable divider between the two active spaces.
- The **Gold Button** is the primary travel control for returning home and opening system navigation.
- Navigation must feel like depth, continuity, and state-preserving movement — not page loss or world reset.

### Core system structure

- **HomeDream** is the root private operating surface.
- **EditProfileDream** is the private profile builder surface.
- **ViewProfile** is the public/shared output surface.
- **6 Daydream surfaces** form the lived creative domains.
- **6 Engin runtimes** form the powered execution / emulator layer.
- The Daydream / Engin system is a **multi-connection network**, not a strict one-to-one pairing.
- The system supports **11 connection paths** across different scopes and work resolutions.

### UI design system

- **Gold / light blue / white** premium palette throughout.
- **Frosted glass** surfaces (`.de-surface`, `.de-widget`).
- **Space Grotesk** font.
- Consistent radius family (6 / 10 / 14 / 18 / 24 / 32 / 9999 px).
- Surfaces should feel calm, premium, spatial, and uncluttered.

### AI Triad

| Agent | Role | Audience |
|-------|------|----------|
| **Dr. Eams** | User assistant / routing / discovery | All authenticated users |
| **IDARi** | Admin bug-fixer + optimizer | Admins only |
| **TheBoogieMan.Ai** | Policy enforcer + system overwatch | System / Admins only |

All three must approve (consensus gating) before any major system update is shipped.

### What "done" looks like

When DREAMengin is complete:

- A new user opens the runtime and can explore without a tutorial.
- They remain oriented because HomeDream, DreamSpace, the DreamDM Bar, and the Gold Button preserve continuity.
- Every Daydream (**6 total**) is a fully functional lived creative surface.
- Every Engin runtime powers real work and connects truthfully into the wider system.
- Their profile is a live, curated public output they can explicitly control.
- The feed shows real content from real connectors and real system activity.
- Games are playable across supported input modes and devices.
- Settings, appearance, privacy, data export, and deletion all work end-to-end.
- TheBoogieMan.Ai silently enforces policy with auditability and appeals.

---

## 🔶 Partly Done (0 items)

These features exist but are incomplete. They must be finished before the product ships.

| Status | Feature | Notes |
|--------|---------|-------|
| — | (none) | — |

---

## 🔲 Needs Work (0 items)

These features are spec'd but not yet built. They are mandatory obligations per **docs/LAW.md §10**.

| Status | Feature | Notes |
|--------|---------|-------|
| — | (none) | — |



---

## 🐛 Known Code Annotations (TODO / FIXME / HACK)

### 📝 TODO (1)

| Location | Description |
|----------|-------------|
| `lib/code/drEamsCodeAssist.ts:355` | implement\n}`; |

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
