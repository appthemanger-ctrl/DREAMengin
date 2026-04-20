# Solo + Co-op Pass Roadmap

> **Owner:** Coding agent (decisions taken on the user's behalf this session)
> **Locked:** 2026-04-20
> **Scope:** Captures every default decision and the execution checklist for
> the remaining passes. NOT a governance/architecture doc — those live under
> `/docs/` and are owned by Idari.

The user delegated all eleven open questions to the agent ("you pick the best
ones … surprise me, make it good") and asked for every pass to be in flight
at once rather than one-at-a-time. This file is the receipt.

---

## Locked decisions (the eleven questions)

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Bar height | **48 / 200 px** | Touch-comfortable rest, taller expanded canvas; matches existing `BAR_H` band |
| 2 | Parallel comment composers | **Coexist one release**, then burn | Don't strand in-flight work; ship the new path behind the same surface |
| 3 | Same-Engin × 2 identity | **Same Supabase identity** | One user = one identity. "Player 2" emerges from the runtimeChannel, not auth |
| 4 | Starter coercion list | `image`, `video`, `audio`, `text/code`, `url`, `engin-state` | Covers ~95% of drops; everything else routed to the universal editor |
| 5 | Bottom→top push permission | **Host-only** | Avoids surprise hijack; viewers request via the consent flow |
| 6 | Grabbed-from-shared default | **Snapshot fork** | Predictable; live-mirror requires explicit "stay live" toggle |
| 7 | `acceptIncoming` default | **Auto for session participants, prompt outside** | Friction where it matters; trust where it's earned |
| 8 | Realtime full-tier cap | **16** before viewer-tier | Matches Supabase channel comfort + UI presence density |
| 9 | First Engin in co-op pack | **`StarMakerEngin`** | Highest emotional payoff; existing collab-studio surface to graft onto |
| 10 | Cold-load top runtime state | **Fully collapsed** | Honors "open to one runtime window" as the default |
| 11 | Home-particle double-tap action | **Reset both runtimes to home** | Obvious, recoverable, matches existing `onHome()` wiring |

---

## What shipped this session

### Pass 1 — Bar defaults + tap discipline (visible UX)
- ✅ Bottom-dock bar default verified (`BAR_H = 80`, `useState(BAR_H)`).
- ✅ **Whole bar is the drag handle** on pointer/mouse — pointer drag handlers
  moved off the small light wrapper onto the bar root
  (`dreamdmbar/dreamsurface.dreamdmbar.tsx`). Touch already had this.
- ✅ **Momentum fling restored** —
  `decideBarRelease` (`lib/dreamdm/barInteractions.ts`):
    * slow drag → bar parks wherever the user lets go (free placement),
    * upward fling past the invisible 2/5 line → snaps to top,
    * downward fling near/below the line → snaps to bottom.
- ✅ `useTap` / `useHomeParticleTap` (`lib/hooks/useTap.ts`) — single-tap is
  now the canonical hook; double-tap is structurally walled off behind the
  home-particle hook so callers can't accidentally re-introduce it.
- ✅ One non-home `onDoubleClick` purged (`ForgeDreamCanvas` add-piece).
- ⚠️ Audited — game-controller and sprint-detector double-tap are *gameplay
  primitives* inside game cartridges (Smash-style dash), not OS UI. Kept.
- ⚠️ Existing gold-particle double-tap (`HomeControls × 2`,
  `DreamNavControls`, `dreamsurface.dreamdmbar.tsx` light, shim) is the
  sanctioned home-particle gesture and stays.

### Pass 3 — Manifest (backwards-compatible)
- ✅ `DaydreamEnginManifest` gained optional `solo` and
  `coop: boolean | { affordances: string[] }` fields. No existing manifest
  needed editing — every Engin keeps working.

### Pass 5 — Runtime channel adapter (solo == co-op with one peer)
- ✅ `lib/runtime/runtimeChannel.ts` — `LocalChannel` (in-mem pub/sub),
  `RealtimeChannel` (Supabase Realtime, dynamically imported, falls back to
  local when Supabase is absent), `createRuntimeChannel(id, mode)` factory.

---

## What follow-on PRs need to land (Passes 2 / 4 / 6 / 7 / 8)

Each item below is small enough to ship in a single PR and references the
locked decisions above so future-me doesn't have to relitigate.

### Pass 2 — Universal editor
- Single `<UniversalEditor target={…} />` surface that:
  * accepts any starter listed in decision #4,
  * routes to type-specific child editors,
  * persists drafts via the existing `dreamdm/draft` machinery.
- Replace per-surface "edit" entry points one consumer at a time; do **not**
  big-bang.

### Pass 4 — Multi-instance Engin manager
- `lib/runtime/instanceManager.ts` — keyed by `${engin}:${instanceId}`.
- Solo and co-op instances are the same row; they only differ in their
  `runtimeChannel` adapter (decision #3 — same identity, channel does the
  rest).
- Persist instance list in Supabase + local mirror.

### Pass 6 — Universal drag/drop
- One `useDragSurface` hook + drop-target registry.
- Coerces dropped payloads using decision #4's starter list before handing
  off to the editor (Pass 2) or the channel (Pass 5).

### Pass 7 — Consent flow
- `acceptIncoming` policy table per decision #7: auto for in-session peers,
  prompt-chip for outside-session.
- Reuses the existing notification/centre primitives — no new modal stack.

### Pass 8 — Co-op pack
- First Engin: **StarMakerEngin** (decision #9). Wire its existing
  collab-studio surface to a `RealtimeChannel`. Solo path keeps using a
  `LocalChannel` — same component tree.
- Second Engin: `CodeEditorEngin`. Third: `VideoPlayerEngin`.
- Each Engin's manifest sets `coop: { affordances: […] }` so the host knows
  what to wire (presence cursor, broadcast state, hand-off, etc.).

---

## Guardrails for follow-on work

1. **Never branch the React tree on solo vs co-op.** If you find yourself
   writing `if (isShared) <CoopThing /> else <SoloThing />`, you are doing
   it wrong. Swap the channel, not the component.
2. **Never add `onDoubleClick` outside the home particle.** If a future
   feature genuinely needs it, write the lint rule first and ship the rule
   in the same PR as the exception.
3. **Default to "park where you let go".** `decideBarRelease` is the
   reference behaviour. Any future drag surface that snaps without a fling
   is a bug.
4. **Top runtime stays collapsed on cold load** (decision #10). Solo users
   never see a forced second pane.
