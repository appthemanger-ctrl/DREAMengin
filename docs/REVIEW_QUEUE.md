# DREAMengin — Review Queue

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)
> **Process:** Naming Authority enforcement pass — April 2026
> **Rule:** Files in this queue are NOT deleted. Owner reviews and decides: keep, rename, wire, or delete.

---

## How to use this file

For each entry: read the description, look at the file, then decide:
- **K** — Keep as-is (add justification to NAMING_AUTHORITY if the name is canonical)
- **R** — Rename to a canonical name (agent will implement after you decide the new name)
- **W** — Wire it into a surface (specify which surface/region)
- **D** — Delete it

---

## Queue

### 1. `components/home/dream.NeuralSeamCanvas.tsx`

| Field | Value |
|---|---|
| **Consumer** | `components/home/dream.bar.PersistentDreamBar.tsx` (imported and rendered) |
| **Description** | Renders a Canvas overlay at the DreamDM Bar seam, visualizing cross-Engin data emissions as glowing particles. Pure Canvas 2D, no Three.js. Actually makes the OS data bus visible. |
| **Recommendation** | **K (Keep)** — this has a real semantic purpose (OS bus visualization at the seam). The name "NeuralSeamCanvas" could be renamed to `dream.scene.SeamBridgeCanvas.tsx` (`scene` is a canonical sub-prefix). Flag for owner: the "Neural" prefix is not in NAMING_AUTHORITY but the component is not decorative. |

---

### 2. `dreamdmbar/homedream/dream.homedream.HomeDream.tsx`

| Field | Value |
|---|---|
| **Consumer** | None found (orphan) |
| **Description** | A full Dream Window widget-based HomeDream composition with left/right rails, Dream Window grid, DreamRadialMenu, SystemRadialMenu, SharedDreamShell, and FeaturedCartridges. Uses `DreamNavControls` from the dreamnav namespace. |
| **Recommendation** | **W (Wire)** — this is the canonical widget-based HomeDream layout. Should be wired into `dream.RuntimeView.tsx` as the primary HomeDream Surface composition (replacing or alongside `HomeDreamSurface`). Requires resolving the `DreamNavControls` dependency first (see item 3 below). Owner decision needed: does HomeDream show the feed-first view (current `HomeDreamSurface`) or the widget-first view (this file), or both switchable? |

---

### 3. `components/dreamnav/dreamsurface.dreamnav.tsx` + `components/dreamnav/dream.DreamNavControls.tsx`

| Field | Value |
|---|---|
| **Consumers** | `dreamsurface.dreamnav.tsx` is imported by: `components/dreamengin/dreamsurface.dreamengin.tsx`, `components/dreamengin/dream.overlay.ViewAllDreamsOverlay.tsx`, `components/dreamengin/dream.menu.OutdreamMenu.tsx`. `dream.DreamNavControls.tsx` is imported by: `dreamdmbar/homedream/dream.homedream.HomeDream.tsx`. |
| **Description** | `dreamsurface.dreamnav.tsx` is a React Context provider for spatial navigation (DreamNav). Uses `lib/dreamnav/` (delta, path, gestures). `dream.DreamNavControls.tsx` renders the Gold Button (home button) with DreamNav dispatch. |
| **Recommendation** | **Ambiguous** — has real consumers but the prior conversation analysis says "nothing dispatches to it." The `DreamNavProvider` is mounted by `dreamsurface.dreamengin.tsx` but no component may be dispatching nav actions. Needs owner review: is this the spatial navigation system you want, or is it dead weight? If dead: delete all 3 files (`dreamsurface.dreamnav.tsx`, `dream.DreamNavControls.tsx`, and `lib/dreamnav/`). If alive: wire properly and document in NAMING_AUTHORITY. |

---

### 4. `components/dreamengin/dream.menu.NexusMenu.tsx`

| Field | Value |
|---|---|
| **Consumer** | Unknown — needs investigation |
| **Description** | "Nexus" is not in NAMING_AUTHORITY. Name was invented by an agent. |
| **Recommendation** | **R** — if the menu has a real purpose, rename to a canonical `dream.menu.*` name. If it duplicates an existing menu, delete. |

---

### 5. `components/dreamengin/dream.menu.OutdreamMenu.tsx`

| Field | Value |
|---|---|
| **Consumer** | `components/dreamengin/dreamsurface.dreamengin.tsx` |
| **Description** | "Outdream" is not in NAMING_AUTHORITY. Imports from `dreamnav` namespace. Has real rendering logic for spatial navigation. |
| **Recommendation** | **R** — rename to a canonical `dream.menu.*` name. Requires resolving dreamnav dependency first (item 3). |

---

### 6. `components/dream.AIAssistant.tsx`

| Field | Value |
|---|---|
| **Consumer** | None found |
| **Description** | Generic "AIAssistant" — violates the AI triad law. DREAMengin has three AI agents: Dr. Eams (user-facing), IDARi (admin), TheBoogieMan.Ai (system). A generic "AIAssistant" is not canonical. |
| **Recommendation** | **D** — if it duplicates Dr. Eams functionality, delete. If it contains unique logic, extract to the appropriate `dr-eams/` or `components/idari/` location and rename. |

---

### 7. `components/dream.PhysicsLab.tsx`

| Field | Value |
|---|---|
| **Consumer** | None found |
| **Description** | 24 KB physics lab component. Lab work belongs in `engins/engin.LabEngin.tsx` or `components/engines/lab/`. |
| **Recommendation** | **W** — if the physics functionality is needed, move to `components/engines/lab/` or extract relevant parts into LabEngin. Otherwise delete. |

---

### 8. `components/dreamengin/dream.BabylonWorkspace.tsx`

| Field | Value |
|---|---|
| **Consumer** | Referenced in comment in `app/dreamengin/page.tsx` only (not imported) |
| **Description** | "Workspace" is banned per NAMING_AUTHORITY. File is a Babylon.js workspace component. |
| **Recommendation** | **R** — if the Babylon.js scene is needed, rename to `dream.scene.BabylonDreamScene.tsx` (`scene` is a canonical sub-prefix). Otherwise delete. |

---

### 9. `components/dreamengin/dream.scene.PortfolioOptimizationScene.tsx`

| Field | Value |
|---|---|
| **Consumer** | Unknown |
| **Description** | "PortfolioOptimization" is not in NAMING_AUTHORITY. Sounds like an unrelated financial tool grafted into DREAMengin. |
| **Recommendation** | **D** — high probability of deletion. Owner should confirm this scene is wanted before any rename. |

---

### 10. `components/dreamengin/dream.widget.AppearanceWidget.tsx`

| Field | Value |
|---|---|
| **Consumer** | Unknown |
| **Description** | Appearance settings should live in `/settings/appearance`, not as a free-floating widget. "Widget" here violates the Dream Window naming law (say Dream Window, not widget). |
| **Recommendation** | **D** or **W** — if appearance settings are needed inline, wire into the settings panel. Delete the free-floating widget. |

---

### 11. `components/dream.HomeFeed.tsx` (39 KB)

| Field | Value |
|---|---|
| **Consumer** | `dreamdmbar/homedream/dream.homedream.HomeDreamSurface.tsx` |
| **Description** | "HomeFeed" is not a canonical name prefix (sub-prefix `Home` is not in NAMING_AUTHORITY). However, the component has a real consumer (HomeDreamSurface) and renders the live merged feed. |
| **Recommendation** | **K (Keep, note for rename)** — the component is real and load-bearing. Owner should decide whether to rename it to `dream.HomeDream.FeedView` or keep as-is. Because it is actively consumed, do not delete without updating HomeDreamSurface. |

---

### 12. `components/dream.HomeSpace.tsx` + `components/dream.HomeRadialNav.tsx` + `components/dream.InnerDreamsButton.tsx`

| Field | Value |
|---|---|
| **Consumer** | None found for any of these |
| **Description** | All three have "Home" in the name. None are consumed by the HomeDream region. Orphaned. |
| **Recommendation** | **D** — all three are orphaned. Delete unless owner identifies a consumer or wiring target. |

---

### 13. `components/dream.ThemeToggle.tsx` + `components/dream.VoidThemeToggle.tsx` + `components/dream.ThemeApplicator.tsx`

| Field | Value |
|---|---|
| **Consumer** | Unknown |
| **Description** | Three theme toggle components. Only one should exist. Duplicates are leeches. |
| **Recommendation** | Pick one, delete the other two. Owner decides which is canonical. |

---

### 14. `components/dream.DrEamsModeToggle.tsx` + `components/dream.DrEamsVoiceAssistant.tsx`

| Field | Value |
|---|---|
| **Consumer** | Unknown |
| **Description** | Two Dr. Eams entry points outside the Dr. Eams panel. The canonical Dr. Eams surface is `dr-eams/` and `components/dreamengin/dream.panel.DrEamsPanel.tsx`. |
| **Recommendation** | **D or W** — if these are entry points (buttons), wire them into the existing Dr. Eams panel. If they duplicate the panel, delete. |

---

### 15. `components/dream.MessagesClient.tsx` (37 KB)

| Field | Value |
|---|---|
| **Consumer** | Unknown — may be consumed by messaging route |
| **Description** | Large messages client. Should live in `components/messaging/` per the repository structure. |
| **Recommendation** | **W** — move to `components/messaging/` and rename to `dream.shell.MessagesShell.tsx` or similar canonical name. Update importers. |

---

### 16. `components/dream.ForgeDreamCanvas.tsx`

| Field | Value |
|---|---|
| **Consumer** | Unknown |
| **Description** | Forge canvas. Should live in `components/forge/` or be part of `engins/dream.ForgeEngin.tsx`. |
| **Recommendation** | **W** — move to `components/forge/` and rename canonically. |

---

### 17. `components/dream.panel.ChildSafetyPanel.tsx` (29 KB)

| Field | Value |
|---|---|
| **Consumer** | Unknown |
| **Description** | Child safety panel. Should live under a safety surface or `/settings/safety`, not loose at the components root. |
| **Recommendation** | **W** — move to `components/panels/dream.panel.SafetyPanel.tsx` (if a SafetyPanel doesn't already exist there) and update importers. |

---

### 18. `components/dream.panel.IDariPanel.tsx`

| Field | Value |
|---|---|
| **Consumer** | Unknown |
| **Description** | IDARi panel. Should live under `components/idari/`. Currently at components root. |
| **Recommendation** | **W** — move to `components/idari/dream.panel.IDariPanel.tsx` and update importers. |

---

### 19. `components/dream.universal_asset_registry.tsx` (56 KB)

| Field | Value |
|---|---|
| **Consumer** | Unknown |
| **Description** | Uses snake_case (codebase uses camelCase). 56 KB. Very large. "universal_asset_registry" is not in NAMING_AUTHORITY. |
| **Recommendation** | **Ambiguous** — owner review needed. If real, rename to `dream.AssetRegistry.tsx` and move to an appropriate subdirectory. |

---

### 20. `components/dream.ActiveModuleSurface.tsx`

| Field | Value |
|---|---|
| **Consumer** | `dreamdmbar/homedream/dream.homedream.HomeDreamSurface.tsx` |
| **Description** | "ActiveModuleSurface" is not in NAMING_AUTHORITY. Has a real consumer. Renders modular windows with absolute positioning. |
| **Recommendation** | **R** — rename to `dreamsurface.module.ActiveSurface.tsx` (`dreamsurface.module` is a canonical sub-prefix). Update consumer. |

---

## How changes are tracked

All executed changes (renames, deletions, moves) are logged in `docs/TRIAGE_LOG.md`.
