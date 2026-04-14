# DREAMengin Handoff

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Last updated: 2026-04-01

## What changed in this alignment pass

This handoff reflects the **Deployment & Memory Audit** — ensuring all GitHub Actions
that handle document updates, memory syncing, and handoffs trigger on every push to
`completedream`, and aligning docs to the new Engine architecture.

### Primary outcome

- `github-actions.yml` (main CI/CD pipeline) now includes `completedream` in both
  `push` and `pull_request` branch triggers.
- `spec-engin-ai-agent.yml` (doc/code AI scanner) now includes `completedream` in its
  `push` branch triggers.
- All other document-update, memory-sync, and handoff workflows already covered
  `completedream` (`update-handoff.yml`, `update-readme.yml`, `update-bugs.yml`,
  `update-repo-state.yml`, `sync-build-memory.yml`, `check-build-memory-drift.yml`).
- `docs/ARCHITECTURE.md` gains **§12 Runtime Memory Architecture** — full documented
  spec for `SharedArrayBuffer` memory map (16 MB, entity SoA, HomeDream private region,
  DreamDM Bar seam slot) and `EnginDispatcher` singleton (worker pool, SAB allocation,
  zero-copy seam relay, µs/tick telemetry, bounds audit).
- `docs/AGENT_PLAYBOOK.md` Key File Map now lists `lib/runtime/memory.ts`,
  `lib/runtime/EnginDispatcher.ts`, and `lib/navigation/StructureLedger.ts`; tech-stack
  table includes the `SharedArrayBuffer` + shader `Worker` pool row with a pointer to
  the new ARCHITECTURE §12.

### Key files introduced in this architecture (already in repo, now documented)

| File | Role |
|------|------|
| `lib/runtime/memory.ts` | 16 MB SAB layout — entity SoA arrays, bar seam slot, HomeDream privacy boundary |
| `lib/runtime/EnginDispatcher.ts` | Singleton dispatcher — SAB lifecycle, worker pool, telemetry, BoogieMan audit |
| `public/workers/engin-shader.worker.ts` | Per-worker Atomics.wait / rAF tick loop |
| `tests/engin-dispatcher.test.ts` | Dispatcher lifecycle and bounds-enforcement unit tests |
| `tests/conform-memory-map.test.ts` | Memory map conformance tests |
| `lib/navigation/StructureLedger.ts` | Precomputed O(1) navigation state/transition ledger |

### What has NOT changed

The underlying `lib/runtime/` implementation was already in place. This pass only
ensures the documentation catches up to the existing code reality so agents and
developers find accurate orientation from the start of every session.

---



### Primary outcome

All docs, canonical name registry, and tests now use the OS-layer naming model:
- DREAMengin is a **DreamDM-Bar-led spatial operating environment**
- Surfaces (not pages), Dream Windows (not widgets), DreamSpace (not widget layer)
- Connection language: bind / mount / activate (not link widget / open page)
- Multi-surface, multi-engin connection network (not 1-to-1 pairs)

### Canonical names now documented first

**Product type:**
- DREAMengin Runtime Environment (DreamDM-Bar-led spatial operating environment)

**Runtime regions:**
- HomeDream Surface (root operating surface / underlying feed layer)
- DreamSpace (revealed secondary layer owned by the bar)
- DreamDM Bar / Runtime Seam (Persistent Interaction Rail / top-layer main attraction)

**Core surfaces:**
- HomeDream Surface
- Edit ProfileDream Surface
- View Profile Surface

**Daydream Surface Network:**
- Music Daydream Surface / StarMakerEngin
- Games Daydream Surface / GameEngin
- Lab Daydream Surface / LabEngin
- Code Daydream Surface / CodeEngin
- Brand Daydream Surface / BrandingEngin
- Create Daydream Surface / ContentEngin

**Platform modules:**
- DreamShop Surface
- DreamMarketplace Surface
- DreamMenu
- DreamDM Surface
- DreamAds Surface
- Dream Windows (modular runtime containers)

**AI triad:**
- Dr. Eams
- IDARi
- TheBoogieMan.Ai

## Current repo reality

- Canonical routes exist for `/homedream`, `/edit-profiledream`, and `/view-profile`.
- Legacy support routes still exist for `/home`, `/edit-profile`, `/profile`, and `/u/[handle]`.
- The public/shared profile destination in the current repo is still `/profile/[handle]`.
- The Dream Window layer already exists in `components/dreams/*` while legacy widget material still exists in `components/widgets/*`.
- Code-level naming (variable names, component names) may still use legacy "widget" terminology internally — these are residuals to be resolved progressively.

## Next repo steps

1. Continue renaming UI labels and internal docs toward OS-layer canonical names.
2. Progressively rename internal code references from "widget" to "Dream Window" where it adds clarity.
3. Tighten HomeDream Surface → Edit ProfileDream Surface → View Profile Surface projection boundaries in code.
4. Keep additions minimal and prefer moving or re-wiring what already exists.
5. Ensure all new Dream Window data structures carry the 10 required fields.

## Change Timeline

| # | Date / Time (UTC) | Revision | Branch | Author | Summary |
|---|---|---|---|---|---|
| **auto** | 2026-04-14 15:01 UTC | `8911b62` | copilot/fix-game-window-and-robot-movement | Copilot | ~2 modified<br>fix(madmaxi): game canvas above remote, robot ground contact, fast fall, faster enemies — Reasoning: 1. Layout (engins/GameEngin.tsx) — game stage div changed from inset:0 to    bottom: max(var(--de-hud-bottom,175px), clamp(80px,22dvh,38dvh)). The    MobileGameHUD already sets --de-hud-bottom; this ensures the Babylon    canvas stops above the HUD overlay so touching the remote in portrait    mode does not obscure the character. Mirrors the existing    ImmersiveGameShell pattern.  2. Player ground contact (PLAYER_RIG_Y_OFFSET = 2.0 BU) — the detailed    landing-grade rig (arms, legs, boots) extends ~3.2 BU below the root    node which sits at the 40-px hitbox centre. Without the lift the boots    sink ~2 BU below the platform surface. The constant raises the visual    root while physics hitbox is unchanged.  3. Asymmetric fall gravity (FALL_GRAV_MUL = 3.0) — gravity on the upward    arc is unchanged (1×). Once the robot tips into a downward trajectory    gravity ramps linearly from 1× toward 3× as pvy approaches    MAX_FALL (terminal velocity), giving the requested "jet burst up,    drops fast" feel without altering jump height.  4. Jump/walk speed — JUMP_VY 0.578 → 0.68 (+17.6%), WALK_SPD 0.098 → 0.145    (+48%) for a more responsive, robot-like pace.  5. Enemy speed multipliers — runner ×1.5, charger ×1.8, hopper ×1.25,    flyer ×1.1, zigzag ×1.35, burrower ×1.0, spiker ×1.0, shadow 2.4px/f    base. Enemies are now visibly faster and more threatening.  Architecture justification: gameplay tuning falls under product code (app/, components/, lib/) per IDARI_CONTRACT §3. Performance impact: neutral — no additional draw calls or allocations.  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/346fdd6f-b068-4192-9e74-97c267d0551f  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/games/madmaxi/MadmaxiGame.tsx`, `engins/GameEngin.tsx` |
| **auto** | 2026-04-14 14:13 UTC | `d7a0a04` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #525 from appthemanger-ctrl/copilot/replace-stylized-with-synchronized — feat: replace stale "Stylized" references with "Synchronized" in source comments<br> |
| **auto** | 2026-04-14 13:00 UTC | `91b70d5` | copilot/replace-stylized-with-synchronized | Copilot | ~3 modified<br>feat: replace "Stylized" with "Synchronized" in source code comments — Reasoning: The SICC framework first principle was renamed from "Stylized" to "Synchronized" (see docs/PRINCIPLES_UPDATE.md). Three source-code comment references still used the old name. Architecture justification: SICC is the UI quality framework; keeping comments aligned with the updated principle (docs/PRINCIPLES_UPDATE.md, CHANGELOG.md). Performance impact: neutral — comments only, no runtime behaviour changed.  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/114035f0-10a9-4657-9198-7d0b125f2f6e  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/LandingHero.tsx`, `components/home/DaydreamPulseStrip.tsx`, `lib/feature-build/buildCycle.ts` |
| **auto** | 2026-04-14 12:54 UTC | `9a768fd` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #524 from appthemanger-ctrl/copilot/update-sicc-principles — feat: update SICC framework — replace "Stylized" with "Synchronized"<br> |
| **auto** | 2026-04-14 11:07 UTC | `a9f3d08` | copilot/update-sicc-principles | Copilot | +1 added  ~4 modified<br>feat: update SICC framework — replace Stylized with Synchronized — Reasoning: The SICC framework first principle is updated from "Stylized" to "Synchronized" to refocus the platform on real-time coordination, shared state, and immediate feedback rather than visual decoration.  Architecture justification: SICC is the UI quality framework defined in lib/feature-build/uiQualityCriteria.ts and enforced in the REFINE build phase. Updating the principle aligns the quality criteria with the platform's collaborative/real-time product direction.  Performance impact: neutral — documentation and type constants only, no runtime behaviour changed.  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/608f3765-ed20-43ea-a615-d90ad3c66398  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `docs/PRINCIPLES_UPDATE.md`<br>✏️: `CHANGELOG.md`, `components/connectors/ConnectorWidgetPicker.tsx`, `lib/feature-build/uiQualityCriteria.ts`, `tests/feature-build.test.ts` |

## What changed in this alignment pass

This handoff reflects the README-first documentation cleanup.

### Primary outcome
The docs now treat `README.md` as the authoritative full specification and use spec-first names across the implementation docs.

### Canonical names now documented first
- HomeDream
- EditProfileDream
- ViewProfile
- DayDreams
- Engins
- Dreams
- DreamShop
- DreamMarketplace
- DreamMenu
- DreamDM
- DreamDMBar
- DreamAds
- Dr. Eams
- iDARI
- TheBoogieMan.Ai

## Current repo reality

- Canonical routes exist for `/homedream`, `/edit-profiledream`, and `/view-profile`.
- Legacy support routes still exist for `/home`, `/edit-profile`, `/profile`, and `/u/[handle]`.
- The public/shared profile destination in the current repo is still `/profile/[handle]`.
- The Dreams layer already exists in `components/dreams/*` while legacy widget material still exists in `components/widgets/*`.

## Next repo steps

1. Keep renaming UI labels and internal docs toward spec names.
2. Continue repurposing legacy extras into the spec instead of preserving them as separate product names.
3. Tighten HomeDream → EditProfileDream → ViewProfile projection boundaries in code.
4. Keep additions minimal and prefer moving or re-wiring what already exists.

## Tracking doc

Use `docs/alignment/DOCS_CHANGE_TRACKER.md` as the ledger for this pass.

## Change Timeline

| # | Date / Time (UTC) | Revision | Branch | Author | Summary |
|---|---|---|---|---|---|
| **auto** | 2026-03-15 23:02 UTC | `c513b3f` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #216 from appthemanger-ctrl/copilot/clean-up-unused-resources — chore: strip all mock/demo/placeholder code — wire every surface to real data<br> |
| **auto** | 2026-03-15 22:00 UTC | `5017632` | copilot/clean-up-unused-resources | Copilot | +1 added  −6 deleted  ~9 modified<br>chore: remove all mock/demo/placeholder code - complete housekeeping — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `app/daydream/game/GamePageClient.tsx`<br>✏️: `app/profile/[handle]/page.tsx`, `app/settings/safety/page.tsx`, `app/view-profile/page.tsx`, `backend/src/services/ipfsService.js`, `backend/src/services/livekitService.js`, `components/AnchorWidgetOrchestrator.tsx`, `components/dreamengin/NexusMenu.tsx`, `components/profile/ProfileWidgetGrid.tsx`, `validate-deployment.js`<br>🗑️: `components/AdvancedSearch.tsx`, `components/FloatingActionBubble.tsx`, `components/GestureNavigationDemo.tsx`, `components/MobileFloatingActionButton.tsx`, `lib/connectors/demo.ts`, `lib/navigation/mockWidgetData.ts` |
| **auto** | 2026-03-15 21:42 UTC | `6c4a89a` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #215 from appthemanger-ctrl/copilot/implement-daydreams-description-route — fix: full platform wiring audit — daydreams discoverable, all dead actions wired, all broken routes fixed<br> |
| **auto** | 2026-03-15 20:53 UTC | `3e821e0` | completedream | appthemanger-ctrl | −1 deleted<br>Delete daydream/game directory<br>🗑️: `daydream/game/GamePageClient_app.tsx` |
| **auto** | 2026-03-15 20:46 UTC | `e8e98a3` | completedream | appthemanger-ctrl | +1 added  −1 deleted<br>Add GamePageClient_app.tsx file<br>➕: `daydream/game/GamePageClient_app.tsx`<br>🗑️: `app/game/GamePageClient.tsx` |
