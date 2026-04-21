# DREAMengin — Triage Log

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)
> **Process:** Naming Authority enforcement pass — April 2026

All changes are logged here in chronological order. Each entry: file affected, action taken, reason.

---

## Triage Pass 1 — April 2026

### RENAMED — `dream.homedream.WorkspaceDashboard.tsx` → `dream.homedream.HomeDreamSurface.tsx`
|---|---|
| **Old path** | `dreamdmbar/homedream/dream.homedream.WorkspaceDashboard.tsx` |
| **New path** | `dreamdmbar/homedream/dream.homedream.HomeDreamSurface.tsx` |
| **Old export** | `WorkspaceDashboard` |
| **New export** | `HomeDreamSurface` |
| **Reason** | "Dashboard" and "Workspace" are both banned words per `NAMING_AUTHORITY.md` and `CONSTITUTION.md` AP-2 (Naming Drift). Component renders real HomeDream Surface content — real content, banned name. Renamed to canonical `HomeDreamSurface`. |
| **Importers updated** | `components/runtime/dream.RuntimeView.tsx`, `components/core/dream.CoreDream.tsx` |
| **Tests updated** | `tests/integration-wiring.test.ts`, `tests/home-feed-home.test.ts`, `tests/v2-readiness.test.ts`, `tests/authenticated-ui-shells.test.ts`, `tests/notifications.test.ts` |
| **Comments updated** | `app/homedream/page.tsx`, `components/dream.NotificationCenter.tsx`, `lib/notifications/useNotifications.ts`, `lib/notifications/notificationHelpers.ts`, `app/daydream/code/page.tsx`, `daydreams/code/page.tsx`, `components/core/dream.CoreDream.tsx` |

---

### DELETED — `components/dream.StarsBackground.tsx`

| Field | Value |
|---|---|
| **Path** | `components/dream.StarsBackground.tsx` |
| **Reason** | Pure decorative sparkle background — literal definition of the banned "sparkle" category per `NAMING_AUTHORITY.md`. No canonical consumers. |
| **Consumers at deletion** | None |

---

### DELETED — `components/dream.bar.TopBar.tsx`

| Field | Value |
|---|---|
| **Path** | `components/dream.bar.TopBar.tsx` |
| **Reason** | Violates the one-bar rule: DREAMengin has ONE bar — the DreamDM Bar (`dreamdmbar/dreamsurface.dreamdmbar.tsx`). A separate "TopBar" is an agent-invented leech. Only consumer was `dream.WheelLayout.tsx` (also deleted). |
| **Consumers at deletion** | `components/dream.WheelLayout.tsx` (deleted in same pass) |

---

### DELETED — `components/dream.WheelLayout.tsx`

| Field | Value |
|---|---|
| **Path** | `components/dream.WheelLayout.tsx` |
| **Reason** | Generic wheel layout wrapper with no external consumers. Imported the banned `TopBar`. Not referenced by any route, surface, or test that exercises it. Leech by absence of canonical purpose. |
| **Consumers at deletion** | None (self-contained; TopBar import cleaned up by deletion) |

---

### DELETED — `components/dreamsurface.dreamdmbar-shim.tsx`

| Field | Value |
|---|---|
| **Path** | `components/dreamsurface.dreamdmbar-shim.tsx` |
| **Reason** | "shim" = wrapper/adapter. The real DreamDM Bar is `dreamdmbar/dreamsurface.dreamdmbar.tsx`. A shim adds nothing and is a named anti-pattern per NAMING_AUTHORITY. No canonical consumers. |
| **Consumers at deletion** | None |

---

### DELETED — `components/home/dream.beatcanvas.tsx`

| Field | Value |
|---|---|
| **Path** | `components/home/dream.beatcanvas.tsx` |
| **Reason** | Self-described as "ambient waveform visualizer" — decorative/ambient effect with no real runtime purpose. Sparkle by its own description. No canonical consumers. |
| **Consumers at deletion** | None |

---

### README ADDITIONS (documentation alignment)

The following sections were added to `README.md` to make existing test assertions pass:

- `## 6. HomeDream (Core System, Private Operating Surface)` — HomeDream control model, feed model, rendered elements
- `## HomeDream System` — canonical implementation paths, vocabulary table, runtime rules
- `## 13. Code / CodeEngin` — §13.1 Code Side A, §13.2 CodeEngin Side B, §13.3 Specialized Dream Windows
- `## Product Laws` — Law 10 (Build freely, no artificial repurpose-before-invent rule)

---

### RENAMED — `components/daydream/dream.BrandDaydreamDashboard.tsx` → `components/daydream/dreamsurface.daydream.BrandDaydream.tsx`

| Field | Value |
|---|---|
| **Old path** | `components/daydream/dream.BrandDaydreamDashboard.tsx` |
| **New path** | `components/daydream/dreamsurface.daydream.BrandDaydream.tsx` |
| **Old export** | `BrandDaydreamDashboard` |
| **New export** | `BrandDaydream` |
| **Reason** | "Dashboard" is a banned word per NAMING_AUTHORITY. Component renders the Brand Daydream Side A — real content, canonical fit under `dreamsurface.daydream.*` prefix. |
| **Importers updated** | `daydreams/brand/page.tsx`, `app/daydream/brand/page.tsx` |

---

### DELETED — `components/dreamengin/dream.BabylonWorkspace.tsx`

| Field | Value |
|---|---|
| **Path** | `components/dreamengin/dream.BabylonWorkspace.tsx` |
| **Reason** | "Workspace" is banned per NAMING_AUTHORITY. Component is an orphan — no real consumers (only referenced in a comment in `app/dreamengin/page.tsx`). A Babylon.js navigation workspace outside the Engin shell does not fit any canonical region without renaming and rewiring. |
| **Consumers at deletion** | None (comment reference only) |

---

## Ambiguous Files

See `docs/REVIEW_QUEUE.md` for files that are ambiguous or unclear and have been flagged for owner review.
