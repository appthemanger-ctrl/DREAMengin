# NOT FOR USE IN THIS VERSION

These components have been superseded, conflict with the current design spec,
or belong to an earlier architecture (v1 / old spatial / old nav system).

**Do not import from this folder in production code.**

## Why they were moved here (not deleted)

- Preserves git history and intent
- May contain logic worth referencing for future features
- Keeps the active `components/` folder clean and spec-compliant

## What replaced what

| Deprecated | Replaced by |
|---|---|
| `dreamengin/OutdreamMenu.tsx` | `menus/DreamRadialMenu.tsx` + `menus/MenuPanel.tsx` |
| `dreamengin/NexusMenu.tsx` | `menus/SystemRadialMenu.tsx` + `menus/MenuPanel.tsx` |
| `dreamengin/HomeControls.tsx` | `dreamnav/DreamNavControls.tsx` |
| `dreamengin/DreamenginApp.tsx` | `home/HomeSystem.tsx` + `dreamnav/DreamNavControls.tsx` |
| `controls/HomeControls.tsx` | `dreamnav/DreamNavControls.tsx` |
| `InnerDreams.tsx` | `Idari.tsx` |
| `InnerDreamsButton.tsx` | `IdariButton.tsx` |
| `NavBar.tsx` / `NavBar-enhanced.tsx` / `MobileNavBarEnhanced.tsx` | No nav bar — Golden Button is the nav system (SPEC §3) |
| `HomeDashboard.tsx` | `dreamnav/HomeDreamRuntime.tsx` + `home/HomeSystem.tsx` |
| `HomeFeed.tsx` | `dreamnav/HomeFeedWidgetGrid.tsx` |
| `HomeSpace.tsx` / `spatial/HomeSpace.tsx` | `dreamnav/HomeDreamRuntime.tsx` |
| `ProfileSpace.tsx` / `spatial/ProfileSpace.tsx` | `profile/ProfileCanvas.tsx` |
| `spatial/*` | `dreamnav/` + `daydream/DaydreamShell.tsx` |
| `universe/*` | `dreamengin/StarfieldCanvas.tsx` + `widgets/SnowBackground.tsx` |
| `v1-ui/*` | `widgets/` + `dreamnav/HomeFeedWidgetGrid.tsx` |
| `three/DreamScene.tsx` | `dreamengin/BabylonWorkspace.tsx` (Babylon preferred per ARCHITECTURE §2) |
| `shaders/NeonGlow.tsx` | No replacement — NEON is explicitly forbidden (SPEC §9) |
| `shaders/LightningWing.tsx` | No replacement |
| `shaders/Refractor.tsx` | No replacement |
| `WheelLayout.tsx` | Widget grid layout in `dreamnav/HomeFeedWidgetGrid.tsx` |
| `DashboardLayout.tsx` / `DashboardLayout-enhanced.tsx` | `home/HomeSystem.tsx` |
| `FloatingActionBubble.tsx` | `dreamnav/DreamNavControls.tsx` |
| `StarsBackground.tsx` | `widgets/SnowBackground.tsx` + `dreamengin/StarfieldCanvas.tsx` |
| `menus/RadialMenu.tsx` | `menus/MenuPanel.tsx` |
| `GestureNavigationDemo.tsx` | Demo page — not production |
| `AnchorWidget.tsx` / `AnchorWidgetOrchestrator.tsx` | `dreamnav/HomeDreamRuntime.tsx` anchor system |
| `ShrunkMode.tsx` | `dreamnav/HomeDreamRuntime.tsx` |
| `DragToAnchorClose.tsx` | Not needed in current architecture |
| `TopBar.tsx` | No top bar — SPEC §3 prohibits traditional nav bars |

## Design violations that caused deprecation

Per `docs/SPEC.md §9` (Anti-Patterns):
- No neon, dark-gamer colors, or random decoration → NeonGlow, LightningWing, StarsBackground
- No radial menus with dark overlays → OutdreamMenu, NexusMenu
- No traditional nav bars → NavBar, MobileNavBarEnhanced
- No route-based navigation as primary UX → old DashboardLayout system
- No duplicate runtimes → HomeSpace duplicates, SpatialShell duplicates
