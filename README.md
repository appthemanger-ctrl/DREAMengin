# DREAMengin

**Spatial creative operating environment with one fixed engine + swappable rule-sets.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/) [![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-orange?logo=pnpm)](https://pnpm.io/workspaces) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Live Demo](https://img.shields.io/badge/Live-dreamengin.vercel.app-000?logo=vercel)](https://dreamengin.vercel.app)

## 🗺️ Visual Repository Schematic
See [`VISUAL-SCHEMATIC.md`](VISUAL-SCHEMATIC.md) for a live, auto-updated visual map of every file, function, and connection in this repo — including orphan/floating nodes. Live viewer: https://appthemanger-ctrl.github.io/DREAMengin/

## What is DREAMengin?
DREAMengin is a spatial creative operating environment built around the **Creative Operating Law**: one fixed engine for universal concerns (state, I/O, events, security), and swappable rule-sets for product behavior. In practice, this means HomeDream, DreamSpace, Dream Windows, Engins, messaging, media, and commerce all share one runtime contract instead of each feature inventing its own stack.

The repository follows the five architecture rules documented in `.cursorrules` and `AGENTS.md`: (1) one fixed engine, (2) unique behavior in external rule-sets, (3) rule-sets contain constraints/transformations/parameters only, (4) engine applies rule-set to base state to produce outcomes, and (5) behavior changes by swapping rule-sets instead of rewriting the engine.

For readers new to the project: DREAMengin is closer to an OS shell than a single app. Surfaces are mounted into runtime regions, Engins provide domain-specific tools, and collaboration/transport modes can switch from solo to co-op without swapping component trees.
## Table of Contents
- [4. Tech Stack & Monorepo Layout](#tech-stack-monorepo-layout)
- [5. The Engins](#the-engins)
- [6. Dual Runtimes](#dual-runtimes)
- [7. Shared Dreams](#shared-dreams)
- [8. Dreamr — Human Media](#dreamr---human-media)
- [9. The Shop](#the-shop)
- [10. The Marketplace](#the-marketplace)
- [11. Ads & User Ads](#ads-user-ads)
- [12. The DmBar (`dreamdmbar/`)](#the-dmbar-dreamdmbar)
- [13. Messaging](#messaging)
- [14. HomeDream](#homedream)
- [15. DreamSpace](#dreamspace)
- [16. Dreams (Widgets / Windows / Surfaces)](#dreams-widgets-windows-surfaces)
- [17. User-Facing Modularity](#user-facing-modularity)
- [18. Custom Engins](#custom-engins)
- [19. Full Website Customizability](#full-website-customizability)
- [20. Backend, System, Core & CoreSurfaces](#backend-system-core-coresurfaces)
- [21. Agents & Workflow](#agents-workflow)
- [22. Research, Experiments & Daydreams](#research-experiments-daydreams)
- [23. Infra & Ops](#infra-ops)
- [24. Testing](#testing)
- [25. Getting Started](#getting-started)
- [26. Environment Variables](#environment-variables)
- [27. Contributing](#contributing)
- [28. License](#license)

## Tech Stack & Monorepo Layout
Auto-synced from `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig*.json`, `next.config.*`, `eslint.config.*`, `tailwind.config.*`, `vercel.json`, `.env*.example`, `Dockerfile*` using repository introspection.
- Files tracked: **12**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Tech Stack & Monorepo Layout file structure
```text
├── .env.example
├── .env.local.example
├── eslint.config.mjs
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tailwind.config.ts
├── tsconfig.games.json
├── tsconfig.gamesengin.json
├── tsconfig.json
└── vercel.json
```
<details><summary>Tech Stack & Monorepo Layout file index (12 files)</summary>

- `.env.example` — project file (example).
- `.env.local.example` — project file (example).
- `eslint.config.mjs` — TypeScript/JavaScript runtime module.
- `next.config.mjs` — TypeScript/JavaScript runtime module.
- `package.json` — project file (json).
- `pnpm-lock.yaml` — project file (yaml).
- `pnpm-workspace.yaml` — project file (yaml).
- `tailwind.config.ts` — TypeScript/JavaScript runtime module.
- `tsconfig.games.json` — project file (json).
- `tsconfig.gamesengin.json` — project file (json).
- `tsconfig.json` — project file (json).
- `vercel.json` — project file (json).

</details>

## The Engins
Auto-synced from `engins/**`, `components/runtime/**`, `lib/runtime/**`, `lib/dreamdm/**` using repository introspection.
- Files tracked: **57**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `AutoOpenGameEngin`, `BrandingEngin`, `CodeEngin`, `ContentEngin`, `DreamSystemContext`, `DualRuntimeContainer`, `ForgeEngin`, `GameEngin`, +9 more
#### The Engins file structure
```text
├── components
│   └── runtime
│       ├── dream.DualRuntimeContainer.tsx
│       ├── dream.RuntimeView.tsx
│       └── dream.shell.RuntimeShell.tsx
├── engins
│   ├── CodeEngin
│   │   ├── core
│   │   │   └── parser.ts
│   │   ├── modules
│   │   │   └── ai-co-pilot
│   │   │       ├── dream.panel.AgentPanel.tsx
│   │   │       ├── index.ts
│   │   │       └── useAgentSession.ts
│   │   └── orchestrator
│   │       └── dream.index.tsx
│   ├── autoopen
│   │   └── dream.AutoOpenGameEngin.tsx
│   ├── dream.ForgeEngin.tsx
│   ├── dream.QuantumCircuitCanvas.tsx
│   ├── dream.panel.AnalyticsEngin.tsx
│   ├── engin.BrandingEngin.tsx
│   ├── engin.CodeEngin.tsx
│   ├── engin.ContentEngin.tsx
│   ├── engin.GameEngin.tsx
│   ├── engin.LabEngin.tsx
│   ├── engin.StarMakerEngin.tsx
│   └── portfolio
│       └── dream.PortfolioEngin.tsx
└── lib
    ├── dreamdm
    │   ├── DreamSystemContext.tsx
    │   ├── barInteractions.ts
    │   ├── bridgeSeamFlow.ts
    │   ├── useDreamBarContext.ts
    │   ├── useDreamDMConversations.ts
    │   ├── useDreamDMDraft.ts
    │   ├── useDreamDMMessages.ts
    │   ├── useDreamSearch.ts
    │   ├── useMessagingCore.ts
    │   ├── useModuleBarIntent.ts
    │   └── useNotifications.ts
    └── runtime
        ├── EnginDispatcher.ts
        ├── channelMetrics.ts
        ├── coercionTable.ts
        ├── dreamOSBus.ts
        ├── dropTargetRegistry.ts
        ├── dualRuntime.ts
        ├── dualRuntimeBridge.ts
        ├── enginWorkflowRegistry.ts
        ├── instanceManager.ts
        ├── isAuthRelatedError.ts
        ├── madMaxiSnapshotBridge.ts
        ├── memory.ts
        ├── moduleRegistry.ts
        ├── offlineQueue.ts
        ├── quantumCircuit.ts
        ├── runtimeChannel.ts
        ├── runtimeContainer.ts
        ├── seamClipboard.ts
        ├── sharedResourcePool.ts
        ├── snapshotFingerprint.ts
        ├── swapManager.ts
        ├── useDragSurface.ts
        ├── useDualRuntime.ts
        ├── useDualRuntimePersistence.ts
        ├── useEnginBridge.ts
        ├── useEnginCoopSync.ts
        └── useSharedEnginChannel.ts
```
<details><summary>The Engins file index (57 files)</summary>

- `components/runtime/dream.DualRuntimeContainer.tsx` — React UI module for DualRuntimeContainer.
- `components/runtime/dream.RuntimeView.tsx` — React UI module for RuntimeView.
- `components/runtime/dream.shell.RuntimeShell.tsx` — React UI module for ShellRuntimeShell.
- `engins/CodeEngin/core/parser.ts` — TypeScript/JavaScript runtime module.
- `engins/CodeEngin/modules/ai-co-pilot/dream.panel.AgentPanel.tsx` — React UI module for PanelAgentPanel.
- `engins/CodeEngin/modules/ai-co-pilot/index.ts` — TypeScript/JavaScript runtime module.
- `engins/CodeEngin/modules/ai-co-pilot/useAgentSession.ts` — TypeScript/JavaScript runtime module.
- `engins/CodeEngin/orchestrator/dream.index.tsx` — React UI module for Index.
- `engins/autoopen/dream.AutoOpenGameEngin.tsx` — React UI module for AutoOpenGameEngin.
- `engins/dream.ForgeEngin.tsx` — React UI module for ForgeEngin.
- `engins/dream.QuantumCircuitCanvas.tsx` — React UI module for QuantumCircuitCanvas.
- `engins/dream.panel.AnalyticsEngin.tsx` — React UI module for PanelAnalyticsEngin.
- `engins/engin.BrandingEngin.tsx` — React UI module for BrandingEngin.
- `engins/engin.CodeEngin.tsx` — React UI module for CodeEngin.
- `engins/engin.ContentEngin.tsx` — React UI module for ContentEngin.
- `engins/engin.GameEngin.tsx` — React UI module for GameEngin.
- `engins/engin.LabEngin.tsx` — React UI module for LabEngin.
- `engins/engin.StarMakerEngin.tsx` — React UI module for StarMakerEngin.
- `engins/portfolio/dream.PortfolioEngin.tsx` — React UI module for PortfolioEngin.
- `lib/dreamdm/DreamSystemContext.tsx` — React UI module for DreamSystemContext.
- `lib/dreamdm/barInteractions.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/bridgeSeamFlow.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamBarContext.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamDMConversations.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamDMDraft.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamDMMessages.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamSearch.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useMessagingCore.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useModuleBarIntent.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useNotifications.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/EnginDispatcher.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/channelMetrics.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/coercionTable.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/dreamOSBus.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/dropTargetRegistry.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/dualRuntime.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/dualRuntimeBridge.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/enginWorkflowRegistry.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/instanceManager.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/isAuthRelatedError.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/madMaxiSnapshotBridge.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/memory.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/moduleRegistry.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/offlineQueue.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/quantumCircuit.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/runtimeChannel.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/runtimeContainer.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/seamClipboard.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/sharedResourcePool.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/snapshotFingerprint.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/swapManager.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/useDragSurface.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/useDualRuntime.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/useDualRuntimePersistence.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/useEnginBridge.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/useEnginCoopSync.ts` — TypeScript/JavaScript runtime module.
- `lib/runtime/useSharedEnginChannel.ts` — TypeScript/JavaScript runtime module.

</details>

## Dual Runtimes
DREAMengin runs two persistent runtime regions separated by the DreamDM seam: **Surface Space** (top) and **DreamSpace** (bottom). `lib/runtime/dualRuntime.ts` defines canonical world state, dominance, and torus navigation so either region can host any world (`HomeDream Surface`, `DreamSpace`, `dream`, `engin`, `panel`, `custom`).

`components/runtime/dream.DualRuntimeContainer.tsx` is the state controller used by layout-level shells, while `lib/runtime/dualRuntimeBridge.ts` provides cross-region event transport, durable queueing, and shared message plumbing. `lib/runtime/useDualRuntimePersistence.ts` persists region/world state through OPFS with localStorage fallback so split/runtime choices survive reloads.

The persistent seam is rendered by `components/home/dream.bar.PersistentDreamBar.tsx` + `dreamdmbar/dreamsurface.dreamdmbar.tsx`, which continuously publishes split-ratio context and keeps both regions mounted.

For compute-heavy parity, the VM pair under `lib/vm/` (`dualVMCoordinator.ts`, `wasmGpuVM.ts`, `inter-vm-messaging.ts`, `resource-quota.ts`, `security.ts`, `snapshot.ts`) enforces quotas, bounds, and snapshot controls while preserving the same rule-set contract in both regions. Solo/co-op parity is maintained through shared runtime channels rather than separate UI implementations.
#### Dual runtime pipeline file structure
```text
├── COOP_AND_SOLO_ROADMAP.md
├── app
│   ├── homedream
│   │   └── page.tsx
│   └── layout.tsx
├── assembly
│   ├── bus.ts
│   ├── index.ts
│   └── mad-maxi-player.ts
├── components
│   ├── dream.OSShellActivator.tsx
│   ├── dreamengin
│   │   ├── dream.CanvasDropZone.tsx
│   │   ├── dream.DREAMenginOS.tsx
│   │   ├── dream.DrEamsCanvas.tsx
│   │   ├── dream.HomeControls.tsx
│   │   ├── dream.bar.DrEamsSearchBar.tsx
│   │   ├── dream.menu.NexusMenu.tsx
│   │   ├── dream.menu.OutdreamMenu.tsx
│   │   ├── dream.overlay.ViewAllDreamsOverlay.tsx
│   │   ├── dream.panel.CrossEnginStatusPanel.tsx
│   │   ├── dream.panel.DrEamsPanel.tsx
│   │   ├── dream.scene.BabylonGameScene.tsx
│   │   ├── dream.scene.DrEamsScene.tsx
│   │   ├── dream.scene.PortfolioOptimizationScene.tsx
│   │   ├── dream.shell.EnginShell.tsx
│   │   ├── dream.widget.AppearanceWidget.tsx
│   │   ├── dreamsurface.dreamengin.tsx
│   │   ├── dreamsurface.dreamspace-runtime.tsx
│   │   └── engine
│   │       ├── math.ts
│   │       └── types.ts
│   ├── home
│   │   └── dream.bar.PersistentDreamBar.tsx
│   └── runtime
│       ├── dream.DualRuntimeContainer.tsx
│       ├── dream.RuntimeView.tsx
│       └── dream.shell.RuntimeShell.tsx
├── dreamdmbar
│   ├── dream.GlowingLight.tsx
│   ├── dreamsurface.dreamdmbar.tsx
│   └── homedream
│       ├── dream.shell.HomeSystem.tsx
│       ├── dreamr
│       │   ├── algorithms
│       │   │   ├── botDetector.ts
│       │   │   └── dreamrAlgorithm.ts
│       │   ├── api
│       │   │   └── route.ts
│       │   ├── dream.DreamRCore.tsx
│       │   ├── dream.DreamRFeed.tsx
│       │   └── dreamsurface.dreamr.tsx
│       ├── dreamsurface.dreamdmbar-grid.tsx
│       └── dreamsurface.homedream.tsx
└── lib
    ├── dreamdm
    │   └── DreamSystemContext.tsx
    ├── runtime
    │   ├── EnginDispatcher.ts
    │   ├── channelMetrics.ts
    │   ├── coercionTable.ts
    │   ├── dreamOSBus.ts
    │   ├── dropTargetRegistry.ts
    │   ├── dualRuntime.ts
    │   ├── dualRuntimeBridge.ts
    │   ├── enginWorkflowRegistry.ts
    │   ├── instanceManager.ts
    │   ├── isAuthRelatedError.ts
    │   ├── memory.ts
    │   ├── moduleRegistry.ts
    │   ├── offlineQueue.ts
    │   ├── quantumCircuit.ts
    │   ├── runtimeChannel.ts
    │   ├── runtimeContainer.ts
    │   ├── seamClipboard.ts
    │   ├── snapshotFingerprint.ts
    │   ├── swapManager.ts
    │   ├── useDragSurface.ts
    │   ├── useDualRuntime.ts
    │   ├── useDualRuntimePersistence.ts
    │   ├── useEnginBridge.ts
    │   ├── useEnginCoopSync.ts
    │   └── useSharedEnginChannel.ts
    └── vm
        ├── README.md
        ├── bufferManager.ts
        ├── bus-events.ts
        ├── dual-runtime.ts
        ├── dualVMCoordinator.ts
        ├── index.ts
        ├── inter-vm-messaging.ts
        ├── pipelineCache.ts
        ├── resource-quota.ts
        ├── security.ts
        ├── snapshot.ts
        ├── types.ts
        ├── wasm-features.ts
        └── wasmGpuVM.ts
```
<details><summary>Dual runtime pipeline file index (81 files)</summary>

- `COOP_AND_SOLO_ROADMAP.md` — Documentation/spec for COOP AND SOLO ROADMAP.
- `app/homedream/page.tsx` — Next.js route page for `/homedream`.
- `app/layout.tsx` — Next.js layout for `/`.
- `assembly/bus.ts` — TypeScript runtime module for bus.
- `assembly/index.ts` — TypeScript runtime module for index.
- `assembly/mad-maxi-player.ts` — TypeScript runtime module for mad maxi player.
- `components/dream.OSShellActivator.tsx` — React UI module for OSShellActivator.
- `components/dreamengin/dream.CanvasDropZone.tsx` — React UI module for CanvasDropZone.
- `components/dreamengin/dream.DREAMenginOS.tsx` — React UI module for DREAMenginOS.
- `components/dreamengin/dream.DrEamsCanvas.tsx` — React UI module for DrEamsCanvas.
- `components/dreamengin/dream.HomeControls.tsx` — React UI module for HomeControls.
- `components/dreamengin/dream.bar.DrEamsSearchBar.tsx` — React UI module for bar DrEamsSearchBar.
- `components/dreamengin/dream.menu.NexusMenu.tsx` — React UI module for menu NexusMenu.
- `components/dreamengin/dream.menu.OutdreamMenu.tsx` — React UI module for menu OutdreamMenu.
- `components/dreamengin/dream.overlay.ViewAllDreamsOverlay.tsx` — React UI module for overlay ViewAllDreamsOverlay.
- `components/dreamengin/dream.panel.CrossEnginStatusPanel.tsx` — React UI module for panel CrossEnginStatusPanel.
- `components/dreamengin/dream.panel.DrEamsPanel.tsx` — React UI module for panel DrEamsPanel.
- `components/dreamengin/dream.scene.BabylonGameScene.tsx` — React UI module for scene BabylonGameScene.
- `components/dreamengin/dream.scene.DrEamsScene.tsx` — React UI module for scene DrEamsScene.
- `components/dreamengin/dream.scene.PortfolioOptimizationScene.tsx` — React UI module for scene PortfolioOptimizationScene.
- `components/dreamengin/dream.shell.EnginShell.tsx` — React UI module for shell EnginShell.
- `components/dreamengin/dream.widget.AppearanceWidget.tsx` — React UI module for widget AppearanceWidget.
- `components/dreamengin/dreamsurface.dreamengin.tsx` — React UI module for dreamengin.
- `components/dreamengin/dreamsurface.dreamspace-runtime.tsx` — React UI module for dreamspace runtime.
- `components/dreamengin/engine/math.ts` — TypeScript runtime module for math.
- `components/dreamengin/engine/types.ts` — TypeScript runtime module for types.
- `components/home/dream.bar.PersistentDreamBar.tsx` — React UI module for bar PersistentDreamBar.
- `components/runtime/dream.DualRuntimeContainer.tsx` — React UI module for DualRuntimeContainer.
- `components/runtime/dream.RuntimeView.tsx` — React UI module for RuntimeView.
- `components/runtime/dream.shell.RuntimeShell.tsx` — React UI module for shell RuntimeShell.
- `dreamdmbar/dream.GlowingLight.tsx` — React UI module for GlowingLight.
- `dreamdmbar/dreamsurface.dreamdmbar.tsx` — React UI module for dreamdmbar.
- `dreamdmbar/homedream/dream.shell.HomeSystem.tsx` — React UI module for shell HomeSystem.
- `dreamdmbar/homedream/dreamr/algorithms/botDetector.ts` — TypeScript runtime module for botDetector.
- `dreamdmbar/homedream/dreamr/algorithms/dreamrAlgorithm.ts` — TypeScript runtime module for dreamrAlgorithm.
- `dreamdmbar/homedream/dreamr/api/route.ts` — API route handler for `/homedream/dreamr/api`.
- `dreamdmbar/homedream/dreamr/dream.DreamRCore.tsx` — React UI module for DreamRCore.
- `dreamdmbar/homedream/dreamr/dream.DreamRFeed.tsx` — React UI module for DreamRFeed.
- `dreamdmbar/homedream/dreamr/dreamsurface.dreamr.tsx` — React UI module for dreamr.
- `dreamdmbar/homedream/dreamsurface.dreamdmbar-grid.tsx` — React UI module for dreamdmbar grid.
- `dreamdmbar/homedream/dreamsurface.homedream.tsx` — React UI module for homedream.
- `lib/dreamdm/DreamSystemContext.tsx` — React UI module for DreamSystemContext.
- `lib/runtime/EnginDispatcher.ts` — TypeScript runtime module for EnginDispatcher.
- `lib/runtime/channelMetrics.ts` — TypeScript runtime module for channelMetrics.
- `lib/runtime/coercionTable.ts` — TypeScript runtime module for coercionTable.
- `lib/runtime/dreamOSBus.ts` — TypeScript runtime module for dreamOSBus.
- `lib/runtime/dropTargetRegistry.ts` — TypeScript runtime module for dropTargetRegistry.
- `lib/runtime/dualRuntime.ts` — TypeScript runtime module for dualRuntime.
- `lib/runtime/dualRuntimeBridge.ts` — TypeScript runtime module for dualRuntimeBridge.
- `lib/runtime/enginWorkflowRegistry.ts` — TypeScript runtime module for enginWorkflowRegistry.
- `lib/runtime/instanceManager.ts` — TypeScript runtime module for instanceManager.
- `lib/runtime/isAuthRelatedError.ts` — TypeScript runtime module for isAuthRelatedError.
- `lib/runtime/memory.ts` — TypeScript runtime module for memory.
- `lib/runtime/moduleRegistry.ts` — TypeScript runtime module for moduleRegistry.
- `lib/runtime/offlineQueue.ts` — TypeScript runtime module for offlineQueue.
- `lib/runtime/quantumCircuit.ts` — TypeScript runtime module for quantumCircuit.
- `lib/runtime/runtimeChannel.ts` — TypeScript runtime module for runtimeChannel.
- `lib/runtime/runtimeContainer.ts` — TypeScript runtime module for runtimeContainer.
- `lib/runtime/seamClipboard.ts` — TypeScript runtime module for seamClipboard.
- `lib/runtime/snapshotFingerprint.ts` — TypeScript runtime module for snapshotFingerprint.
- `lib/runtime/swapManager.ts` — TypeScript runtime module for swapManager.
- `lib/runtime/useDragSurface.ts` — TypeScript runtime module for useDragSurface.
- `lib/runtime/useDualRuntime.ts` — TypeScript runtime module for useDualRuntime.
- `lib/runtime/useDualRuntimePersistence.ts` — TypeScript runtime module for useDualRuntimePersistence.
- `lib/runtime/useEnginBridge.ts` — TypeScript runtime module for useEnginBridge.
- `lib/runtime/useEnginCoopSync.ts` — TypeScript runtime module for useEnginCoopSync.
- `lib/runtime/useSharedEnginChannel.ts` — TypeScript runtime module for useSharedEnginChannel.
- `lib/vm/README.md` — Subsystem documentation reference.
- `lib/vm/bufferManager.ts` — TypeScript runtime module for bufferManager.
- `lib/vm/bus-events.ts` — TypeScript runtime module for bus events.
- `lib/vm/dual-runtime.ts` — TypeScript runtime module for dual runtime.
- `lib/vm/dualVMCoordinator.ts` — TypeScript runtime module for dualVMCoordinator.
- `lib/vm/index.ts` — TypeScript runtime module for index.
- `lib/vm/inter-vm-messaging.ts` — TypeScript runtime module for inter vm messaging.
- `lib/vm/pipelineCache.ts` — TypeScript runtime module for pipelineCache.
- `lib/vm/resource-quota.ts` — TypeScript runtime module for resource quota.
- `lib/vm/security.ts` — TypeScript runtime module for security.
- `lib/vm/snapshot.ts` — TypeScript runtime module for snapshot.
- `lib/vm/types.ts` — TypeScript runtime module for types.
- `lib/vm/wasm-features.ts` — TypeScript runtime module for wasm features.
- `lib/vm/wasmGpuVM.ts` — TypeScript runtime module for wasmGpuVM.

</details>
## Shared Dreams
Shared Dreams are realtime collaboration sessions where multiple peers co-edit or co-view the same runtime context. The canonical session model lives in `lib/collaboration/index.ts` (roles, modes, event families, permissions), and `lib/sharedDream.ts` provides the backwards-compatible façade consumed by hooks/components.

Runtime flow:
- `hooks/useSharedDream.ts` and `components/shared-dream/dream.SharedDreamProvider.tsx` create/join sessions and keep peer/cursor/presence state in sync.
- `lib/supabase/realtime.ts` provides typed transport adapters for broadcast + presence channels, with graceful local fallback paths.
- Payload normalization (cursor, edit, state_patch, media_sync, data_packet, control_signal, mode_change, presence_update) is centralized before dispatch.
- `dream.InviteFlow.tsx` generates invite links and auto-join handoff via URL channel parsing.

Shared session persistence/API surface is exposed through `app/api/dream-windows/*`, `app/api/dreams/instances`, and messaging board routes; Phase 8 migrations (`20260321200000_phase8a_feed_and_layout.sql`, `20260322000000_phase8b_dream_windows.sql`, plus messaging migration `20260307000001_conversations_messages.sql`) provide the backing schema and policy boundaries.
#### Shared-dream pipeline file structure
```text
├── app
│   └── api
│       ├── dream-windows
│       │   ├── [id]
│       │   │   └── route.ts
│       │   └── route.ts
│       ├── dreams
│       │   ├── feed
│       │   │   └── route.ts
│       │   ├── instances
│       │   │   └── route.ts
│       │   └── transfer
│       │       └── route.ts
│       └── messages
│           ├── boards
│           │   └── route.ts
│           └── route.ts
├── components
│   └── shared-dream
│       ├── dream.InviteFlow.tsx
│       ├── dream.SharedDreamCanvas.tsx
│       ├── dream.SharedDreamProvider.tsx
│       └── index.ts
├── hooks
│   └── useSharedDream.ts
├── lib
│   ├── collaboration
│   │   └── index.ts
│   ├── runtime
│   │   ├── instanceManager.ts
│   │   ├── runtimeChannel.ts
│   │   └── useSharedEnginChannel.ts
│   ├── sharedDream.ts
│   └── supabase
│       └── realtime.ts
└── supabase
    └── migrations
        ├── 20260307000001_conversations_messages.sql
        ├── 20260321200000_phase8a_feed_and_layout.sql
        ├── 20260322000000_phase8b_dream_windows.sql
        └── 20260420000001_consent_settings_audit.sql
```
<details><summary>Shared-dream pipeline file index (22 files)</summary>

- `app/api/dream-windows/[id]/route.ts` — API route handler for `/api/dream-windows/[id]`.
- `app/api/dream-windows/route.ts` — API route handler for `/api/dream-windows`.
- `app/api/dreams/feed/route.ts` — API route handler for `/api/dreams/feed`.
- `app/api/dreams/instances/route.ts` — API route handler for `/api/dreams/instances`.
- `app/api/dreams/transfer/route.ts` — API route handler for `/api/dreams/transfer`.
- `app/api/messages/boards/route.ts` — API route handler for `/api/messages/boards`.
- `app/api/messages/route.ts` — API route handler for `/api/messages`.
- `components/shared-dream/dream.InviteFlow.tsx` — React UI module for InviteFlow.
- `components/shared-dream/dream.SharedDreamCanvas.tsx` — React UI module for SharedDreamCanvas.
- `components/shared-dream/dream.SharedDreamProvider.tsx` — React UI module for SharedDreamProvider.
- `components/shared-dream/index.ts` — TypeScript runtime module for index.
- `hooks/useSharedDream.ts` — TypeScript runtime module for useSharedDream.
- `lib/collaboration/index.ts` — TypeScript runtime module for index.
- `lib/runtime/instanceManager.ts` — TypeScript runtime module for instanceManager.
- `lib/runtime/runtimeChannel.ts` — TypeScript runtime module for runtimeChannel.
- `lib/runtime/useSharedEnginChannel.ts` — TypeScript runtime module for useSharedEnginChannel.
- `lib/sharedDream.ts` — TypeScript runtime module for sharedDream.
- `lib/supabase/realtime.ts` — TypeScript runtime module for realtime.
- `supabase/migrations/20260307000001_conversations_messages.sql` — Database schema or migration for 20260307000001 conversations messages.
- `supabase/migrations/20260321200000_phase8a_feed_and_layout.sql` — Database schema or migration for 20260321200000 phase8a feed and layout.
- `supabase/migrations/20260322000000_phase8b_dream_windows.sql` — Database schema or migration for 20260322000000 phase8b windows.
- `supabase/migrations/20260420000001_consent_settings_audit.sql` — Database schema or migration for 20260420000001 consent settings audit.

</details>
## Dreamr — Human Media
Auto-synced from `app/dreamr/**`, `app/api/dreamr/**`, `lib/feed/**`, `components/home/**` using repository introspection.
- Files tracked: **14**
- API routes discovered: `/api/dreamr/feed`, `/api/dreamr/suggested`
- App pages discovered: `/dreamr`
- Components/modules discovered: `ActiveModuleSurface`, `BarGlobalDreamBar`, `BarPersistentDreamBar`, `DaydreamPulseStrip`, `FlagshipEnginesStrip`, `NeuralSeamCanvas`, `Page`, `WidgetDreamWidget`
#### Dreamr — Human Media file structure
```text
├── app
│   ├── api
│   │   └── dreamr
│   │       ├── feed
│   │       │   └── route.ts
│   │       └── suggested
│   │           └── route.ts
│   └── dreamr
│       └── page.tsx
├── components
│   └── home
│       ├── dream.ActiveModuleSurface.tsx
│       ├── dream.DaydreamPulseStrip.tsx
│       ├── dream.FlagshipEnginesStrip.tsx
│       ├── dream.NeuralSeamCanvas.tsx
│       ├── dream.bar.GlobalDreamBar.tsx
│       ├── dream.bar.PersistentDreamBar.tsx
│       └── dream.widget.DreamWidget.tsx
└── lib
    └── feed
        ├── feedTopics.ts
        ├── hashtags.ts
        ├── useLiveFeed.ts
        └── useYouTubeLiveFeed.ts
```
<details><summary>Dreamr — Human Media file index (14 files)</summary>

- `app/api/dreamr/feed/route.ts` — API route handler.
- `app/api/dreamr/suggested/route.ts` — API route handler.
- `app/dreamr/page.tsx` — route page.
- `components/home/dream.ActiveModuleSurface.tsx` — React UI module for ActiveModuleSurface.
- `components/home/dream.DaydreamPulseStrip.tsx` — React UI module for DaydreamPulseStrip.
- `components/home/dream.FlagshipEnginesStrip.tsx` — React UI module for FlagshipEnginesStrip.
- `components/home/dream.NeuralSeamCanvas.tsx` — React UI module for NeuralSeamCanvas.
- `components/home/dream.bar.GlobalDreamBar.tsx` — React UI module for BarGlobalDreamBar.
- `components/home/dream.bar.PersistentDreamBar.tsx` — React UI module for BarPersistentDreamBar.
- `components/home/dream.widget.DreamWidget.tsx` — React UI module for WidgetDreamWidget.
- `lib/feed/feedTopics.ts` — TypeScript/JavaScript runtime module.
- `lib/feed/hashtags.ts` — TypeScript/JavaScript runtime module.
- `lib/feed/useLiveFeed.ts` — TypeScript/JavaScript runtime module.
- `lib/feed/useYouTubeLiveFeed.ts` — TypeScript/JavaScript runtime module.

</details>

## The Shop
The Shop is DREAMengin’s first-party storefront (`/shop`, `/shop/sell`) for creator-owned merch listings. Unlike Marketplace, Shop behaves as a direct seller storefront tied to the owner’s catalog.

Runtime flow:
- Listing CRUD and validation run through `app/api/shop/route.ts` + `lib/shop/listings.ts`.
- Records persist to the Supabase `merch` table introduced in `20260324000001_phase8e_shop_marketplace.sql`.
- Create/update actions emit feed-side visibility artifacts so products can appear in user-facing discovery surfaces.
- Billing logic in-repo is server-side order math/recording; external checkout provider wiring is intentionally not embedded in this subsystem.
#### Shop files file structure
```text
├── app
│   ├── api
│   │   └── shop
│   │       └── route.ts
│   └── shop
│       ├── page.tsx
│       └── sell
│           └── page.tsx
├── lib
│   └── shop
│       └── listings.ts
├── supabase
│   └── migrations
│       └── 20260324000001_phase8e_shop_marketplace.sql
└── tests
    └── phase8e-shop-marketplace.test.ts
```
<details><summary>Shop files file index (6 files)</summary>

- `app/api/shop/route.ts` — API route handler for `/api/shop`.
- `app/shop/page.tsx` — Next.js route page for `/shop`.
- `app/shop/sell/page.tsx` — Next.js route page for `/shop/sell`.
- `lib/shop/listings.ts` — TypeScript runtime module for listings.
- `supabase/migrations/20260324000001_phase8e_shop_marketplace.sql` — Database schema or migration for 20260324000001 phase8e shop marketplace.
- `tests/phase8e-shop-marketplace.test.ts` — TypeScript runtime module for phase8e shop marketplace test.

</details>
## The Marketplace
Marketplace is the peer-to-peer exchange surface (`/marketplace`, `/marketplace/sell`, `/marketplace/[id]`) and is intentionally separate from Shop. It focuses on cross-user discovery, request workflows, and moderated publish state.

How it works:
- Listings and query filters are handled by `app/api/marketplace/route.ts` + `lib/marketplace/listings.ts` with category/tag filtering and seller-profile joins.
- Buyer → seller outreach runs through `app/api/marketplace/request/route.ts` + `lib/marketplace/request.ts` (request/contact workflow).
- `marketplace_items` and `marketplace_contact_requests` schema/policies are defined in `20260324000001_phase8e_shop_marketplace.sql` with moderation/publish gating semantics.
- UI surfaces (`dream.MarketplaceListingCard`, `dream.MarketplaceRequestButton`) consume the same fixed runtime/state contract as other modules.
#### Marketplace files file structure
```text
├── app
│   ├── api
│   │   └── marketplace
│   │       ├── request
│   │       │   └── route.ts
│   │       └── route.ts
│   └── marketplace
│       ├── [id]
│       │   └── page.tsx
│       ├── page.tsx
│       └── sell
│           └── page.tsx
├── components
│   ├── marketplace
│   │   ├── dream.MarketplaceListingCard.tsx
│   │   └── dream.MarketplaceRequestButton.tsx
│   └── panels
│       └── dream.panel.MarketplacePanel.tsx
├── lib
│   └── marketplace
│       ├── listings.ts
│       └── request.ts
├── supabase
│   └── migrations
│       └── 20260324000001_phase8e_shop_marketplace.sql
├── tests
│   └── phase8e-shop-marketplace.test.ts
└── types
    └── marketplace.ts
```
<details><summary>Marketplace files file index (13 files)</summary>

- `app/api/marketplace/request/route.ts` — API route handler for `/api/marketplace/request`.
- `app/api/marketplace/route.ts` — API route handler for `/api/marketplace`.
- `app/marketplace/[id]/page.tsx` — Next.js route page for `/marketplace/[id]`.
- `app/marketplace/page.tsx` — Next.js route page for `/marketplace`.
- `app/marketplace/sell/page.tsx` — Next.js route page for `/marketplace/sell`.
- `components/marketplace/dream.MarketplaceListingCard.tsx` — React UI module for MarketplaceListingCard.
- `components/marketplace/dream.MarketplaceRequestButton.tsx` — React UI module for MarketplaceRequestButton.
- `components/panels/dream.panel.MarketplacePanel.tsx` — React UI module for panel MarketplacePanel.
- `lib/marketplace/listings.ts` — TypeScript runtime module for listings.
- `lib/marketplace/request.ts` — TypeScript runtime module for request.
- `supabase/migrations/20260324000001_phase8e_shop_marketplace.sql` — Database schema or migration for 20260324000001 phase8e shop marketplace.
- `tests/phase8e-shop-marketplace.test.ts` — TypeScript runtime module for phase8e shop marketplace test.
- `types/marketplace.ts` — TypeScript runtime module for marketplace.

</details>
## Ads & User Ads
Ads & User Ads cover campaign creation, slot delivery, order accounting, and skip-credit economics across `/ads`, `/ads/create`, and `/ads/slot/[id]`.

What it does:
- `app/api/ads/orders/route.ts` applies platform/creator split math during order writes.
- `app/api/ads/view/route.ts` tracks ad impressions/views for reporting and payout logic.
- Skip-credit ledger endpoints (`/api/skip-credits/balance|earn|use`) maintain earn/use/balance state consumed by UI components.
- `components/ads/dream.AdUnit.tsx` renders ad units and `dream.SkipCreditBalance.tsx` exposes user credit balance in-shell.
- `supabase/migrations/20260321000000_ads_platform_promotions.sql` adds platform promotion + ad-system schema required by these surfaces.
#### Ads system files file structure
```text
├── app
│   ├── ads
│   │   ├── create
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   └── slot
│   │       └── [id]
│   │           └── page.tsx
│   └── api
│       ├── ads
│       │   ├── orders
│       │   │   └── route.ts
│       │   └── view
│       │       └── route.ts
│       └── skip-credits
│           ├── balance
│           │   └── route.ts
│           ├── earn
│           │   └── route.ts
│           └── use
│               └── route.ts
├── components
│   └── ads
│       ├── dream.AdUnit.tsx
│       └── dream.SkipCreditBalance.tsx
├── supabase
│   └── migrations
│       └── 20260321000000_ads_platform_promotions.sql
└── types
    └── ads.ts
```
<details><summary>Ads system files file index (12 files)</summary>

- `app/ads/create/page.tsx` — Next.js route page for `/ads/create`.
- `app/ads/page.tsx` — Next.js route page for `/ads`.
- `app/ads/slot/[id]/page.tsx` — Next.js route page for `/ads/slot/[id]`.
- `app/api/ads/orders/route.ts` — API route handler for `/api/ads/orders`.
- `app/api/ads/view/route.ts` — API route handler for `/api/ads/view`.
- `app/api/skip-credits/balance/route.ts` — API route handler for `/api/skip-credits/balance`.
- `app/api/skip-credits/earn/route.ts` — API route handler for `/api/skip-credits/earn`.
- `app/api/skip-credits/use/route.ts` — API route handler for `/api/skip-credits/use`.
- `components/ads/dream.AdUnit.tsx` — React UI module for AdUnit.
- `components/ads/dream.SkipCreditBalance.tsx` — React UI module for SkipCreditBalance.
- `supabase/migrations/20260321000000_ads_platform_promotions.sql` — Database schema or migration for 20260321000000 ads platform promotions.
- `types/ads.ts` — TypeScript runtime module for ads.

</details>
## The DmBar (`dreamdmbar/`)
Auto-synced from `dreamdmbar/**`, `components/home/dream.bar.*`, `lib/dreamdm/**` using repository introspection.
- Files tracked: **15**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `BarGlobalDreamBar`, `BarPersistentDreamBar`, `DreamSystemContext`, `DreamsurfaceDreamdmbar`, `GlowingLight`
#### The DmBar (`dreamdmbar/`) file structure
```text
├── components
│   └── home
│       ├── dream.bar.GlobalDreamBar.tsx
│       └── dream.bar.PersistentDreamBar.tsx
├── dreamdmbar
│   ├── dream.GlowingLight.tsx
│   └── dreamsurface.dreamdmbar.tsx
└── lib
    └── dreamdm
        ├── DreamSystemContext.tsx
        ├── barInteractions.ts
        ├── bridgeSeamFlow.ts
        ├── useDreamBarContext.ts
        ├── useDreamDMConversations.ts
        ├── useDreamDMDraft.ts
        ├── useDreamDMMessages.ts
        ├── useDreamSearch.ts
        ├── useMessagingCore.ts
        ├── useModuleBarIntent.ts
        └── useNotifications.ts
```
<details><summary>The DmBar (`dreamdmbar/`) file index (15 files)</summary>

- `components/home/dream.bar.GlobalDreamBar.tsx` — React UI module for BarGlobalDreamBar.
- `components/home/dream.bar.PersistentDreamBar.tsx` — React UI module for BarPersistentDreamBar.
- `dreamdmbar/dream.GlowingLight.tsx` — React UI module for GlowingLight.
- `dreamdmbar/dreamsurface.dreamdmbar.tsx` — React UI module for DreamsurfaceDreamdmbar.
- `lib/dreamdm/DreamSystemContext.tsx` — React UI module for DreamSystemContext.
- `lib/dreamdm/barInteractions.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/bridgeSeamFlow.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamBarContext.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamDMConversations.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamDMDraft.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamDMMessages.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useDreamSearch.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useMessagingCore.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useModuleBarIntent.ts` — TypeScript/JavaScript runtime module.
- `lib/dreamdm/useNotifications.ts` — TypeScript/JavaScript runtime module.

</details>

## Messaging
Messaging covers direct conversations, board-style threads, drafts, notifications, and realtime message sync under the DreamDM shell.

Runtime flow:
- `app/api/messages/route.ts` handles conversation fetch/send writes with auth + child-safety checks on message content/media.
- `app/api/messages/boards/route.ts` provides board creation and board post request flow.
- Client orchestration is split across `useDreamDMConversations`, `useDreamDMMessages`, `useDreamDMDraft`, `useMessagingCore`, and `useNotifications` for list state, realtime inserts, optimistic send, draft persistence, and unread polling.
- `20260307000001_conversations_messages.sql` provides the core `conversations/messages` schema + policy baseline used by these routes/hooks.
#### Messaging files file structure
```text
├── app
│   ├── api
│   │   └── messages
│   │       ├── boards
│   │       │   └── route.ts
│   │       └── route.ts
│   └── messages
│       ├── boards
│       │   ├── [id]
│       │   │   └── page.tsx
│       │   ├── new
│       │   │   └── page.tsx
│       │   └── page.tsx
│       └── page.tsx
├── components
│   ├── dream.MessagesClient.tsx
│   └── messaging
│       └── dream.BoardComposer.tsx
├── lib
│   └── dreamdm
│       ├── useDreamDMConversations.ts
│       ├── useDreamDMDraft.ts
│       ├── useDreamDMMessages.ts
│       ├── useMessagingCore.ts
│       └── useNotifications.ts
└── supabase
    └── migrations
        └── 20260307000001_conversations_messages.sql
```
<details><summary>Messaging files file index (14 files)</summary>

- `app/api/messages/boards/route.ts` — API route handler for `/api/messages/boards`.
- `app/api/messages/route.ts` — API route handler for `/api/messages`.
- `app/messages/boards/[id]/page.tsx` — Next.js route page for `/messages/boards/[id]`.
- `app/messages/boards/new/page.tsx` — Next.js route page for `/messages/boards/new`.
- `app/messages/boards/page.tsx` — Next.js route page for `/messages/boards`.
- `app/messages/page.tsx` — Next.js route page for `/messages`.
- `components/dream.MessagesClient.tsx` — React UI module for MessagesClient.
- `components/messaging/dream.BoardComposer.tsx` — React UI module for BoardComposer.
- `lib/dreamdm/useDreamDMConversations.ts` — TypeScript runtime module for useDreamDMConversations.
- `lib/dreamdm/useDreamDMDraft.ts` — TypeScript runtime module for useDreamDMDraft.
- `lib/dreamdm/useDreamDMMessages.ts` — TypeScript runtime module for useDreamDMMessages.
- `lib/dreamdm/useMessagingCore.ts` — TypeScript runtime module for useMessagingCore.
- `lib/dreamdm/useNotifications.ts` — TypeScript runtime module for useNotifications.
- `supabase/migrations/20260307000001_conversations_messages.sql` — Database schema or migration for 20260307000001 conversations messages.

</details>
## HomeDream
Auto-synced from `app/homedream/**`, `components/home/**`, `lib/home/**` using repository introspection.
- Files tracked: **8**
- API routes discovered: none
- App pages discovered: `/homedream`
- Components/modules discovered: `ActiveModuleSurface`, `BarGlobalDreamBar`, `BarPersistentDreamBar`, `DaydreamPulseStrip`, `FlagshipEnginesStrip`, `NeuralSeamCanvas`, `Page`, `WidgetDreamWidget`
#### HomeDream file structure
```text
├── app
│   └── homedream
│       └── page.tsx
└── components
    └── home
        ├── dream.ActiveModuleSurface.tsx
        ├── dream.DaydreamPulseStrip.tsx
        ├── dream.FlagshipEnginesStrip.tsx
        ├── dream.NeuralSeamCanvas.tsx
        ├── dream.bar.GlobalDreamBar.tsx
        ├── dream.bar.PersistentDreamBar.tsx
        └── dream.widget.DreamWidget.tsx
```
<details><summary>HomeDream file index (8 files)</summary>

- `app/homedream/page.tsx` — route page.
- `components/home/dream.ActiveModuleSurface.tsx` — React UI module for ActiveModuleSurface.
- `components/home/dream.DaydreamPulseStrip.tsx` — React UI module for DaydreamPulseStrip.
- `components/home/dream.FlagshipEnginesStrip.tsx` — React UI module for FlagshipEnginesStrip.
- `components/home/dream.NeuralSeamCanvas.tsx` — React UI module for NeuralSeamCanvas.
- `components/home/dream.bar.GlobalDreamBar.tsx` — React UI module for BarGlobalDreamBar.
- `components/home/dream.bar.PersistentDreamBar.tsx` — React UI module for BarPersistentDreamBar.
- `components/home/dream.widget.DreamWidget.tsx` — React UI module for WidgetDreamWidget.

</details>

## DreamSpace
DreamSpace is the lower-region runtime world optimized for Dream Window hosting, module launch, and spatial arrangement workflows. It differs from HomeDream by focusing on mounted module sessions and workspace composition rather than feed/home orchestration.

How it works:
- `components/dreams/dreamsurface.dreamspace.tsx` renders the DreamSpace panel (apps, feeds, profile modes, recent destinations).
- `components/dreamengin/dreamsurface.dreamspace-runtime.tsx` hosts runtime-specific DreamSpace module behavior.
- `lib/dream-window/*` enforces Dream Window lifecycle/state transitions and API mutation helpers.
- `lib/dreams/useDreamsRuntime.ts` maintains per-instance DreamSpace runtime state so parallel regions can run independently.
#### DreamSpace files file structure
```text
├── app
│   └── settings
│       └── dreams
│           └── dreams-layout-editor.tsx
├── components
│   ├── dreamengin
│   │   └── dreamsurface.dreamspace-runtime.tsx
│   └── dreams
│       └── dreamsurface.dreamspace.tsx
├── lib
│   ├── dream-window
│   │   ├── DreamWindowLifecycle.ts
│   │   ├── connectionVerbs.ts
│   │   ├── enginConnectionNetwork.ts
│   │   ├── index.ts
│   │   ├── runtimeRegion.ts
│   │   └── useDreamWindowActions.ts
│   └── dreams
│       ├── DreamRegistry.tsx
│       ├── drag.ts
│       ├── profileProjection.ts
│       ├── types.ts
│       └── useDreamsRuntime.ts
└── tests
    └── dreamspace-panel.test.ts
```
<details><summary>DreamSpace files file index (15 files)</summary>

- `app/settings/dreams/dreams-layout-editor.tsx` — React UI module for dreams layout editor.
- `components/dreamengin/dreamsurface.dreamspace-runtime.tsx` — React UI module for dreamspace runtime.
- `components/dreams/dreamsurface.dreamspace.tsx` — React UI module for dreamspace.
- `lib/dream-window/DreamWindowLifecycle.ts` — TypeScript runtime module for DreamWindowLifecycle.
- `lib/dream-window/connectionVerbs.ts` — TypeScript runtime module for connectionVerbs.
- `lib/dream-window/enginConnectionNetwork.ts` — TypeScript runtime module for enginConnectionNetwork.
- `lib/dream-window/index.ts` — TypeScript runtime module for index.
- `lib/dream-window/runtimeRegion.ts` — TypeScript runtime module for runtimeRegion.
- `lib/dream-window/useDreamWindowActions.ts` — TypeScript runtime module for useDreamWindowActions.
- `lib/dreams/DreamRegistry.tsx` — React UI module for DreamRegistry.
- `lib/dreams/drag.ts` — TypeScript runtime module for drag.
- `lib/dreams/profileProjection.ts` — TypeScript runtime module for profileProjection.
- `lib/dreams/types.ts` — TypeScript runtime module for types.
- `lib/dreams/useDreamsRuntime.ts` — TypeScript runtime module for useDreamsRuntime.
- `tests/dreamspace-panel.test.ts` — TypeScript runtime module for dreamspace panel test.

</details>
## Dreams (Widgets / Windows / Surfaces)
This repo ships three user-facing primitives that share one runtime contract:
- **Widgets** — small embeddable units (for cards/tools/media controls) mostly under `components/widgets/*` and `lib/widgets/*`.
- **Dream Windows** — full modular runtime containers with lifecycle (`unbound → bound → mounted ↔ collapsed`) enforced by `lib/dream-window/DreamWindowLifecycle.ts`.
- **Surfaces** — canonical mount points where windows/widgets run (HomeDream Surface, DreamSpace, profile/runtime shells), implemented through `dreamsurface.*.tsx` components under `components/dreams/*`, `components/dreamengin/*`, and `dreamdmbar/homedream/*`.

The naming convention `dreamsurface.*.tsx` marks canonical mount components across domains (`dreamsurface.homedream.tsx`, `dreamsurface.dreamspace.tsx`, `dreamsurface.window.tsx`, etc.). These components stay bound to fixed engine plumbing while rule-sets define what each surface renders.
#### Dreams/Windows/Widgets files file structure
```text
├── app
│   ├── api
│   │   └── widgets
│   │       ├── feed
│   │       │   └── route.ts
│   │       └── instances
│   │           └── route.ts
│   └── settings
│       └── widgets
│           └── page.tsx
├── components
│   ├── dreams
│   │   ├── dream.DraggableDream.tsx
│   │   ├── dream.GlobalDragLayer.tsx
│   │   ├── dream.PlatformErrorReporter.tsx
│   │   ├── dream.SlideOverPanel.tsx
│   │   ├── dream.connectorlayer.tsx
│   │   ├── dream.featurelayer.tsx
│   │   ├── dream.outputlayer.tsx
│   │   ├── dream.panel.RuntimeMemoryHUD.tsx
│   │   ├── dream.shell.DreamShell.tsx
│   │   ├── dream.shell.SharedDreamShell.tsx
│   │   ├── dream.widget.SuperDreamWidget.tsx
│   │   ├── dream.window.JourneyDreamWindow.tsx
│   │   ├── dreamsurface.dreamspace.tsx
│   │   ├── dreamsurface.shell.tsx
│   │   └── dreamsurface.window.tsx
│   └── widgets
│       ├── dream.AddDreamCTA.tsx
│       ├── dream.ConfigureSheet.tsx
│       ├── dream.EditModeBanner.tsx
│       ├── dream.EditModeProvider.tsx
│       ├── dream.widget.PlayMediaWidget.tsx
│       ├── dream.widget.UniversalWidget.tsx
│       ├── dream.widget.WidgetCard.tsx
│       ├── dream.widget.WidgetLibrary.tsx
│       ├── dream.widget.WidgetPlaceholder.tsx
│       ├── dream.widget.WidgetShell.tsx
│       └── dream.widget.WidgetSurface.tsx
├── lib
│   ├── dream-window
│   │   ├── DreamWindowLifecycle.ts
│   │   ├── connectionVerbs.ts
│   │   ├── enginConnectionNetwork.ts
│   │   ├── index.ts
│   │   ├── runtimeRegion.ts
│   │   └── useDreamWindowActions.ts
│   └── widgets
│       ├── CrossWidgetPosting.ts
│       ├── WidgetBus.ts
│       ├── WidgetEngine.tsx
│       ├── WidgetEventBus.ts
│       ├── WidgetLinkGraph.ts
│       ├── feed-resolver.ts
│       ├── parse.ts
│       ├── parseConfig.ts
│       ├── useWidget.ts
│       └── widgetRegistry.ts
└── types
    ├── dream-window.ts
    └── widget-system-v2.ts
```
<details><summary>Dreams/Windows/Widgets files file index (47 files)</summary>

- `app/api/widgets/feed/route.ts` — API route handler for `/api/widgets/feed`.
- `app/api/widgets/instances/route.ts` — API route handler for `/api/widgets/instances`.
- `app/settings/widgets/page.tsx` — Next.js route page for `/settings/widgets`.
- `components/dreams/dream.DraggableDream.tsx` — React UI module for DraggableDream.
- `components/dreams/dream.GlobalDragLayer.tsx` — React UI module for GlobalDragLayer.
- `components/dreams/dream.PlatformErrorReporter.tsx` — React UI module for PlatformErrorReporter.
- `components/dreams/dream.SlideOverPanel.tsx` — React UI module for SlideOverPanel.
- `components/dreams/dream.connectorlayer.tsx` — React UI module for connectorlayer.
- `components/dreams/dream.featurelayer.tsx` — React UI module for featurelayer.
- `components/dreams/dream.outputlayer.tsx` — React UI module for outputlayer.
- `components/dreams/dream.panel.RuntimeMemoryHUD.tsx` — React UI module for panel RuntimeMemoryHUD.
- `components/dreams/dream.shell.DreamShell.tsx` — React UI module for shell DreamShell.
- `components/dreams/dream.shell.SharedDreamShell.tsx` — React UI module for shell SharedDreamShell.
- `components/dreams/dream.widget.SuperDreamWidget.tsx` — React UI module for widget SuperDreamWidget.
- `components/dreams/dream.window.JourneyDreamWindow.tsx` — React UI module for window JourneyDreamWindow.
- `components/dreams/dreamsurface.dreamspace.tsx` — React UI module for dreamspace.
- `components/dreams/dreamsurface.shell.tsx` — React UI module for shell.
- `components/dreams/dreamsurface.window.tsx` — React UI module for window.
- `components/widgets/dream.AddDreamCTA.tsx` — React UI module for AddDreamCTA.
- `components/widgets/dream.ConfigureSheet.tsx` — React UI module for ConfigureSheet.
- `components/widgets/dream.EditModeBanner.tsx` — React UI module for EditModeBanner.
- `components/widgets/dream.EditModeProvider.tsx` — React UI module for EditModeProvider.
- `components/widgets/dream.widget.PlayMediaWidget.tsx` — React UI module for widget PlayMediaWidget.
- `components/widgets/dream.widget.UniversalWidget.tsx` — React UI module for widget UniversalWidget.
- `components/widgets/dream.widget.WidgetCard.tsx` — React UI module for widget WidgetCard.
- `components/widgets/dream.widget.WidgetLibrary.tsx` — React UI module for widget WidgetLibrary.
- `components/widgets/dream.widget.WidgetPlaceholder.tsx` — React UI module for widget WidgetPlaceholder.
- `components/widgets/dream.widget.WidgetShell.tsx` — React UI module for widget WidgetShell.
- `components/widgets/dream.widget.WidgetSurface.tsx` — React UI module for widget WidgetSurface.
- `lib/dream-window/DreamWindowLifecycle.ts` — TypeScript runtime module for DreamWindowLifecycle.
- `lib/dream-window/connectionVerbs.ts` — TypeScript runtime module for connectionVerbs.
- `lib/dream-window/enginConnectionNetwork.ts` — TypeScript runtime module for enginConnectionNetwork.
- `lib/dream-window/index.ts` — TypeScript runtime module for index.
- `lib/dream-window/runtimeRegion.ts` — TypeScript runtime module for runtimeRegion.
- `lib/dream-window/useDreamWindowActions.ts` — TypeScript runtime module for useDreamWindowActions.
- `lib/widgets/CrossWidgetPosting.ts` — TypeScript runtime module for CrossWidgetPosting.
- `lib/widgets/WidgetBus.ts` — TypeScript runtime module for WidgetBus.
- `lib/widgets/WidgetEngine.tsx` — React UI module for WidgetEngine.
- `lib/widgets/WidgetEventBus.ts` — TypeScript runtime module for WidgetEventBus.
- `lib/widgets/WidgetLinkGraph.ts` — TypeScript runtime module for WidgetLinkGraph.
- `lib/widgets/feed-resolver.ts` — TypeScript runtime module for feed resolver.
- `lib/widgets/parse.ts` — TypeScript runtime module for parse.
- `lib/widgets/parseConfig.ts` — TypeScript runtime module for parseConfig.
- `lib/widgets/useWidget.ts` — TypeScript runtime module for useWidget.
- `lib/widgets/widgetRegistry.ts` — TypeScript runtime module for widgetRegistry.
- `types/dream-window.ts` — TypeScript runtime module for dream window.
- `types/widget-system-v2.ts` — TypeScript runtime module for widget system v2.

</details>
## User-Facing Modularity
Auto-synced from `components/**`, `styles/**`, `lib/ui/**`, `hooks/**` using repository introspection.
- Files tracked: **317**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `AIAssistant`, `ActiveModuleSurface`, `ActivityPostForm`, `ActivityProfile`, `AdUnit`, `AddDreamCTA`, `AddSliceSheet`, `AlgorithmEngine`, +254 more
#### User-Facing Modularity file structure
```text
├── components
│   ├── activity
│   │   ├── dream.ActivityPostForm.tsx
│   │   ├── dream.ActivityProfile.tsx
│   │   └── dream.TierBadge.tsx
│   ├── ads
│   │   ├── dream.AdUnit.tsx
│   │   └── dream.SkipCreditBalance.tsx
│   ├── auth
│   │   └── dream.PasswordField.tsx
│   ├── connectors
│   │   ├── dream.AddSliceSheet.tsx
│   │   ├── dream.ConnectDreamPrompt.tsx
│   │   ├── dream.ConnectorRow.tsx
│   │   ├── dream.NoSlotDialog.tsx
│   │   ├── dream.PlacementMode.tsx
│   │   ├── dream.widget.ConnectWidgetPrompt.tsx
│   │   └── dream.widget.ConnectorWidgetPicker.tsx
│   ├── core
│   │   └── dream.CoreDream.tsx
│   ├── customize
│   │   ├── dream.GlobalCustomizeUI.tsx
│   │   ├── dream.bar.CustomizeModeBar.tsx
│   │   ├── dream.bar.CustomizeToolbar.tsx
│   │   └── panels
│   │       ├── dream.panel.ColorPanel.tsx
│   │       ├── dream.panel.EffectsPanel.tsx
│   │       ├── dream.panel.FontPanel.tsx
│   │       └── dream.panel.LayoutPanel.tsx
│   ├── daydream
│   │   ├── dream.CodeDreamIDE.tsx
│   │   ├── dream.DiffViewer.tsx
│   │   ├── dream.JourneyTrail.tsx
│   │   ├── dream.LabDreamIDE.tsx
│   │   ├── dream.NGNEngin.tsx
│   │   ├── dream.OpenDaydreamSideBButton.tsx
│   │   ├── dream.StandaloneEnginSurface.tsx
│   │   ├── dream.constellationmap.tsx
│   │   ├── dream.shell.DaydreamShell.tsx
│   │   ├── dreamsurface.daydream.AnalyticsDaydream.tsx
│   │   ├── dreamsurface.daydream.BrandDaydream.tsx
│   │   └── starmaker
│   │       ├── dream.panel.CompingPanel.tsx
│   │       ├── dream.panel.MultitrackArrangementPanel.tsx
│   │       ├── dream.panel.PianoRollPanel.tsx
│   │       └── dream.panel.SessionViewPanel.tsx
│   ├── draggable
│   │   └── dream.DraggableModule.tsx
│   ├── dream.AIAssistant.tsx
│   ├── dream.AudioVisualizer3D.tsx
│   ├── dream.BoogieWarningBanner.tsx
│   ├── dream.BrandLogo.tsx
│   ├── dream.CommandPalette.tsx
│   ├── dream.CreatePostModal.tsx
│   ├── dream.DrEamsModeToggle.tsx
│   ├── dream.DrEamsVoiceAssistant.tsx
│   ├── dream.DragToAnchorClose.tsx
│   ├── dream.FeedCard.tsx
│   ├── dream.ForgeDreamCanvas.tsx
│   ├── dream.GlobalOverlays.tsx
│   ├── dream.HeroSprite.tsx
│   ├── dream.HomeFeed.tsx
│   ├── dream.IconSelector.tsx
│   ├── dream.InnerDreamsButton.tsx
│   ├── dream.KonamiDream.tsx
│   ├── dream.LedgerChart.tsx
│   ├── dream.MessagesClient.tsx
│   ├── dream.NotificationCenter.tsx
│   ├── dream.OSShellActivator.tsx
│   ├── dream.PhysicsLab.tsx
│   ├── dream.ProfileEditor.tsx
│   ├── dream.ProfileShareButton.tsx
│   ├── dream.ProfileSpace.tsx
│   ├── dream.PullToRefresh.tsx
│   ├── dream.ShrunkMode.tsx
│   ├── dream.SkeletonLoaders.tsx
│   ├── dream.ThemeApplicator.tsx
│   ├── dream.ThemeToggle.tsx
│   ├── dream.ToastSystem.tsx
│   ├── dream.VoidThemeToggle.tsx
│   ├── dream.panel.ChildSafetyPanel.tsx
│   ├── dream.panel.IDariPanel.tsx
│   ├── dream.universal_asset_registry.tsx
│   ├── dream.widget.AnchorWidget.tsx
│   ├── dream.widget.ProfileWidgetBlock.tsx
│   ├── dream.widget.WidgetBubble.tsx
│   ├── dreamengin
│   │   ├── dream.CanvasDropZone.tsx
│   │   ├── dream.DREAMenginOS.tsx
│   │   ├── dream.DrEamsCanvas.tsx
│   │   ├── dream.HomeControls.tsx
│   │   ├── dream.bar.DrEamsSearchBar.tsx
│   │   ├── dream.menu.NexusMenu.tsx
│   │   ├── dream.menu.OutdreamMenu.tsx
│   │   ├── dream.overlay.ViewAllDreamsOverlay.tsx
│   │   ├── dream.panel.CrossEnginStatusPanel.tsx
│   │   ├── dream.panel.DrEamsPanel.tsx
│   │   ├── dream.scene.BabylonGameScene.tsx
│   │   ├── dream.scene.DrEamsScene.tsx
│   │   ├── dream.scene.PortfolioOptimizationScene.tsx
│   │   ├── dream.shell.EnginShell.tsx
│   │   ├── dream.widget.AppearanceWidget.tsx
│   │   ├── dreamsurface.dreamengin.tsx
│   │   └── engine
│   │       ├── math.ts
│   │       └── types.ts
│   ├── dreamnav
│   │   ├── dream.DreamNavControls.tsx
│   │   └── dreamsurface.dreamnav.tsx
│   ├── dreamr
│   │   ├── dream.CloseFriendsSettings.tsx
│   │   ├── dream.panel.DreamRChannelPanel.tsx
│   │   └── dream.panel.DreamRCreatorPanel.tsx
│   ├── dreams
│   │   ├── dream.DraggableDream.tsx
│   │   ├── dream.GlobalDragLayer.tsx
│   │   ├── dream.PlatformErrorReporter.tsx
│   │   ├── dream.SlideOverPanel.tsx
│   │   ├── dream.connectorlayer.tsx
│   │   ├── dream.featurelayer.tsx
… (197 more files)
```
<details><summary>User-Facing Modularity file index (317 files)</summary>

- `components/activity/dream.ActivityPostForm.tsx` — React UI module for ActivityPostForm.
- `components/activity/dream.ActivityProfile.tsx` — React UI module for ActivityProfile.
- `components/activity/dream.TierBadge.tsx` — React UI module for TierBadge.
- `components/ads/dream.AdUnit.tsx` — React UI module for AdUnit.
- `components/ads/dream.SkipCreditBalance.tsx` — React UI module for SkipCreditBalance.
- `components/auth/dream.PasswordField.tsx` — React UI module for PasswordField.
- `components/connectors/dream.AddSliceSheet.tsx` — React UI module for AddSliceSheet.
- `components/connectors/dream.ConnectDreamPrompt.tsx` — React UI module for ConnectDreamPrompt.
- `components/connectors/dream.ConnectorRow.tsx` — React UI module for ConnectorRow.
- `components/connectors/dream.NoSlotDialog.tsx` — React UI module for NoSlotDialog.
- `components/connectors/dream.PlacementMode.tsx` — React UI module for PlacementMode.
- `components/connectors/dream.widget.ConnectWidgetPrompt.tsx` — React UI module for WidgetConnectWidgetPrompt.
- `components/connectors/dream.widget.ConnectorWidgetPicker.tsx` — React UI module for WidgetConnectorWidgetPicker.
- `components/core/dream.CoreDream.tsx` — React UI module for CoreDream.
- `components/customize/dream.GlobalCustomizeUI.tsx` — React UI module for GlobalCustomizeUI.
- `components/customize/dream.bar.CustomizeModeBar.tsx` — React UI module for BarCustomizeModeBar.
- `components/customize/dream.bar.CustomizeToolbar.tsx` — React UI module for BarCustomizeToolbar.
- `components/customize/panels/dream.panel.ColorPanel.tsx` — React UI module for PanelColorPanel.
- `components/customize/panels/dream.panel.EffectsPanel.tsx` — React UI module for PanelEffectsPanel.
- `components/customize/panels/dream.panel.FontPanel.tsx` — React UI module for PanelFontPanel.
- `components/customize/panels/dream.panel.LayoutPanel.tsx` — React UI module for PanelLayoutPanel.
- `components/daydream/dream.CodeDreamIDE.tsx` — React UI module for CodeDreamIDE.
- `components/daydream/dream.DiffViewer.tsx` — React UI module for DiffViewer.
- `components/daydream/dream.JourneyTrail.tsx` — React UI module for JourneyTrail.
- `components/daydream/dream.LabDreamIDE.tsx` — React UI module for LabDreamIDE.
- `components/daydream/dream.NGNEngin.tsx` — React UI module for NGNEngin.
- `components/daydream/dream.OpenDaydreamSideBButton.tsx` — React UI module for OpenDaydreamSideBButton.
- `components/daydream/dream.StandaloneEnginSurface.tsx` — React UI module for StandaloneEnginSurface.
- `components/daydream/dream.constellationmap.tsx` — React UI module for Constellationmap.
- `components/daydream/dream.shell.DaydreamShell.tsx` — React UI module for ShellDaydreamShell.
- `components/daydream/dreamsurface.daydream.AnalyticsDaydream.tsx` — React UI module for DreamsurfaceDaydreamAnalyticsDaydream.
- `components/daydream/dreamsurface.daydream.BrandDaydream.tsx` — React UI module for DreamsurfaceDaydreamBrandDaydream.
- `components/daydream/starmaker/dream.panel.CompingPanel.tsx` — React UI module for PanelCompingPanel.
- `components/daydream/starmaker/dream.panel.MultitrackArrangementPanel.tsx` — React UI module for PanelMultitrackArrangementPanel.
- `components/daydream/starmaker/dream.panel.PianoRollPanel.tsx` — React UI module for PanelPianoRollPanel.
- `components/daydream/starmaker/dream.panel.SessionViewPanel.tsx` — React UI module for PanelSessionViewPanel.
- `components/draggable/dream.DraggableModule.tsx` — React UI module for DraggableModule.
- `components/dream.AIAssistant.tsx` — React UI module for AIAssistant.
- `components/dream.AudioVisualizer3D.tsx` — React UI module for AudioVisualizer3D.
- `components/dream.BoogieWarningBanner.tsx` — React UI module for BoogieWarningBanner.
- `components/dream.BrandLogo.tsx` — React UI module for BrandLogo.
- `components/dream.CommandPalette.tsx` — React UI module for CommandPalette.
- `components/dream.CreatePostModal.tsx` — React UI module for CreatePostModal.
- `components/dream.DrEamsModeToggle.tsx` — React UI module for DrEamsModeToggle.
- `components/dream.DrEamsVoiceAssistant.tsx` — React UI module for DrEamsVoiceAssistant.
- `components/dream.DragToAnchorClose.tsx` — React UI module for DragToAnchorClose.
- `components/dream.FeedCard.tsx` — React UI module for FeedCard.
- `components/dream.ForgeDreamCanvas.tsx` — React UI module for ForgeDreamCanvas.
- `components/dream.GlobalOverlays.tsx` — React UI module for GlobalOverlays.
- `components/dream.HeroSprite.tsx` — React UI module for HeroSprite.
- `components/dream.HomeFeed.tsx` — React UI module for HomeFeed.
- `components/dream.IconSelector.tsx` — React UI module for IconSelector.
- `components/dream.InnerDreamsButton.tsx` — React UI module for InnerDreamsButton.
- `components/dream.KonamiDream.tsx` — React UI module for KonamiDream.
- `components/dream.LedgerChart.tsx` — React UI module for LedgerChart.
- `components/dream.MessagesClient.tsx` — React UI module for MessagesClient.
- `components/dream.NotificationCenter.tsx` — React UI module for NotificationCenter.
- `components/dream.OSShellActivator.tsx` — React UI module for OSShellActivator.
- `components/dream.PhysicsLab.tsx` — React UI module for PhysicsLab.
- `components/dream.ProfileEditor.tsx` — React UI module for ProfileEditor.
- `components/dream.ProfileShareButton.tsx` — React UI module for ProfileShareButton.
- `components/dream.ProfileSpace.tsx` — React UI module for ProfileSpace.
- `components/dream.PullToRefresh.tsx` — React UI module for PullToRefresh.
- `components/dream.ShrunkMode.tsx` — React UI module for ShrunkMode.
- `components/dream.SkeletonLoaders.tsx` — React UI module for SkeletonLoaders.
- `components/dream.ThemeApplicator.tsx` — React UI module for ThemeApplicator.
- `components/dream.ThemeToggle.tsx` — React UI module for ThemeToggle.
- `components/dream.ToastSystem.tsx` — React UI module for ToastSystem.
- `components/dream.VoidThemeToggle.tsx` — React UI module for VoidThemeToggle.
- `components/dream.panel.ChildSafetyPanel.tsx` — React UI module for PanelChildSafetyPanel.
- `components/dream.panel.IDariPanel.tsx` — React UI module for PanelIDariPanel.
- `components/dream.universal_asset_registry.tsx` — React UI module for UniversalAssetRegistry.
- `components/dream.widget.AnchorWidget.tsx` — React UI module for WidgetAnchorWidget.
- `components/dream.widget.ProfileWidgetBlock.tsx` — React UI module for WidgetProfileWidgetBlock.
- `components/dream.widget.WidgetBubble.tsx` — React UI module for WidgetWidgetBubble.
- `components/dreamengin/dream.CanvasDropZone.tsx` — React UI module for CanvasDropZone.
- `components/dreamengin/dream.DREAMenginOS.tsx` — React UI module for DREAMenginOS.
- `components/dreamengin/dream.DrEamsCanvas.tsx` — React UI module for DrEamsCanvas.
- `components/dreamengin/dream.HomeControls.tsx` — React UI module for HomeControls.
- `components/dreamengin/dream.bar.DrEamsSearchBar.tsx` — React UI module for BarDrEamsSearchBar.
- `components/dreamengin/dream.menu.NexusMenu.tsx` — React UI module for MenuNexusMenu.
- `components/dreamengin/dream.menu.OutdreamMenu.tsx` — React UI module for MenuOutdreamMenu.
- `components/dreamengin/dream.overlay.ViewAllDreamsOverlay.tsx` — React UI module for OverlayViewAllDreamsOverlay.
- `components/dreamengin/dream.panel.CrossEnginStatusPanel.tsx` — React UI module for PanelCrossEnginStatusPanel.
- `components/dreamengin/dream.panel.DrEamsPanel.tsx` — React UI module for PanelDrEamsPanel.
- `components/dreamengin/dream.scene.BabylonGameScene.tsx` — React UI module for SceneBabylonGameScene.
- `components/dreamengin/dream.scene.DrEamsScene.tsx` — React UI module for SceneDrEamsScene.
- `components/dreamengin/dream.scene.PortfolioOptimizationScene.tsx` — React UI module for ScenePortfolioOptimizationScene.
- `components/dreamengin/dream.shell.EnginShell.tsx` — React UI module for ShellEnginShell.
- `components/dreamengin/dream.widget.AppearanceWidget.tsx` — React UI module for WidgetAppearanceWidget.
- `components/dreamengin/dreamsurface.dreamengin.tsx` — React UI module for DreamsurfaceDreamengin.
- `components/dreamengin/engine/math.ts` — TypeScript/JavaScript runtime module.
- `components/dreamengin/engine/types.ts` — TypeScript/JavaScript runtime module.
- `components/dreamnav/dream.DreamNavControls.tsx` — React UI module for DreamNavControls.
- `components/dreamnav/dreamsurface.dreamnav.tsx` — React UI module for DreamsurfaceDreamnav.
- `components/dreamr/dream.CloseFriendsSettings.tsx` — React UI module for CloseFriendsSettings.
- `components/dreamr/dream.panel.DreamRChannelPanel.tsx` — React UI module for PanelDreamRChannelPanel.
- `components/dreamr/dream.panel.DreamRCreatorPanel.tsx` — React UI module for PanelDreamRCreatorPanel.
- `components/dreams/dream.DraggableDream.tsx` — React UI module for DraggableDream.
- `components/dreams/dream.GlobalDragLayer.tsx` — React UI module for GlobalDragLayer.
- `components/dreams/dream.PlatformErrorReporter.tsx` — React UI module for PlatformErrorReporter.
- `components/dreams/dream.SlideOverPanel.tsx` — React UI module for SlideOverPanel.
- `components/dreams/dream.connectorlayer.tsx` — React UI module for Connectorlayer.
- `components/dreams/dream.featurelayer.tsx` — React UI module for Featurelayer.
- `components/dreams/dream.outputlayer.tsx` — React UI module for Outputlayer.
- `components/dreams/dream.panel.RuntimeMemoryHUD.tsx` — React UI module for PanelRuntimeMemoryHUD.
- `components/dreams/dream.shell.DreamShell.tsx` — React UI module for ShellDreamShell.
- `components/dreams/dream.shell.SharedDreamShell.tsx` — React UI module for ShellSharedDreamShell.
- `components/dreams/dream.widget.SuperDreamWidget.tsx` — React UI module for WidgetSuperDreamWidget.
- `components/dreams/dream.window.JourneyDreamWindow.tsx` — React UI module for WindowJourneyDreamWindow.
- `components/dreams/dreamsurface.dreamspace.tsx` — React UI module for DreamsurfaceDreamspace.
- `components/dreams/dreamsurface.shell.tsx` — React UI module for DreamsurfaceShell.
- `components/dreams/dreamsurface.window.tsx` — React UI module for DreamsurfaceWindow.
- `components/engines/brand/dream.BrandEnginApp.tsx` — React UI module for BrandEnginApp.
- `components/engines/brand/index.ts` — TypeScript/JavaScript runtime module.
- `components/engines/brand/panels/dream.panel.CampaignsPanel.tsx` — React UI module for PanelCampaignsPanel.
- `components/engines/brand/panels/dream.panel.IdentityPanel.tsx` — React UI module for PanelIdentityPanel.
- `components/engines/code/dream.CodeEnginApp.tsx` — React UI module for CodeEnginApp.
- `components/engines/code/index.ts` — TypeScript/JavaScript runtime module.
- `components/engines/code/panels/dream.panel.AIPanel.tsx` — React UI module for PanelAIPanel.
- `components/engines/code/panels/dream.panel.NotebookPanel.tsx` — React UI module for PanelNotebookPanel.
- `components/engines/code/panels/dream.panel.ProjectsPanel.tsx` — React UI module for PanelProjectsPanel.
- `components/engines/create/dream.CreateEnginApp.tsx` — React UI module for CreateEnginApp.
- `components/engines/create/index.ts` — TypeScript/JavaScript runtime module.
- `components/engines/create/panels/dream.panel.CalendarPanel.tsx` — React UI module for PanelCalendarPanel.
- `components/engines/create/panels/dream.panel.EditorPanel.tsx` — React UI module for PanelEditorPanel.
- `components/engines/create/panels/dream.panel.QueuePanel.tsx` — React UI module for PanelQueuePanel.
- `components/engines/games/dream.GameEnginApp.tsx` — React UI module for GameEnginApp.
- `components/engines/games/index.ts` — TypeScript/JavaScript runtime module.
- `components/engines/games/panels/dream.panel.BuilderPanel.tsx` — React UI module for PanelBuilderPanel.
- `components/engines/games/panels/dream.panel.LibraryPanel.tsx` — React UI module for PanelLibraryPanel.
- `components/engines/games/panels/dream.panel.ScoresPanel.tsx` — React UI module for PanelScoresPanel.
- `components/engines/index.ts` — TypeScript/JavaScript runtime module.
- `components/engines/lab/dream.LabEnginApp.tsx` — React UI module for LabEnginApp.
- `components/engines/lab/index.ts` — TypeScript/JavaScript runtime module.
- `components/engines/lab/panels/dream.panel.DataVizPanel.tsx` — React UI module for PanelDataVizPanel.
- `components/engines/lab/panels/dream.panel.ExperimentsPanel.tsx` — React UI module for PanelExperimentsPanel.
- `components/engines/lab/panels/dream.panel.QuantumPanel.tsx` — React UI module for PanelQuantumPanel.
- `components/engines/music/dream.MusicEnginApp.tsx` — React UI module for MusicEnginApp.
- `components/engines/music/index.ts` — TypeScript/JavaScript runtime module.
- `components/engines/music/panels/dream.panel.ArrangePanel.tsx` — React UI module for PanelArrangePanel.
- `components/engines/music/panels/dream.panel.MusicLibraryPanel.tsx` — React UI module for PanelMusicLibraryPanel.
- `components/engines/music/panels/dream.panel.StudioPanel.tsx` — React UI module for PanelStudioPanel.
- `components/engines/portfolio/dream.PortfolioEnginApp.tsx` — React UI module for PortfolioEnginApp.
- `components/engines/portfolio/index.ts` — TypeScript/JavaScript runtime module.
- `components/engines/portfolio/panels/dream.panel.AssetsPanel.tsx` — React UI module for PanelAssetsPanel.
- `components/engines/portfolio/panels/dream.panel.OptimizePanel.tsx` — React UI module for PanelOptimizePanel.
- `components/engines/portfolio/panels/dream.panel.PortfolioQuantumPanel.tsx` — React UI module for PanelPortfolioQuantumPanel.
- `components/engines/shared/dream.EnginProvider.tsx` — React UI module for EnginProvider.
- `components/engines/shared/dream.EnginRuleSet.ts` — TypeScript/JavaScript runtime module.
- `components/engines/shared/dream.bar.EnginNavBar.tsx` — React UI module for BarEnginNavBar.
- `components/engines/shared/dream.makeEnginApp.tsx` — React UI module for MakeEnginApp.
- `components/engines/shared/dream.shell.EnginAppShell.tsx` — React UI module for ShellEnginAppShell.
- `components/engines/shared/index.ts` — TypeScript/JavaScript runtime module.
- `components/feed/dream.AlgorithmEngine.tsx` — React UI module for AlgorithmEngine.
- `components/feed/dream.CommentSection.tsx` — React UI module for CommentSection.
- `components/feed/dream.FeedVideoCard.tsx` — React UI module for FeedVideoCard.
- `components/feed/dream.FollowButton.tsx` — React UI module for FollowButton.
- `components/feed/dream.FollowOnboarding.tsx` — React UI module for FollowOnboarding.
- `components/feeds/dream.widget.EmbedFeedWidget.tsx` — React UI module for WidgetEmbedFeedWidget.
- `components/forge/dream.EngineBuilderCanvas.tsx` — React UI module for EngineBuilderCanvas.
- `components/forge/dream.panel.AIBuilderPanel.tsx` — React UI module for PanelAIBuilderPanel.
- `components/forge/dream.widget.ForgeMomentumWidget.tsx` — React UI module for WidgetForgeMomentumWidget.
- `components/gameengin/README.md` — documentation file.
- `components/gameengin/dream.CartridgeRegistryBootstrap.tsx` — React UI module for CartridgeRegistryBootstrap.
- `components/gameengin/dream.CrashReportModal.tsx` — React UI module for CrashReportModal.
- `components/gameengin/dream.cartridge.CartridgeBrowser.tsx` — React UI module for CartridgeCartridgeBrowser.
- `components/gameengin/dream.cartridge.CartridgeErrorBoundary.tsx` — React UI module for CartridgeCartridgeErrorBoundary.
- `components/gameengin/dream.cartridge.CartridgeLauncher.tsx` — React UI module for CartridgeCartridgeLauncher.
- `components/gameengin/dream.cartridge.FeaturedCartridges.tsx` — React UI module for CartridgeFeaturedCartridges.
- `components/gameengin/input/DualSenseManager.ts` — TypeScript/JavaScript runtime module.
- `components/games/_fx/canvasFx.ts` — TypeScript/JavaScript runtime module.
- `components/games/css-modules.d.ts` — TypeScript/JavaScript runtime module.
- `components/games/dream.AvenueOfMirrors.tsx` — React UI module for AvenueOfMirrors.
- `components/games/dream.BabylonSideScroller.tsx` — React UI module for BabylonSideScroller.
- `components/games/dream.DefuseRitual.tsx` — React UI module for DefuseRitual.
- `components/games/dream.EchoArena.tsx` — React UI module for EchoArena.
- `components/games/dream.EnginFracture.tsx` — React UI module for EnginFracture.
- `components/games/dream.GameController.module.css` — project file (css).
- `components/games/dream.GameController.tsx` — React UI module for GameController.
- `components/games/dream.GamesHub.tsx` — React UI module for GamesHub.
- `components/games/dream.Glassfall.tsx` — React UI module for Glassfall.
- `components/games/dream.Leaderboard.tsx` — React UI module for Leaderboard.
- `components/games/dream.LexiconSolitaire.tsx` — React UI module for LexiconSolitaire.
- `components/games/dream.NeonDrift.tsx` — React UI module for NeonDrift.
- `components/games/dream.NiteFlyerSolarHymn.tsx` — React UI module for NiteFlyerSolarHymn.
- `components/games/dream.NullCathedral.tsx` — React UI module for NullCathedral.
- `components/games/dream.RecordingControls.tsx` — React UI module for RecordingControls.
- `components/games/dream.SerpentSiege.tsx` — React UI module for SerpentSiege.
- `components/games/dream.VoidlineGP.tsx` — React UI module for VoidlineGP.
- `components/games/dream.hud.GameHUD.tsx` — React UI module for HudGameHUD.
- `components/games/dream.hud.LegacyGameHUD.tsx` — React UI module for HudLegacyGameHUD.
- `components/games/dream.hud.MobileGameHUD.module.css` — project file (css).
- `components/games/dream.hud.MobileGameHUD.tsx` — React UI module for HudMobileGameHUD.
- `components/games/dream.remote.GameRemote.tsx` — React UI module for RemoteGameRemote.
- `components/games/dream.remote.LegacyGameRemote.tsx` — React UI module for RemoteLegacyGameRemote.
- `components/games/madmaxi/audio.ts` — TypeScript/JavaScript runtime module.
- `components/games/madmaxi/authoredZonePacks.ts` — TypeScript/JavaScript runtime module.
- `components/games/madmaxi/config.ts` — TypeScript/JavaScript runtime module.
- `components/games/madmaxi/dream.MadmaxiGame.tsx` — React UI module for MadmaxiGame.
- `components/games/madmaxi/index.ts` — TypeScript/JavaScript runtime module.
- `components/games/madmaxi/levels.ts` — TypeScript/JavaScript runtime module.
- `components/games/madmaxi/materials.ts` — TypeScript/JavaScript runtime module.
- `components/games/madmaxi/types.ts` — TypeScript/JavaScript runtime module.
- `components/games/madmaxi/vfx.ts` — TypeScript/JavaScript runtime module.
- `components/home/dream.ActiveModuleSurface.tsx` — React UI module for ActiveModuleSurface.
- `components/home/dream.DaydreamPulseStrip.tsx` — React UI module for DaydreamPulseStrip.
- `components/home/dream.FlagshipEnginesStrip.tsx` — React UI module for FlagshipEnginesStrip.
- `components/home/dream.NeuralSeamCanvas.tsx` — React UI module for NeuralSeamCanvas.
- `components/home/dream.bar.GlobalDreamBar.tsx` — React UI module for BarGlobalDreamBar.
- `components/home/dream.bar.PersistentDreamBar.tsx` — React UI module for BarPersistentDreamBar.
- `components/home/dream.widget.DreamWidget.tsx` — React UI module for WidgetDreamWidget.
- `components/idari/dream.PlatformHealth.tsx` — React UI module for PlatformHealth.
- `components/landing/dream.LandingNav.tsx` — React UI module for LandingNav.
- `components/landing/dream.LandingProductStatement.tsx` — React UI module for LandingProductStatement.
- `components/landing/dream.scene.UniverseField.tsx` — React UI module for SceneUniverseField.
- `components/marketplace/dream.MarketplaceListingCard.tsx` — React UI module for MarketplaceListingCard.
- `components/marketplace/dream.MarketplaceRequestButton.tsx` — React UI module for MarketplaceRequestButton.
- `components/menus/dream.menu.DreamRadialMenu.tsx` — React UI module for MenuDreamRadialMenu.
- `components/menus/dream.menu.DualBottomMenu.tsx` — React UI module for MenuDualBottomMenu.
- `components/menus/dream.menu.RadialMenu.tsx` — React UI module for MenuRadialMenu.
- `components/menus/dream.menu.SystemRadialMenu.tsx` — React UI module for MenuSystemRadialMenu.
- `components/menus/dream.panel.MenuPanel.tsx` — React UI module for PanelMenuPanel.
- `components/messaging/dream.BoardComposer.tsx` — React UI module for BoardComposer.
- `components/music/dream.SoundRecorder.tsx` — React UI module for SoundRecorder.
- `components/onboarding/dream.OnboardingTip.tsx` — React UI module for OnboardingTip.
- `components/optimizer/dream.scene.BabylonOptimizeroScene.tsx` — React UI module for SceneBabylonOptimizeroScene.
- `components/overlays/dream.RootStatusScreen.tsx` — React UI module for RootStatusScreen.
- `components/panels/dream.panel.AlgorithmPanel.tsx` — React UI module for PanelAlgorithmPanel.
- `components/panels/dream.panel.AppearancePanel.tsx` — React UI module for PanelAppearancePanel.
- `components/panels/dream.panel.ConnectorsPanel.tsx` — React UI module for PanelConnectorsPanel.
- `components/panels/dream.panel.ControlsPanel.tsx` — React UI module for PanelControlsPanel.
- `components/panels/dream.panel.DataPanel.tsx` — React UI module for PanelDataPanel.
- `components/panels/dream.panel.FeedPanel.tsx` — React UI module for PanelFeedPanel.
- `components/panels/dream.panel.FeedSettingsPanel.tsx` — React UI module for PanelFeedSettingsPanel.
- `components/panels/dream.panel.HelpPanel.tsx` — React UI module for PanelHelpPanel.
- `components/panels/dream.panel.MarketplacePanel.tsx` — React UI module for PanelMarketplacePanel.
- `components/panels/dream.panel.PrivacyPanel.tsx` — React UI module for PanelPrivacyPanel.
- `components/panels/dream.panel.ProfilePanel.tsx` — React UI module for PanelProfilePanel.
- `components/panels/dream.panel.SafetyPanel.tsx` — React UI module for PanelSafetyPanel.
- `components/panels/dream.panel.SettingsPanel.tsx` — React UI module for PanelSettingsPanel.
- `components/panels/dream.panel.WidgetsPanel.tsx` — React UI module for PanelWidgetsPanel.
- `components/profile/dream.EditableAvatar.tsx` — React UI module for EditableAvatar.
- `components/profile/dream.ProfileCanvas.tsx` — React UI module for ProfileCanvas.
- `components/profile/dream.ProfileCustomizeButton.tsx` — React UI module for ProfileCustomizeButton.
- `components/profile/dream.widget.ProfileWidgetGrid.tsx` — React UI module for WidgetProfileWidgetGrid.
- `components/providers/dream.AppSurfaceShell.tsx` — React UI module for AppSurfaceShell.
- `components/providers/dream.GodTierProvider.tsx` — React UI module for GodTierProvider.
- `components/providers/dream.ThemeProvider.tsx` — React UI module for ThemeProvider.
- `components/runtime/dream.DualRuntimeContainer.tsx` — React UI module for DualRuntimeContainer.
- `components/runtime/dream.RuntimeView.tsx` — React UI module for RuntimeView.
- `components/runtime/dream.shell.RuntimeShell.tsx` — React UI module for ShellRuntimeShell.
- `components/shaders/dream.LightningWing.tsx` — React UI module for LightningWing.
- `components/shaders/dream.NeonGlow.tsx` — React UI module for NeonGlow.
- `components/shaders/dream.Refractor.tsx` — React UI module for Refractor.
- `components/shaders/index.ts` — TypeScript/JavaScript runtime module.
- `components/shared-dream/dream.InviteFlow.tsx` — React UI module for InviteFlow.
- `components/shared-dream/dream.SharedDreamCanvas.tsx` — React UI module for SharedDreamCanvas.
- `components/shared-dream/dream.SharedDreamProvider.tsx` — React UI module for SharedDreamProvider.
- `components/shared-dream/dream.SharedDreamRuntime.tsx` — React UI module for SharedDreamRuntime.
- `components/shared-dream/index.ts` — TypeScript/JavaScript runtime module.
- `components/spatial/dream.PixiPhysicsLayer.tsx` — React UI module for PixiPhysicsLayer.
- `components/spatial/dream.ProfileSpace.tsx` — React UI module for ProfileSpace.
- `components/spatial/dream.shell.EnhancedSpatialShell.tsx` — React UI module for ShellEnhancedSpatialShell.
- `components/three/dream.scene.tsx` — React UI module for Scene.
- `components/three/index.ts` — TypeScript/JavaScript runtime module.
- `components/ui/dream.AuthenticatedPageHeader.tsx` — React UI module for AuthenticatedPageHeader.
- `components/ui/dream.DreamWord.tsx` — React UI module for DreamWord.
- `components/ui/dream.IconList.tsx` — React UI module for IconList.
- `components/ui/dream.InfinityIcon.tsx` — React UI module for InfinityIcon.
- `components/ui/dream.PlatformBadge.tsx` — React UI module for PlatformBadge.
- `components/ui/dream.SheetIcon.tsx` — React UI module for SheetIcon.
- `components/ui/dream.SocialShareSheet.tsx` — React UI module for SocialShareSheet.
- `components/universal-editor/dream.UniversalEditor.tsx` — React UI module for UniversalEditor.
- `components/universal-editor/dream.UniversalEditorWrapper.tsx` — React UI module for UniversalEditorWrapper.
- `components/universal-editor/index.ts` — TypeScript/JavaScript runtime module.
- `components/universal-editor/useTapHoldMove.ts` — TypeScript/JavaScript runtime module.
- `components/universe/dream.node-cluster.tsx` — React UI module for NodeCluster.
- `components/universe/dream.shell.universe-shell.tsx` — React UI module for ShellUniverseShell.
- `components/universe/dream.universe-card.tsx` — React UI module for UniverseCard.
- `components/universe/index.ts` — TypeScript/JavaScript runtime module.
- `components/warp/dream.WarpCanvas.tsx` — React UI module for WarpCanvas.
- `components/webgpu/dream.WebGPUShowcase.tsx` — React UI module for WebGPUShowcase.
- `components/webgpu/neuralPostProcess.ts` — TypeScript/JavaScript runtime module.
- `components/webgpu/renderer.ts` — TypeScript/JavaScript runtime module.
- `components/webgpu/shaders.ts` — TypeScript/JavaScript runtime module.
- `components/widgets/dream.AddDreamCTA.tsx` — React UI module for AddDreamCTA.
- `components/widgets/dream.ConfigureSheet.tsx` — React UI module for ConfigureSheet.
- `components/widgets/dream.EditModeBanner.tsx` — React UI module for EditModeBanner.
- `components/widgets/dream.EditModeProvider.tsx` — React UI module for EditModeProvider.
- `components/widgets/dream.widget.PlayMediaWidget.tsx` — React UI module for WidgetPlayMediaWidget.
- `components/widgets/dream.widget.UniversalWidget.tsx` — React UI module for WidgetUniversalWidget.
- `components/widgets/dream.widget.WidgetCard.tsx` — React UI module for WidgetWidgetCard.
- `components/widgets/dream.widget.WidgetLibrary.tsx` — React UI module for WidgetWidgetLibrary.
- `components/widgets/dream.widget.WidgetPlaceholder.tsx` — React UI module for WidgetWidgetPlaceholder.
- `components/widgets/dream.widget.WidgetShell.tsx` — React UI module for WidgetWidgetShell.
- `components/widgets/dream.widget.WidgetSurface.tsx` — React UI module for WidgetWidgetSurface.
- `hooks/use-spatial.ts` — TypeScript/JavaScript runtime module.
- `hooks/useAccount.ts` — TypeScript/JavaScript runtime module.
- `hooks/useConnectorInstallFlow.ts` — TypeScript/JavaScript runtime module.
- `hooks/useDreamLayout.ts` — TypeScript/JavaScript runtime module.
- `hooks/useHideOnScroll.ts` — TypeScript/JavaScript runtime module.
- `hooks/useSharedDream.ts` — TypeScript/JavaScript runtime module.
- `hooks/useTapHoldMove.ts` — TypeScript/JavaScript runtime module.
- `hooks/useTick.ts` — TypeScript/JavaScript runtime module.
- `hooks/useViewCounter.ts` — TypeScript/JavaScript runtime module.
- `lib/ui/CustomizeModeContext.tsx` — React UI module for CustomizeModeContext.
- `lib/ui/responsive.ts` — TypeScript/JavaScript runtime module.
- `lib/ui/runtimeViewport.ts` — TypeScript/JavaScript runtime module.
- `lib/ui/skin-engine.ts` — TypeScript/JavaScript runtime module.
- `lib/ui/theme-engine.ts` — TypeScript/JavaScript runtime module.
- `lib/ui/theme.ts` — TypeScript/JavaScript runtime module.
- `styles/dream-shell.css` — project file (css).
- `styles/globals.css` — project file (css).
- `styles/home-dream.css` — project file (css).
- `styles/theme.css` — project file (css).
- `styles/view-transitions.css` — project file (css).

</details>

## Custom Engins
Auto-synced from `engins/**`, `daydreams/**`, `components/daydream/**` using repository introspection.
- Files tracked: **37**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `AutoOpenGameEngin`, `BrandingEngin`, `CodeDreamIDE`, `CodeEngin`, `Constellationmap`, `ContentEngin`, `DiffViewer`, `DreamsurfaceDaydreamAnalyticsDaydream`, +21 more
#### Custom Engins file structure
```text
├── components
│   └── daydream
│       ├── dream.CodeDreamIDE.tsx
│       ├── dream.DiffViewer.tsx
│       ├── dream.JourneyTrail.tsx
│       ├── dream.LabDreamIDE.tsx
│       ├── dream.NGNEngin.tsx
│       ├── dream.OpenDaydreamSideBButton.tsx
│       ├── dream.StandaloneEnginSurface.tsx
│       ├── dream.constellationmap.tsx
│       ├── dream.shell.DaydreamShell.tsx
│       ├── dreamsurface.daydream.AnalyticsDaydream.tsx
│       ├── dreamsurface.daydream.BrandDaydream.tsx
│       └── starmaker
│           ├── dream.panel.CompingPanel.tsx
│           ├── dream.panel.MultitrackArrangementPanel.tsx
│           ├── dream.panel.PianoRollPanel.tsx
│           └── dream.panel.SessionViewPanel.tsx
├── daydreams
│   ├── brand
│   │   └── page.tsx
│   ├── code
│   │   └── page.tsx
│   ├── create
│   │   └── page.tsx
│   ├── games
│   │   └── page.tsx
│   ├── lab
│   │   └── page.tsx
│   └── music
│       └── page.tsx
└── engins
    ├── CodeEngin
    │   ├── core
    │   │   └── parser.ts
    │   ├── modules
    │   │   └── ai-co-pilot
    │   │       ├── dream.panel.AgentPanel.tsx
    │   │       ├── index.ts
    │   │       └── useAgentSession.ts
    │   └── orchestrator
    │       └── dream.index.tsx
    ├── autoopen
    │   └── dream.AutoOpenGameEngin.tsx
    ├── dream.ForgeEngin.tsx
    ├── dream.QuantumCircuitCanvas.tsx
    ├── dream.panel.AnalyticsEngin.tsx
    ├── engin.BrandingEngin.tsx
    ├── engin.CodeEngin.tsx
    ├── engin.ContentEngin.tsx
    ├── engin.GameEngin.tsx
    ├── engin.LabEngin.tsx
    ├── engin.StarMakerEngin.tsx
    └── portfolio
        └── dream.PortfolioEngin.tsx
```
<details><summary>Custom Engins file index (37 files)</summary>

- `components/daydream/dream.CodeDreamIDE.tsx` — React UI module for CodeDreamIDE.
- `components/daydream/dream.DiffViewer.tsx` — React UI module for DiffViewer.
- `components/daydream/dream.JourneyTrail.tsx` — React UI module for JourneyTrail.
- `components/daydream/dream.LabDreamIDE.tsx` — React UI module for LabDreamIDE.
- `components/daydream/dream.NGNEngin.tsx` — React UI module for NGNEngin.
- `components/daydream/dream.OpenDaydreamSideBButton.tsx` — React UI module for OpenDaydreamSideBButton.
- `components/daydream/dream.StandaloneEnginSurface.tsx` — React UI module for StandaloneEnginSurface.
- `components/daydream/dream.constellationmap.tsx` — React UI module for Constellationmap.
- `components/daydream/dream.shell.DaydreamShell.tsx` — React UI module for ShellDaydreamShell.
- `components/daydream/dreamsurface.daydream.AnalyticsDaydream.tsx` — React UI module for DreamsurfaceDaydreamAnalyticsDaydream.
- `components/daydream/dreamsurface.daydream.BrandDaydream.tsx` — React UI module for DreamsurfaceDaydreamBrandDaydream.
- `components/daydream/starmaker/dream.panel.CompingPanel.tsx` — React UI module for PanelCompingPanel.
- `components/daydream/starmaker/dream.panel.MultitrackArrangementPanel.tsx` — React UI module for PanelMultitrackArrangementPanel.
- `components/daydream/starmaker/dream.panel.PianoRollPanel.tsx` — React UI module for PanelPianoRollPanel.
- `components/daydream/starmaker/dream.panel.SessionViewPanel.tsx` — React UI module for PanelSessionViewPanel.
- `daydreams/brand/page.tsx` — route page.
- `daydreams/code/page.tsx` — route page.
- `daydreams/create/page.tsx` — route page.
- `daydreams/games/page.tsx` — route page.
- `daydreams/lab/page.tsx` — route page.
- `daydreams/music/page.tsx` — route page.
- `engins/CodeEngin/core/parser.ts` — TypeScript/JavaScript runtime module.
- `engins/CodeEngin/modules/ai-co-pilot/dream.panel.AgentPanel.tsx` — React UI module for PanelAgentPanel.
- `engins/CodeEngin/modules/ai-co-pilot/index.ts` — TypeScript/JavaScript runtime module.
- `engins/CodeEngin/modules/ai-co-pilot/useAgentSession.ts` — TypeScript/JavaScript runtime module.
- `engins/CodeEngin/orchestrator/dream.index.tsx` — React UI module for Index.
- `engins/autoopen/dream.AutoOpenGameEngin.tsx` — React UI module for AutoOpenGameEngin.
- `engins/dream.ForgeEngin.tsx` — React UI module for ForgeEngin.
- `engins/dream.QuantumCircuitCanvas.tsx` — React UI module for QuantumCircuitCanvas.
- `engins/dream.panel.AnalyticsEngin.tsx` — React UI module for PanelAnalyticsEngin.
- `engins/engin.BrandingEngin.tsx` — React UI module for BrandingEngin.
- `engins/engin.CodeEngin.tsx` — React UI module for CodeEngin.
- `engins/engin.ContentEngin.tsx` — React UI module for ContentEngin.
- `engins/engin.GameEngin.tsx` — React UI module for GameEngin.
- `engins/engin.LabEngin.tsx` — React UI module for LabEngin.
- `engins/engin.StarMakerEngin.tsx` — React UI module for StarMakerEngin.
- `engins/portfolio/dream.PortfolioEngin.tsx` — React UI module for PortfolioEngin.

</details>

## Full Website Customizability
Auto-synced from `app/settings/**`, `app/api/settings/**`, `lib/theme/**`, `styles/**` using repository introspection.
- Files tracked: **29**
- API routes discovered: `/api/settings/appearance`, `/api/settings/feed`, `/api/settings/notifications`, `/api/settings/privacy`
- App pages discovered: `/settings`, `/settings/account`, `/settings/algorithm`, `/settings/appearance`, `/settings/controls`, `/settings/data`, `/settings/dreams`, `/settings/feed`, +6 more
- Components/modules discovered: `ControlsClient`, `DangerZoneActions`, `DataClient`, `DreamsLayoutEditor`, `Page`, `PositionIndicatorToggle`, `PrivacyClient`
#### Full Website Customizability file structure
```text
├── app
│   ├── api
│   │   └── settings
│   │       ├── appearance
│   │       │   └── route.ts
│   │       ├── feed
│   │       │   └── route.ts
│   │       ├── notifications
│   │       │   └── route.ts
│   │       └── privacy
│   │           └── route.ts
│   └── settings
│       ├── account
│       │   ├── dream.DangerZoneActions.tsx
│       │   └── page.tsx
│       ├── algorithm
│       │   └── page.tsx
│       ├── appearance
│       │   └── page.tsx
│       ├── controls
│       │   ├── dream.ControlsClient.tsx
│       │   ├── dream.PositionIndicatorToggle.tsx
│       │   └── page.tsx
│       ├── data
│       │   ├── dream.DataClient.tsx
│       │   └── page.tsx
│       ├── dreams
│       │   ├── dreams-layout-editor.tsx
│       │   └── page.tsx
│       ├── feed
│       │   └── page.tsx
│       ├── help
│       │   └── page.tsx
│       ├── notifications
│       │   └── page.tsx
│       ├── page.tsx
│       ├── privacy
│       │   ├── dream.PrivacyClient.tsx
│       │   └── page.tsx
│       ├── safety
│       │   └── page.tsx
│       ├── security
│       │   └── page.tsx
│       └── widgets
│           └── page.tsx
└── styles
    ├── dream-shell.css
    ├── globals.css
    ├── home-dream.css
    ├── theme.css
    └── view-transitions.css
```
<details><summary>Full Website Customizability file index (29 files)</summary>

- `app/api/settings/appearance/route.ts` — API route handler.
- `app/api/settings/feed/route.ts` — API route handler.
- `app/api/settings/notifications/route.ts` — API route handler.
- `app/api/settings/privacy/route.ts` — API route handler.
- `app/settings/account/dream.DangerZoneActions.tsx` — React UI module for DangerZoneActions.
- `app/settings/account/page.tsx` — route page.
- `app/settings/algorithm/page.tsx` — route page.
- `app/settings/appearance/page.tsx` — route page.
- `app/settings/controls/dream.ControlsClient.tsx` — React UI module for ControlsClient.
- `app/settings/controls/dream.PositionIndicatorToggle.tsx` — React UI module for PositionIndicatorToggle.
- `app/settings/controls/page.tsx` — route page.
- `app/settings/data/dream.DataClient.tsx` — React UI module for DataClient.
- `app/settings/data/page.tsx` — route page.
- `app/settings/dreams/dreams-layout-editor.tsx` — React UI module for DreamsLayoutEditor.
- `app/settings/dreams/page.tsx` — route page.
- `app/settings/feed/page.tsx` — route page.
- `app/settings/help/page.tsx` — route page.
- `app/settings/notifications/page.tsx` — route page.
- `app/settings/page.tsx` — route page.
- `app/settings/privacy/dream.PrivacyClient.tsx` — React UI module for PrivacyClient.
- `app/settings/privacy/page.tsx` — route page.
- `app/settings/safety/page.tsx` — route page.
- `app/settings/security/page.tsx` — route page.
- `app/settings/widgets/page.tsx` — route page.
- `styles/dream-shell.css` — project file (css).
- `styles/globals.css` — project file (css).
- `styles/home-dream.css` — project file (css).
- `styles/theme.css` — project file (css).
- `styles/view-transitions.css` — project file (css).

</details>

## Backend, System, Core & CoreSurfaces
Auto-synced from `backend/**`, `core/**`, `coresurfaces/**`, `system/**`, `app/api/**`, `lib/supabase/**` using repository introspection.
- Files tracked: **134**
- API routes discovered: `/api/account/delete-data`, `/api/account/delete-dream`, `/api/account/export-data`, `/api/activity/track`, `/api/admin/ai-chat`, `/api/admin/ai-request`, `/api/admin/child-safety`, `/api/admin/code-files`, +99 more
- App pages discovered: none
- Components/modules discovered: `DreamsurfaceEditProfileDream`, `DreamsurfaceViewProfile`
#### Backend, System, Core & CoreSurfaces file structure
```text
├── app
│   └── api
│       ├── account
│       │   ├── delete-data
│       │   │   └── route.ts
│       │   ├── delete-dream
│       │   │   └── route.ts
│       │   └── export-data
│       │       └── route.ts
│       ├── activity
│       │   └── track
│       │       └── route.ts
│       ├── admin
│       │   ├── ai-chat
│       │   │   └── route.ts
│       │   ├── ai-request
│       │   │   └── route.ts
│       │   ├── child-safety
│       │   │   └── route.ts
│       │   ├── code-files
│       │   │   └── route.ts
│       │   └── observability
│       │       └── route.ts
│       ├── ads
│       │   ├── orders
│       │   │   └── route.ts
│       │   └── view
│       │       └── route.ts
│       ├── agent
│       │   └── session
│       │       └── route.ts
│       ├── ai
│       │   ├── boogieman
│       │   │   ├── child-safety
│       │   │   │   └── route.ts
│       │   │   ├── privacy-event
│       │   │   │   └── route.ts
│       │   │   ├── route.ts
│       │   │   └── status
│       │   │       └── route.ts
│       │   ├── eams
│       │   │   └── route.ts
│       │   ├── execute
│       │   │   └── route.ts
│       │   └── idari
│       │       └── route.ts
│       ├── appeal
│       │   └── route.ts
│       ├── auth
│       │   ├── logout
│       │   │   └── route.ts
│       │   └── providers
│       │       └── route.ts
│       ├── blocks
│       │   └── route.ts
│       ├── ci
│       │   └── run
│       │       └── route.ts
│       ├── close-friends
│       │   └── route.ts
│       ├── comments
│       │   └── route.ts
│       ├── connectors
│       │   ├── [provider]
│       │   │   ├── connect
│       │   │   │   └── route.ts
│       │   │   ├── disconnect
│       │   │   │   └── route.ts
│       │   │   ├── items
│       │   │   │   └── route.ts
│       │   │   ├── sync
│       │   │   │   └── route.ts
│       │   │   └── verify
│       │   │       └── route.ts
│       │   ├── cron
│       │   │   └── route.ts
│       │   ├── instagram
│       │   │   └── oauth
│       │   │       ├── callback
│       │   │       │   └── route.ts
│       │   │       └── start
│       │   │           └── route.ts
│       │   ├── status
│       │   │   └── route.ts
│       │   ├── webhooks
│       │   │   └── [provider]
│       │   │       └── route.ts
│       │   └── youtube
│       │       └── oauth
│       │           ├── callback
│       │           │   └── route.ts
│       │           └── start
│       │               └── route.ts
│       ├── content
│       │   ├── generative-fill
│       │   │   └── route.ts
│       │   ├── intelligence
│       │   │   └── route.ts
│       │   ├── transcribe
│       │   │   └── route.ts
│       │   └── voice-clone
│       │       └── route.ts
│       ├── dr-eams
│       │   ├── hf
│       │   │   └── route.ts
│       │   └── run
│       │       └── route.ts
│       ├── drafts
│       │   ├── [id]
│       │   │   └── route.ts
│       │   └── route.ts
│       ├── dream-windows
│       │   ├── [id]
│       │   │   └── route.ts
│       │   └── route.ts
│       ├── dreamengin
│       │   └── os-status
│       │       └── route.ts
│       ├── dreamr
│       │   ├── feed
… (14 more files)
```
<details><summary>Backend, System, Core & CoreSurfaces file index (134 files)</summary>

- `app/api/account/delete-data/route.ts` — API route handler.
- `app/api/account/delete-dream/route.ts` — API route handler.
- `app/api/account/export-data/route.ts` — API route handler.
- `app/api/activity/track/route.ts` — API route handler.
- `app/api/admin/ai-chat/route.ts` — API route handler.
- `app/api/admin/ai-request/route.ts` — API route handler.
- `app/api/admin/child-safety/route.ts` — API route handler.
- `app/api/admin/code-files/route.ts` — API route handler.
- `app/api/admin/observability/route.ts` — API route handler.
- `app/api/ads/orders/route.ts` — API route handler.
- `app/api/ads/view/route.ts` — API route handler.
- `app/api/agent/session/route.ts` — API route handler.
- `app/api/ai/boogieman/child-safety/route.ts` — API route handler.
- `app/api/ai/boogieman/privacy-event/route.ts` — API route handler.
- `app/api/ai/boogieman/route.ts` — API route handler.
- `app/api/ai/boogieman/status/route.ts` — API route handler.
- `app/api/ai/eams/route.ts` — API route handler.
- `app/api/ai/execute/route.ts` — API route handler.
- `app/api/ai/idari/route.ts` — API route handler.
- `app/api/appeal/route.ts` — API route handler.
- `app/api/auth/logout/route.ts` — API route handler.
- `app/api/auth/providers/route.ts` — API route handler.
- `app/api/blocks/route.ts` — API route handler.
- `app/api/ci/run/route.ts` — API route handler.
- `app/api/close-friends/route.ts` — API route handler.
- `app/api/comments/route.ts` — API route handler.
- `app/api/connectors/[provider]/connect/route.ts` — API route handler.
- `app/api/connectors/[provider]/disconnect/route.ts` — API route handler.
- `app/api/connectors/[provider]/items/route.ts` — API route handler.
- `app/api/connectors/[provider]/sync/route.ts` — API route handler.
- `app/api/connectors/[provider]/verify/route.ts` — API route handler.
- `app/api/connectors/cron/route.ts` — API route handler.
- `app/api/connectors/instagram/oauth/callback/route.ts` — API route handler.
- `app/api/connectors/instagram/oauth/start/route.ts` — API route handler.
- `app/api/connectors/status/route.ts` — API route handler.
- `app/api/connectors/webhooks/[provider]/route.ts` — API route handler.
- `app/api/connectors/youtube/oauth/callback/route.ts` — API route handler.
- `app/api/connectors/youtube/oauth/start/route.ts` — API route handler.
- `app/api/content/generative-fill/route.ts` — API route handler.
- `app/api/content/intelligence/route.ts` — API route handler.
- `app/api/content/transcribe/route.ts` — API route handler.
- `app/api/content/voice-clone/route.ts` — API route handler.
- `app/api/dr-eams/hf/route.ts` — API route handler.
- `app/api/dr-eams/run/route.ts` — API route handler.
- `app/api/drafts/[id]/route.ts` — API route handler.
- `app/api/drafts/route.ts` — API route handler.
- `app/api/dream-windows/[id]/route.ts` — API route handler.
- `app/api/dream-windows/route.ts` — API route handler.
- `app/api/dreamengin/os-status/route.ts` — API route handler.
- `app/api/dreamr/feed/route.ts` — API route handler.
- `app/api/dreamr/suggested/route.ts` — API route handler.
- `app/api/dreams/feed/route.ts` — API route handler.
- `app/api/dreams/instances/route.ts` — API route handler.
- `app/api/dreams/transfer/route.ts` — API route handler.
- `app/api/embed-feed/route.ts` — API route handler.
- `app/api/favorites/route.ts` — API route handler.
- `app/api/feed/route.ts` — API route handler.
- `app/api/follow/route.ts` — API route handler.
- `app/api/forge/build/route.ts` — API route handler.
- `app/api/gal/route.ts` — API route handler.
- `app/api/game-scores/route.ts` — API route handler.
- `app/api/gameengin/crash-report/route.ts` — API route handler.
- `app/api/health/route.ts` — API route handler.
- `app/api/home-layout/route.ts` — API route handler.
- `app/api/journey/route.ts` — API route handler.
- `app/api/lab/benchmarks/route.ts` — API route handler.
- `app/api/ledger-media/route.ts` — API route handler.
- `app/api/likes/route.ts` — API route handler.
- `app/api/marketplace/request/route.ts` — API route handler.
- `app/api/marketplace/route.ts` — API route handler.
- `app/api/messages/boards/route.ts` — API route handler.
- `app/api/messages/route.ts` — API route handler.
- `app/api/metrics/platform/route.ts` — API route handler.
- `app/api/metrics/route.ts` — API route handler.
- `app/api/metrics/user/[userId]/route.ts` — API route handler.
- `app/api/music/route.ts` — API route handler.
- `app/api/notifications/route.ts` — API route handler.
- `app/api/platform/errors/route.ts` — API route handler.
- `app/api/posts/[id]/route.ts` — API route handler.
- `app/api/posts/[id]/save/route.ts` — API route handler.
- `app/api/posts/[id]/view/route.ts` — API route handler.
- `app/api/posts/profile/[userId]/route.ts` — API route handler.
- `app/api/posts/route.ts` — API route handler.
- `app/api/profile/route.ts` — API route handler.
- `app/api/projects/route.ts` — API route handler.
- `app/api/scheduled-posts/route.ts` — API route handler.
- `app/api/security/scan/route.ts` — API route handler.
- `app/api/settings/appearance/route.ts` — API route handler.
- `app/api/settings/feed/route.ts` — API route handler.
- `app/api/settings/notifications/route.ts` — API route handler.
- `app/api/settings/privacy/route.ts` — API route handler.
- `app/api/setup/check/route.ts` — API route handler.
- `app/api/setup/google-oauth/route.ts` — API route handler.
- `app/api/shellhub/devices/route.ts` — API route handler.
- `app/api/shop/route.ts` — API route handler.
- `app/api/skip-credits/balance/route.ts` — API route handler.
- `app/api/skip-credits/earn/route.ts` — API route handler.
- `app/api/skip-credits/use/route.ts` — API route handler.
- `app/api/social/rss-feed/route.ts` — API route handler.
- `app/api/upload/route.ts` — API route handler.
- `app/api/user/layout/route.ts` — API route handler.
- `app/api/views/track/route.ts` — API route handler.
- `app/api/widgets/feed/route.ts` — API route handler.
- `app/api/widgets/instances/route.ts` — API route handler.
- `app/api/youtube/channel/route.ts` — API route handler.
- `app/api/youtube/discovery/route.ts` — API route handler.
- `app/api/youtube/live-feed/route.ts` — API route handler.
- `backend/.env.example` — project file (example).
- `backend/README.md` — documentation file.
- `backend/docker-compose.yml` — project file (yml).
- `backend/dockerfile` — project file (no extension).
- `backend/index.js` — TypeScript/JavaScript runtime module.
- `backend/package-lock.json` — project file (json).
- `backend/package.json` — project file (json).
- `backend/src/Routes/apiRoutes.js` — TypeScript/JavaScript runtime module.
- `backend/src/controllers/engagementController.js` — TypeScript/JavaScript runtime module.
- `backend/src/controllers/feedController.js` — TypeScript/JavaScript runtime module.
- `backend/src/controllers/ipfsController.js` — TypeScript/JavaScript runtime module.
- `backend/src/services/ipfsService.js` — TypeScript/JavaScript runtime module.
- `backend/src/services/livekitService.js` — TypeScript/JavaScript runtime module.
- `backend/src/socialaggregators/bluesky.js` — TypeScript/JavaScript runtime module.
- `backend/src/socialaggregators/mastodon.js` — TypeScript/JavaScript runtime module.
- `backend/src/socialaggregators/nostr.js` — TypeScript/JavaScript runtime module.
- `core/.gitkeep` — project file (no extension).
- `coresurfaces/dreamsurface.EditProfileDream.tsx` — React UI module for DreamsurfaceEditProfileDream.
- `coresurfaces/dreamsurface.ViewProfile.tsx` — React UI module for DreamsurfaceViewProfile.
- `lib/supabase/client.ts` — TypeScript/JavaScript runtime module.
- `lib/supabase/config.ts` — TypeScript/JavaScript runtime module.
- `lib/supabase/env.ts` — TypeScript/JavaScript runtime module.
- `lib/supabase/realtime.ts` — TypeScript/JavaScript runtime module.
- `lib/supabase/safeGetUser.ts` — TypeScript/JavaScript runtime module.
- `lib/supabase/server.ts` — TypeScript/JavaScript runtime module.
- `lib/supabase/vector.ts` — TypeScript/JavaScript runtime module.
- `system/ci/archive/root-workflows/github-actions.yml` — project file (yml).

</details>

## Agents & Workflow
Auto-synced from `agents/**`, `.github/workflows/**`, `.github/scripts/**`, `scripts/**` using repository introspection.
- Files tracked: **134**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Agents & Workflow file structure
```text
├── .github
│   ├── scripts
│   │   ├── DREAMENGIN_CORE_COMPLETE.md
│   │   ├── DREAMENGIN_CORE_USAGE.md
│   │   ├── ai_implement.py
│   │   ├── ai_neural_decision.py
│   │   ├── ai_propose.py
│   │   ├── ai_report_propose.py
│   │   ├── assemble_report_context.py
│   │   ├── catalog_games_for_ai.py
│   │   ├── check-root-hygiene.sh
│   │   ├── check_workflow_masking.py
│   │   ├── dreamengin_core.py
│   │   ├── humanai_audit.py
│   │   ├── issue-bot.js
│   │   ├── run-readme-autosync.mjs
│   │   ├── scan_dreamengin_context.py
│   │   ├── scan_gameengin_context.py
│   │   ├── validate_game_sandbox.py
│   │   └── validate_report_agent_spec.py
│   └── workflows
│       ├── autofixaudit.yml
│       ├── autofixvercelbuild.yml
│       ├── bot-pr-automerge.yml
│       ├── bouncer.yml
│       ├── codeql.yml
│       ├── copilot-setup-steps.yml
│       ├── daydream-all.yml
│       ├── daydream-brand-engin.yml
│       ├── daydream-code-engin.yml
│       ├── daydream-create-engin.yml
│       ├── daydream-engin-build-cycle.yml
│       ├── daydream-engin-sicc-refinement.yml
│       ├── daydream-games-engin.yml
│       ├── daydream-lab-engin.yml
│       ├── daydream-music-engin.yml
│       ├── db-extension-audit.yml
│       ├── db-extension-check.yml
│       ├── deploy-artifact.yml
│       ├── docs-auto-update.yml
│       ├── dreamengin-preflight.yml
│       ├── elite-gameengin-evolution.yml
│       ├── engin-all.yml
│       ├── exportrepo.yml
│       ├── full-audit.yml
│       ├── game-engin-patrol.yml
│       ├── game-library-research.yml
│       ├── gameengin-ai-agent.yml
│       ├── gameengin-artisan.yml
│       ├── gameengin-maestro.yml
│       ├── gameengin-mechanic.yml
│       ├── gameengin-prophet.yml
│       ├── gameengin-upgrader.yml
│       ├── gameengin-writer.yml
│       ├── games-library-ai-agent.yml
│       ├── garbageman.yml
│       ├── generatesupabasetypes.yml
│       ├── github-actions.yml
│       ├── humanai-army-audit.yml
│       ├── humanai-audit.yml
│       ├── idari-daily.yml
│       ├── issue-bot.yml
│       ├── mobile-nextgen-spec-evolution.yml
│       ├── mobile-ps5-spec-evolution.yml
│       ├── neural_decision_engine.yml
│       ├── optimize-dreamengin.yml
│       ├── orphan-guard.yml
│       ├── portfolio-optimization.yml
│       ├── preflight.yml
│       ├── print-codebase.yml
│       ├── readme-autosync.yml
│       ├── refreshlock.yml
│       ├── repo-snapshot.yml
│       ├── report-driven-coding-agent.yml
│       ├── resilient-engine-smoke.yml
│       ├── root-hygiene.yml
│       ├── spec-engin-ai-agent.yml
│       ├── sql-migration-guard.yml
│       ├── sync-build-memory.yml
│       ├── update-embed-feed.yml
│       ├── update-repo-state.yml
│       ├── vercel-deploy.yml
│       └── visual-schematic.yml
├── agents
│   ├── .gitkeep
│   ├── humanAI
│   │   ├── orchestrator.md
│   │   └── personas
│   │       ├── accessibility.md
│   │       ├── creator.md
│   │       ├── ios-first.md
│   │       ├── power-user.md
│   │       └── social-explorer.md
│   └── humanAI.persona.md
└── scripts
    ├── analyze-repo-state.mjs
    ├── archive
    │   ├── proxy.ts
    │   └── validate-deployment.js
    ├── autofix-vercel-build.mjs
    ├── check-build-memory-drift.mjs
    ├── check-engin-filenames.mjs
    ├── check-licenses.mjs
    ├── check-orphans.mjs
    ├── check-root-hygiene.mjs
    ├── close-all-open-prs.sh
    ├── deploy.sh
    ├── export-full-code.mjs
    ├── feature-build
    │   └── generate-features.mjs
    ├── gameengin
    │   ├── architect-run.ts
    │   ├── artisan-run.ts
    │   ├── lib
    │   │   └── tar.ts
    │   ├── maestro-analyze.ts
    │   ├── mechanic-run.ts
    │   ├── package-cartridge.ts
    │   ├── prophet-run.ts
    │   ├── upgrader-run.ts
… (14 more files)
```
<details><summary>Agents & Workflow file index (134 files)</summary>

- `.github/scripts/DREAMENGIN_CORE_COMPLETE.md` — documentation file.
- `.github/scripts/DREAMENGIN_CORE_USAGE.md` — documentation file.
- `.github/scripts/ai_implement.py` — project file (py).
- `.github/scripts/ai_neural_decision.py` — project file (py).
- `.github/scripts/ai_propose.py` — project file (py).
- `.github/scripts/ai_report_propose.py` — project file (py).
- `.github/scripts/assemble_report_context.py` — project file (py).
- `.github/scripts/catalog_games_for_ai.py` — project file (py).
- `.github/scripts/check-root-hygiene.sh` — project file (sh).
- `.github/scripts/check_workflow_masking.py` — project file (py).
- `.github/scripts/dreamengin_core.py` — project file (py).
- `.github/scripts/humanai_audit.py` — project file (py).
- `.github/scripts/issue-bot.js` — TypeScript/JavaScript runtime module.
- `.github/scripts/run-readme-autosync.mjs` — TypeScript/JavaScript runtime module.
- `.github/scripts/scan_dreamengin_context.py` — project file (py).
- `.github/scripts/scan_gameengin_context.py` — project file (py).
- `.github/scripts/validate_game_sandbox.py` — project file (py).
- `.github/scripts/validate_report_agent_spec.py` — project file (py).
- `.github/workflows/autofixaudit.yml` — project file (yml).
- `.github/workflows/autofixvercelbuild.yml` — project file (yml).
- `.github/workflows/bot-pr-automerge.yml` — project file (yml).
- `.github/workflows/bouncer.yml` — project file (yml).
- `.github/workflows/codeql.yml` — project file (yml).
- `.github/workflows/copilot-setup-steps.yml` — project file (yml).
- `.github/workflows/daydream-all.yml` — project file (yml).
- `.github/workflows/daydream-brand-engin.yml` — project file (yml).
- `.github/workflows/daydream-code-engin.yml` — project file (yml).
- `.github/workflows/daydream-create-engin.yml` — project file (yml).
- `.github/workflows/daydream-engin-build-cycle.yml` — project file (yml).
- `.github/workflows/daydream-engin-sicc-refinement.yml` — project file (yml).
- `.github/workflows/daydream-games-engin.yml` — project file (yml).
- `.github/workflows/daydream-lab-engin.yml` — project file (yml).
- `.github/workflows/daydream-music-engin.yml` — project file (yml).
- `.github/workflows/db-extension-audit.yml` — project file (yml).
- `.github/workflows/db-extension-check.yml` — project file (yml).
- `.github/workflows/deploy-artifact.yml` — project file (yml).
- `.github/workflows/docs-auto-update.yml` — project file (yml).
- `.github/workflows/dreamengin-preflight.yml` — project file (yml).
- `.github/workflows/elite-gameengin-evolution.yml` — project file (yml).
- `.github/workflows/engin-all.yml` — project file (yml).
- `.github/workflows/exportrepo.yml` — project file (yml).
- `.github/workflows/full-audit.yml` — project file (yml).
- `.github/workflows/game-engin-patrol.yml` — project file (yml).
- `.github/workflows/game-library-research.yml` — project file (yml).
- `.github/workflows/gameengin-ai-agent.yml` — project file (yml).
- `.github/workflows/gameengin-artisan.yml` — project file (yml).
- `.github/workflows/gameengin-maestro.yml` — project file (yml).
- `.github/workflows/gameengin-mechanic.yml` — project file (yml).
- `.github/workflows/gameengin-prophet.yml` — project file (yml).
- `.github/workflows/gameengin-upgrader.yml` — project file (yml).
- `.github/workflows/gameengin-writer.yml` — project file (yml).
- `.github/workflows/games-library-ai-agent.yml` — project file (yml).
- `.github/workflows/garbageman.yml` — project file (yml).
- `.github/workflows/generatesupabasetypes.yml` — project file (yml).
- `.github/workflows/github-actions.yml` — project file (yml).
- `.github/workflows/humanai-army-audit.yml` — project file (yml).
- `.github/workflows/humanai-audit.yml` — project file (yml).
- `.github/workflows/idari-daily.yml` — project file (yml).
- `.github/workflows/issue-bot.yml` — project file (yml).
- `.github/workflows/mobile-nextgen-spec-evolution.yml` — project file (yml).
- `.github/workflows/mobile-ps5-spec-evolution.yml` — project file (yml).
- `.github/workflows/neural_decision_engine.yml` — project file (yml).
- `.github/workflows/optimize-dreamengin.yml` — project file (yml).
- `.github/workflows/orphan-guard.yml` — project file (yml).
- `.github/workflows/portfolio-optimization.yml` — project file (yml).
- `.github/workflows/preflight.yml` — project file (yml).
- `.github/workflows/print-codebase.yml` — project file (yml).
- `.github/workflows/readme-autosync.yml` — project file (yml).
- `.github/workflows/refreshlock.yml` — project file (yml).
- `.github/workflows/repo-snapshot.yml` — project file (yml).
- `.github/workflows/report-driven-coding-agent.yml` — project file (yml).
- `.github/workflows/resilient-engine-smoke.yml` — project file (yml).
- `.github/workflows/root-hygiene.yml` — project file (yml).
- `.github/workflows/spec-engin-ai-agent.yml` — project file (yml).
- `.github/workflows/sql-migration-guard.yml` — project file (yml).
- `.github/workflows/sync-build-memory.yml` — project file (yml).
- `.github/workflows/update-embed-feed.yml` — project file (yml).
- `.github/workflows/update-repo-state.yml` — project file (yml).
- `.github/workflows/vercel-deploy.yml` — project file (yml).
- `.github/workflows/visual-schematic.yml` — project file (yml).
- `agents/.gitkeep` — project file (no extension).
- `agents/humanAI.persona.md` — documentation file.
- `agents/humanAI/orchestrator.md` — documentation file.
- `agents/humanAI/personas/accessibility.md` — documentation file.
- `agents/humanAI/personas/creator.md` — documentation file.
- `agents/humanAI/personas/ios-first.md` — documentation file.
- `agents/humanAI/personas/power-user.md` — documentation file.
- `agents/humanAI/personas/social-explorer.md` — documentation file.
- `scripts/analyze-repo-state.mjs` — TypeScript/JavaScript runtime module.
- `scripts/archive/proxy.ts` — TypeScript/JavaScript runtime module.
- `scripts/archive/validate-deployment.js` — TypeScript/JavaScript runtime module.
- `scripts/autofix-vercel-build.mjs` — TypeScript/JavaScript runtime module.
- `scripts/check-build-memory-drift.mjs` — TypeScript/JavaScript runtime module.
- `scripts/check-engin-filenames.mjs` — TypeScript/JavaScript runtime module.
- `scripts/check-licenses.mjs` — TypeScript/JavaScript runtime module.
- `scripts/check-orphans.mjs` — TypeScript/JavaScript runtime module.
- `scripts/check-root-hygiene.mjs` — TypeScript/JavaScript runtime module.
- `scripts/close-all-open-prs.sh` — project file (sh).
- `scripts/deploy.sh` — project file (sh).
- `scripts/export-full-code.mjs` — TypeScript/JavaScript runtime module.
- `scripts/feature-build/generate-features.mjs` — TypeScript/JavaScript runtime module.
- `scripts/gameengin/architect-run.ts` — TypeScript/JavaScript runtime module.
- `scripts/gameengin/artisan-run.ts` — TypeScript/JavaScript runtime module.
- `scripts/gameengin/lib/tar.ts` — TypeScript/JavaScript runtime module.
- `scripts/gameengin/maestro-analyze.ts` — TypeScript/JavaScript runtime module.
- `scripts/gameengin/mechanic-run.ts` — TypeScript/JavaScript runtime module.
- `scripts/gameengin/package-cartridge.ts` — TypeScript/JavaScript runtime module.
- `scripts/gameengin/prophet-run.ts` — TypeScript/JavaScript runtime module.
- `scripts/gameengin/upgrader-run.ts` — TypeScript/JavaScript runtime module.
- `scripts/gameengin/writer-run.ts` — TypeScript/JavaScript runtime module.
- `scripts/generate-mobile-nextgen-spec.mjs` — TypeScript/JavaScript runtime module.
- `scripts/generate-mobile-ps5-spec.mjs` — TypeScript/JavaScript runtime module.
- `scripts/generate-webapp-final-form.mjs` — TypeScript/JavaScript runtime module.
- `scripts/law-check.sh` — project file (sh).
- `scripts/migrate-imports.sh` — project file (sh).
- `scripts/optimize-dreamengin.mjs` — TypeScript/JavaScript runtime module.
- `scripts/postbuild.js` — TypeScript/JavaScript runtime module.
- `scripts/postbuild.ts` — TypeScript/JavaScript runtime module.
- `scripts/readme-autosync.ts` — TypeScript/JavaScript runtime module.
- `scripts/repository-state-analysis-section.mjs` — TypeScript/JavaScript runtime module.
- `scripts/score-pass.cjs` — TypeScript/JavaScript runtime module.
- `scripts/setup-database.sql` — SQL migration/schema artifact.
- `scripts/spec-check.cjs` — TypeScript/JavaScript runtime module.
- `scripts/sync-build-memory.mjs` — TypeScript/JavaScript runtime module.
- `scripts/ui-ux-agent.py` — project file (py).
- `scripts/update-bugs.mjs` — TypeScript/JavaScript runtime module.
- `scripts/update-embed-feed.mjs` — TypeScript/JavaScript runtime module.
- `scripts/update-handoff.mjs` — TypeScript/JavaScript runtime module.
- `scripts/update-readme-status-utils.mjs` — TypeScript/JavaScript runtime module.
- `scripts/update-readme.mjs` — TypeScript/JavaScript runtime module.
- `scripts/validate-schema-sync.sh` — project file (sh).
- `scripts/vercel-ignore.cjs` — TypeScript/JavaScript runtime module.
- `scripts/vercel-preflight.cjs` — TypeScript/JavaScript runtime module.
- `scripts/wire-orphans.mjs` — TypeScript/JavaScript runtime module.

</details>

## Research, Experiments & Daydreams
Auto-synced from `research/**`, `research-and-development/**`, `experiments/**`, `daydreams/**` using repository introspection.
- Files tracked: **24**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `Page`
#### Research, Experiments & Daydreams file structure
```text
├── daydreams
│   ├── brand
│   │   └── page.tsx
│   ├── code
│   │   └── page.tsx
│   ├── create
│   │   └── page.tsx
│   ├── games
│   │   └── page.tsx
│   ├── lab
│   │   └── page.tsx
│   └── music
│       └── page.tsx
├── experiments
│   └── .gitkeep
├── research
│   ├── DISCOVERY.md
│   ├── README.md
│   ├── ccc-ada-twin-engine
│   │   ├── README.md
│   │   ├── code
│   │   │   └── README.md
│   │   ├── data
│   │   │   └── README.md
│   │   ├── notes
│   │   │   └── sharpening_notes.txt
│   │   └── paper
│   │       ├── ccc_ada_axioms_and_invariants.tex
│   │       ├── ccc_ada_black_hole_gravitational_wave_memory.tex
│   │       ├── ccc_ada_holography_and_information_boundary.tex
│   │       ├── ccc_ada_predictions_and_falsifiability.tex
│   │       └── ccc_ada_twin_engine_framework.tex
│   ├── data
│   │   ├── README.md
│   │   └── torr_vs_mond_lock_n11.csv
│   ├── equations
│   │   └── torridityequate.txt
│   └── paper
│       └── torridity_ledger.tex
└── research-and-development
    ├── LICENSE
    └── tech-spec-v1.md
```
<details><summary>Research, Experiments & Daydreams file index (24 files)</summary>

- `daydreams/brand/page.tsx` — route page.
- `daydreams/code/page.tsx` — route page.
- `daydreams/create/page.tsx` — route page.
- `daydreams/games/page.tsx` — route page.
- `daydreams/lab/page.tsx` — route page.
- `daydreams/music/page.tsx` — route page.
- `experiments/.gitkeep` — project file (no extension).
- `research-and-development/LICENSE` — project file (no extension).
- `research-and-development/tech-spec-v1.md` — documentation file.
- `research/DISCOVERY.md` — documentation file.
- `research/README.md` — documentation file.
- `research/ccc-ada-twin-engine/README.md` — documentation file.
- `research/ccc-ada-twin-engine/code/README.md` — documentation file.
- `research/ccc-ada-twin-engine/data/README.md` — documentation file.
- `research/ccc-ada-twin-engine/notes/sharpening_notes.txt` — project file (txt).
- `research/ccc-ada-twin-engine/paper/ccc_ada_axioms_and_invariants.tex` — project file (tex).
- `research/ccc-ada-twin-engine/paper/ccc_ada_black_hole_gravitational_wave_memory.tex` — project file (tex).
- `research/ccc-ada-twin-engine/paper/ccc_ada_holography_and_information_boundary.tex` — project file (tex).
- `research/ccc-ada-twin-engine/paper/ccc_ada_predictions_and_falsifiability.tex` — project file (tex).
- `research/ccc-ada-twin-engine/paper/ccc_ada_twin_engine_framework.tex` — project file (tex).
- `research/data/README.md` — documentation file.
- `research/data/torr_vs_mond_lock_n11.csv` — project file (csv).
- `research/equations/torridityequate.txt` — project file (txt).
- `research/paper/torridity_ledger.tex` — project file (tex).

</details>

## Infra & Ops
Auto-synced from `terraform/**`, `prometheus/**`, `grafana/**`, `.github/workflows/**`, `vercel.json`, `docker-compose.yml` using repository introspection.
- Files tracked: **67**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Infra & Ops file structure
```text
├── .github
│   └── workflows
│       ├── autofixaudit.yml
│       ├── autofixvercelbuild.yml
│       ├── bot-pr-automerge.yml
│       ├── bouncer.yml
│       ├── codeql.yml
│       ├── copilot-setup-steps.yml
│       ├── daydream-all.yml
│       ├── daydream-brand-engin.yml
│       ├── daydream-code-engin.yml
│       ├── daydream-create-engin.yml
│       ├── daydream-engin-build-cycle.yml
│       ├── daydream-engin-sicc-refinement.yml
│       ├── daydream-games-engin.yml
│       ├── daydream-lab-engin.yml
│       ├── daydream-music-engin.yml
│       ├── db-extension-audit.yml
│       ├── db-extension-check.yml
│       ├── deploy-artifact.yml
│       ├── docs-auto-update.yml
│       ├── dreamengin-preflight.yml
│       ├── elite-gameengin-evolution.yml
│       ├── engin-all.yml
│       ├── exportrepo.yml
│       ├── full-audit.yml
│       ├── game-engin-patrol.yml
│       ├── game-library-research.yml
│       ├── gameengin-ai-agent.yml
│       ├── gameengin-artisan.yml
│       ├── gameengin-maestro.yml
│       ├── gameengin-mechanic.yml
│       ├── gameengin-prophet.yml
│       ├── gameengin-upgrader.yml
│       ├── gameengin-writer.yml
│       ├── games-library-ai-agent.yml
│       ├── garbageman.yml
│       ├── generatesupabasetypes.yml
│       ├── github-actions.yml
│       ├── humanai-army-audit.yml
│       ├── humanai-audit.yml
│       ├── idari-daily.yml
│       ├── issue-bot.yml
│       ├── mobile-nextgen-spec-evolution.yml
│       ├── mobile-ps5-spec-evolution.yml
│       ├── neural_decision_engine.yml
│       ├── optimize-dreamengin.yml
│       ├── orphan-guard.yml
│       ├── portfolio-optimization.yml
│       ├── preflight.yml
│       ├── print-codebase.yml
│       ├── readme-autosync.yml
│       ├── refreshlock.yml
│       ├── repo-snapshot.yml
│       ├── report-driven-coding-agent.yml
│       ├── resilient-engine-smoke.yml
│       ├── root-hygiene.yml
│       ├── spec-engin-ai-agent.yml
│       ├── sql-migration-guard.yml
│       ├── sync-build-memory.yml
│       ├── update-embed-feed.yml
│       ├── update-repo-state.yml
│       ├── vercel-deploy.yml
│       └── visual-schematic.yml
├── grafana
│   ├── dashboards
│   │   └── default.yml
│   └── datasources
│       └── prometheus.yml
├── prometheus
│   └── prometheus.yml
├── terraform
│   └── main.tf
└── vercel.json
```
<details><summary>Infra & Ops file index (67 files)</summary>

- `.github/workflows/autofixaudit.yml` — project file (yml).
- `.github/workflows/autofixvercelbuild.yml` — project file (yml).
- `.github/workflows/bot-pr-automerge.yml` — project file (yml).
- `.github/workflows/bouncer.yml` — project file (yml).
- `.github/workflows/codeql.yml` — project file (yml).
- `.github/workflows/copilot-setup-steps.yml` — project file (yml).
- `.github/workflows/daydream-all.yml` — project file (yml).
- `.github/workflows/daydream-brand-engin.yml` — project file (yml).
- `.github/workflows/daydream-code-engin.yml` — project file (yml).
- `.github/workflows/daydream-create-engin.yml` — project file (yml).
- `.github/workflows/daydream-engin-build-cycle.yml` — project file (yml).
- `.github/workflows/daydream-engin-sicc-refinement.yml` — project file (yml).
- `.github/workflows/daydream-games-engin.yml` — project file (yml).
- `.github/workflows/daydream-lab-engin.yml` — project file (yml).
- `.github/workflows/daydream-music-engin.yml` — project file (yml).
- `.github/workflows/db-extension-audit.yml` — project file (yml).
- `.github/workflows/db-extension-check.yml` — project file (yml).
- `.github/workflows/deploy-artifact.yml` — project file (yml).
- `.github/workflows/docs-auto-update.yml` — project file (yml).
- `.github/workflows/dreamengin-preflight.yml` — project file (yml).
- `.github/workflows/elite-gameengin-evolution.yml` — project file (yml).
- `.github/workflows/engin-all.yml` — project file (yml).
- `.github/workflows/exportrepo.yml` — project file (yml).
- `.github/workflows/full-audit.yml` — project file (yml).
- `.github/workflows/game-engin-patrol.yml` — project file (yml).
- `.github/workflows/game-library-research.yml` — project file (yml).
- `.github/workflows/gameengin-ai-agent.yml` — project file (yml).
- `.github/workflows/gameengin-artisan.yml` — project file (yml).
- `.github/workflows/gameengin-maestro.yml` — project file (yml).
- `.github/workflows/gameengin-mechanic.yml` — project file (yml).
- `.github/workflows/gameengin-prophet.yml` — project file (yml).
- `.github/workflows/gameengin-upgrader.yml` — project file (yml).
- `.github/workflows/gameengin-writer.yml` — project file (yml).
- `.github/workflows/games-library-ai-agent.yml` — project file (yml).
- `.github/workflows/garbageman.yml` — project file (yml).
- `.github/workflows/generatesupabasetypes.yml` — project file (yml).
- `.github/workflows/github-actions.yml` — project file (yml).
- `.github/workflows/humanai-army-audit.yml` — project file (yml).
- `.github/workflows/humanai-audit.yml` — project file (yml).
- `.github/workflows/idari-daily.yml` — project file (yml).
- `.github/workflows/issue-bot.yml` — project file (yml).
- `.github/workflows/mobile-nextgen-spec-evolution.yml` — project file (yml).
- `.github/workflows/mobile-ps5-spec-evolution.yml` — project file (yml).
- `.github/workflows/neural_decision_engine.yml` — project file (yml).
- `.github/workflows/optimize-dreamengin.yml` — project file (yml).
- `.github/workflows/orphan-guard.yml` — project file (yml).
- `.github/workflows/portfolio-optimization.yml` — project file (yml).
- `.github/workflows/preflight.yml` — project file (yml).
- `.github/workflows/print-codebase.yml` — project file (yml).
- `.github/workflows/readme-autosync.yml` — project file (yml).
- `.github/workflows/refreshlock.yml` — project file (yml).
- `.github/workflows/repo-snapshot.yml` — project file (yml).
- `.github/workflows/report-driven-coding-agent.yml` — project file (yml).
- `.github/workflows/resilient-engine-smoke.yml` — project file (yml).
- `.github/workflows/root-hygiene.yml` — project file (yml).
- `.github/workflows/spec-engin-ai-agent.yml` — project file (yml).
- `.github/workflows/sql-migration-guard.yml` — project file (yml).
- `.github/workflows/sync-build-memory.yml` — project file (yml).
- `.github/workflows/update-embed-feed.yml` — project file (yml).
- `.github/workflows/update-repo-state.yml` — project file (yml).
- `.github/workflows/vercel-deploy.yml` — project file (yml).
- `.github/workflows/visual-schematic.yml` — project file (yml).
- `grafana/dashboards/default.yml` — project file (yml).
- `grafana/datasources/prometheus.yml` — project file (yml).
- `prometheus/prometheus.yml` — project file (yml).
- `terraform/main.tf` — project file (tf).
- `vercel.json` — project file (json).

</details>

## Testing
Auto-synced from `tests/**`, `vitest.config.ts`, `playwright.config.ts` using repository introspection.
- Files tracked: **209**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Testing file structure
```text
├── playwright.config.ts
├── tests
│   ├── DUALSENSE_TEST_PLAN.md
│   ├── activity-first-protocol.test.ts
│   ├── activity-revenue-split.test.ts
│   ├── admin-lockout.test.ts
│   ├── admin-upgrade-readiness.test.ts
│   ├── agent-bus-consensus.test.ts
│   ├── ai-edit-engine.test.ts
│   ├── api-route-body-guard.test.ts
│   ├── asset-optimizer.test.ts
│   ├── auth-providers-route.test.ts
│   ├── auth-update-password-page.test.ts
│   ├── authenticated-ui-shells.test.ts
│   ├── babylon-optimizero.test.ts
│   ├── babylon-webgpu-engine.test.ts
│   ├── bar-hide-preserves-both-runtimes.test.ts
│   ├── boogie-policy-module.test.ts
│   ├── boogieman.test.ts
│   ├── bot-detector.test.ts
│   ├── branding-logos.test.ts
│   ├── canonical-naming-enforcement.test.ts
│   ├── child-safety.test.ts
│   ├── code-dream-preview.test.ts
│   ├── coercion-table.test.ts
│   ├── collector-extended.test.ts
│   ├── compositeengin-features.test.ts
│   ├── conform-memory-map.test.ts
│   ├── connector-delivery.test.ts
│   ├── connectors.test.ts
│   ├── content-intelligence-routes.test.ts
│   ├── content-publish-intent.test.ts
│   ├── contentengin-features.test.ts
│   ├── contextual-home.test.ts
│   ├── creative-optimizero.test.ts
│   ├── data-transform-extended.test.ts
│   ├── data-transform.test.ts
│   ├── daydream-engin-routes.test.ts
│   ├── decide-bar-release.test.ts
│   ├── dev-bypass.test.ts
│   ├── diff-viewer.test.ts
│   ├── dr-eams-code-assist.test.ts
│   ├── dr-eams-search-bar.test.ts
│   ├── dream-bar-context.test.ts
│   ├── dream-continuity-spine.test.ts
│   ├── dream-effects.test.ts
│   ├── dream-os-bus.test.ts
│   ├── dream-state.test.ts
│   ├── dream-window-system.test.ts
│   ├── dreamdm-bar-intent.test.ts
│   ├── dreamdm-bar-interactions.test.ts
│   ├── dreamdm-bar-wild.test.ts
│   ├── dreamdm-draft.test.ts
│   ├── dreamdm-messaging-phase2.test.ts
│   ├── dreamengin-os.test.ts
│   ├── dreamnav.tau.test.ts
│   ├── dreamr-algorithm-velocity.test.ts
│   ├── dreamr-algorithm.test.ts
│   ├── dreamr-feed-limits.test.ts
│   ├── dreamr-feed-topics.test.ts
│   ├── dreamr-page-route.test.ts
│   ├── dreamr-swipe-personalization.test.ts
│   ├── dreamr-visibility-cursor.test.ts
│   ├── dreamspace-panel.test.ts
│   ├── drop-target-registry.test.ts
│   ├── dual-runtime-bridge-peer-activity.test.ts
│   ├── durable-bridge.test.ts
│   ├── e2e
│   │   ├── demo.spec.ts
│   │   └── full-coverage.spec.ts
│   ├── edit-profiledream-section7.test.ts
│   ├── engin-dispatcher.test.ts
│   ├── engin-runtime-core.test.ts
│   ├── engin-workflow.test.ts
│   ├── enginpipe
│   │   ├── manifest.test.ts
│   │   ├── telemetry.test.ts
│   │   └── tiers.test.ts
│   ├── example.spec.ts
│   ├── export-full-code.test.ts
│   ├── feature-build.test.ts
│   ├── forge-build.test.ts
│   ├── forge-engin.test.ts
│   ├── forge-momentum.test.ts
│   ├── forge-nexus.test.ts
│   ├── forge-rituals.test.ts
│   ├── fusion-cartridges-depth.test.ts
│   ├── fusion-cartridges.test.ts
│   ├── game-controller.test.ts
│   ├── game-engin-ruleset.test.ts
│   ├── game-navigation.test.ts
│   ├── game-performance-baseline.test.ts
│   ├── game-quality-plan.test.ts
│   ├── game-remote-regression.test.ts
│   ├── gameengin-architect.test.ts
│   ├── gameengin-cartridges.test.ts
│   ├── gameengin-crash-modal.test.ts
│   ├── gameengin-loop.test.ts
│   ├── gameengin-power-systems.test.ts
│   ├── gameengin-progression.test.ts
│   ├── gameengin-remote.test.ts
│   ├── gameengin-spec.test.ts
│   ├── games-daydream-page-auth.test.ts
│   ├── god-tier-engine.test.ts
│   ├── hero-sprite.test.ts
│   ├── home-feed-home.test.ts
│   ├── homedream-page-auth.test.ts
│   ├── icons.test.ts
│   ├── idari-admin-guard.test.ts
│   ├── idari-observability-loop.test.ts
│   ├── idari-patch-plan.test.ts
│   ├── instance-manager.test.ts
│   ├── integration-wiring.test.ts
│   ├── is-auth-related-error.test.ts
│   ├── journey-insights.test.ts
│   ├── journey.test.ts
│   ├── lab-dream-split.test.ts
│   ├── lab-section-12-spec.test.ts
│   ├── landing-calibration.test.ts
│   ├── landing-mission-link.test.ts
… (89 more files)
```
<details><summary>Testing file index (209 files)</summary>

- `playwright.config.ts` — TypeScript/JavaScript runtime module.
- `tests/DUALSENSE_TEST_PLAN.md` — documentation file.
- `tests/activity-first-protocol.test.ts` — TypeScript/JavaScript runtime module.
- `tests/activity-revenue-split.test.ts` — TypeScript/JavaScript runtime module.
- `tests/admin-lockout.test.ts` — TypeScript/JavaScript runtime module.
- `tests/admin-upgrade-readiness.test.ts` — TypeScript/JavaScript runtime module.
- `tests/agent-bus-consensus.test.ts` — TypeScript/JavaScript runtime module.
- `tests/ai-edit-engine.test.ts` — TypeScript/JavaScript runtime module.
- `tests/api-route-body-guard.test.ts` — TypeScript/JavaScript runtime module.
- `tests/asset-optimizer.test.ts` — TypeScript/JavaScript runtime module.
- `tests/auth-providers-route.test.ts` — TypeScript/JavaScript runtime module.
- `tests/auth-update-password-page.test.ts` — TypeScript/JavaScript runtime module.
- `tests/authenticated-ui-shells.test.ts` — TypeScript/JavaScript runtime module.
- `tests/babylon-optimizero.test.ts` — TypeScript/JavaScript runtime module.
- `tests/babylon-webgpu-engine.test.ts` — TypeScript/JavaScript runtime module.
- `tests/bar-hide-preserves-both-runtimes.test.ts` — TypeScript/JavaScript runtime module.
- `tests/boogie-policy-module.test.ts` — TypeScript/JavaScript runtime module.
- `tests/boogieman.test.ts` — TypeScript/JavaScript runtime module.
- `tests/bot-detector.test.ts` — TypeScript/JavaScript runtime module.
- `tests/branding-logos.test.ts` — TypeScript/JavaScript runtime module.
- `tests/canonical-naming-enforcement.test.ts` — TypeScript/JavaScript runtime module.
- `tests/child-safety.test.ts` — TypeScript/JavaScript runtime module.
- `tests/code-dream-preview.test.ts` — TypeScript/JavaScript runtime module.
- `tests/coercion-table.test.ts` — TypeScript/JavaScript runtime module.
- `tests/collector-extended.test.ts` — TypeScript/JavaScript runtime module.
- `tests/compositeengin-features.test.ts` — TypeScript/JavaScript runtime module.
- `tests/conform-memory-map.test.ts` — TypeScript/JavaScript runtime module.
- `tests/connector-delivery.test.ts` — TypeScript/JavaScript runtime module.
- `tests/connectors.test.ts` — TypeScript/JavaScript runtime module.
- `tests/content-intelligence-routes.test.ts` — TypeScript/JavaScript runtime module.
- `tests/content-publish-intent.test.ts` — TypeScript/JavaScript runtime module.
- `tests/contentengin-features.test.ts` — TypeScript/JavaScript runtime module.
- `tests/contextual-home.test.ts` — TypeScript/JavaScript runtime module.
- `tests/creative-optimizero.test.ts` — TypeScript/JavaScript runtime module.
- `tests/data-transform-extended.test.ts` — TypeScript/JavaScript runtime module.
- `tests/data-transform.test.ts` — TypeScript/JavaScript runtime module.
- `tests/daydream-engin-routes.test.ts` — TypeScript/JavaScript runtime module.
- `tests/decide-bar-release.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dev-bypass.test.ts` — TypeScript/JavaScript runtime module.
- `tests/diff-viewer.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dr-eams-code-assist.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dr-eams-search-bar.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dream-bar-context.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dream-continuity-spine.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dream-effects.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dream-os-bus.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dream-state.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dream-window-system.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamdm-bar-intent.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamdm-bar-interactions.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamdm-bar-wild.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamdm-draft.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamdm-messaging-phase2.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamengin-os.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamnav.tau.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamr-algorithm-velocity.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamr-algorithm.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamr-feed-limits.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamr-feed-topics.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamr-page-route.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamr-swipe-personalization.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamr-visibility-cursor.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dreamspace-panel.test.ts` — TypeScript/JavaScript runtime module.
- `tests/drop-target-registry.test.ts` — TypeScript/JavaScript runtime module.
- `tests/dual-runtime-bridge-peer-activity.test.ts` — TypeScript/JavaScript runtime module.
- `tests/durable-bridge.test.ts` — TypeScript/JavaScript runtime module.
- `tests/e2e/demo.spec.ts` — TypeScript/JavaScript runtime module.
- `tests/e2e/full-coverage.spec.ts` — TypeScript/JavaScript runtime module.
- `tests/edit-profiledream-section7.test.ts` — TypeScript/JavaScript runtime module.
- `tests/engin-dispatcher.test.ts` — TypeScript/JavaScript runtime module.
- `tests/engin-runtime-core.test.ts` — TypeScript/JavaScript runtime module.
- `tests/engin-workflow.test.ts` — TypeScript/JavaScript runtime module.
- `tests/enginpipe/manifest.test.ts` — TypeScript/JavaScript runtime module.
- `tests/enginpipe/telemetry.test.ts` — TypeScript/JavaScript runtime module.
- `tests/enginpipe/tiers.test.ts` — TypeScript/JavaScript runtime module.
- `tests/example.spec.ts` — TypeScript/JavaScript runtime module.
- `tests/export-full-code.test.ts` — TypeScript/JavaScript runtime module.
- `tests/feature-build.test.ts` — TypeScript/JavaScript runtime module.
- `tests/forge-build.test.ts` — TypeScript/JavaScript runtime module.
- `tests/forge-engin.test.ts` — TypeScript/JavaScript runtime module.
- `tests/forge-momentum.test.ts` — TypeScript/JavaScript runtime module.
- `tests/forge-nexus.test.ts` — TypeScript/JavaScript runtime module.
- `tests/forge-rituals.test.ts` — TypeScript/JavaScript runtime module.
- `tests/fusion-cartridges-depth.test.ts` — TypeScript/JavaScript runtime module.
- `tests/fusion-cartridges.test.ts` — TypeScript/JavaScript runtime module.
- `tests/game-controller.test.ts` — TypeScript/JavaScript runtime module.
- `tests/game-engin-ruleset.test.ts` — TypeScript/JavaScript runtime module.
- `tests/game-navigation.test.ts` — TypeScript/JavaScript runtime module.
- `tests/game-performance-baseline.test.ts` — TypeScript/JavaScript runtime module.
- `tests/game-quality-plan.test.ts` — TypeScript/JavaScript runtime module.
- `tests/game-remote-regression.test.ts` — TypeScript/JavaScript runtime module.
- `tests/gameengin-architect.test.ts` — TypeScript/JavaScript runtime module.
- `tests/gameengin-cartridges.test.ts` — TypeScript/JavaScript runtime module.
- `tests/gameengin-crash-modal.test.ts` — TypeScript/JavaScript runtime module.
- `tests/gameengin-loop.test.ts` — TypeScript/JavaScript runtime module.
- `tests/gameengin-power-systems.test.ts` — TypeScript/JavaScript runtime module.
- `tests/gameengin-progression.test.ts` — TypeScript/JavaScript runtime module.
- `tests/gameengin-remote.test.ts` — TypeScript/JavaScript runtime module.
- `tests/gameengin-spec.test.ts` — TypeScript/JavaScript runtime module.
- `tests/games-daydream-page-auth.test.ts` — TypeScript/JavaScript runtime module.
- `tests/god-tier-engine.test.ts` — TypeScript/JavaScript runtime module.
- `tests/hero-sprite.test.ts` — TypeScript/JavaScript runtime module.
- `tests/home-feed-home.test.ts` — TypeScript/JavaScript runtime module.
- `tests/homedream-page-auth.test.ts` — TypeScript/JavaScript runtime module.
- `tests/icons.test.ts` — TypeScript/JavaScript runtime module.
- `tests/idari-admin-guard.test.ts` — TypeScript/JavaScript runtime module.
- `tests/idari-observability-loop.test.ts` — TypeScript/JavaScript runtime module.
- `tests/idari-patch-plan.test.ts` — TypeScript/JavaScript runtime module.
- `tests/instance-manager.test.ts` — TypeScript/JavaScript runtime module.
- `tests/integration-wiring.test.ts` — TypeScript/JavaScript runtime module.
- `tests/is-auth-related-error.test.ts` — TypeScript/JavaScript runtime module.
- `tests/journey-insights.test.ts` — TypeScript/JavaScript runtime module.
- `tests/journey.test.ts` — TypeScript/JavaScript runtime module.
- `tests/lab-dream-split.test.ts` — TypeScript/JavaScript runtime module.
- `tests/lab-section-12-spec.test.ts` — TypeScript/JavaScript runtime module.
- `tests/landing-calibration.test.ts` — TypeScript/JavaScript runtime module.
- `tests/landing-mission-link.test.ts` — TypeScript/JavaScript runtime module.
- `tests/ledger-media.test.ts` — TypeScript/JavaScript runtime module.
- `tests/live-feed.test.ts` — TypeScript/JavaScript runtime module.
- `tests/madmaxi-authored-levels.test.ts` — TypeScript/JavaScript runtime module.
- `tests/madmaxi-mechanics.test.ts` — TypeScript/JavaScript runtime module.
- `tests/mobile-game-controls.test.ts` — TypeScript/JavaScript runtime module.
- `tests/modular-os-stores.test.ts` — TypeScript/JavaScript runtime module.
- `tests/module-registry.test.ts` — TypeScript/JavaScript runtime module.
- `tests/music-starmaker-section10.test.ts` — TypeScript/JavaScript runtime module.
- `tests/namespace-isolation.test.ts` — TypeScript/JavaScript runtime module.
- `tests/navigation/manifold-physics.spec.ts` — TypeScript/JavaScript runtime module.
- `tests/navigation/navigation.spec.ts` — TypeScript/JavaScript runtime module.
- `tests/navigation/quaternion.spec.ts` — TypeScript/JavaScript runtime module.
- `tests/neural-seam-flow.test.ts` — TypeScript/JavaScript runtime module.
- `tests/notifications.test.ts` — TypeScript/JavaScript runtime module.
- `tests/offline-queue.test.ts` — TypeScript/JavaScript runtime module.
- `tests/optimizer.test.ts` — TypeScript/JavaScript runtime module.
- `tests/orphan-wire-script.test.ts` — TypeScript/JavaScript runtime module.
- `tests/os-subsystem-manifest.test.ts` — TypeScript/JavaScript runtime module.
- `tests/page-surface-wiring.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase6-privacy-idari.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase7-naming.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase8a.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase8b-dream-windows.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase8e-orders.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase8e-shop-marketplace.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase8f-daydream-activation.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase8f-daydream-network.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase8g-dual-runtime-persistence.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase8h-triad-consensus.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase8i-settings-persistence.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase9-adaptive-quality.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase9-cross-post.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase9-drag-drop.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase9-hashtags.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase9-notifications.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase9-offline-cache.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase9-scene-state.test.ts` — TypeScript/JavaScript runtime module.
- `tests/phase9-touch-gestures.test.ts` — TypeScript/JavaScript runtime module.
- `tests/platform-utils.test.ts` — TypeScript/JavaScript runtime module.
- `tests/post-media.test.ts` — TypeScript/JavaScript runtime module.
- `tests/post-view-counting.test.ts` — TypeScript/JavaScript runtime module.
- `tests/product-law-principle10-alignment.test.ts` — TypeScript/JavaScript runtime module.
- `tests/profile-avatar-edit-entrypoints.test.ts` — TypeScript/JavaScript runtime module.
- `tests/rate-limiting.test.ts` — TypeScript/JavaScript runtime module.
- `tests/readme-autosync.test.ts` — TypeScript/JavaScript runtime module.
- `tests/readme-homedream-system.test.ts` — TypeScript/JavaScript runtime module.
- `tests/readme-section13-code-codeengin.test.ts` — TypeScript/JavaScript runtime module.
- `tests/readme-section6-homedream.test.ts` — TypeScript/JavaScript runtime module.
- `tests/report-driven-game-agent.test.ts` — TypeScript/JavaScript runtime module.
- `tests/repository-state-analysis-section.test.ts` — TypeScript/JavaScript runtime module.
- `tests/responsive.test.ts` — TypeScript/JavaScript runtime module.
- `tests/rss-feed.test.ts` — TypeScript/JavaScript runtime module.
- `tests/runtime-channel.test.ts` — TypeScript/JavaScript runtime module.
- `tests/runtime-container.test.ts` — TypeScript/JavaScript runtime module.
- `tests/runtime-viewport.test.ts` — TypeScript/JavaScript runtime module.
- `tests/runtime-wiring.test.ts` — TypeScript/JavaScript runtime module.
- `tests/safe-get-user.test.ts` — TypeScript/JavaScript runtime module.
- `tests/seam-clipboard.test.ts` — TypeScript/JavaScript runtime module.
- `tests/session-continuity.test.ts` — TypeScript/JavaScript runtime module.
- `tests/session-pattern-engine.test.ts` — TypeScript/JavaScript runtime module.
- `tests/setup-env.ts` — TypeScript/JavaScript runtime module.
- `tests/shell-cartridge-wiring.test.ts` — TypeScript/JavaScript runtime module.
- `tests/skip-credits.test.ts` — TypeScript/JavaScript runtime module.
- `tests/social-feed.test.ts` — TypeScript/JavaScript runtime module.
- `tests/social-platforms.test.ts` — TypeScript/JavaScript runtime module.
- `tests/spec35-vm-bus-events.test.ts` — TypeScript/JavaScript runtime module.
- `tests/spec36-bot-detection.test.ts` — TypeScript/JavaScript runtime module.
- `tests/spec37-torridity.test.ts` — TypeScript/JavaScript runtime module.
- `tests/spec38-collaboration.test.ts` — TypeScript/JavaScript runtime module.
- `tests/spec41-engine-builder.test.ts` — TypeScript/JavaScript runtime module.
- `tests/starmaker-music.test.ts` — TypeScript/JavaScript runtime module.
- `tests/structure-ledger.test.ts` — TypeScript/JavaScript runtime module.
- `tests/supabase-config.test.ts` — TypeScript/JavaScript runtime module.
- `tests/swap-manager-extended.test.ts` — TypeScript/JavaScript runtime module.
- `tests/swipe-calibration.test.ts` — TypeScript/JavaScript runtime module.
- `tests/tech-foundation.test.ts` — TypeScript/JavaScript runtime module.
- `tests/torridity-ledger.test.ts` — TypeScript/JavaScript runtime module.
- `tests/universal-asset-registry.test.ts` — TypeScript/JavaScript runtime module.
- `tests/universal-engine.test.ts` — TypeScript/JavaScript runtime module.
- `tests/universal-visual-modularity.test.ts` — TypeScript/JavaScript runtime module.
- `tests/update-readme-current-status.test.ts` — TypeScript/JavaScript runtime module.
- `tests/user-sim.test.ts` — TypeScript/JavaScript runtime module.
- `tests/utils-extended.test.ts` — TypeScript/JavaScript runtime module.
- `tests/utils-supabase-server.test.ts` — TypeScript/JavaScript runtime module.
- `tests/v2-readiness.test.ts` — TypeScript/JavaScript runtime module.
- `tests/view-profile-public-view-controls.test.ts` — TypeScript/JavaScript runtime module.
- `tests/warp-engine.test.ts` — TypeScript/JavaScript runtime module.
- `tests/wasm-gpu-vm.test.ts` — TypeScript/JavaScript runtime module.
- `tests/webgpu-director.test.ts` — TypeScript/JavaScript runtime module.
- `tests/widget-install-flow.test.ts` — TypeScript/JavaScript runtime module.
- `tests/youtube-provider.test.ts` — TypeScript/JavaScript runtime module.
- `vitest.config.ts` — TypeScript/JavaScript runtime module.

</details>

## Getting Started
Auto-synced from `README.md`, `.env.example`, `.env.local.example` using repository introspection.
- Files tracked: **3**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Getting Started file structure
```text
├── .env.example
├── .env.local.example
└── README.md
```
<details><summary>Getting Started file index (3 files)</summary>

- `.env.example` — project file (example).
- `.env.local.example` — project file (example).
- `README.md` — documentation file.

</details>

## Environment Variables
Auto-synced from `.env.example`, `.env.local.example`, `app/api/**` using repository introspection.
- Files tracked: **109**
- API routes discovered: `/api/account/delete-data`, `/api/account/delete-dream`, `/api/account/export-data`, `/api/activity/track`, `/api/admin/ai-chat`, `/api/admin/ai-request`, `/api/admin/child-safety`, `/api/admin/code-files`, +99 more
- App pages discovered: none
- Components/modules discovered: none
#### Environment Variables file structure
```text
├── .env.example
├── .env.local.example
└── app
    └── api
        ├── account
        │   ├── delete-data
        │   │   └── route.ts
        │   ├── delete-dream
        │   │   └── route.ts
        │   └── export-data
        │       └── route.ts
        ├── activity
        │   └── track
        │       └── route.ts
        ├── admin
        │   ├── ai-chat
        │   │   └── route.ts
        │   ├── ai-request
        │   │   └── route.ts
        │   ├── child-safety
        │   │   └── route.ts
        │   ├── code-files
        │   │   └── route.ts
        │   └── observability
        │       └── route.ts
        ├── ads
        │   ├── orders
        │   │   └── route.ts
        │   └── view
        │       └── route.ts
        ├── agent
        │   └── session
        │       └── route.ts
        ├── ai
        │   ├── boogieman
        │   │   ├── child-safety
        │   │   │   └── route.ts
        │   │   ├── privacy-event
        │   │   │   └── route.ts
        │   │   ├── route.ts
        │   │   └── status
        │   │       └── route.ts
        │   ├── eams
        │   │   └── route.ts
        │   ├── execute
        │   │   └── route.ts
        │   └── idari
        │       └── route.ts
        ├── appeal
        │   └── route.ts
        ├── auth
        │   ├── logout
        │   │   └── route.ts
        │   └── providers
        │       └── route.ts
        ├── blocks
        │   └── route.ts
        ├── ci
        │   └── run
        │       └── route.ts
        ├── close-friends
        │   └── route.ts
        ├── comments
        │   └── route.ts
        ├── connectors
        │   ├── [provider]
        │   │   ├── connect
        │   │   │   └── route.ts
        │   │   ├── disconnect
        │   │   │   └── route.ts
        │   │   ├── items
        │   │   │   └── route.ts
        │   │   ├── sync
        │   │   │   └── route.ts
        │   │   └── verify
        │   │       └── route.ts
        │   ├── cron
        │   │   └── route.ts
        │   ├── instagram
        │   │   └── oauth
        │   │       ├── callback
        │   │       │   └── route.ts
        │   │       └── start
        │   │           └── route.ts
        │   ├── status
        │   │   └── route.ts
        │   ├── webhooks
        │   │   └── [provider]
        │   │       └── route.ts
        │   └── youtube
        │       └── oauth
        │           ├── callback
        │           │   └── route.ts
        │           └── start
        │               └── route.ts
        ├── content
        │   ├── generative-fill
        │   │   └── route.ts
        │   ├── intelligence
        │   │   └── route.ts
        │   ├── transcribe
        │   │   └── route.ts
        │   └── voice-clone
        │       └── route.ts
        ├── dr-eams
        │   ├── hf
        │   │   └── route.ts
        │   └── run
        │       └── route.ts
        ├── drafts
        │   ├── [id]
        │   │   └── route.ts
        │   └── route.ts
        ├── dream-windows
        │   ├── [id]
        │   │   └── route.ts
        │   └── route.ts
        ├── dreamengin
        │   └── os-status
        │       └── route.ts
```
<details><summary>Environment Variables file index (109 files)</summary>

- `.env.example` — project file (example).
- `.env.local.example` — project file (example).
- `app/api/account/delete-data/route.ts` — API route handler.
- `app/api/account/delete-dream/route.ts` — API route handler.
- `app/api/account/export-data/route.ts` — API route handler.
- `app/api/activity/track/route.ts` — API route handler.
- `app/api/admin/ai-chat/route.ts` — API route handler.
- `app/api/admin/ai-request/route.ts` — API route handler.
- `app/api/admin/child-safety/route.ts` — API route handler.
- `app/api/admin/code-files/route.ts` — API route handler.
- `app/api/admin/observability/route.ts` — API route handler.
- `app/api/ads/orders/route.ts` — API route handler.
- `app/api/ads/view/route.ts` — API route handler.
- `app/api/agent/session/route.ts` — API route handler.
- `app/api/ai/boogieman/child-safety/route.ts` — API route handler.
- `app/api/ai/boogieman/privacy-event/route.ts` — API route handler.
- `app/api/ai/boogieman/route.ts` — API route handler.
- `app/api/ai/boogieman/status/route.ts` — API route handler.
- `app/api/ai/eams/route.ts` — API route handler.
- `app/api/ai/execute/route.ts` — API route handler.
- `app/api/ai/idari/route.ts` — API route handler.
- `app/api/appeal/route.ts` — API route handler.
- `app/api/auth/logout/route.ts` — API route handler.
- `app/api/auth/providers/route.ts` — API route handler.
- `app/api/blocks/route.ts` — API route handler.
- `app/api/ci/run/route.ts` — API route handler.
- `app/api/close-friends/route.ts` — API route handler.
- `app/api/comments/route.ts` — API route handler.
- `app/api/connectors/[provider]/connect/route.ts` — API route handler.
- `app/api/connectors/[provider]/disconnect/route.ts` — API route handler.
- `app/api/connectors/[provider]/items/route.ts` — API route handler.
- `app/api/connectors/[provider]/sync/route.ts` — API route handler.
- `app/api/connectors/[provider]/verify/route.ts` — API route handler.
- `app/api/connectors/cron/route.ts` — API route handler.
- `app/api/connectors/instagram/oauth/callback/route.ts` — API route handler.
- `app/api/connectors/instagram/oauth/start/route.ts` — API route handler.
- `app/api/connectors/status/route.ts` — API route handler.
- `app/api/connectors/webhooks/[provider]/route.ts` — API route handler.
- `app/api/connectors/youtube/oauth/callback/route.ts` — API route handler.
- `app/api/connectors/youtube/oauth/start/route.ts` — API route handler.
- `app/api/content/generative-fill/route.ts` — API route handler.
- `app/api/content/intelligence/route.ts` — API route handler.
- `app/api/content/transcribe/route.ts` — API route handler.
- `app/api/content/voice-clone/route.ts` — API route handler.
- `app/api/dr-eams/hf/route.ts` — API route handler.
- `app/api/dr-eams/run/route.ts` — API route handler.
- `app/api/drafts/[id]/route.ts` — API route handler.
- `app/api/drafts/route.ts` — API route handler.
- `app/api/dream-windows/[id]/route.ts` — API route handler.
- `app/api/dream-windows/route.ts` — API route handler.
- `app/api/dreamengin/os-status/route.ts` — API route handler.
- `app/api/dreamr/feed/route.ts` — API route handler.
- `app/api/dreamr/suggested/route.ts` — API route handler.
- `app/api/dreams/feed/route.ts` — API route handler.
- `app/api/dreams/instances/route.ts` — API route handler.
- `app/api/dreams/transfer/route.ts` — API route handler.
- `app/api/embed-feed/route.ts` — API route handler.
- `app/api/favorites/route.ts` — API route handler.
- `app/api/feed/route.ts` — API route handler.
- `app/api/follow/route.ts` — API route handler.
- `app/api/forge/build/route.ts` — API route handler.
- `app/api/gal/route.ts` — API route handler.
- `app/api/game-scores/route.ts` — API route handler.
- `app/api/gameengin/crash-report/route.ts` — API route handler.
- `app/api/health/route.ts` — API route handler.
- `app/api/home-layout/route.ts` — API route handler.
- `app/api/journey/route.ts` — API route handler.
- `app/api/lab/benchmarks/route.ts` — API route handler.
- `app/api/ledger-media/route.ts` — API route handler.
- `app/api/likes/route.ts` — API route handler.
- `app/api/marketplace/request/route.ts` — API route handler.
- `app/api/marketplace/route.ts` — API route handler.
- `app/api/messages/boards/route.ts` — API route handler.
- `app/api/messages/route.ts` — API route handler.
- `app/api/metrics/platform/route.ts` — API route handler.
- `app/api/metrics/route.ts` — API route handler.
- `app/api/metrics/user/[userId]/route.ts` — API route handler.
- `app/api/music/route.ts` — API route handler.
- `app/api/notifications/route.ts` — API route handler.
- `app/api/platform/errors/route.ts` — API route handler.
- `app/api/posts/[id]/route.ts` — API route handler.
- `app/api/posts/[id]/save/route.ts` — API route handler.
- `app/api/posts/[id]/view/route.ts` — API route handler.
- `app/api/posts/profile/[userId]/route.ts` — API route handler.
- `app/api/posts/route.ts` — API route handler.
- `app/api/profile/route.ts` — API route handler.
- `app/api/projects/route.ts` — API route handler.
- `app/api/scheduled-posts/route.ts` — API route handler.
- `app/api/security/scan/route.ts` — API route handler.
- `app/api/settings/appearance/route.ts` — API route handler.
- `app/api/settings/feed/route.ts` — API route handler.
- `app/api/settings/notifications/route.ts` — API route handler.
- `app/api/settings/privacy/route.ts` — API route handler.
- `app/api/setup/check/route.ts` — API route handler.
- `app/api/setup/google-oauth/route.ts` — API route handler.
- `app/api/shellhub/devices/route.ts` — API route handler.
- `app/api/shop/route.ts` — API route handler.
- `app/api/skip-credits/balance/route.ts` — API route handler.
- `app/api/skip-credits/earn/route.ts` — API route handler.
- `app/api/skip-credits/use/route.ts` — API route handler.
- `app/api/social/rss-feed/route.ts` — API route handler.
- `app/api/upload/route.ts` — API route handler.
- `app/api/user/layout/route.ts` — API route handler.
- `app/api/views/track/route.ts` — API route handler.
- `app/api/widgets/feed/route.ts` — API route handler.
- `app/api/widgets/instances/route.ts` — API route handler.
- `app/api/youtube/channel/route.ts` — API route handler.
- `app/api/youtube/discovery/route.ts` — API route handler.
- `app/api/youtube/live-feed/route.ts` — API route handler.

</details>

## Contributing
Auto-synced from `CONTRIBUTING*`, `AGENTS.md`, `docs/**`, `.github/**` using repository introspection.
- Files tracked: **275**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Contributing file structure
```text
├── .github
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── actions
│   │   ├── resilient-engine
│   │   │   └── action.yml
│   │   └── setup-node
│   │       └── action.yml
│   ├── agents
│   │   ├── Spec-Engin HyperSICC.agent.md
│   │   ├── dreamengin.agent.md
│   │   ├── error-tracker.agent.md
│   │   ├── gameengin-ai-agent.yml
│   │   ├── gameengin.md
│   │   ├── humanAI.agent.md
│   │   ├── idari.agent.md
│   │   ├── my-agent.agent.md
│   │   ├── newagent.agent.md
│   │   └── videogameAi.md
│   ├── copilot-instructions.md
│   ├── issue-triage
│   │   ├── issue-552.md
│   │   ├── issue-556.md
│   │   ├── issue-560.md
│   │   ├── issue-565.md
│   │   ├── issue-571.md
│   │   ├── issue-573.md
│   │   ├── issue-600.md
│   │   ├── issue-601.md
│   │   ├── issue-602.md
│   │   ├── issue-603.md
│   │   ├── issue-604.md
│   │   ├── issue-605.md
│   │   ├── issue-606.md
│   │   ├── issue-607.md
│   │   ├── issue-608.md
│   │   ├── issue-609.md
│   │   ├── issue-610.md
│   │   ├── issue-611.md
│   │   ├── issue-612.md
│   │   ├── issue-613.md
│   │   ├── issue-617.md
│   │   ├── issue-620.md
│   │   ├── issue-621.md
│   │   ├── issue-622.md
│   │   ├── issue-623.md
│   │   ├── issue-647.md
│   │   ├── issue-753.md
│   │   └── issue-754.md
│   ├── pull_request_template.md
│   ├── ruleset
│   │   ├── autofixvercelbuild.yml
│   │   ├── bot-pr-automerge.yml
│   │   ├── bouncer.yml
│   │   ├── copilot-setup-steps.yml
│   │   ├── daydream-all.yml
│   │   ├── daydream-brand-engin.yml
│   │   ├── daydream-code-engin.yml
│   │   ├── daydream-create-engin.yml
│   │   ├── daydream-engin-build-cycle.yml
│   │   ├── daydream-engin-sicc-refinement.yml
│   │   ├── daydream-games-engin.yml
│   │   ├── daydream-lab-engin.yml
│   │   ├── daydream-music-engin.yml
│   │   ├── db-extension-audit.yml
│   │   ├── db-extension-check.yml
│   │   ├── deploy-artifact.yml
│   │   ├── docs-auto-update.yml
│   │   ├── dreamengin-preflight.yml
│   │   ├── elite-gameengin-evolution.yml
│   │   ├── engin-all.yml
│   │   ├── exportrepo.yml
│   │   ├── game-engin-patrol.yml
│   │   ├── game-library-research.yml
│   │   ├── gameengin-ai-agent.yml
│   │   ├── gameengin-artisan.yml
│   │   ├── gameengin-maestro.yml
│   │   ├── gameengin-mechanic.yml
│   │   ├── gameengin-prophet.yml
│   │   ├── gameengin-upgrader.yml
│   │   ├── gameengin-writer.yml
│   │   ├── games-library-ai-agent.yml
│   │   ├── garbageman.yml
│   │   ├── generatesupabasetypes.yml
│   │   ├── github-actions.yml
│   │   ├── humanai-army-audit.yml
│   │   ├── humanai-audit.yml
│   │   ├── idari-daily.yml
│   │   ├── issue-bot.yml
│   │   ├── mobile-nextgen-spec-evolution.yml
│   │   ├── mobile-ps5-spec-evolution.yml
│   │   ├── neural-decision-engine.yml
│   │   ├── optimize-dreamengin.yml
│   │   ├── portfolio-optimization.yml
│   │   ├── preflight.yml
│   │   ├── print-codebase.yml
│   │   ├── readme-autosync.yml
│   │   ├── refreshlock.yml
│   │   ├── repo-snapshot.yml
│   │   ├── report-driven-coding-agent.yml
│   │   ├── root-hygiene.yml
│   │   ├── spec-engin-ai-agent.yml
│   │   ├── sql-migration-guard.yml
│   │   ├── sync-build-memory.yml
│   │   ├── update-embed-feed.yml
│   │   ├── update-repo-state.yml
│   │   └── vercel-deploy.yml
│   ├── scripts
│   │   ├── DREAMENGIN_CORE_COMPLETE.md
│   │   ├── DREAMENGIN_CORE_USAGE.md
│   │   ├── ai_implement.py
│   │   ├── ai_neural_decision.py
│   │   ├── ai_propose.py
│   │   ├── ai_report_propose.py
│   │   ├── assemble_report_context.py
│   │   ├── catalog_games_for_ai.py
│   │   ├── check-root-hygiene.sh
│   │   ├── check_workflow_masking.py
│   │   ├── dreamengin_core.py
│   │   ├── humanai_audit.py
│   │   ├── issue-bot.js
… (155 more files)
```
<details><summary>Contributing file index (275 files)</summary>

- `.github/PULL_REQUEST_TEMPLATE.md` — documentation file.
- `.github/actions/resilient-engine/action.yml` — project file (yml).
- `.github/actions/setup-node/action.yml` — project file (yml).
- `.github/agents/Spec-Engin HyperSICC.agent.md` — documentation file.
- `.github/agents/dreamengin.agent.md` — documentation file.
- `.github/agents/error-tracker.agent.md` — documentation file.
- `.github/agents/gameengin-ai-agent.yml` — project file (yml).
- `.github/agents/gameengin.md` — documentation file.
- `.github/agents/humanAI.agent.md` — documentation file.
- `.github/agents/idari.agent.md` — documentation file.
- `.github/agents/my-agent.agent.md` — documentation file.
- `.github/agents/newagent.agent.md` — documentation file.
- `.github/agents/videogameAi.md` — documentation file.
- `.github/copilot-instructions.md` — documentation file.
- `.github/issue-triage/issue-552.md` — documentation file.
- `.github/issue-triage/issue-556.md` — documentation file.
- `.github/issue-triage/issue-560.md` — documentation file.
- `.github/issue-triage/issue-565.md` — documentation file.
- `.github/issue-triage/issue-571.md` — documentation file.
- `.github/issue-triage/issue-573.md` — documentation file.
- `.github/issue-triage/issue-600.md` — documentation file.
- `.github/issue-triage/issue-601.md` — documentation file.
- `.github/issue-triage/issue-602.md` — documentation file.
- `.github/issue-triage/issue-603.md` — documentation file.
- `.github/issue-triage/issue-604.md` — documentation file.
- `.github/issue-triage/issue-605.md` — documentation file.
- `.github/issue-triage/issue-606.md` — documentation file.
- `.github/issue-triage/issue-607.md` — documentation file.
- `.github/issue-triage/issue-608.md` — documentation file.
- `.github/issue-triage/issue-609.md` — documentation file.
- `.github/issue-triage/issue-610.md` — documentation file.
- `.github/issue-triage/issue-611.md` — documentation file.
- `.github/issue-triage/issue-612.md` — documentation file.
- `.github/issue-triage/issue-613.md` — documentation file.
- `.github/issue-triage/issue-617.md` — documentation file.
- `.github/issue-triage/issue-620.md` — documentation file.
- `.github/issue-triage/issue-621.md` — documentation file.
- `.github/issue-triage/issue-622.md` — documentation file.
- `.github/issue-triage/issue-623.md` — documentation file.
- `.github/issue-triage/issue-647.md` — documentation file.
- `.github/issue-triage/issue-753.md` — documentation file.
- `.github/issue-triage/issue-754.md` — documentation file.
- `.github/pull_request_template.md` — documentation file.
- `.github/ruleset/autofixvercelbuild.yml` — project file (yml).
- `.github/ruleset/bot-pr-automerge.yml` — project file (yml).
- `.github/ruleset/bouncer.yml` — project file (yml).
- `.github/ruleset/copilot-setup-steps.yml` — project file (yml).
- `.github/ruleset/daydream-all.yml` — project file (yml).
- `.github/ruleset/daydream-brand-engin.yml` — project file (yml).
- `.github/ruleset/daydream-code-engin.yml` — project file (yml).
- `.github/ruleset/daydream-create-engin.yml` — project file (yml).
- `.github/ruleset/daydream-engin-build-cycle.yml` — project file (yml).
- `.github/ruleset/daydream-engin-sicc-refinement.yml` — project file (yml).
- `.github/ruleset/daydream-games-engin.yml` — project file (yml).
- `.github/ruleset/daydream-lab-engin.yml` — project file (yml).
- `.github/ruleset/daydream-music-engin.yml` — project file (yml).
- `.github/ruleset/db-extension-audit.yml` — project file (yml).
- `.github/ruleset/db-extension-check.yml` — project file (yml).
- `.github/ruleset/deploy-artifact.yml` — project file (yml).
- `.github/ruleset/docs-auto-update.yml` — project file (yml).
- `.github/ruleset/dreamengin-preflight.yml` — project file (yml).
- `.github/ruleset/elite-gameengin-evolution.yml` — project file (yml).
- `.github/ruleset/engin-all.yml` — project file (yml).
- `.github/ruleset/exportrepo.yml` — project file (yml).
- `.github/ruleset/game-engin-patrol.yml` — project file (yml).
- `.github/ruleset/game-library-research.yml` — project file (yml).
- `.github/ruleset/gameengin-ai-agent.yml` — project file (yml).
- `.github/ruleset/gameengin-artisan.yml` — project file (yml).
- `.github/ruleset/gameengin-maestro.yml` — project file (yml).
- `.github/ruleset/gameengin-mechanic.yml` — project file (yml).
- `.github/ruleset/gameengin-prophet.yml` — project file (yml).
- `.github/ruleset/gameengin-upgrader.yml` — project file (yml).
- `.github/ruleset/gameengin-writer.yml` — project file (yml).
- `.github/ruleset/games-library-ai-agent.yml` — project file (yml).
- `.github/ruleset/garbageman.yml` — project file (yml).
- `.github/ruleset/generatesupabasetypes.yml` — project file (yml).
- `.github/ruleset/github-actions.yml` — project file (yml).
- `.github/ruleset/humanai-army-audit.yml` — project file (yml).
- `.github/ruleset/humanai-audit.yml` — project file (yml).
- `.github/ruleset/idari-daily.yml` — project file (yml).
- `.github/ruleset/issue-bot.yml` — project file (yml).
- `.github/ruleset/mobile-nextgen-spec-evolution.yml` — project file (yml).
- `.github/ruleset/mobile-ps5-spec-evolution.yml` — project file (yml).
- `.github/ruleset/neural-decision-engine.yml` — project file (yml).
- `.github/ruleset/optimize-dreamengin.yml` — project file (yml).
- `.github/ruleset/portfolio-optimization.yml` — project file (yml).
- `.github/ruleset/preflight.yml` — project file (yml).
- `.github/ruleset/print-codebase.yml` — project file (yml).
- `.github/ruleset/readme-autosync.yml` — project file (yml).
- `.github/ruleset/refreshlock.yml` — project file (yml).
- `.github/ruleset/repo-snapshot.yml` — project file (yml).
- `.github/ruleset/report-driven-coding-agent.yml` — project file (yml).
- `.github/ruleset/root-hygiene.yml` — project file (yml).
- `.github/ruleset/spec-engin-ai-agent.yml` — project file (yml).
- `.github/ruleset/sql-migration-guard.yml` — project file (yml).
- `.github/ruleset/sync-build-memory.yml` — project file (yml).
- `.github/ruleset/update-embed-feed.yml` — project file (yml).
- `.github/ruleset/update-repo-state.yml` — project file (yml).
- `.github/ruleset/vercel-deploy.yml` — project file (yml).
- `.github/scripts/DREAMENGIN_CORE_COMPLETE.md` — documentation file.
- `.github/scripts/DREAMENGIN_CORE_USAGE.md` — documentation file.
- `.github/scripts/ai_implement.py` — project file (py).
- `.github/scripts/ai_neural_decision.py` — project file (py).
- `.github/scripts/ai_propose.py` — project file (py).
- `.github/scripts/ai_report_propose.py` — project file (py).
- `.github/scripts/assemble_report_context.py` — project file (py).
- `.github/scripts/catalog_games_for_ai.py` — project file (py).
- `.github/scripts/check-root-hygiene.sh` — project file (sh).
- `.github/scripts/check_workflow_masking.py` — project file (py).
- `.github/scripts/dreamengin_core.py` — project file (py).
- `.github/scripts/humanai_audit.py` — project file (py).
- `.github/scripts/issue-bot.js` — TypeScript/JavaScript runtime module.
- `.github/scripts/run-readme-autosync.mjs` — TypeScript/JavaScript runtime module.
- `.github/scripts/scan_dreamengin_context.py` — project file (py).
- `.github/scripts/scan_gameengin_context.py` — project file (py).
- `.github/scripts/validate_game_sandbox.py` — project file (py).
- `.github/scripts/validate_report_agent_spec.py` — project file (py).
- `.github/workflows/autofixaudit.yml` — project file (yml).
- `.github/workflows/autofixvercelbuild.yml` — project file (yml).
- `.github/workflows/bot-pr-automerge.yml` — project file (yml).
- `.github/workflows/bouncer.yml` — project file (yml).
- `.github/workflows/codeql.yml` — project file (yml).
- `.github/workflows/copilot-setup-steps.yml` — project file (yml).
- `.github/workflows/daydream-all.yml` — project file (yml).
- `.github/workflows/daydream-brand-engin.yml` — project file (yml).
- `.github/workflows/daydream-code-engin.yml` — project file (yml).
- `.github/workflows/daydream-create-engin.yml` — project file (yml).
- `.github/workflows/daydream-engin-build-cycle.yml` — project file (yml).
- `.github/workflows/daydream-engin-sicc-refinement.yml` — project file (yml).
- `.github/workflows/daydream-games-engin.yml` — project file (yml).
- `.github/workflows/daydream-lab-engin.yml` — project file (yml).
- `.github/workflows/daydream-music-engin.yml` — project file (yml).
- `.github/workflows/db-extension-audit.yml` — project file (yml).
- `.github/workflows/db-extension-check.yml` — project file (yml).
- `.github/workflows/deploy-artifact.yml` — project file (yml).
- `.github/workflows/docs-auto-update.yml` — project file (yml).
- `.github/workflows/dreamengin-preflight.yml` — project file (yml).
- `.github/workflows/elite-gameengin-evolution.yml` — project file (yml).
- `.github/workflows/engin-all.yml` — project file (yml).
- `.github/workflows/exportrepo.yml` — project file (yml).
- `.github/workflows/full-audit.yml` — project file (yml).
- `.github/workflows/game-engin-patrol.yml` — project file (yml).
- `.github/workflows/game-library-research.yml` — project file (yml).
- `.github/workflows/gameengin-ai-agent.yml` — project file (yml).
- `.github/workflows/gameengin-artisan.yml` — project file (yml).
- `.github/workflows/gameengin-maestro.yml` — project file (yml).
- `.github/workflows/gameengin-mechanic.yml` — project file (yml).
- `.github/workflows/gameengin-prophet.yml` — project file (yml).
- `.github/workflows/gameengin-upgrader.yml` — project file (yml).
- `.github/workflows/gameengin-writer.yml` — project file (yml).
- `.github/workflows/games-library-ai-agent.yml` — project file (yml).
- `.github/workflows/garbageman.yml` — project file (yml).
- `.github/workflows/generatesupabasetypes.yml` — project file (yml).
- `.github/workflows/github-actions.yml` — project file (yml).
- `.github/workflows/humanai-army-audit.yml` — project file (yml).
- `.github/workflows/humanai-audit.yml` — project file (yml).
- `.github/workflows/idari-daily.yml` — project file (yml).
- `.github/workflows/issue-bot.yml` — project file (yml).
- `.github/workflows/mobile-nextgen-spec-evolution.yml` — project file (yml).
- `.github/workflows/mobile-ps5-spec-evolution.yml` — project file (yml).
- `.github/workflows/neural_decision_engine.yml` — project file (yml).
- `.github/workflows/optimize-dreamengin.yml` — project file (yml).
- `.github/workflows/orphan-guard.yml` — project file (yml).
- `.github/workflows/portfolio-optimization.yml` — project file (yml).
- `.github/workflows/preflight.yml` — project file (yml).
- `.github/workflows/print-codebase.yml` — project file (yml).
- `.github/workflows/readme-autosync.yml` — project file (yml).
- `.github/workflows/refreshlock.yml` — project file (yml).
- `.github/workflows/repo-snapshot.yml` — project file (yml).
- `.github/workflows/report-driven-coding-agent.yml` — project file (yml).
- `.github/workflows/resilient-engine-smoke.yml` — project file (yml).
- `.github/workflows/root-hygiene.yml` — project file (yml).
- `.github/workflows/spec-engin-ai-agent.yml` — project file (yml).
- `.github/workflows/sql-migration-guard.yml` — project file (yml).
- `.github/workflows/sync-build-memory.yml` — project file (yml).
- `.github/workflows/update-embed-feed.yml` — project file (yml).
- `.github/workflows/update-repo-state.yml` — project file (yml).
- `.github/workflows/vercel-deploy.yml` — project file (yml).
- `.github/workflows/visual-schematic.yml` — project file (yml).
- `AGENTS.md` — documentation file.
- `docs/ACTION_AUDIT.md` — documentation file.
- `docs/ACTIVITY_FIRST_PROTOCOL.md` — documentation file.
- `docs/ADD_WORKFLOW.md` — documentation file.
- `docs/AGENT_PLAYBOOK.md` — documentation file.
- `docs/AI_MAP.md` — documentation file.
- `docs/ARCHITECTURE.md` — documentation file.
- `docs/AUTH_SETUP.md` — documentation file.
- `docs/AXIOMS.md` — documentation file.
- `docs/BOOGIEMAN_POLICY.md` — documentation file.
- `docs/BUGS.md` — documentation file.
- `docs/CHILD_SAFETY_POLICY.md` — documentation file.
- `docs/CONNECTORS.md` — documentation file.
- `docs/CONNECTOR_MATRIX.md` — documentation file.
- `docs/CONSTITUTION.md` — documentation file.
- `docs/COPILOT_TOOLKIT.md` — documentation file.
- `docs/DREAMGAME_FORMAT.md` — documentation file.
- `docs/DR_EAMS.md` — documentation file.
- `docs/DUALSENSE_EXAMPLE.md` — documentation file.
- `docs/DUALSENSE_INTEGRATION.md` — documentation file.
- `docs/ENGIN_RUNTIME.md` — documentation file.
- `docs/FEATURE_STATUS.md` — documentation file.
- `docs/GENERATION_LAW.md` — documentation file.
- `docs/GITHUB_CODING_AGENT.md` — documentation file.
- `docs/GOLD_BUTTON_DUAL_RUNTIME.md` — documentation file.
- `docs/GOLD_BUTTON_QUICK_REF.md` — documentation file.
- `docs/HANDOFF.md` — documentation file.
- `docs/IDARI_CONTRACT.md` — documentation file.
- `docs/ISSUE_FIXES.md` — documentation file.
- `docs/LAW.md` — documentation file.
- `docs/MODULARITY_VIOLATION_LOG.md` — documentation file.
- `docs/NAMESPACE_PROTOCOL.md` — documentation file.
- `docs/NAMING_AUTHORITY.md` — documentation file.
- `docs/OBSERVABILITY.md` — documentation file.
- `docs/PHASE9_IMPLEMENTATION.md` — documentation file.
- `docs/POLICY_TESTS.md` — documentation file.
- `docs/PRINCIPLES_UPDATE.md` — documentation file.
- `docs/PRODUCT_DEFINITION.md` — documentation file.
- `docs/REPO_COMPANION.md` — documentation file.
- `docs/REPO_STATE_ANALYZER.md` — documentation file.
- `docs/REPO_STRUCTURE_CONTRACT.md` — documentation file.
- `docs/REVIEW_QUEUE.md` — documentation file.
- `docs/SECURITY.md` — documentation file.
- `docs/THEME.md` — documentation file.
- `docs/TRIAGE_LOG.md` — documentation file.
- `docs/UNIVERSAL_ENGINE.md` — documentation file.
- `docs/WASM_GPU_VM_SUMMARY.md` — documentation file.
- `docs/WIDGET_SYSTEM_V2.md` — documentation file.
- `docs/alignment/DOCS_CHANGE_TRACKER.md` — documentation file.
- `docs/alignment/REPO_TO_SPEC.md` — documentation file.
- `docs/architecture/IMPLEMENTATION_NOTES.md` — documentation file.
- `docs/architecture/dreamengin_phase2.md` — documentation file.
- `docs/archive/.gitkeep` — project file (no extension).
- `docs/dreamdm_bar_pass1.md` — documentation file.
- `docs/dreamdm_bar_pass2.md` — documentation file.
- `docs/dreamdm_messaging_phase2.md` — documentation file.
- `docs/dreamengin_phase1.md` — documentation file.
- `docs/dreamengin_phase6.md` — documentation file.
- `docs/dreamengin_phase8.md` — documentation file.
- `docs/engin_workflows.md` — documentation file.
- `docs/engineering/guardrails.md` — documentation file.
- `docs/enginpipe/README.md` — documentation file.
- `docs/guides/GITHUB_PUSH_GUIDE.md` — documentation file.
- `docs/guides/README.agent.md` — documentation file.
- `docs/icons.md` — documentation file.
- `docs/issue-552-readme-section-bot-ai-agent-quick-reference.md` — documentation file.
- `docs/issue-556-readme-section-bot-canonical-route-system.md` — documentation file.
- `docs/issue-560-readme-section-bot-runtime-model.md` — documentation file.
- `docs/issue-565-readme-section-bot-3-os-layer-naming-law-canonic.md` — documentation file.
- `docs/issue-571-readme-section-bot-9-daydream-pair-system-6-dayd.md` — documentation file.
- `docs/issue-573-readme-section-bot-11-games-gameengin.md` — documentation file.
- `docs/issue-600-readme-section-bot-recent-changes.md` — documentation file.
- `docs/issue-601-readme-section-bot-repository-state-analysis.md` — documentation file.
- `docs/issue-602-readme-section-bot-homedream-system.md` — documentation file.
- `docs/issue-603-readme-section-bot-core-surfaces.md` — documentation file.
- `docs/issue-604-readme-section-bot-current-implementation-status.md` — documentation file.
- `docs/issue-605-readme-section-bot-daydream-surfaces.md` — documentation file.
- `docs/issue-606-readme-section-bot-daydream-engin-network-model.md` — documentation file.
- `docs/issue-607-readme-section-bot-dreamdmbar-interaction-rail-r.md` — documentation file.
- `docs/issue-608-readme-section-bot-1-product-law-16-foundational.md` — documentation file.
- `docs/issue-609-readme-section-bot-6-homedream-core-system-priva.md` — documentation file.
- `docs/issue-610-readme-section-bot-10-music-starmakerengin.md` — documentation file.
- `docs/issue-611-readme-section-bot-12-lab-labengin.md` — documentation file.
- `docs/issue-612-readme-section-bot-13-code-codeengin.md` — documentation file.
- `docs/issue-613-readme-section-bot-7-edit-profiledream-core-syst.md` — documentation file.
- `docs/issue-617-readme-section-bot-8-view-profile-public-shared-.md` — documentation file.
- `docs/issue-620-readme-section-bot-what-this-is.md` — documentation file.
- `docs/issue-621-readme-section-bot-start-here.md` — documentation file.
- `docs/issue-622-readme-section-bot-structure.md` — documentation file.
- `docs/issue-623-readme-section-bot-root-rules.md` — documentation file.
- `docs/issue-647-readme-section-bot-how-to-regenerate-this-spec.md` — documentation file.
- `docs/logs/README_PATCH.md` — documentation file.
- `docs/mobile-nextgen-web-gaming-engine-spec.md` — documentation file.
- `docs/mobile-ps5-web-gaming-engine-spec.md` — documentation file.
- `docs/policy/theboogie.md` — documentation file.
- `docs/wasm_gpu_vm_spec.md` — documentation file.

</details>

## License
MIT — see [LICENSE](LICENSE).

---

## HomeDream System

- Canonical Route: `/homedream`
- Runtime implementation paths:
  - `app/homedream/page.tsx`
  - `app/dreamdmbar/_components/DreamBarDataBridge.tsx`

Canonical vocabulary:
- **Surface**
- **Daydream**
- **Engin**
- **Dream Window**
- **Canonical Route**

Runtime rules:
- DreamDMBar persistence is shell-owned.
- Home orchestration is stateful via `DreamSystemContext`.
- Surface regions preserve mounted state while hidden/minimized.

## 6. HomeDream (Core System, Private Operating Surface)

Single tap: Open dual menus.
Double tap: Go Home.
HomeDream is private by default and persistent between sessions.
The surface is centered around a personalized feed.
Core controls include 6 Daydream navigation, Dream Window layout, feed algorithm settings, and posting routes.

---

## 13. Code / CodeEngin

13.1 Code (Side A)

13.2 CodeEngin (Side B)

13.3 Specialized Dream Windows (Examples)

## UNIVERSAL MODULARITY LAW

See `docs/MODULARITY_VIOLATION_LOG.md` for enforcement and audit.
Required drag wrapper primitives: `DraggableModule`, `DreamWindowShell`, `UniversalEditorWrapper`.

No artificial "repurpose before invent" rule.

## Repo Visualizer
Auto-synced from `repo-visualizer/**` using repository introspection.
- Files tracked: **6**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Repo Visualizer file structure
```text
└── repo-visualizer
    ├── README.md
    ├── analyzer.mjs
    ├── graph-stats.json
    ├── graph.json
    ├── index.html
    └── server.mjs
```
<details><summary>Repo Visualizer file index (6 files)</summary>

- `repo-visualizer/README.md` — documentation file.
- `repo-visualizer/analyzer.mjs` — TypeScript/JavaScript runtime module.
- `repo-visualizer/graph-stats.json` — project file (json).
- `repo-visualizer/graph.json` — project file (json).
- `repo-visualizer/index.html` — project file (html).
- `repo-visualizer/server.mjs` — TypeScript/JavaScript runtime module.

</details>

## Build Memory
Auto-synced from `build-memory/**` using repository introspection.
- Files tracked: **6**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Build Memory file structure
```text
└── build-memory
    ├── actions.json
    ├── events.json
    ├── registry.json
    ├── routes.json
    ├── schema.json
    └── ui-surfaces.json
```
<details><summary>Build Memory file index (6 files)</summary>

- `build-memory/actions.json` — project file (json).
- `build-memory/events.json` — project file (json).
- `build-memory/registry.json` — project file (json).
- `build-memory/routes.json` — project file (json).
- `build-memory/schema.json` — project file (json).
- `build-memory/ui-surfaces.json` — project file (json).

</details>

## Src
Auto-synced from `src/**` using repository introspection.
- Files tracked: **36**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `DreamEnginLogo`, `LogoHero`, `Nav`
#### Src file structure
```text
└── src
    ├── components
    │   ├── dream.DreamEnginLogo.tsx
    │   ├── dream.LogoHero.tsx
    │   └── dream.Nav.tsx
    ├── configs
    │   └── demoGameConfig.ts
    ├── core
    │   └── GameEnginCore.ts
    ├── dream
    │   └── rulesets
    │       ├── codeengin
    │       │   └── index.ts
    │       ├── dreamsengin
    │       │   └── index.ts
    │       ├── forgengn
    │       │   └── index.ts
    │       ├── gameengin
    │       │   └── index.ts
    │       ├── homedream
    │       │   ├── dream.homedream.constants.ts
    │       │   ├── dream.homedream.physics.ts
    │       │   ├── dream.homedream.transforms.ts
    │       │   └── index.ts
    │       ├── labengin
    │       │   └── index.ts
    │       └── starmakerengin
    │           └── index.ts
    ├── dreamsurface
    │   ├── dreamsurface.bridge.ts
    │   ├── dreamsurface.delta.ts
    │   └── index.ts
    ├── engin
    │   ├── core
    │   │   ├── engin.auth.ts
    │   │   ├── engin.eventbus.ts
    │   │   ├── engin.ledger.ts
    │   │   ├── engin.renderloop.ts
    │   │   └── index.ts
    │   ├── generated
    │   │   ├── brain.ts
    │   │   ├── cartridges.ts
    │   │   ├── connectors.ts
    │   │   ├── hooks.ts
    │   │   ├── index.ts
    │   │   ├── personas.ts
    │   │   ├── rulesets.ts
    │   │   ├── surfaces.ts
    │   │   └── systems.ts
    │   └── state
    │       └── base.json
    ├── launcher.ts
    └── lib
        ├── ai
        │   └── client.ts
        └── babylon
            └── useDreamLogoScene.ts
```
<details><summary>Src file index (36 files)</summary>

- `src/components/dream.DreamEnginLogo.tsx` — React UI module for DreamEnginLogo.
- `src/components/dream.LogoHero.tsx` — React UI module for LogoHero.
- `src/components/dream.Nav.tsx` — React UI module for Nav.
- `src/configs/demoGameConfig.ts` — TypeScript/JavaScript runtime module.
- `src/core/GameEnginCore.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/codeengin/index.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/dreamsengin/index.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/forgengn/index.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/gameengin/index.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/homedream/dream.homedream.constants.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/homedream/dream.homedream.physics.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/homedream/dream.homedream.transforms.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/homedream/index.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/labengin/index.ts` — TypeScript/JavaScript runtime module.
- `src/dream/rulesets/starmakerengin/index.ts` — TypeScript/JavaScript runtime module.
- `src/dreamsurface/dreamsurface.bridge.ts` — TypeScript/JavaScript runtime module.
- `src/dreamsurface/dreamsurface.delta.ts` — TypeScript/JavaScript runtime module.
- `src/dreamsurface/index.ts` — TypeScript/JavaScript runtime module.
- `src/engin/core/engin.auth.ts` — TypeScript/JavaScript runtime module.
- `src/engin/core/engin.eventbus.ts` — TypeScript/JavaScript runtime module.
- `src/engin/core/engin.ledger.ts` — TypeScript/JavaScript runtime module.
- `src/engin/core/engin.renderloop.ts` — TypeScript/JavaScript runtime module.
- `src/engin/core/index.ts` — TypeScript/JavaScript runtime module.
- `src/engin/generated/brain.ts` — TypeScript/JavaScript runtime module.
- `src/engin/generated/cartridges.ts` — TypeScript/JavaScript runtime module.
- `src/engin/generated/connectors.ts` — TypeScript/JavaScript runtime module.
- `src/engin/generated/hooks.ts` — TypeScript/JavaScript runtime module.
- `src/engin/generated/index.ts` — TypeScript/JavaScript runtime module.
- `src/engin/generated/personas.ts` — TypeScript/JavaScript runtime module.
- `src/engin/generated/rulesets.ts` — TypeScript/JavaScript runtime module.
- `src/engin/generated/surfaces.ts` — TypeScript/JavaScript runtime module.
- `src/engin/generated/systems.ts` — TypeScript/JavaScript runtime module.
- `src/engin/state/base.json` — project file (json).
- `src/launcher.ts` — TypeScript/JavaScript runtime module.
- `src/lib/ai/client.ts` — TypeScript/JavaScript runtime module.
- `src/lib/babylon/useDreamLogoScene.ts` — TypeScript/JavaScript runtime module.

</details>

## Api
Auto-synced from `api/**` using repository introspection.
- Files tracked: **112**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Api file structure
```text
└── api
    ├── account
    │   ├── delete-data
    │   │   └── route.ts
    │   ├── delete-dream
    │   │   └── route.ts
    │   └── export-data
    │       └── route.ts
    ├── activity
    │   └── track
    │       └── route.ts
    ├── admin
    │   ├── ai-chat
    │   │   └── route.ts
    │   ├── ai-request
    │   │   └── route.ts
    │   ├── child-safety
    │   │   └── route.ts
    │   ├── code-files
    │   │   └── route.ts
    │   └── observability
    │       └── route.ts
    ├── ads
    │   ├── orders
    │   │   └── route.ts
    │   └── view
    │       └── route.ts
    ├── agent
    │   └── session
    │       └── route.ts
    ├── ai
    │   ├── boogieman
    │   │   ├── child-safety
    │   │   │   └── route.ts
    │   │   ├── privacy-event
    │   │   │   └── route.ts
    │   │   ├── route.ts
    │   │   └── status
    │   │       └── route.ts
    │   ├── eams
    │   │   └── route.ts
    │   ├── execute
    │   │   └── route.ts
    │   └── idari
    │       └── route.ts
    ├── appeal
    │   └── route.ts
    ├── auth
    │   ├── logout
    │   │   └── route.ts
    │   └── providers
    │       └── route.ts
    ├── blocks
    │   └── route.ts
    ├── ci
    │   └── run
    │       └── route.ts
    ├── close-friends
    │   └── route.ts
    ├── comments
    │   └── route.ts
    ├── connectors
    │   ├── [provider]
    │   │   ├── connect
    │   │   │   └── route.ts
    │   │   ├── disconnect
    │   │   │   └── route.ts
    │   │   ├── items
    │   │   │   └── route.ts
    │   │   ├── sync
    │   │   │   └── route.ts
    │   │   └── verify
    │   │       └── route.ts
    │   ├── cron
    │   │   └── route.ts
    │   ├── instagram
    │   │   └── oauth
    │   │       ├── callback
    │   │       │   └── route.ts
    │   │       └── start
    │   │           └── route.ts
    │   ├── status
    │   │   └── route.ts
    │   ├── webhooks
    │   │   └── [provider]
    │   │       └── route.ts
    │   └── youtube
    │       └── oauth
    │           ├── callback
    │           │   └── route.ts
    │           └── start
    │               └── route.ts
    ├── content
    │   ├── generative-fill
    │   │   └── route.ts
    │   ├── intelligence
    │   │   └── route.ts
    │   ├── transcribe
    │   │   └── route.ts
    │   └── voice-clone
    │       └── route.ts
    ├── dr-eams
    │   ├── hf
    │   │   └── route.ts
    │   └── run
    │       └── route.ts
    ├── drafts
    │   ├── [id]
    │   │   └── route.ts
    │   └── route.ts
    ├── dream-windows
    │   ├── [id]
    │   │   └── route.ts
    │   └── route.ts
    ├── dreamengin
    │   └── os-status
    │       └── route.ts
    ├── dreamr
    │   ├── feed
    │   │   └── route.ts
```
<details><summary>Api file index (112 files)</summary>

- `api/account/delete-data/route.ts` — API route handler.
- `api/account/delete-dream/route.ts` — API route handler.
- `api/account/export-data/route.ts` — API route handler.
- `api/activity/track/route.ts` — API route handler.
- `api/admin/ai-chat/route.ts` — API route handler.
- `api/admin/ai-request/route.ts` — API route handler.
- `api/admin/child-safety/route.ts` — API route handler.
- `api/admin/code-files/route.ts` — API route handler.
- `api/admin/observability/route.ts` — API route handler.
- `api/ads/orders/route.ts` — API route handler.
- `api/ads/view/route.ts` — API route handler.
- `api/agent/session/route.ts` — API route handler.
- `api/ai/boogieman/child-safety/route.ts` — API route handler.
- `api/ai/boogieman/privacy-event/route.ts` — API route handler.
- `api/ai/boogieman/route.ts` — API route handler.
- `api/ai/boogieman/status/route.ts` — API route handler.
- `api/ai/eams/route.ts` — API route handler.
- `api/ai/execute/route.ts` — API route handler.
- `api/ai/idari/route.ts` — API route handler.
- `api/appeal/route.ts` — API route handler.
- `api/auth/logout/route.ts` — API route handler.
- `api/auth/providers/route.ts` — API route handler.
- `api/blocks/route.ts` — API route handler.
- `api/ci/run/route.ts` — API route handler.
- `api/close-friends/route.ts` — API route handler.
- `api/comments/route.ts` — API route handler.
- `api/connectors/[provider]/connect/route.ts` — API route handler.
- `api/connectors/[provider]/disconnect/route.ts` — API route handler.
- `api/connectors/[provider]/items/route.ts` — API route handler.
- `api/connectors/[provider]/sync/route.ts` — API route handler.
- `api/connectors/[provider]/verify/route.ts` — API route handler.
- `api/connectors/cron/route.ts` — API route handler.
- `api/connectors/instagram/oauth/callback/route.ts` — API route handler.
- `api/connectors/instagram/oauth/start/route.ts` — API route handler.
- `api/connectors/status/route.ts` — API route handler.
- `api/connectors/webhooks/[provider]/route.ts` — API route handler.
- `api/connectors/youtube/oauth/callback/route.ts` — API route handler.
- `api/connectors/youtube/oauth/start/route.ts` — API route handler.
- `api/content/generative-fill/route.ts` — API route handler.
- `api/content/intelligence/route.ts` — API route handler.
- `api/content/transcribe/route.ts` — API route handler.
- `api/content/voice-clone/route.ts` — API route handler.
- `api/dr-eams/hf/route.ts` — API route handler.
- `api/dr-eams/run/route.ts` — API route handler.
- `api/drafts/[id]/route.ts` — API route handler.
- `api/drafts/route.ts` — API route handler.
- `api/dream-windows/[id]/route.ts` — API route handler.
- `api/dream-windows/route.ts` — API route handler.
- `api/dreamengin/os-status/route.ts` — API route handler.
- `api/dreamr/feed/route.ts` — API route handler.
- `api/dreamr/suggested/route.ts` — API route handler.
- `api/dreamr/tally/route.ts` — API route handler.
- `api/dreams/feed/route.ts` — API route handler.
- `api/dreams/instances/route.ts` — API route handler.
- `api/dreams/transfer/route.ts` — API route handler.
- `api/embed-feed/route.ts` — API route handler.
- `api/favorites/route.ts` — API route handler.
- `api/feed/route.ts` — API route handler.
- `api/follow/route.ts` — API route handler.
- `api/gal/route.ts` — API route handler.
- `api/game-scores/route.ts` — API route handler.
- `api/gameengin/crash-report/route.ts` — API route handler.
- `api/health/route.ts` — API route handler.
- `api/home-layout/route.ts` — API route handler.
- `api/journey/route.ts` — API route handler.
- `api/lab/benchmarks/route.ts` — API route handler.
- `api/ledger-media/route.ts` — API route handler.
- `api/likes/route.ts` — API route handler.
- `api/marketplace/request/route.ts` — API route handler.
- `api/marketplace/route.ts` — API route handler.
- `api/messages/boards/route.ts` — API route handler.
- `api/messages/route.ts` — API route handler.
- `api/metrics/platform/route.ts` — API route handler.
- `api/metrics/route.ts` — API route handler.
- `api/metrics/user/[userId]/route.ts` — API route handler.
- `api/music/route.ts` — API route handler.
- `api/notifications/route.ts` — API route handler.
- `api/platform/errors/route.ts` — API route handler.
- `api/posts/[id]/route.ts` — API route handler.
- `api/posts/[id]/save/route.ts` — API route handler.
- `api/posts/[id]/view/route.ts` — API route handler.
- `api/posts/profile/[userId]/route.ts` — API route handler.
- `api/posts/route.ts` — API route handler.
- `api/profile/route.ts` — API route handler.
- `api/projects/route.ts` — API route handler.
- `api/scheduled-posts/route.ts` — API route handler.
- `api/security/scan/route.ts` — API route handler.
- `api/settings/appearance/route.ts` — API route handler.
- `api/settings/feed/route.ts` — API route handler.
- `api/settings/notifications/route.ts` — API route handler.
- `api/settings/privacy/route.ts` — API route handler.
- `api/setup/check/route.ts` — API route handler.
- `api/setup/google-oauth/route.ts` — API route handler.
- `api/shared-dream/sessions/[id]/route.ts` — API route handler.
- `api/shared-dream/sessions/route.ts` — API route handler.
- `api/shellhub/devices/route.ts` — API route handler.
- `api/shop/route.ts` — API route handler.
- `api/skip-credits/balance/route.ts` — API route handler.
- `api/skip-credits/earn/route.ts` — API route handler.
- `api/skip-credits/use/route.ts` — API route handler.
- `api/social/ipfs/route.ts` — API route handler.
- `api/social/livekit/room/route.ts` — API route handler.
- `api/social/livekit/token/route.ts` — API route handler.
- `api/social/rss-feed/route.ts` — API route handler.
- `api/upload/route.ts` — API route handler.
- `api/user/layout/route.ts` — API route handler.
- `api/views/track/route.ts` — API route handler.
- `api/widgets/feed/route.ts` — API route handler.
- `api/widgets/instances/route.ts` — API route handler.
- `api/youtube/channel/route.ts` — API route handler.
- `api/youtube/discovery/route.ts` — API route handler.
- `api/youtube/live-feed/route.ts` — API route handler.

</details>

