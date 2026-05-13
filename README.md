# DREAMengin

**Spatial creative operating environment with one fixed engine + swappable rule-sets.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/) [![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-orange?logo=pnpm)](https://pnpm.io/workspaces) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Live Demo](https://img.shields.io/badge/Live-dreamengin.vercel.app-000?logo=vercel)](https://dreamengin.vercel.app)

## What is DREAMengin?
DREAMengin is designed around the **Creative Operating Law** documented in `.cursorrules` and `AGENTS.md`: keep one fixed universal engine for state, I/O, events, and security, and express product differences as swappable rule-sets. The engine is stable infrastructure; features evolve by changing rule-sets, surfaces, and manifests.

In plain English: DREAMengin behaves like a platform OS where HomeDream, DreamSpace, Dream Windows, Engins, messaging, media, commerce, and collaboration all run through shared runtime primitives instead of disconnected app silos. That gives the project a single behavior model across solo and co-op usage, while still allowing highly modular user-facing composition.

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
### Root configuration files
| File | Purpose |
|---|---|
| `package.json` | Structured data/config for package. |
| `pnpm-workspace.yaml` | Automation/workflow configuration for pnpm workspace. |
| `next.config.mjs` | JavaScript tooling/runtime script for next config. |
| `tailwind.config.ts` | TypeScript runtime module for tailwind config. |
| `tsconfig.json` | Structured data/config for tsconfig. |
| `tsconfig.games.json` | Structured data/config for tsconfig games. |
| `tsconfig.gamesengin.json` | Structured data/config for tsconfig gamesengin. |
| `playwright.config.ts` | TypeScript runtime module for playwright config. |
| `vitest.config.ts` | TypeScript runtime module for vitest config. |
| `vercel.json` | Structured data/config for vercel. |
| `eslint.config.mjs` | JavaScript tooling/runtime script for eslint config. |
| `.gitleaks.toml` | Tooling configuration for gitleaks. |
| `postcss.config.js` | JavaScript tooling/runtime script for postcss config. |
| `postcss.config.mjs` | JavaScript tooling/runtime script for postcss config. |
| `.env.example` | Project file used by this subsystem (example). |
| `.env.local.example` | Project file used by this subsystem (example). |
| `next-env.d.ts` | TypeScript runtime module for next env d. |
| `tailwindcss-animate.d.ts` | TypeScript runtime module for tailwindcss animate d. |

### Top-level directories
| Directory | Purpose |
|---|---|
| `.ci/` | CI snapshots and automation state artifacts. |
| `.github/` | GitHub workflows, templates, issue triage, and automation scripts. |
| `.husky/` | Local git hook entrypoints. |
| `agents/` | HumanAI and other agent personas/orchestration prompts. |
| `app/` | Next.js App Router pages, layouts, and API routes. |
| `assembly/` | AssemblyScript sources compiled to WebAssembly workers/cartridges. |
| `backend/` | Secondary Express-based backend utilities/services. |
| `build-memory/` | Generated machine-readable route/action/UI memory snapshots. |
| `components/` | React UI components grouped by product subsystems. |
| `config/` | YAML configuration inputs for optimizer/UI-UX tooling. |
| `core/` | Fixed core engine entry modules. |
| `coresurfaces/` | Canonical profile/edit core surfaces. |
| `daydreams/` | Standalone daydream route surfaces outside App Router. |
| `docs/` | Architecture law, product docs, and operational references. |
| `dr-eams/` | Dr.Eams AI subsystem prompts and docs. |
| `dreamdmbar/` | Persistent DreamDM bar and HomeDream runtime shell implementation. |
| `engins/` | Pluggable Engin implementations (rule-set driven feature engines). |
| `experiments/` | Experimental prototypes isolated from production paths. |
| `frontend/` | Legacy Vite frontend (kept for compatibility/migration support). |
| `grafana/` | Grafana provisioning/config artifacts. |
| `hooks/` | Shared React hooks used across surfaces. |
| `lib/` | Core runtime logic, state orchestration, adapters, and domain modules. |
| `misc/` | Miscellaneous support assets and scripts. |
| `output/` | Generated automation output artifacts. |
| `prometheus/` | Prometheus server configuration. |
| `public/` | Static assets, wasm workers, cartridges, icons, and manifest files. |
| `research/` | Research datasets/equations/papers that inform implementation. |
| `research-and-development/` | R&D staging docs and scripts separate from production. |
| `scripts/` | Project scripts for analysis, enforcement, and automation. |
| `src/` | Lower-level dream/engin rulesets and bridge primitives. |
| `styles/` | Global and subsystem CSS layers. |
| `supabase/` | Supabase config, schema, and SQL migrations. |
| `system/` | System-level fixed runtime glue modules. |
| `terraform/` | Infrastructure-as-code root module. |
| `tests/` | Vitest test suites and supporting test docs. |
| `types/` | Shared TypeScript types/contracts. |
| `utils/` | Utility scripts/helpers not owned by another subsystem. |
| `workflow/` | Workflow definitions for internal engine pipelines. |

## The Engins
An **Engin** in this repository is a pluggable capability layer mounted into the fixed runtime shell. The fixed engine provides lifecycle/state/event plumbing, while each Engin contributes domain-specific constraints, transformations, and UI rules. The active set in `engins/` includes Game, StarMaker (music), Lab, Code, Branding, Content, Analytics, Forge, and Portfolio implementations.

At runtime, Engins are routed through DreamSpace/HomeDream and can be promoted from solo channels to shared channels using runtime adapters (`lib/runtime/runtimeChannel.ts`, `lib/runtime/useSharedEnginChannel.ts`). This keeps component trees stable while transport mode changes.

#### Engins subsystem file structure
```text
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
<details><summary>Engins subsystem file index (16 files)</summary>

- `engins/CodeEngin/core/parser.ts` — TypeScript runtime module for parser.
- `engins/CodeEngin/modules/ai-co-pilot/dream.panel.AgentPanel.tsx` — React UI module for panel AgentPanel.
- `engins/CodeEngin/modules/ai-co-pilot/index.ts` — TypeScript runtime module for index.
- `engins/CodeEngin/modules/ai-co-pilot/useAgentSession.ts` — TypeScript runtime module for useAgentSession.
- `engins/CodeEngin/orchestrator/dream.index.tsx` — React UI module for index.
- `engins/autoopen/dream.AutoOpenGameEngin.tsx` — React UI module for AutoOpenGameEngin.
- `engins/dream.ForgeEngin.tsx` — React UI module for ForgeEngin.
- `engins/dream.QuantumCircuitCanvas.tsx` — React UI module for QuantumCircuitCanvas.
- `engins/dream.panel.AnalyticsEngin.tsx` — React UI module for panel AnalyticsEngin.
- `engins/engin.BrandingEngin.tsx` — React UI module for BrandingEngin.
- `engins/engin.CodeEngin.tsx` — React UI module for CodeEngin.
- `engins/engin.ContentEngin.tsx` — React UI module for ContentEngin.
- `engins/engin.GameEngin.tsx` — React UI module for GameEngin.
- `engins/engin.LabEngin.tsx` — React UI module for LabEngin.
- `engins/engin.StarMakerEngin.tsx` — React UI module for StarMakerEngin.
- `engins/portfolio/dream.PortfolioEngin.tsx` — React UI module for PortfolioEngin.

</details>

### BrandingEngin
**What it is:** `BrandingEngin` is one of the concrete Engin implementations currently tracked on `completedream`.

**How it works:** It plugs into the shared Dream runtime through canonical route/surface dispatch and uses the fixed engine context for state/events while exposing `BrandingEngin`-specific UI logic.
#### BrandingEngin file structure
```text
└── engins
    └── engin.BrandingEngin.tsx
```
<details><summary>BrandingEngin file index (1 files)</summary>

- `engins/engin.BrandingEngin.tsx` — React UI module for BrandingEngin.

</details>

### CodeEngin
**What it is:** `CodeEngin` is one of the concrete Engin implementations currently tracked on `completedream`.

**How it works:** It plugs into the shared Dream runtime through canonical route/surface dispatch and uses the fixed engine context for state/events while exposing `CodeEngin`-specific UI logic.
#### CodeEngin file structure
```text
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
    └── engin.CodeEngin.tsx
```
<details><summary>CodeEngin file index (6 files)</summary>

- `engins/CodeEngin/core/parser.ts` — TypeScript runtime module for parser.
- `engins/CodeEngin/modules/ai-co-pilot/dream.panel.AgentPanel.tsx` — React UI module for panel AgentPanel.
- `engins/CodeEngin/modules/ai-co-pilot/index.ts` — TypeScript runtime module for index.
- `engins/CodeEngin/modules/ai-co-pilot/useAgentSession.ts` — TypeScript runtime module for useAgentSession.
- `engins/CodeEngin/orchestrator/dream.index.tsx` — React UI module for index.
- `engins/engin.CodeEngin.tsx` — React UI module for CodeEngin.

</details>

### ContentEngin
**What it is:** `ContentEngin` is one of the concrete Engin implementations currently tracked on `completedream`.

**How it works:** It plugs into the shared Dream runtime through canonical route/surface dispatch and uses the fixed engine context for state/events while exposing `ContentEngin`-specific UI logic.
#### ContentEngin file structure
```text
└── engins
    └── engin.ContentEngin.tsx
```
<details><summary>ContentEngin file index (1 files)</summary>

- `engins/engin.ContentEngin.tsx` — React UI module for ContentEngin.

</details>

### GameEngin
**What it is:** `GameEngin` is one of the concrete Engin implementations currently tracked on `completedream`.

**How it works:** It plugs into the shared Dream runtime through canonical route/surface dispatch and uses the fixed engine context for state/events while exposing `GameEngin`-specific UI logic.
#### GameEngin file structure
```text
└── engins
    ├── autoopen
    │   └── dream.AutoOpenGameEngin.tsx
    └── engin.GameEngin.tsx
```
<details><summary>GameEngin file index (2 files)</summary>

- `engins/autoopen/dream.AutoOpenGameEngin.tsx` — React UI module for AutoOpenGameEngin.
- `engins/engin.GameEngin.tsx` — React UI module for GameEngin.

</details>

### LabEngin
**What it is:** `LabEngin` is one of the concrete Engin implementations currently tracked on `completedream`.

**How it works:** It plugs into the shared Dream runtime through canonical route/surface dispatch and uses the fixed engine context for state/events while exposing `LabEngin`-specific UI logic.
#### LabEngin file structure
```text
└── engins
    ├── dream.QuantumCircuitCanvas.tsx
    └── engin.LabEngin.tsx
```
<details><summary>LabEngin file index (2 files)</summary>

- `engins/dream.QuantumCircuitCanvas.tsx` — React UI module for QuantumCircuitCanvas.
- `engins/engin.LabEngin.tsx` — React UI module for LabEngin.

</details>

### StarMakerEngin
**What it is:** `StarMakerEngin` is one of the concrete Engin implementations currently tracked on `completedream`.

**How it works:** It plugs into the shared Dream runtime through canonical route/surface dispatch and uses the fixed engine context for state/events while exposing `StarMakerEngin`-specific UI logic.
#### StarMakerEngin file structure
```text
└── engins
    └── engin.StarMakerEngin.tsx
```
<details><summary>StarMakerEngin file index (1 files)</summary>

- `engins/engin.StarMakerEngin.tsx` — React UI module for StarMakerEngin.

</details>

### AnalyticsEngin
**What it is:** `AnalyticsEngin` is one of the concrete Engin implementations currently tracked on `completedream`.

**How it works:** It plugs into the shared Dream runtime through canonical route/surface dispatch and uses the fixed engine context for state/events while exposing `AnalyticsEngin`-specific UI logic.
#### AnalyticsEngin file structure
```text
└── engins
    └── dream.panel.AnalyticsEngin.tsx
```
<details><summary>AnalyticsEngin file index (1 files)</summary>

- `engins/dream.panel.AnalyticsEngin.tsx` — React UI module for panel AnalyticsEngin.

</details>

### ForgeEngin
**What it is:** `ForgeEngin` is one of the concrete Engin implementations currently tracked on `completedream`.

**How it works:** It plugs into the shared Dream runtime through canonical route/surface dispatch and uses the fixed engine context for state/events while exposing `ForgeEngin`-specific UI logic.
#### ForgeEngin file structure
```text
└── engins
    └── dream.ForgeEngin.tsx
```
<details><summary>ForgeEngin file index (1 files)</summary>

- `engins/dream.ForgeEngin.tsx` — React UI module for ForgeEngin.

</details>

### PortfolioEngin
**What it is:** `PortfolioEngin` is one of the concrete Engin implementations currently tracked on `completedream`.

**How it works:** It plugs into the shared Dream runtime through canonical route/surface dispatch and uses the fixed engine context for state/events while exposing `PortfolioEngin`-specific UI logic.
#### PortfolioEngin file structure
```text
└── engins
    └── portfolio
        └── dream.PortfolioEngin.tsx
```
<details><summary>PortfolioEngin file index (1 files)</summary>

- `engins/portfolio/dream.PortfolioEngin.tsx` — React UI module for PortfolioEngin.

</details>

### Custom Engins capability (current state)
No `engins/custom/` directory exists on this branch. Custom Engin behavior is currently implemented through runtime module manifests, registry/state managers, and channel adapters in `lib/runtime/*`, `lib/universal-editor/*`, and `types/module-manifest.ts`.
#### Custom Engin capability files file structure
```text
├── COOP_AND_SOLO_ROADMAP.md
├── lib
│   ├── runtime
│   │   ├── instanceManager.ts
│   │   ├── moduleRegistry.ts
│   │   └── useSharedEnginChannel.ts
│   ├── universal-editor
│   │   └── module-manifest.ts
│   └── universalEditor.ts
└── types
    └── module-manifest.ts
```
<details><summary>Custom Engin capability files file index (7 files)</summary>

- `COOP_AND_SOLO_ROADMAP.md` — Documentation/spec for COOP AND SOLO ROADMAP.
- `lib/runtime/instanceManager.ts` — TypeScript runtime module for instanceManager.
- `lib/runtime/moduleRegistry.ts` — TypeScript runtime module for moduleRegistry.
- `lib/runtime/useSharedEnginChannel.ts` — TypeScript runtime module for useSharedEnginChannel.
- `lib/universal-editor/module-manifest.ts` — TypeScript runtime module for module manifest.
- `lib/universalEditor.ts` — TypeScript runtime module for universalEditor.
- `types/module-manifest.ts` — TypeScript runtime module for module manifest.

</details>
## Dual Runtimes
DREAMengin runs a dual-runtime model: a top **Surface Space/HomeDream** region and a bottom **DreamSpace** region, coordinated by the persistent DreamDM bar and context state. `lib/runtime/dualRuntime.ts` defines canonical runtime world states and torus navigation, while `DreamSystemContext` and runtime components keep both regions synchronized.

The fixed engine applies the same rule-set contract to both runtime regions; only world selection and dominance change. Solo/co-op parity is handled by runtime channels so UI trees remain unified.
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
Shared Dreams are realtime collaboration sessions where multiple participants co-edit/view synchronized runtime state. The implementation wraps canonical collaboration primitives (`lib/collaboration`) behind `lib/sharedDream.ts` and client hooks (`hooks/useSharedDream.ts`).

State sync is transport-backed by Supabase Realtime and local fallback channels. The fixed engine normalizes broadcast payloads (cursor, edit, patch, media sync, presence), while rule-sets decide how individual Dream/Engin surfaces consume them.
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
Dreamr is the human-media layer (feed, creator posts, social discovery, and dr-eams tooling). It spans App Router surfaces, API routes, and feed components with Supabase-backed content persistence.

The engine handles identity/session/state contracts; Dreamr rule-sets define feed ranking, post rendering, and media interaction behavior. This includes route handlers for feed retrieval, posting, embeds, likes, comments, and draft persistence.
#### Dreamr/human-media files file structure
```text
├── app
│   ├── api
│   │   ├── comments
│   │   │   └── route.ts
│   │   ├── drafts
│   │   │   ├── [id]
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── dreamr
│   │   │   ├── feed
│   │   │   │   └── route.ts
│   │   │   └── suggested
│   │   │       └── route.ts
│   │   ├── embed-feed
│   │   │   └── route.ts
│   │   ├── feed
│   │   │   └── route.ts
│   │   ├── likes
│   │   │   └── route.ts
│   │   ├── posts
│   │   │   ├── [id]
│   │   │   │   ├── route.ts
│   │   │   │   ├── save
│   │   │   │   │   └── route.ts
│   │   │   │   └── view
│   │   │   │       └── route.ts
│   │   │   ├── profile
│   │   │   │   └── [userId]
│   │   │   │       └── route.ts
│   │   │   └── route.ts
│   │   └── views
│   │       └── track
│   │           └── route.ts
│   └── dreamr
│       └── page.tsx
├── components
│   ├── dreamr
│   │   ├── dream.CloseFriendsSettings.tsx
│   │   ├── dream.panel.DreamRChannelPanel.tsx
│   │   └── dream.panel.DreamRCreatorPanel.tsx
│   ├── feed
│   │   ├── dream.AlgorithmEngine.tsx
│   │   ├── dream.CommentSection.tsx
│   │   ├── dream.FeedVideoCard.tsx
│   │   ├── dream.FollowButton.tsx
│   │   └── dream.FollowOnboarding.tsx
│   └── feeds
│       └── dream.widget.EmbedFeedWidget.tsx
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
├── dr-eams
│   ├── capabilities.yaml
│   └── tools.ts
└── lib
    ├── dreamr
    │   ├── closeFriendsVisibility.ts
    │   ├── dreamrfeed.tsx
    │   ├── feedCursor.ts
    │   ├── socialHumanityScore.ts
    │   ├── swipeCalibration.ts
    │   ├── swipePersonalization.ts
    │   └── torridityLedger.ts
    ├── feed
    │   ├── feedTopics.ts
    │   ├── hashtags.ts
    │   ├── useLiveFeed.ts
    │   └── useYouTubeLiveFeed.ts
    ├── ledger.ts
    └── social-feed.ts
```
<details><summary>Dreamr/human-media files file index (45 files)</summary>

- `app/api/comments/route.ts` — API route handler for `/api/comments`.
- `app/api/drafts/[id]/route.ts` — API route handler for `/api/drafts/[id]`.
- `app/api/drafts/route.ts` — API route handler for `/api/drafts`.
- `app/api/dreamr/feed/route.ts` — API route handler for `/api/dreamr/feed`.
- `app/api/dreamr/suggested/route.ts` — API route handler for `/api/dreamr/suggested`.
- `app/api/embed-feed/route.ts` — API route handler for `/api/embed-feed`.
- `app/api/feed/route.ts` — API route handler for `/api/feed`.
- `app/api/likes/route.ts` — API route handler for `/api/likes`.
- `app/api/posts/[id]/route.ts` — API route handler for `/api/posts/[id]`.
- `app/api/posts/[id]/save/route.ts` — API route handler for `/api/posts/[id]/save`.
- `app/api/posts/[id]/view/route.ts` — API route handler for `/api/posts/[id]/view`.
- `app/api/posts/profile/[userId]/route.ts` — API route handler for `/api/posts/profile/[userId]`.
- `app/api/posts/route.ts` — API route handler for `/api/posts`.
- `app/api/views/track/route.ts` — API route handler for `/api/views/track`.
- `app/dreamr/page.tsx` — Next.js route page for `/dreamr`.
- `components/dreamr/dream.CloseFriendsSettings.tsx` — React UI module for CloseFriendsSettings.
- `components/dreamr/dream.panel.DreamRChannelPanel.tsx` — React UI module for panel DreamRChannelPanel.
- `components/dreamr/dream.panel.DreamRCreatorPanel.tsx` — React UI module for panel DreamRCreatorPanel.
- `components/feed/dream.AlgorithmEngine.tsx` — React UI module for AlgorithmEngine.
- `components/feed/dream.CommentSection.tsx` — React UI module for CommentSection.
- `components/feed/dream.FeedVideoCard.tsx` — React UI module for FeedVideoCard.
- `components/feed/dream.FollowButton.tsx` — React UI module for FollowButton.
- `components/feed/dream.FollowOnboarding.tsx` — React UI module for FollowOnboarding.
- `components/feeds/dream.widget.EmbedFeedWidget.tsx` — React UI module for widget EmbedFeedWidget.
- `daydreams/brand/page.tsx` — Next.js route page for `/brand`.
- `daydreams/code/page.tsx` — Next.js route page for `/code`.
- `daydreams/create/page.tsx` — Next.js route page for `/create`.
- `daydreams/games/page.tsx` — Next.js route page for `/games`.
- `daydreams/lab/page.tsx` — Next.js route page for `/lab`.
- `daydreams/music/page.tsx` — Next.js route page for `/music`.
- `dr-eams/capabilities.yaml` — Automation/workflow configuration for capabilities.
- `dr-eams/tools.ts` — TypeScript runtime module for tools.
- `lib/dreamr/closeFriendsVisibility.ts` — TypeScript runtime module for closeFriendsVisibility.
- `lib/dreamr/dreamrfeed.tsx` — React UI module for dreamrfeed.
- `lib/dreamr/feedCursor.ts` — TypeScript runtime module for feedCursor.
- `lib/dreamr/socialHumanityScore.ts` — TypeScript runtime module for socialHumanityScore.
- `lib/dreamr/swipeCalibration.ts` — TypeScript runtime module for swipeCalibration.
- `lib/dreamr/swipePersonalization.ts` — TypeScript runtime module for swipePersonalization.
- `lib/dreamr/torridityLedger.ts` — TypeScript runtime module for torridityLedger.
- `lib/feed/feedTopics.ts` — TypeScript runtime module for feedTopics.
- `lib/feed/hashtags.ts` — TypeScript runtime module for hashtags.
- `lib/feed/useLiveFeed.ts` — TypeScript runtime module for useLiveFeed.
- `lib/feed/useYouTubeLiveFeed.ts` — TypeScript runtime module for useYouTubeLiveFeed.
- `lib/ledger.ts` — TypeScript runtime module for ledger.
- `lib/social-feed.ts` — TypeScript runtime module for social feed.

</details>
## The Shop
The Shop is the first-party merch storefront surface (`/shop`) for user-owned listings. It exposes authenticated CRUD via `app/api/shop/route.ts` and validation helpers in `lib/shop/listings.ts`.

Runtime flow: user creates/updates listings, records persist to Supabase (`merch` table), and feed items are emitted for storefront visibility. Payment processor-specific checkout wiring (e.g., Stripe) is **not present** in the tracked files for this branch.
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
Marketplace is a distinct peer-to-peer listing layer (`/marketplace`) separated from the Shop. It uses a dedicated `marketplace_items` model, moderation/publish gating, and request flow endpoints.

Unlike Shop (seller storefront), Marketplace emphasizes cross-user listing discovery and request workflows with category/tags filtering and seller profile joins at the API layer.
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
Ads are implemented through ad surfaces (`/ads`), ad slot rendering, ad view tracking, and order creation endpoints. The code enforces a platform/creator revenue split server-side in `app/api/ads/orders/route.ts`.

User ads are represented as authenticated listing/order interactions plus skip-credit balances and ad-unit rendering components. Billing logic present in-repo is custom server-side math and DB writes; no external payment SDK integration is tracked in these ad files.
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
DreamDMBar is the persistent interaction rail/shell. It owns drag gestures, split-ratio runtime control, contextual intents, and direct access to messaging/search/Dr.Eams entry points.

It overlays all routes from `app/layout.tsx`, acting as the runtime seam between Surface Space and DreamSpace. The fixed engine provides global context/state; the DmBar rule-set determines gesture behavior and UI affordances.
#### DreamDMBar files file structure
```text
└── dreamdmbar
    ├── dream.GlowingLight.tsx
    ├── dreamsurface.dreamdmbar.tsx
    └── homedream
        ├── dream.shell.HomeSystem.tsx
        ├── dreamr
        │   ├── algorithms
        │   │   ├── botDetector.ts
        │   │   └── dreamrAlgorithm.ts
        │   ├── api
        │   │   └── route.ts
        │   ├── dream.DreamRCore.tsx
        │   ├── dream.DreamRFeed.tsx
        │   └── dreamsurface.dreamr.tsx
        ├── dreamsurface.dreamdmbar-grid.tsx
        └── dreamsurface.homedream.tsx
```
<details><summary>DreamDMBar files file index (11 files)</summary>

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

</details>
## Messaging
Messaging includes direct conversations, boards, and realtime-safe DM interactions across App Router pages, API routes, and DreamDM hooks/components.

Runtime flow: conversation retrieval/send endpoints (`app/api/messages/*`) + client renderers + DreamDM hooks for drafts, notifications, and conversation state. Safety checks (including child-safety scanning) are enforced server-side in message write paths.
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
HomeDream is the primary user home surface (`/homedream`) and product center. It composes activity, feed, quick actions, and runtime controls while remaining integrated with the persistent DmBar shell.

The fixed runtime keeps HomeDream mount/state stable; HomeDream-specific rule-sets in `src/dream/rulesets/homedream/*` and home components define transforms, constants, and behavior. HomeDream can run in either runtime region through dual-runtime dispatch.
#### HomeDream files file structure
```text
├── app
│   └── homedream
│       └── page.tsx
├── components
│   ├── dream.OSShellActivator.tsx
│   └── home
│       ├── dream.ActiveModuleSurface.tsx
│       ├── dream.DaydreamPulseStrip.tsx
│       ├── dream.FlagshipEnginesStrip.tsx
│       ├── dream.NeuralSeamCanvas.tsx
│       ├── dream.bar.GlobalDreamBar.tsx
│       ├── dream.bar.PersistentDreamBar.tsx
│       └── dream.widget.DreamWidget.tsx
├── dreamdmbar
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
├── lib
│   └── home-buttons
│       ├── button-groups.ts
│       └── contextual-home.ts
└── src
    └── dream
        └── rulesets
            └── homedream
                ├── dream.homedream.constants.ts
                ├── dream.homedream.physics.ts
                ├── dream.homedream.transforms.ts
                └── index.ts
```
<details><summary>HomeDream files file index (24 files)</summary>

- `app/homedream/page.tsx` — Next.js route page for `/homedream`.
- `components/dream.OSShellActivator.tsx` — React UI module for OSShellActivator.
- `components/home/dream.ActiveModuleSurface.tsx` — React UI module for ActiveModuleSurface.
- `components/home/dream.DaydreamPulseStrip.tsx` — React UI module for DaydreamPulseStrip.
- `components/home/dream.FlagshipEnginesStrip.tsx` — React UI module for FlagshipEnginesStrip.
- `components/home/dream.NeuralSeamCanvas.tsx` — React UI module for NeuralSeamCanvas.
- `components/home/dream.bar.GlobalDreamBar.tsx` — React UI module for bar GlobalDreamBar.
- `components/home/dream.bar.PersistentDreamBar.tsx` — React UI module for bar PersistentDreamBar.
- `components/home/dream.widget.DreamWidget.tsx` — React UI module for widget DreamWidget.
- `dreamdmbar/homedream/dream.shell.HomeSystem.tsx` — React UI module for shell HomeSystem.
- `dreamdmbar/homedream/dreamr/algorithms/botDetector.ts` — TypeScript runtime module for botDetector.
- `dreamdmbar/homedream/dreamr/algorithms/dreamrAlgorithm.ts` — TypeScript runtime module for dreamrAlgorithm.
- `dreamdmbar/homedream/dreamr/api/route.ts` — API route handler for `/homedream/dreamr/api`.
- `dreamdmbar/homedream/dreamr/dream.DreamRCore.tsx` — React UI module for DreamRCore.
- `dreamdmbar/homedream/dreamr/dream.DreamRFeed.tsx` — React UI module for DreamRFeed.
- `dreamdmbar/homedream/dreamr/dreamsurface.dreamr.tsx` — React UI module for dreamr.
- `dreamdmbar/homedream/dreamsurface.dreamdmbar-grid.tsx` — React UI module for dreamdmbar grid.
- `dreamdmbar/homedream/dreamsurface.homedream.tsx` — React UI module for homedream.
- `lib/home-buttons/button-groups.ts` — TypeScript runtime module for button groups.
- `lib/home-buttons/contextual-home.ts` — TypeScript runtime module for contextual home.
- `src/dream/rulesets/homedream/dream.homedream.constants.ts` — TypeScript runtime module for homeconstants.
- `src/dream/rulesets/homedream/dream.homedream.physics.ts` — TypeScript runtime module for homephysics.
- `src/dream/rulesets/homedream/dream.homedream.transforms.ts` — TypeScript runtime module for hometransforms.
- `src/dream/rulesets/homedream/index.ts` — TypeScript runtime module for index.

</details>
## DreamSpace
DreamSpace is the personal canvas/workspace where Dream Windows/Engins are mounted, arranged, and persisted. It is rendered by DreamSpace surface components and runtime/world dispatch logic.

The engine layer manages lifecycle and region routing; DreamSpace rule-sets/components provide layout/panel behavior and user editing affordances.
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
Canonical terminology in current code/docs is **Dream Window** for modular runtime containers (`CHANGELOG.md`, `lib/dream-window/*`, `types/dream-window.ts`). “Widget” and “Surface” still appear in legacy/compatibility areas and user-facing labels, but Dream Window is the canonical model.

Lifecycle is enforced through `DreamWindowLifecycle` (unbound → bound → mounted ↔ collapsed), with engine-managed state/events/security and rule-set specific rendering per Dream type.
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
User-facing modularity is delivered via customize bars/panels, draggable modules, universal editor wrappers, and widget libraries/settings pages. Users can compose/rearrange interfaces without editing code.

The fixed engine keeps persistence/event contracts unified; modularity rule-sets define what can be moved, edited, installed, and shared per surface.
#### User-modularity files file structure
```text
├── app
│   ├── api
│   │   └── widgets
│   │       ├── feed
│   │       │   └── route.ts
│   │       └── instances
│   │           └── route.ts
│   └── settings
│       ├── dreams
│       │   ├── dreams-layout-editor.tsx
│       │   └── page.tsx
│       └── widgets
│           └── page.tsx
├── components
│   ├── customize
│   │   ├── dream.GlobalCustomizeUI.tsx
│   │   ├── dream.bar.CustomizeModeBar.tsx
│   │   ├── dream.bar.CustomizeToolbar.tsx
│   │   └── panels
│   │       ├── dream.panel.ColorPanel.tsx
│   │       ├── dream.panel.EffectsPanel.tsx
│   │       ├── dream.panel.FontPanel.tsx
│   │       └── dream.panel.LayoutPanel.tsx
│   ├── draggable
│   │   └── dream.DraggableModule.tsx
│   ├── universal-editor
│   │   ├── dream.UniversalEditor.tsx
│   │   ├── dream.UniversalEditorWrapper.tsx
│   │   ├── index.ts
│   │   └── useTapHoldMove.ts
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
└── lib
    ├── runtime
    │   ├── dropTargetRegistry.ts
    │   ├── moduleRegistry.ts
    │   └── useDragSurface.ts
    ├── universal-editor
    │   └── module-manifest.ts
    └── universalEditor.ts
```
<details><summary>User-modularity files file index (33 files)</summary>

- `app/api/widgets/feed/route.ts` — API route handler for `/api/widgets/feed`.
- `app/api/widgets/instances/route.ts` — API route handler for `/api/widgets/instances`.
- `app/settings/dreams/dreams-layout-editor.tsx` — React UI module for dreams layout editor.
- `app/settings/dreams/page.tsx` — Next.js route page for `/settings/dreams`.
- `app/settings/widgets/page.tsx` — Next.js route page for `/settings/widgets`.
- `components/customize/dream.GlobalCustomizeUI.tsx` — React UI module for GlobalCustomizeUI.
- `components/customize/dream.bar.CustomizeModeBar.tsx` — React UI module for bar CustomizeModeBar.
- `components/customize/dream.bar.CustomizeToolbar.tsx` — React UI module for bar CustomizeToolbar.
- `components/customize/panels/dream.panel.ColorPanel.tsx` — React UI module for panel ColorPanel.
- `components/customize/panels/dream.panel.EffectsPanel.tsx` — React UI module for panel EffectsPanel.
- `components/customize/panels/dream.panel.FontPanel.tsx` — React UI module for panel FontPanel.
- `components/customize/panels/dream.panel.LayoutPanel.tsx` — React UI module for panel LayoutPanel.
- `components/draggable/dream.DraggableModule.tsx` — React UI module for DraggableModule.
- `components/universal-editor/dream.UniversalEditor.tsx` — React UI module for UniversalEditor.
- `components/universal-editor/dream.UniversalEditorWrapper.tsx` — React UI module for UniversalEditorWrapper.
- `components/universal-editor/index.ts` — TypeScript runtime module for index.
- `components/universal-editor/useTapHoldMove.ts` — TypeScript runtime module for useTapHoldMove.
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
- `lib/runtime/dropTargetRegistry.ts` — TypeScript runtime module for dropTargetRegistry.
- `lib/runtime/moduleRegistry.ts` — TypeScript runtime module for moduleRegistry.
- `lib/runtime/useDragSurface.ts` — TypeScript runtime module for useDragSurface.
- `lib/universal-editor/module-manifest.ts` — TypeScript runtime module for module manifest.
- `lib/universalEditor.ts` — TypeScript runtime module for universalEditor.

</details>
## Custom Engins
Custom Engins are currently authored through manifests and runtime registration primitives rather than a dedicated `engins/custom/` directory. Authors define module metadata/contracts and register instances/channels through runtime registries.

Hot-swap and solo/co-op promotion are handled by instance/channel managers (`instanceManager`, `runtimeChannel`, `useSharedEnginChannel`). Sandboxing boundaries come from shared engine constraints and API-layer auth/security rules.
#### Custom Engins authoring/runtime files file structure
```text
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
├── lib
│   ├── runtime
│   │   ├── instanceManager.ts
│   │   ├── moduleRegistry.ts
│   │   ├── runtimeChannel.ts
│   │   └── useSharedEnginChannel.ts
│   └── universal-editor
│       └── module-manifest.ts
└── types
    └── module-manifest.ts
```
<details><summary>Custom Engins authoring/runtime files file index (22 files)</summary>

- `engins/CodeEngin/core/parser.ts` — TypeScript runtime module for parser.
- `engins/CodeEngin/modules/ai-co-pilot/dream.panel.AgentPanel.tsx` — React UI module for panel AgentPanel.
- `engins/CodeEngin/modules/ai-co-pilot/index.ts` — TypeScript runtime module for index.
- `engins/CodeEngin/modules/ai-co-pilot/useAgentSession.ts` — TypeScript runtime module for useAgentSession.
- `engins/CodeEngin/orchestrator/dream.index.tsx` — React UI module for index.
- `engins/autoopen/dream.AutoOpenGameEngin.tsx` — React UI module for AutoOpenGameEngin.
- `engins/dream.ForgeEngin.tsx` — React UI module for ForgeEngin.
- `engins/dream.QuantumCircuitCanvas.tsx` — React UI module for QuantumCircuitCanvas.
- `engins/dream.panel.AnalyticsEngin.tsx` — React UI module for panel AnalyticsEngin.
- `engins/engin.BrandingEngin.tsx` — React UI module for BrandingEngin.
- `engins/engin.CodeEngin.tsx` — React UI module for CodeEngin.
- `engins/engin.ContentEngin.tsx` — React UI module for ContentEngin.
- `engins/engin.GameEngin.tsx` — React UI module for GameEngin.
- `engins/engin.LabEngin.tsx` — React UI module for LabEngin.
- `engins/engin.StarMakerEngin.tsx` — React UI module for StarMakerEngin.
- `engins/portfolio/dream.PortfolioEngin.tsx` — React UI module for PortfolioEngin.
- `lib/runtime/instanceManager.ts` — TypeScript runtime module for instanceManager.
- `lib/runtime/moduleRegistry.ts` — TypeScript runtime module for moduleRegistry.
- `lib/runtime/runtimeChannel.ts` — TypeScript runtime module for runtimeChannel.
- `lib/runtime/useSharedEnginChannel.ts` — TypeScript runtime module for useSharedEnginChannel.
- `lib/universal-editor/module-manifest.ts` — TypeScript runtime module for module manifest.
- `types/module-manifest.ts` — TypeScript runtime module for module manifest.

</details>
## Full Website Customizability
Full customizability spans theme tokens (`tailwind.config.ts`), CSS layers (`styles/`), customizable panels/UI (`components/customize/*`, `components/panels/*`), and appearance settings routes/APIs.

The fixed engine keeps rendering/runtime guarantees, while customization rule-sets adjust layout, visual tokens, panel behavior, and per-user appearance state.
#### Customization/theming files file structure
```text
├── app
│   ├── api
│   │   └── settings
│   │       └── appearance
│   │           └── route.ts
│   └── settings
│       └── appearance
│           └── page.tsx
├── components
│   ├── customize
│   │   ├── dream.GlobalCustomizeUI.tsx
│   │   ├── dream.bar.CustomizeModeBar.tsx
│   │   ├── dream.bar.CustomizeToolbar.tsx
│   │   └── panels
│   │       ├── dream.panel.ColorPanel.tsx
│   │       ├── dream.panel.EffectsPanel.tsx
│   │       ├── dream.panel.FontPanel.tsx
│   │       └── dream.panel.LayoutPanel.tsx
│   └── panels
│       ├── dream.panel.AlgorithmPanel.tsx
│       ├── dream.panel.AppearancePanel.tsx
│       ├── dream.panel.ConnectorsPanel.tsx
│       ├── dream.panel.ControlsPanel.tsx
│       ├── dream.panel.DataPanel.tsx
│       ├── dream.panel.FeedPanel.tsx
│       ├── dream.panel.FeedSettingsPanel.tsx
│       ├── dream.panel.HelpPanel.tsx
│       ├── dream.panel.MarketplacePanel.tsx
│       ├── dream.panel.PrivacyPanel.tsx
│       ├── dream.panel.ProfilePanel.tsx
│       ├── dream.panel.SafetyPanel.tsx
│       ├── dream.panel.SettingsPanel.tsx
│       └── dream.panel.WidgetsPanel.tsx
├── config
│   ├── advanced-game-targets.json
│   ├── optimizer.yaml
│   └── ui-ux-spec.yaml
├── core
│   └── .gitkeep
├── postcss.config.js
├── postcss.config.mjs
├── styles
│   ├── dream-shell.css
│   ├── globals.css
│   ├── home-dream.css
│   ├── theme.css
│   └── view-transitions.css
├── system
│   └── ci
│       └── archive
│           └── root-workflows
│               └── github-actions.yml
└── tailwind.config.ts
```
<details><summary>Customization/theming files file index (36 files)</summary>

- `app/api/settings/appearance/route.ts` — API route handler for `/api/settings/appearance`.
- `app/settings/appearance/page.tsx` — Next.js route page for `/settings/appearance`.
- `components/customize/dream.GlobalCustomizeUI.tsx` — React UI module for GlobalCustomizeUI.
- `components/customize/dream.bar.CustomizeModeBar.tsx` — React UI module for bar CustomizeModeBar.
- `components/customize/dream.bar.CustomizeToolbar.tsx` — React UI module for bar CustomizeToolbar.
- `components/customize/panels/dream.panel.ColorPanel.tsx` — React UI module for panel ColorPanel.
- `components/customize/panels/dream.panel.EffectsPanel.tsx` — React UI module for panel EffectsPanel.
- `components/customize/panels/dream.panel.FontPanel.tsx` — React UI module for panel FontPanel.
- `components/customize/panels/dream.panel.LayoutPanel.tsx` — React UI module for panel LayoutPanel.
- `components/panels/dream.panel.AlgorithmPanel.tsx` — React UI module for panel AlgorithmPanel.
- `components/panels/dream.panel.AppearancePanel.tsx` — React UI module for panel AppearancePanel.
- `components/panels/dream.panel.ConnectorsPanel.tsx` — React UI module for panel ConnectorsPanel.
- `components/panels/dream.panel.ControlsPanel.tsx` — React UI module for panel ControlsPanel.
- `components/panels/dream.panel.DataPanel.tsx` — React UI module for panel DataPanel.
- `components/panels/dream.panel.FeedPanel.tsx` — React UI module for panel FeedPanel.
- `components/panels/dream.panel.FeedSettingsPanel.tsx` — React UI module for panel FeedSettingsPanel.
- `components/panels/dream.panel.HelpPanel.tsx` — React UI module for panel HelpPanel.
- `components/panels/dream.panel.MarketplacePanel.tsx` — React UI module for panel MarketplacePanel.
- `components/panels/dream.panel.PrivacyPanel.tsx` — React UI module for panel PrivacyPanel.
- `components/panels/dream.panel.ProfilePanel.tsx` — React UI module for panel ProfilePanel.
- `components/panels/dream.panel.SafetyPanel.tsx` — React UI module for panel SafetyPanel.
- `components/panels/dream.panel.SettingsPanel.tsx` — React UI module for panel SettingsPanel.
- `components/panels/dream.panel.WidgetsPanel.tsx` — React UI module for panel WidgetsPanel.
- `config/advanced-game-targets.json` — Structured data/config for advanced game targets.
- `config/optimizer.yaml` — Automation/workflow configuration for optimizer.
- `config/ui-ux-spec.yaml` — Automation/workflow configuration for ui ux spec.
- `core/.gitkeep` — Executable/config artifact for gitkeep.
- `postcss.config.js` — JavaScript tooling/runtime script for postcss config.
- `postcss.config.mjs` — JavaScript tooling/runtime script for postcss config.
- `styles/dream-shell.css` — Stylesheet for dream shell.
- `styles/globals.css` — Stylesheet for globals.
- `styles/home-dream.css` — Stylesheet for home dream.
- `styles/theme.css` — Stylesheet for theme.
- `styles/view-transitions.css` — Stylesheet for view transitions.
- `system/ci/archive/root-workflows/github-actions.yml` — Automation/workflow configuration for github actions.
- `tailwind.config.ts` — TypeScript runtime module for tailwind config.

</details>
## Backend, System, Core & CoreSurfaces
These directories represent the fixed engine substrate and lower-level system glue. `core/` + `system/` are minimal but canonical anchors, `backend/` carries server-side services, and `coresurfaces/` contains core profile surfaces.

This is where Rule 1–5 separation is most explicit: infrastructure/state contracts stay centralized, while domain-specific behavior is layered through higher-level rule-set modules.
#### Backend/system/core files file structure
```text
├── backend
│   ├── .env.example
│   ├── README.md
│   ├── docker-compose.yml
│   ├── dockerfile
│   ├── index.js
│   ├── package-lock.json
│   ├── package.json
│   └── src
│       ├── Routes
│       │   └── apiRoutes.js
│       ├── controllers
│       │   ├── engagementController.js
│       │   ├── feedController.js
│       │   └── ipfsController.js
│       ├── services
│       │   ├── ipfsService.js
│       │   └── livekitService.js
│       └── socialaggregators
│           ├── bluesky.js
│           ├── mastodon.js
│           └── nostr.js
├── core
│   └── .gitkeep
├── coresurfaces
│   ├── dreamsurface.EditProfileDream.tsx
│   └── dreamsurface.ViewProfile.tsx
└── system
    └── ci
        └── archive
            └── root-workflows
                └── github-actions.yml
```
<details><summary>Backend/system/core files file index (20 files)</summary>

- `backend/.env.example` — Project file used by this subsystem (example).
- `backend/README.md` — Subsystem documentation reference.
- `backend/docker-compose.yml` — Automation/workflow configuration for docker compose.
- `backend/dockerfile` — Executable/config artifact for dockerfile.
- `backend/index.js` — JavaScript tooling/runtime script for index.
- `backend/package-lock.json` — Structured data/config for package lock.
- `backend/package.json` — Structured data/config for package.
- `backend/src/Routes/apiRoutes.js` — JavaScript tooling/runtime script for apiRoutes.
- `backend/src/controllers/engagementController.js` — JavaScript tooling/runtime script for engagementController.
- `backend/src/controllers/feedController.js` — JavaScript tooling/runtime script for feedController.
- `backend/src/controllers/ipfsController.js` — JavaScript tooling/runtime script for ipfsController.
- `backend/src/services/ipfsService.js` — JavaScript tooling/runtime script for ipfsService.
- `backend/src/services/livekitService.js` — JavaScript tooling/runtime script for livekitService.
- `backend/src/socialaggregators/bluesky.js` — JavaScript tooling/runtime script for bluesky.
- `backend/src/socialaggregators/mastodon.js` — JavaScript tooling/runtime script for mastodon.
- `backend/src/socialaggregators/nostr.js` — JavaScript tooling/runtime script for nostr.
- `core/.gitkeep` — Executable/config artifact for gitkeep.
- `coresurfaces/dreamsurface.EditProfileDream.tsx` — React UI module for EditProfileDream.
- `coresurfaces/dreamsurface.ViewProfile.tsx` — React UI module for ViewProfile.
- `system/ci/archive/root-workflows/github-actions.yml` — Automation/workflow configuration for github actions.

</details>
## Agents & Workflow
DREAMengin includes explicit agent governance and workflow layers: `AGENTS.md` defines operating law, `agents/` stores personas/orchestration, and `workflow/` stores workflow-oriented assets used by internal automation patterns.

Agents plug in as operational/control surfaces, not as replacements for the fixed runtime engine. They consume engine outputs and enforce process-level checks.
#### Agents/workflow files file structure
```text
├── AGENTS.md
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
└── workflow
    └── archive
        ├── Dockerfile
        ├── Dockerfile.dev
        ├── appthemanger-ctrl_DREAMengin_95779c.json
        ├── config.yaml
        └── docker-compose.yml
```
<details><summary>Agents/workflow files file index (14 files)</summary>

- `AGENTS.md` — Documentation/spec for AGENTS.
- `agents/.gitkeep` — Executable/config artifact for gitkeep.
- `agents/humanAI.persona.md` — Documentation/spec for humanAI persona.
- `agents/humanAI/orchestrator.md` — Documentation/spec for orchestrator.
- `agents/humanAI/personas/accessibility.md` — Documentation/spec for accessibility.
- `agents/humanAI/personas/creator.md` — Documentation/spec for creator.
- `agents/humanAI/personas/ios-first.md` — Documentation/spec for ios first.
- `agents/humanAI/personas/power-user.md` — Documentation/spec for power user.
- `agents/humanAI/personas/social-explorer.md` — Documentation/spec for social explorer.
- `workflow/archive/Dockerfile` — Executable/config artifact for Dockerfile.
- `workflow/archive/Dockerfile.dev` — Project file used by this subsystem (dev).
- `workflow/archive/appthemanger-ctrl_DREAMengin_95779c.json` — Structured data/config for appthemanger ctrl DREAMengin 95779c.
- `workflow/archive/config.yaml` — Automation/workflow configuration for config.
- `workflow/archive/docker-compose.yml` — Automation/workflow configuration for docker compose.

</details>
## Research, Experiments & Daydreams
Research and experiments are intentionally separated from production runtime paths. `research/` and `research-and-development/` preserve exploratory artifacts, while `experiments/` and `daydreams/` hold prototype or transitional surfaces.

This separation keeps the fixed engine stable while still allowing high-velocity exploration and speculative design iteration.
#### Research/experiments/daydreams files file structure
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
<details><summary>Research/experiments/daydreams files file index (24 files)</summary>

- `daydreams/brand/page.tsx` — Next.js route page for `/brand`.
- `daydreams/code/page.tsx` — Next.js route page for `/code`.
- `daydreams/create/page.tsx` — Next.js route page for `/create`.
- `daydreams/games/page.tsx` — Next.js route page for `/games`.
- `daydreams/lab/page.tsx` — Next.js route page for `/lab`.
- `daydreams/music/page.tsx` — Next.js route page for `/music`.
- `experiments/.gitkeep` — Executable/config artifact for gitkeep.
- `research-and-development/LICENSE` — Executable/config artifact for LICENSE.
- `research-and-development/tech-spec-v1.md` — Documentation/spec for tech spec v1.
- `research/DISCOVERY.md` — Documentation/spec for DISCOVERY.
- `research/README.md` — Subsystem documentation reference.
- `research/ccc-ada-twin-engine/README.md` — Subsystem documentation reference.
- `research/ccc-ada-twin-engine/code/README.md` — Subsystem documentation reference.
- `research/ccc-ada-twin-engine/data/README.md` — Subsystem documentation reference.
- `research/ccc-ada-twin-engine/notes/sharpening_notes.txt` — Project file used by this subsystem (txt).
- `research/ccc-ada-twin-engine/paper/ccc_ada_axioms_and_invariants.tex` — Project file used by this subsystem (tex).
- `research/ccc-ada-twin-engine/paper/ccc_ada_black_hole_gravitational_wave_memory.tex` — Project file used by this subsystem (tex).
- `research/ccc-ada-twin-engine/paper/ccc_ada_holography_and_information_boundary.tex` — Project file used by this subsystem (tex).
- `research/ccc-ada-twin-engine/paper/ccc_ada_predictions_and_falsifiability.tex` — Project file used by this subsystem (tex).
- `research/ccc-ada-twin-engine/paper/ccc_ada_twin_engine_framework.tex` — Project file used by this subsystem (tex).
- `research/data/README.md` — Subsystem documentation reference.
- `research/data/torr_vs_mond_lock_n11.csv` — Project file used by this subsystem (csv).
- `research/equations/torridityequate.txt` — Project file used by this subsystem (txt).
- `research/paper/torridity_ledger.tex` — Project file used by this subsystem (tex).

</details>
## Infra & Ops
Infra/Ops spans deployment, monitoring, DB migration, CI workflows, hooks, automation scripts, and generated operational artifacts. The platform uses Vercel + Supabase + GitHub Actions + Grafana/Prometheus/Terraform assets tracked in-repo.

Operational flow: schema/config evolves through migration and IaC files; workflows/scripts enforce quality gates and automated reports; observability config defines runtime monitoring paths.
#### Infra/Ops files file structure
```text
├── .ci
│   ├── snapshot.diff.txt
│   └── snapshot.md
├── .github
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── actions
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
│   │   ├── dreamengin_core.py
│   │   ├── humanai_audit.py
│   │   ├── issue-bot.js
│   │   ├── scan_dreamengin_context.py
│   │   ├── scan_gameengin_context.py
│   │   ├── validate_game_sandbox.py
│   │   └── validate_report_agent_spec.py
│   └── workflows
│       ├── autofixvercelbuild.yml
│       ├── bot-pr-automerge.yml
│       ├── bouncer.yml
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
│       ├── portfolio-optimization.yml
│       ├── preflight.yml
│       ├── print-codebase.yml
│       ├── refreshlock.yml
│       ├── repo-snapshot.yml
│       ├── report-driven-coding-agent.yml
│       ├── root-hygiene.yml
│       ├── spec-engin-ai-agent.yml
│       ├── sql-migration-guard.yml
│       ├── sync-build-memory.yml
│       ├── update-embed-feed.yml
│       ├── update-repo-state.yml
│       └── vercel-deploy.yml
├── .husky
│   ├── pre-commit
│   └── pre-push
├── build-memory
│   ├── actions.json
│   ├── events.json
│   ├── routes.json
│   ├── schema.json
│   └── ui-surfaces.json
├── grafana
│   ├── dashboards
│   │   └── default.yml
│   └── datasources
│       └── prometheus.yml
├── misc
│   └── images
│       ├── arm2_transparent.png
│       ├── coat_transparent.png
│       ├── head_transparent.png
│       ├── iconslist.png
│       ├── logo_DREAM_transparent.png
│       ├── logo_ENGIN_transparent.png
│       ├── logo_transparent.png
│       ├── shoe1_transparent.png
│       ├── shoe2_transparent.png
│       ├── sprite_2x_transparent.png
│       └── sprite_transparent.png
├── output
│   ├── patch-plan.json
│   └── result.json
├── prometheus
│   └── prometheus.yml
├── scripts
│   ├── analyze-repo-state.mjs
│   ├── archive
│   │   ├── proxy.ts
│   │   └── validate-deployment.js
│   ├── autofix-vercel-build.mjs
│   ├── check-build-memory-drift.mjs
│   ├── check-engin-filenames.mjs
│   ├── check-licenses.mjs
│   ├── check-root-hygiene.mjs
│   ├── close-all-open-prs.sh
│   ├── deploy.sh
│   ├── export-full-code.mjs
│   ├── feature-build
│   │   └── generate-features.mjs
│   ├── gameengin
│   │   ├── architect-run.ts
│   │   ├── artisan-run.ts
│   │   ├── lib
│   │   │   └── tar.ts
│   │   ├── maestro-analyze.ts
│   │   ├── mechanic-run.ts
│   │   ├── package-cartridge.ts
│   │   ├── prophet-run.ts
│   │   ├── upgrader-run.ts
│   │   └── writer-run.ts
│   ├── generate-mobile-nextgen-spec.mjs
│   ├── generate-mobile-ps5-spec.mjs
│   ├── generate-webapp-final-form.mjs
│   ├── law-check.sh
│   ├── migrate-imports.sh
│   ├── optimize-dreamengin.mjs
│   ├── postbuild.js
│   ├── postbuild.ts
│   ├── repository-state-analysis-section.mjs
│   ├── score-pass.cjs
│   ├── setup-database.sql
│   ├── spec-check.cjs
│   ├── sync-build-memory.mjs
│   ├── ui-ux-agent.py
│   ├── update-bugs.mjs
│   ├── update-embed-feed.mjs
│   ├── update-handoff.mjs
│   ├── update-readme-status-utils.mjs
│   ├── update-readme.mjs
│   ├── validate-schema-sync.sh
│   ├── vercel-ignore.cjs
│   └── vercel-preflight.cjs
├── supabase
│   ├── config.toml
│   ├── migrations
│   │   ├── 20240120000000_initial_schema.sql
│   │   ├── 20240120000001_enable_rls.sql
│   │   ├── 20260129000000_upgrade_schema.sql
│   │   ├── 20260210000000_widget_system_v2.sql
│   │   ├── 20260210000001_ai_system_v2026.sql
│   │   ├── 20260210_ai_core.sql
│   │   ├── 20260214000000_security_axioms.sql
│   │   ├── 20260226000000_admin_lock.sql
│   │   ├── 20260305000000_create_notes.sql
│   │   ├── 20260305000001_comments.sql
│   │   ├── 20260305000002_leaderboard.sql
│   │   ├── 20260307000000_readme_gaps.sql
│   │   ├── 20260307000001_conversations_messages.sql
│   │   ├── 20260310000000_widget_instances_visibility.sql
│   │   ├── 20260310000001_profiles_widget_config.sql
│   │   ├── 20260310000002_profile_dream_widgets.sql
│   │   ├── 20260310000003_connector_accounts.sql
│   │   ├── 20260310000004_feed_items.sql
│   │   ├── 20260310000010_dreamdm_bar_pass2.sql
│   │   ├── 20260315000000_content_drafts.sql
│   │   ├── 20260316000000_visibility_mappings.sql
│   │   ├── 20260319000000_journey_dots.sql
│   │   ├── 20260319065444_new-migration.sql
│   │   ├── 20260319120000_connector_accounts_schema_reload.sql
│   │   ├── 20260320000000_scheduled_posts.sql
│   │   ├── 20260320100000_game_scores_all_games.sql
│   │   ├── 20260320110000_user_blocks.sql
│   │   ├── 20260321000000_ads_platform_promotions.sql
│   │   ├── 20260321200000_phase8a_feed_and_layout.sql
│   │   ├── 20260322000000_phase8b_dream_windows.sql
│   │   ├── 20260322000000_policy_events.sql
│   │   ├── 20260322000001_message_boards.sql
│   │   ├── 20260323100000_embed_feed_items.sql
│   │   ├── 20260324000000_phase8e_orders.sql
│   │   ├── 20260324000001_phase8e_shop_marketplace.sql
│   │   ├── 20260325000000_phase8f_daydream_network.sql
│   │   ├── 20260325100000_child_safety.sql
│   │   ├── 20260401000001_platform_utilities.sql
│   │   ├── 20260402000001_control_mappings.sql
│   │   ├── 20260402000002_game_assets.sql
│   │   ├── 20260403000001_pgvector_embeddings.sql
│   │   ├── 20260403000002_pgvector_search_rpc.sql
│   │   ├── 20260405000001_dreamr_feed_registry.sql
│   │   ├── 20260405042406_auto_scaffold.sql
│   │   ├── 20260413000000_phase9_activity_first_protocol.sql
│   │   ├── 20260417000000_repurpose_nods_as_dream_docs.sql
│   │   ├── 20260417000001_dream_docs_search_rpc.sql
│   │   ├── 20260418000000_gameengin_core.sql
│   │   ├── 20260420000001_consent_settings_audit.sql
│   │   ├── 20260426000000_activity_coop_gameengin_completion.sql
│   │   ├── 20260426000100_rename_widgets_to_dreams.sql
│   │   └── 20260426000200_build_memory_schema_gaps.sql
│   ├── schema-final.sql
│   └── seed.sql
├── terraform
│   └── main.tf
└── vercel.json
```
<details><summary>Infra/Ops files file index (238 files)</summary>

- `.ci/snapshot.diff.txt` — Project file used by this subsystem (txt).
- `.ci/snapshot.md` — Documentation/spec for snapshot.
- `.github/PULL_REQUEST_TEMPLATE.md` — Documentation/spec for PULL REQUEST TEMPLATE.
- `.github/actions/setup-node/action.yml` — Automation/workflow configuration for action.
- `.github/agents/Spec-Engin HyperSICC.agent.md` — Documentation/spec for Spec Engin HyperSICC agent.
- `.github/agents/dreamengin.agent.md` — Documentation/spec for dreamagent.
- `.github/agents/error-tracker.agent.md` — Documentation/spec for error tracker agent.
- `.github/agents/gameengin-ai-agent.yml` — Automation/workflow configuration for gameengin ai agent.
- `.github/agents/gameengin.md` — Documentation/spec for gameengin.
- `.github/agents/humanAI.agent.md` — Documentation/spec for humanAI agent.
- `.github/agents/idari.agent.md` — Documentation/spec for idari agent.
- `.github/agents/my-agent.agent.md` — Documentation/spec for my agent agent.
- `.github/agents/newagent.agent.md` — Documentation/spec for newagent agent.
- `.github/agents/videogameAi.md` — Documentation/spec for videogameAi.
- `.github/copilot-instructions.md` — Documentation/spec for copilot instructions.
- `.github/issue-triage/issue-552.md` — Documentation/spec for issue 552.
- `.github/issue-triage/issue-556.md` — Documentation/spec for issue 556.
- `.github/issue-triage/issue-560.md` — Documentation/spec for issue 560.
- `.github/issue-triage/issue-565.md` — Documentation/spec for issue 565.
- `.github/issue-triage/issue-571.md` — Documentation/spec for issue 571.
- `.github/issue-triage/issue-573.md` — Documentation/spec for issue 573.
- `.github/issue-triage/issue-600.md` — Documentation/spec for issue 600.
- `.github/issue-triage/issue-601.md` — Documentation/spec for issue 601.
- `.github/issue-triage/issue-602.md` — Documentation/spec for issue 602.
- `.github/issue-triage/issue-603.md` — Documentation/spec for issue 603.
- `.github/issue-triage/issue-604.md` — Documentation/spec for issue 604.
- `.github/issue-triage/issue-605.md` — Documentation/spec for issue 605.
- `.github/issue-triage/issue-606.md` — Documentation/spec for issue 606.
- `.github/issue-triage/issue-607.md` — Documentation/spec for issue 607.
- `.github/issue-triage/issue-608.md` — Documentation/spec for issue 608.
- `.github/issue-triage/issue-609.md` — Documentation/spec for issue 609.
- `.github/issue-triage/issue-610.md` — Documentation/spec for issue 610.
- `.github/issue-triage/issue-611.md` — Documentation/spec for issue 611.
- `.github/issue-triage/issue-612.md` — Documentation/spec for issue 612.
- `.github/issue-triage/issue-613.md` — Documentation/spec for issue 613.
- `.github/issue-triage/issue-617.md` — Documentation/spec for issue 617.
- `.github/issue-triage/issue-620.md` — Documentation/spec for issue 620.
- `.github/issue-triage/issue-621.md` — Documentation/spec for issue 621.
- `.github/issue-triage/issue-622.md` — Documentation/spec for issue 622.
- `.github/issue-triage/issue-623.md` — Documentation/spec for issue 623.
- `.github/issue-triage/issue-647.md` — Documentation/spec for issue 647.
- `.github/issue-triage/issue-753.md` — Documentation/spec for issue 753.
- `.github/issue-triage/issue-754.md` — Documentation/spec for issue 754.
- `.github/pull_request_template.md` — Documentation/spec for pull request template.
- `.github/scripts/DREAMENGIN_CORE_COMPLETE.md` — Documentation/spec for DREAMENGIN CORE COMPLETE.
- `.github/scripts/DREAMENGIN_CORE_USAGE.md` — Documentation/spec for DREAMENGIN CORE USAGE.
- `.github/scripts/ai_implement.py` — Python automation script for ai implement.
- `.github/scripts/ai_neural_decision.py` — Python automation script for ai neural decision.
- `.github/scripts/ai_propose.py` — Python automation script for ai propose.
- `.github/scripts/ai_report_propose.py` — Python automation script for ai report propose.
- `.github/scripts/assemble_report_context.py` — Python automation script for assemble report context.
- `.github/scripts/catalog_games_for_ai.py` — Python automation script for catalog games for ai.
- `.github/scripts/check-root-hygiene.sh` — Project file used by this subsystem (sh).
- `.github/scripts/dreamengin_core.py` — Python automation script for dreamengin core.
- `.github/scripts/humanai_audit.py` — Python automation script for humanai audit.
- `.github/scripts/issue-bot.js` — JavaScript tooling/runtime script for issue bot.
- `.github/scripts/scan_dreamengin_context.py` — Python automation script for scan dreamengin context.
- `.github/scripts/scan_gameengin_context.py` — Python automation script for scan gameengin context.
- `.github/scripts/validate_game_sandbox.py` — Python automation script for validate game sandbox.
- `.github/scripts/validate_report_agent_spec.py` — Python automation script for validate report agent spec.
- `.github/workflows/autofixvercelbuild.yml` — Automation/workflow configuration for autofixvercelbuild.
- `.github/workflows/bot-pr-automerge.yml` — Automation/workflow configuration for bot pr automerge.
- `.github/workflows/bouncer.yml` — Automation/workflow configuration for bouncer.
- `.github/workflows/copilot-setup-steps.yml` — Automation/workflow configuration for copilot setup steps.
- `.github/workflows/daydream-all.yml` — Automation/workflow configuration for daydream all.
- `.github/workflows/daydream-brand-engin.yml` — Automation/workflow configuration for daydream brand engin.
- `.github/workflows/daydream-code-engin.yml` — Automation/workflow configuration for daydream code engin.
- `.github/workflows/daydream-create-engin.yml` — Automation/workflow configuration for daydream create engin.
- `.github/workflows/daydream-engin-build-cycle.yml` — Automation/workflow configuration for daydream engin build cycle.
- `.github/workflows/daydream-engin-sicc-refinement.yml` — Automation/workflow configuration for daydream engin sicc refinement.
- `.github/workflows/daydream-games-engin.yml` — Automation/workflow configuration for daydream games engin.
- `.github/workflows/daydream-lab-engin.yml` — Automation/workflow configuration for daydream lab engin.
- `.github/workflows/daydream-music-engin.yml` — Automation/workflow configuration for daydream music engin.
- `.github/workflows/db-extension-audit.yml` — Automation/workflow configuration for db extension audit.
- `.github/workflows/db-extension-check.yml` — Automation/workflow configuration for db extension check.
- `.github/workflows/deploy-artifact.yml` — Automation/workflow configuration for deploy artifact.
- `.github/workflows/docs-auto-update.yml` — Automation/workflow configuration for docs auto update.
- `.github/workflows/dreamengin-preflight.yml` — Automation/workflow configuration for dreamengin preflight.
- `.github/workflows/elite-gameengin-evolution.yml` — Automation/workflow configuration for elite gameengin evolution.
- `.github/workflows/engin-all.yml` — Automation/workflow configuration for engin all.
- `.github/workflows/exportrepo.yml` — Automation/workflow configuration for exportrepo.
- `.github/workflows/game-engin-patrol.yml` — Automation/workflow configuration for game engin patrol.
- `.github/workflows/game-library-research.yml` — Automation/workflow configuration for game library research.
- `.github/workflows/gameengin-ai-agent.yml` — Automation/workflow configuration for gameengin ai agent.
- `.github/workflows/gameengin-artisan.yml` — Automation/workflow configuration for gameengin artisan.
- `.github/workflows/gameengin-maestro.yml` — Automation/workflow configuration for gameengin maestro.
- `.github/workflows/gameengin-mechanic.yml` — Automation/workflow configuration for gameengin mechanic.
- `.github/workflows/gameengin-prophet.yml` — Automation/workflow configuration for gameengin prophet.
- `.github/workflows/gameengin-upgrader.yml` — Automation/workflow configuration for gameengin upgrader.
- `.github/workflows/gameengin-writer.yml` — Automation/workflow configuration for gameengin writer.
- `.github/workflows/games-library-ai-agent.yml` — Automation/workflow configuration for games library ai agent.
- `.github/workflows/garbageman.yml` — Automation/workflow configuration for garbageman.
- `.github/workflows/generatesupabasetypes.yml` — Automation/workflow configuration for generatesupabasetypes.
- `.github/workflows/github-actions.yml` — Automation/workflow configuration for github actions.
- `.github/workflows/humanai-army-audit.yml` — Automation/workflow configuration for humanai army audit.
- `.github/workflows/humanai-audit.yml` — Automation/workflow configuration for humanai audit.
- `.github/workflows/idari-daily.yml` — Automation/workflow configuration for idari daily.
- `.github/workflows/issue-bot.yml` — Automation/workflow configuration for issue bot.
- `.github/workflows/mobile-nextgen-spec-evolution.yml` — Automation/workflow configuration for mobile nextgen spec evolution.
- `.github/workflows/mobile-ps5-spec-evolution.yml` — Automation/workflow configuration for mobile ps5 spec evolution.
- `.github/workflows/neural_decision_engine.yml` — Automation/workflow configuration for neural decision engine.
- `.github/workflows/optimize-dreamengin.yml` — Automation/workflow configuration for optimize dreamengin.
- `.github/workflows/portfolio-optimization.yml` — Automation/workflow configuration for portfolio optimization.
- `.github/workflows/preflight.yml` — Automation/workflow configuration for preflight.
- `.github/workflows/print-codebase.yml` — Automation/workflow configuration for print codebase.
- `.github/workflows/refreshlock.yml` — Automation/workflow configuration for refreshlock.
- `.github/workflows/repo-snapshot.yml` — Automation/workflow configuration for repo snapshot.
- `.github/workflows/report-driven-coding-agent.yml` — Automation/workflow configuration for report driven coding agent.
- `.github/workflows/root-hygiene.yml` — Automation/workflow configuration for root hygiene.
- `.github/workflows/spec-engin-ai-agent.yml` — Automation/workflow configuration for spec engin ai agent.
- `.github/workflows/sql-migration-guard.yml` — Automation/workflow configuration for sql migration guard.
- `.github/workflows/sync-build-memory.yml` — Automation/workflow configuration for sync build memory.
- `.github/workflows/update-embed-feed.yml` — Automation/workflow configuration for update embed feed.
- `.github/workflows/update-repo-state.yml` — Automation/workflow configuration for update repo state.
- `.github/workflows/vercel-deploy.yml` — Automation/workflow configuration for vercel deploy.
- `.husky/pre-commit` — Executable/config artifact for pre commit.
- `.husky/pre-push` — Executable/config artifact for pre push.
- `build-memory/actions.json` — Structured data/config for actions.
- `build-memory/events.json` — Structured data/config for events.
- `build-memory/routes.json` — Structured data/config for routes.
- `build-memory/schema.json` — Structured data/config for schema.
- `build-memory/ui-surfaces.json` — Structured data/config for ui surfaces.
- `grafana/dashboards/default.yml` — Automation/workflow configuration for default.
- `grafana/datasources/prometheus.yml` — Automation/workflow configuration for prometheus.
- `misc/images/arm2_transparent.png` — Static visual asset used by the UI/runtime.
- `misc/images/coat_transparent.png` — Static visual asset used by the UI/runtime.
- `misc/images/head_transparent.png` — Static visual asset used by the UI/runtime.
- `misc/images/iconslist.png` — Static visual asset used by the UI/runtime.
- `misc/images/logo_DREAM_transparent.png` — Static visual asset used by the UI/runtime.
- `misc/images/logo_ENGIN_transparent.png` — Static visual asset used by the UI/runtime.
- `misc/images/logo_transparent.png` — Static visual asset used by the UI/runtime.
- `misc/images/shoe1_transparent.png` — Static visual asset used by the UI/runtime.
- `misc/images/shoe2_transparent.png` — Static visual asset used by the UI/runtime.
- `misc/images/sprite_2x_transparent.png` — Static visual asset used by the UI/runtime.
- `misc/images/sprite_transparent.png` — Static visual asset used by the UI/runtime.
- `output/patch-plan.json` — Structured data/config for patch plan.
- `output/result.json` — Structured data/config for result.
- `prometheus/prometheus.yml` — Automation/workflow configuration for prometheus.
- `scripts/analyze-repo-state.mjs` — JavaScript tooling/runtime script for analyze repo state.
- `scripts/archive/proxy.ts` — TypeScript runtime module for proxy.
- `scripts/archive/validate-deployment.js` — JavaScript tooling/runtime script for validate deployment.
- `scripts/autofix-vercel-build.mjs` — JavaScript tooling/runtime script for autofix vercel build.
- `scripts/check-build-memory-drift.mjs` — JavaScript tooling/runtime script for check build memory drift.
- `scripts/check-engin-filenames.mjs` — JavaScript tooling/runtime script for check engin filenames.
- `scripts/check-licenses.mjs` — JavaScript tooling/runtime script for check licenses.
- `scripts/check-root-hygiene.mjs` — JavaScript tooling/runtime script for check root hygiene.
- `scripts/close-all-open-prs.sh` — Project file used by this subsystem (sh).
- `scripts/deploy.sh` — Project file used by this subsystem (sh).
- `scripts/export-full-code.mjs` — JavaScript tooling/runtime script for export full code.
- `scripts/feature-build/generate-features.mjs` — JavaScript tooling/runtime script for generate features.
- `scripts/gameengin/architect-run.ts` — TypeScript runtime module for architect run.
- `scripts/gameengin/artisan-run.ts` — TypeScript runtime module for artisan run.
- `scripts/gameengin/lib/tar.ts` — TypeScript runtime module for tar.
- `scripts/gameengin/maestro-analyze.ts` — TypeScript runtime module for maestro analyze.
- `scripts/gameengin/mechanic-run.ts` — TypeScript runtime module for mechanic run.
- `scripts/gameengin/package-cartridge.ts` — TypeScript runtime module for package cartridge.
- `scripts/gameengin/prophet-run.ts` — TypeScript runtime module for prophet run.
- `scripts/gameengin/upgrader-run.ts` — TypeScript runtime module for upgrader run.
- `scripts/gameengin/writer-run.ts` — TypeScript runtime module for writer run.
- `scripts/generate-mobile-nextgen-spec.mjs` — JavaScript tooling/runtime script for generate mobile nextgen spec.
- `scripts/generate-mobile-ps5-spec.mjs` — JavaScript tooling/runtime script for generate mobile ps5 spec.
- `scripts/generate-webapp-final-form.mjs` — JavaScript tooling/runtime script for generate webapp final form.
- `scripts/law-check.sh` — Project file used by this subsystem (sh).
- `scripts/migrate-imports.sh` — Project file used by this subsystem (sh).
- `scripts/optimize-dreamengin.mjs` — JavaScript tooling/runtime script for optimize dreamengin.
- `scripts/postbuild.js` — JavaScript tooling/runtime script for postbuild.
- `scripts/postbuild.ts` — TypeScript runtime module for postbuild.
- `scripts/repository-state-analysis-section.mjs` — JavaScript tooling/runtime script for repository state analysis section.
- `scripts/score-pass.cjs` — JavaScript tooling/runtime script for score pass.
- `scripts/setup-database.sql` — Database schema or migration for setup database.
- `scripts/spec-check.cjs` — JavaScript tooling/runtime script for spec check.
- `scripts/sync-build-memory.mjs` — JavaScript tooling/runtime script for sync build memory.
- `scripts/ui-ux-agent.py` — Python automation script for ui ux agent.
- `scripts/update-bugs.mjs` — JavaScript tooling/runtime script for update bugs.
- `scripts/update-embed-feed.mjs` — JavaScript tooling/runtime script for update embed feed.
- `scripts/update-handoff.mjs` — JavaScript tooling/runtime script for update handoff.
- `scripts/update-readme-status-utils.mjs` — JavaScript tooling/runtime script for update readme status utils.
- `scripts/update-readme.mjs` — JavaScript tooling/runtime script for update readme.
- `scripts/validate-schema-sync.sh` — Project file used by this subsystem (sh).
- `scripts/vercel-ignore.cjs` — JavaScript tooling/runtime script for vercel ignore.
- `scripts/vercel-preflight.cjs` — JavaScript tooling/runtime script for vercel preflight.
- `supabase/config.toml` — Tooling configuration for config.
- `supabase/migrations/20240120000000_initial_schema.sql` — Database schema or migration for 20240120000000 initial schema.
- `supabase/migrations/20240120000001_enable_rls.sql` — Database schema or migration for 20240120000001 enable rls.
- `supabase/migrations/20260129000000_upgrade_schema.sql` — Database schema or migration for 20260129000000 upgrade schema.
- `supabase/migrations/20260210000000_widget_system_v2.sql` — Database schema or migration for 20260210000000 widget system v2.
- `supabase/migrations/20260210000001_ai_system_v2026.sql` — Database schema or migration for 20260210000001 ai system v2026.
- `supabase/migrations/20260210_ai_core.sql` — Database schema or migration for 20260210 ai core.
- `supabase/migrations/20260214000000_security_axioms.sql` — Database schema or migration for 20260214000000 security axioms.
- `supabase/migrations/20260226000000_admin_lock.sql` — Database schema or migration for 20260226000000 admin lock.
- `supabase/migrations/20260305000000_create_notes.sql` — Database schema or migration for 20260305000000 create notes.
- `supabase/migrations/20260305000001_comments.sql` — Database schema or migration for 20260305000001 comments.
- `supabase/migrations/20260305000002_leaderboard.sql` — Database schema or migration for 20260305000002 leaderboard.
- `supabase/migrations/20260307000000_readme_gaps.sql` — Database schema or migration for 20260307000000 readme gaps.
- `supabase/migrations/20260307000001_conversations_messages.sql` — Database schema or migration for 20260307000001 conversations messages.
- `supabase/migrations/20260310000000_widget_instances_visibility.sql` — Database schema or migration for 20260310000000 widget instances visibility.
- `supabase/migrations/20260310000001_profiles_widget_config.sql` — Database schema or migration for 20260310000001 profiles widget config.
- `supabase/migrations/20260310000002_profile_dream_widgets.sql` — Database schema or migration for 20260310000002 profile widgets.
- `supabase/migrations/20260310000003_connector_accounts.sql` — Database schema or migration for 20260310000003 connector accounts.
- `supabase/migrations/20260310000004_feed_items.sql` — Database schema or migration for 20260310000004 feed items.
- `supabase/migrations/20260310000010_dreamdm_bar_pass2.sql` — Database schema or migration for 20260310000010 dreamdm bar pass2.
- `supabase/migrations/20260315000000_content_drafts.sql` — Database schema or migration for 20260315000000 content drafts.
- `supabase/migrations/20260316000000_visibility_mappings.sql` — Database schema or migration for 20260316000000 visibility mappings.
- `supabase/migrations/20260319000000_journey_dots.sql` — Database schema or migration for 20260319000000 journey dots.
- `supabase/migrations/20260319065444_new-migration.sql` — Database schema or migration for 20260319065444 new migration.
- `supabase/migrations/20260319120000_connector_accounts_schema_reload.sql` — Database schema or migration for 20260319120000 connector accounts schema reload.
- `supabase/migrations/20260320000000_scheduled_posts.sql` — Database schema or migration for 20260320000000 scheduled posts.
- `supabase/migrations/20260320100000_game_scores_all_games.sql` — Database schema or migration for 20260320100000 game scores all games.
- `supabase/migrations/20260320110000_user_blocks.sql` — Database schema or migration for 20260320110000 user blocks.
- `supabase/migrations/20260321000000_ads_platform_promotions.sql` — Database schema or migration for 20260321000000 ads platform promotions.
- `supabase/migrations/20260321200000_phase8a_feed_and_layout.sql` — Database schema or migration for 20260321200000 phase8a feed and layout.
- `supabase/migrations/20260322000000_phase8b_dream_windows.sql` — Database schema or migration for 20260322000000 phase8b windows.
- `supabase/migrations/20260322000000_policy_events.sql` — Database schema or migration for 20260322000000 policy events.
- `supabase/migrations/20260322000001_message_boards.sql` — Database schema or migration for 20260322000001 message boards.
- `supabase/migrations/20260323100000_embed_feed_items.sql` — Database schema or migration for 20260323100000 embed feed items.
- `supabase/migrations/20260324000000_phase8e_orders.sql` — Database schema or migration for 20260324000000 phase8e orders.
- `supabase/migrations/20260324000001_phase8e_shop_marketplace.sql` — Database schema or migration for 20260324000001 phase8e shop marketplace.
- `supabase/migrations/20260325000000_phase8f_daydream_network.sql` — Database schema or migration for 20260325000000 phase8f daynetwork.
- `supabase/migrations/20260325100000_child_safety.sql` — Database schema or migration for 20260325100000 child safety.
- `supabase/migrations/20260401000001_platform_utilities.sql` — Database schema or migration for 20260401000001 platform utilities.
- `supabase/migrations/20260402000001_control_mappings.sql` — Database schema or migration for 20260402000001 control mappings.
- `supabase/migrations/20260402000002_game_assets.sql` — Database schema or migration for 20260402000002 game assets.
- `supabase/migrations/20260403000001_pgvector_embeddings.sql` — Database schema or migration for 20260403000001 pgvector embeddings.
- `supabase/migrations/20260403000002_pgvector_search_rpc.sql` — Database schema or migration for 20260403000002 pgvector search rpc.
- `supabase/migrations/20260405000001_dreamr_feed_registry.sql` — Database schema or migration for 20260405000001 dreamr feed registry.
- `supabase/migrations/20260405042406_auto_scaffold.sql` — Database schema or migration for 20260405042406 auto scaffold.
- `supabase/migrations/20260413000000_phase9_activity_first_protocol.sql` — Database schema or migration for 20260413000000 phase9 activity first protocol.
- `supabase/migrations/20260417000000_repurpose_nods_as_dream_docs.sql` — Database schema or migration for 20260417000000 repurpose nods as docs.
- `supabase/migrations/20260417000001_dream_docs_search_rpc.sql` — Database schema or migration for 20260417000001 docs search rpc.
- `supabase/migrations/20260418000000_gameengin_core.sql` — Database schema or migration for 20260418000000 gameengin core.
- `supabase/migrations/20260420000001_consent_settings_audit.sql` — Database schema or migration for 20260420000001 consent settings audit.
- `supabase/migrations/20260426000000_activity_coop_gameengin_completion.sql` — Database schema or migration for 20260426000000 activity coop gameengin completion.
- `supabase/migrations/20260426000100_rename_widgets_to_dreams.sql` — Database schema or migration for 20260426000100 rename widgets to dreams.
- `supabase/migrations/20260426000200_build_memory_schema_gaps.sql` — Database schema or migration for 20260426000200 build memory schema gaps.
- `supabase/schema-final.sql` — Database schema or migration for schema final.
- `supabase/seed.sql` — Database schema or migration for seed.
- `terraform/main.tf` — Project file used by this subsystem (tf).
- `vercel.json` — Structured data/config for vercel.

</details>
## Testing
Testing uses Vitest (`pnpm test`) for unit/integration suites and Playwright config for browser e2e (`tests/e2e`). `pnpm preflight` runs typecheck + lint + test:ci for CI/local gatekeeping.

Pre-existing note from repo docs: historical failures in `tests/dreamdm-bar-interactions.test.ts` are documented in governance docs; treat them as known context when comparing across commits.
#### Testing files file structure
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
│   ├── ledger-media.test.ts
│   ├── live-feed.test.ts
│   ├── madmaxi-authored-levels.test.ts
│   ├── madmaxi-mechanics.test.ts
│   ├── mobile-game-controls.test.ts
│   ├── modular-os-stores.test.ts
│   ├── module-registry.test.ts
│   ├── music-starmaker-section10.test.ts
│   ├── namespace-isolation.test.ts
│   ├── navigation
│   │   ├── manifold-physics.spec.ts
│   │   ├── navigation.spec.ts
│   │   └── quaternion.spec.ts
│   ├── neural-seam-flow.test.ts
│   ├── notifications.test.ts
│   ├── offline-queue.test.ts
│   ├── optimizer.test.ts
│   ├── os-subsystem-manifest.test.ts
│   ├── page-surface-wiring.test.ts
│   ├── phase6-privacy-idari.test.ts
│   ├── phase7-naming.test.ts
│   ├── phase8a.test.ts
│   ├── phase8b-dream-windows.test.ts
│   ├── phase8e-orders.test.ts
│   ├── phase8e-shop-marketplace.test.ts
│   ├── phase8f-daydream-activation.test.ts
│   ├── phase8f-daydream-network.test.ts
│   ├── phase8g-dual-runtime-persistence.test.ts
│   ├── phase8h-triad-consensus.test.ts
│   ├── phase8i-settings-persistence.test.ts
│   ├── phase9-adaptive-quality.test.ts
│   ├── phase9-cross-post.test.ts
│   ├── phase9-drag-drop.test.ts
│   ├── phase9-hashtags.test.ts
│   ├── phase9-notifications.test.ts
│   ├── phase9-offline-cache.test.ts
│   ├── phase9-scene-state.test.ts
│   ├── phase9-touch-gestures.test.ts
│   ├── platform-utils.test.ts
│   ├── post-media.test.ts
│   ├── post-view-counting.test.ts
│   ├── product-law-principle10-alignment.test.ts
│   ├── profile-avatar-edit-entrypoints.test.ts
│   ├── rate-limiting.test.ts
│   ├── readme-homedream-system.test.ts
│   ├── readme-section13-code-codeengin.test.ts
│   ├── readme-section6-homedream.test.ts
│   ├── report-driven-game-agent.test.ts
│   ├── repository-state-analysis-section.test.ts
│   ├── responsive.test.ts
│   ├── rss-feed.test.ts
│   ├── runtime-channel.test.ts
│   ├── runtime-container.test.ts
│   ├── runtime-viewport.test.ts
│   ├── runtime-wiring.test.ts
│   ├── safe-get-user.test.ts
│   ├── seam-clipboard.test.ts
│   ├── session-continuity.test.ts
│   ├── session-pattern-engine.test.ts
│   ├── skip-credits.test.ts
│   ├── social-feed.test.ts
│   ├── social-platforms.test.ts
│   ├── spec35-vm-bus-events.test.ts
│   ├── spec36-bot-detection.test.ts
│   ├── spec37-torridity.test.ts
│   ├── spec38-collaboration.test.ts
│   ├── spec41-engine-builder.test.ts
│   ├── starmaker-music.test.ts
│   ├── structure-ledger.test.ts
│   ├── supabase-env.test.ts
│   ├── swap-manager-extended.test.ts
│   ├── swipe-calibration.test.ts
│   ├── tech-foundation.test.ts
│   ├── torridity-ledger.test.ts
│   ├── universal-asset-registry.test.ts
│   ├── universal-visual-modularity.test.ts
│   ├── update-readme-current-status.test.ts
│   ├── user-sim.test.ts
│   ├── utils-extended.test.ts
│   ├── utils-supabase-server.test.ts
│   ├── v2-readiness.test.ts
│   ├── view-profile-public-view-controls.test.ts
│   ├── warp-engine.test.ts
│   ├── wasm-gpu-vm.test.ts
│   ├── webgpu-director.test.ts
│   ├── widget-install-flow.test.ts
│   └── youtube-provider.test.ts
└── vitest.config.ts
```
<details><summary>Testing files file index (204 files)</summary>

- `playwright.config.ts` — TypeScript runtime module for playwright config.
- `tests/DUALSENSE_TEST_PLAN.md` — Documentation/spec for DUALSENSE TEST PLAN.
- `tests/activity-first-protocol.test.ts` — TypeScript runtime module for activity first protocol test.
- `tests/activity-revenue-split.test.ts` — TypeScript runtime module for activity revenue split test.
- `tests/admin-lockout.test.ts` — TypeScript runtime module for admin lockout test.
- `tests/admin-upgrade-readiness.test.ts` — TypeScript runtime module for admin upgrade readiness test.
- `tests/agent-bus-consensus.test.ts` — TypeScript runtime module for agent bus consensus test.
- `tests/ai-edit-engine.test.ts` — TypeScript runtime module for ai edit engine test.
- `tests/api-route-body-guard.test.ts` — TypeScript runtime module for api route body guard test.
- `tests/asset-optimizer.test.ts` — TypeScript runtime module for asset optimizer test.
- `tests/auth-providers-route.test.ts` — TypeScript runtime module for auth providers route test.
- `tests/auth-update-password-page.test.ts` — TypeScript runtime module for auth update password page test.
- `tests/authenticated-ui-shells.test.ts` — TypeScript runtime module for authenticated ui shells test.
- `tests/babylon-optimizero.test.ts` — TypeScript runtime module for babylon optimizero test.
- `tests/babylon-webgpu-engine.test.ts` — TypeScript runtime module for babylon webgpu engine test.
- `tests/bar-hide-preserves-both-runtimes.test.ts` — TypeScript runtime module for bar hide preserves both runtimes test.
- `tests/boogie-policy-module.test.ts` — TypeScript runtime module for boogie policy module test.
- `tests/boogieman.test.ts` — TypeScript runtime module for boogieman test.
- `tests/bot-detector.test.ts` — TypeScript runtime module for bot detector test.
- `tests/branding-logos.test.ts` — TypeScript runtime module for branding logos test.
- `tests/canonical-naming-enforcement.test.ts` — TypeScript runtime module for canonical naming enforcement test.
- `tests/child-safety.test.ts` — TypeScript runtime module for child safety test.
- `tests/code-dream-preview.test.ts` — TypeScript runtime module for code dream preview test.
- `tests/coercion-table.test.ts` — TypeScript runtime module for coercion table test.
- `tests/collector-extended.test.ts` — TypeScript runtime module for collector extended test.
- `tests/compositeengin-features.test.ts` — TypeScript runtime module for compositeengin features test.
- `tests/conform-memory-map.test.ts` — TypeScript runtime module for conform memory map test.
- `tests/connector-delivery.test.ts` — TypeScript runtime module for connector delivery test.
- `tests/connectors.test.ts` — TypeScript runtime module for connectors test.
- `tests/content-intelligence-routes.test.ts` — TypeScript runtime module for content intelligence routes test.
- `tests/content-publish-intent.test.ts` — TypeScript runtime module for content publish intent test.
- `tests/contentengin-features.test.ts` — TypeScript runtime module for contentengin features test.
- `tests/contextual-home.test.ts` — TypeScript runtime module for contextual home test.
- `tests/creative-optimizero.test.ts` — TypeScript runtime module for creative optimizero test.
- `tests/data-transform-extended.test.ts` — TypeScript runtime module for data transform extended test.
- `tests/data-transform.test.ts` — TypeScript runtime module for data transform test.
- `tests/daydream-engin-routes.test.ts` — TypeScript runtime module for daydream engin routes test.
- `tests/decide-bar-release.test.ts` — TypeScript runtime module for decide bar release test.
- `tests/dev-bypass.test.ts` — TypeScript runtime module for dev bypass test.
- `tests/diff-viewer.test.ts` — TypeScript runtime module for diff viewer test.
- `tests/dr-eams-code-assist.test.ts` — TypeScript runtime module for dr eams code assist test.
- `tests/dr-eams-search-bar.test.ts` — TypeScript runtime module for dr eams search bar test.
- `tests/dream-bar-context.test.ts` — TypeScript runtime module for dream bar context test.
- `tests/dream-continuity-spine.test.ts` — TypeScript runtime module for dream continuity spine test.
- `tests/dream-effects.test.ts` — TypeScript runtime module for dream effects test.
- `tests/dream-os-bus.test.ts` — TypeScript runtime module for dream os bus test.
- `tests/dream-state.test.ts` — TypeScript runtime module for dream state test.
- `tests/dream-window-system.test.ts` — TypeScript runtime module for dream window system test.
- `tests/dreamdm-bar-intent.test.ts` — TypeScript runtime module for dreamdm bar intent test.
- `tests/dreamdm-bar-interactions.test.ts` — TypeScript runtime module for dreamdm bar interactions test.
- `tests/dreamdm-bar-wild.test.ts` — TypeScript runtime module for dreamdm bar wild test.
- `tests/dreamdm-draft.test.ts` — TypeScript runtime module for dreamdm draft test.
- `tests/dreamdm-messaging-phase2.test.ts` — TypeScript runtime module for dreamdm messaging phase2 test.
- `tests/dreamengin-os.test.ts` — TypeScript runtime module for dreamengin os test.
- `tests/dreamnav.tau.test.ts` — TypeScript runtime module for dreamnav tau test.
- `tests/dreamr-algorithm-velocity.test.ts` — TypeScript runtime module for dreamr algorithm velocity test.
- `tests/dreamr-algorithm.test.ts` — TypeScript runtime module for dreamr algorithm test.
- `tests/dreamr-feed-limits.test.ts` — TypeScript runtime module for dreamr feed limits test.
- `tests/dreamr-feed-topics.test.ts` — TypeScript runtime module for dreamr feed topics test.
- `tests/dreamr-page-route.test.ts` — TypeScript runtime module for dreamr page route test.
- `tests/dreamr-swipe-personalization.test.ts` — TypeScript runtime module for dreamr swipe personalization test.
- `tests/dreamr-visibility-cursor.test.ts` — TypeScript runtime module for dreamr visibility cursor test.
- `tests/dreamspace-panel.test.ts` — TypeScript runtime module for dreamspace panel test.
- `tests/drop-target-registry.test.ts` — TypeScript runtime module for drop target registry test.
- `tests/dual-runtime-bridge-peer-activity.test.ts` — TypeScript runtime module for dual runtime bridge peer activity test.
- `tests/durable-bridge.test.ts` — TypeScript runtime module for durable bridge test.
- `tests/e2e/demo.spec.ts` — TypeScript runtime module for demo spec.
- `tests/e2e/full-coverage.spec.ts` — TypeScript runtime module for full coverage spec.
- `tests/edit-profiledream-section7.test.ts` — TypeScript runtime module for edit profiledream section7 test.
- `tests/engin-dispatcher.test.ts` — TypeScript runtime module for engin dispatcher test.
- `tests/engin-runtime-core.test.ts` — TypeScript runtime module for engin runtime core test.
- `tests/engin-workflow.test.ts` — TypeScript runtime module for engin workflow test.
- `tests/enginpipe/manifest.test.ts` — TypeScript runtime module for manifest test.
- `tests/enginpipe/telemetry.test.ts` — TypeScript runtime module for telemetry test.
- `tests/enginpipe/tiers.test.ts` — TypeScript runtime module for tiers test.
- `tests/example.spec.ts` — TypeScript runtime module for example spec.
- `tests/export-full-code.test.ts` — TypeScript runtime module for export full code test.
- `tests/feature-build.test.ts` — TypeScript runtime module for feature build test.
- `tests/forge-build.test.ts` — TypeScript runtime module for forge build test.
- `tests/forge-engin.test.ts` — TypeScript runtime module for forge test.
- `tests/forge-momentum.test.ts` — TypeScript runtime module for forge momentum test.
- `tests/forge-nexus.test.ts` — TypeScript runtime module for forge nexus test.
- `tests/forge-rituals.test.ts` — TypeScript runtime module for forge rituals test.
- `tests/fusion-cartridges-depth.test.ts` — TypeScript runtime module for fusion cartridges depth test.
- `tests/fusion-cartridges.test.ts` — TypeScript runtime module for fusion cartridges test.
- `tests/game-controller.test.ts` — TypeScript runtime module for game controller test.
- `tests/game-engin-ruleset.test.ts` — TypeScript runtime module for game engin ruleset test.
- `tests/game-navigation.test.ts` — TypeScript runtime module for game navigation test.
- `tests/game-performance-baseline.test.ts` — TypeScript runtime module for game performance baseline test.
- `tests/game-quality-plan.test.ts` — TypeScript runtime module for game quality plan test.
- `tests/game-remote-regression.test.ts` — TypeScript runtime module for game remote regression test.
- `tests/gameengin-architect.test.ts` — TypeScript runtime module for gameengin architect test.
- `tests/gameengin-cartridges.test.ts` — TypeScript runtime module for gameengin cartridges test.
- `tests/gameengin-crash-modal.test.ts` — TypeScript runtime module for gameengin crash modal test.
- `tests/gameengin-loop.test.ts` — TypeScript runtime module for gameengin loop test.
- `tests/gameengin-power-systems.test.ts` — TypeScript runtime module for gameengin power systems test.
- `tests/gameengin-progression.test.ts` — TypeScript runtime module for gameengin progression test.
- `tests/gameengin-remote.test.ts` — TypeScript runtime module for gameengin remote test.
- `tests/gameengin-spec.test.ts` — TypeScript runtime module for gameengin spec test.
- `tests/games-daydream-page-auth.test.ts` — TypeScript runtime module for games daydream page auth test.
- `tests/god-tier-engine.test.ts` — TypeScript runtime module for god tier engine test.
- `tests/hero-sprite.test.ts` — TypeScript runtime module for hero sprite test.
- `tests/home-feed-home.test.ts` — TypeScript runtime module for home feed home test.
- `tests/homedream-page-auth.test.ts` — TypeScript runtime module for homedream page auth test.
- `tests/icons.test.ts` — TypeScript runtime module for icons test.
- `tests/idari-admin-guard.test.ts` — TypeScript runtime module for idari admin guard test.
- `tests/idari-observability-loop.test.ts` — TypeScript runtime module for idari observability loop test.
- `tests/idari-patch-plan.test.ts` — TypeScript runtime module for idari patch plan test.
- `tests/instance-manager.test.ts` — TypeScript runtime module for instance manager test.
- `tests/integration-wiring.test.ts` — TypeScript runtime module for integration wiring test.
- `tests/is-auth-related-error.test.ts` — TypeScript runtime module for is auth related error test.
- `tests/journey-insights.test.ts` — TypeScript runtime module for journey insights test.
- `tests/journey.test.ts` — TypeScript runtime module for journey test.
- `tests/lab-dream-split.test.ts` — TypeScript runtime module for lab dream split test.
- `tests/lab-section-12-spec.test.ts` — TypeScript runtime module for lab section 12 spec test.
- `tests/landing-calibration.test.ts` — TypeScript runtime module for landing calibration test.
- `tests/landing-mission-link.test.ts` — TypeScript runtime module for landing mission link test.
- `tests/ledger-media.test.ts` — TypeScript runtime module for ledger media test.
- `tests/live-feed.test.ts` — TypeScript runtime module for live feed test.
- `tests/madmaxi-authored-levels.test.ts` — TypeScript runtime module for madmaxi authored levels test.
- `tests/madmaxi-mechanics.test.ts` — TypeScript runtime module for madmaxi mechanics test.
- `tests/mobile-game-controls.test.ts` — TypeScript runtime module for mobile game controls test.
- `tests/modular-os-stores.test.ts` — TypeScript runtime module for modular os stores test.
- `tests/module-registry.test.ts` — TypeScript runtime module for module registry test.
- `tests/music-starmaker-section10.test.ts` — TypeScript runtime module for music starmaker section10 test.
- `tests/namespace-isolation.test.ts` — TypeScript runtime module for namespace isolation test.
- `tests/navigation/manifold-physics.spec.ts` — TypeScript runtime module for manifold physics spec.
- `tests/navigation/navigation.spec.ts` — TypeScript runtime module for navigation spec.
- `tests/navigation/quaternion.spec.ts` — TypeScript runtime module for quaternion spec.
- `tests/neural-seam-flow.test.ts` — TypeScript runtime module for neural seam flow test.
- `tests/notifications.test.ts` — TypeScript runtime module for notifications test.
- `tests/offline-queue.test.ts` — TypeScript runtime module for offline queue test.
- `tests/optimizer.test.ts` — TypeScript runtime module for optimizer test.
- `tests/os-subsystem-manifest.test.ts` — TypeScript runtime module for os subsystem manifest test.
- `tests/page-surface-wiring.test.ts` — TypeScript runtime module for page surface wiring test.
- `tests/phase6-privacy-idari.test.ts` — TypeScript runtime module for phase6 privacy idari test.
- `tests/phase7-naming.test.ts` — TypeScript runtime module for phase7 naming test.
- `tests/phase8a.test.ts` — TypeScript runtime module for phase8a test.
- `tests/phase8b-dream-windows.test.ts` — TypeScript runtime module for phase8b dream windows test.
- `tests/phase8e-orders.test.ts` — TypeScript runtime module for phase8e orders test.
- `tests/phase8e-shop-marketplace.test.ts` — TypeScript runtime module for phase8e shop marketplace test.
- `tests/phase8f-daydream-activation.test.ts` — TypeScript runtime module for phase8f daydream activation test.
- `tests/phase8f-daydream-network.test.ts` — TypeScript runtime module for phase8f daydream network test.
- `tests/phase8g-dual-runtime-persistence.test.ts` — TypeScript runtime module for phase8g dual runtime persistence test.
- `tests/phase8h-triad-consensus.test.ts` — TypeScript runtime module for phase8h triad consensus test.
- `tests/phase8i-settings-persistence.test.ts` — TypeScript runtime module for phase8i settings persistence test.
- `tests/phase9-adaptive-quality.test.ts` — TypeScript runtime module for phase9 adaptive quality test.
- `tests/phase9-cross-post.test.ts` — TypeScript runtime module for phase9 cross post test.
- `tests/phase9-drag-drop.test.ts` — TypeScript runtime module for phase9 drag drop test.
- `tests/phase9-hashtags.test.ts` — TypeScript runtime module for phase9 hashtags test.
- `tests/phase9-notifications.test.ts` — TypeScript runtime module for phase9 notifications test.
- `tests/phase9-offline-cache.test.ts` — TypeScript runtime module for phase9 offline cache test.
- `tests/phase9-scene-state.test.ts` — TypeScript runtime module for phase9 scene state test.
- `tests/phase9-touch-gestures.test.ts` — TypeScript runtime module for phase9 touch gestures test.
- `tests/platform-utils.test.ts` — TypeScript runtime module for platform utils test.
- `tests/post-media.test.ts` — TypeScript runtime module for post media test.
- `tests/post-view-counting.test.ts` — TypeScript runtime module for post view counting test.
- `tests/product-law-principle10-alignment.test.ts` — TypeScript runtime module for product law principle10 alignment test.
- `tests/profile-avatar-edit-entrypoints.test.ts` — TypeScript runtime module for profile avatar edit entrypoints test.
- `tests/rate-limiting.test.ts` — TypeScript runtime module for rate limiting test.
- `tests/readme-homedream-system.test.ts` — TypeScript runtime module for readme homedream system test.
- `tests/readme-section13-code-codeengin.test.ts` — TypeScript runtime module for readme section13 code codetest.
- `tests/readme-section6-homedream.test.ts` — TypeScript runtime module for readme section6 hometest.
- `tests/report-driven-game-agent.test.ts` — TypeScript runtime module for report driven game agent test.
- `tests/repository-state-analysis-section.test.ts` — TypeScript runtime module for repository state analysis section test.
- `tests/responsive.test.ts` — TypeScript runtime module for responsive test.
- `tests/rss-feed.test.ts` — TypeScript runtime module for rss feed test.
- `tests/runtime-channel.test.ts` — TypeScript runtime module for runtime channel test.
- `tests/runtime-container.test.ts` — TypeScript runtime module for runtime container test.
- `tests/runtime-viewport.test.ts` — TypeScript runtime module for runtime viewport test.
- `tests/runtime-wiring.test.ts` — TypeScript runtime module for runtime wiring test.
- `tests/safe-get-user.test.ts` — TypeScript runtime module for safe get user test.
- `tests/seam-clipboard.test.ts` — TypeScript runtime module for seam clipboard test.
- `tests/session-continuity.test.ts` — TypeScript runtime module for session continuity test.
- `tests/session-pattern-engine.test.ts` — TypeScript runtime module for session pattern engine test.
- `tests/skip-credits.test.ts` — TypeScript runtime module for skip credits test.
- `tests/social-feed.test.ts` — TypeScript runtime module for social feed test.
- `tests/social-platforms.test.ts` — TypeScript runtime module for social platforms test.
- `tests/spec35-vm-bus-events.test.ts` — TypeScript runtime module for spec35 vm bus events test.
- `tests/spec36-bot-detection.test.ts` — TypeScript runtime module for spec36 bot detection test.
- `tests/spec37-torridity.test.ts` — TypeScript runtime module for spec37 torridity test.
- `tests/spec38-collaboration.test.ts` — TypeScript runtime module for spec38 collaboration test.
- `tests/spec41-engine-builder.test.ts` — TypeScript runtime module for spec41 engine builder test.
- `tests/starmaker-music.test.ts` — TypeScript runtime module for starmaker music test.
- `tests/structure-ledger.test.ts` — TypeScript runtime module for structure ledger test.
- `tests/supabase-env.test.ts` — TypeScript runtime module for supabase env test.
- `tests/swap-manager-extended.test.ts` — TypeScript runtime module for swap manager extended test.
- `tests/swipe-calibration.test.ts` — TypeScript runtime module for swipe calibration test.
- `tests/tech-foundation.test.ts` — TypeScript runtime module for tech foundation test.
- `tests/torridity-ledger.test.ts` — TypeScript runtime module for torridity ledger test.
- `tests/universal-asset-registry.test.ts` — TypeScript runtime module for universal asset registry test.
- `tests/universal-visual-modularity.test.ts` — TypeScript runtime module for universal visual modularity test.
- `tests/update-readme-current-status.test.ts` — TypeScript runtime module for update readme current status test.
- `tests/user-sim.test.ts` — TypeScript runtime module for user sim test.
- `tests/utils-extended.test.ts` — TypeScript runtime module for utils extended test.
- `tests/utils-supabase-server.test.ts` — TypeScript runtime module for utils supabase server test.
- `tests/v2-readiness.test.ts` — TypeScript runtime module for v2 readiness test.
- `tests/view-profile-public-view-controls.test.ts` — TypeScript runtime module for view profile public view controls test.
- `tests/warp-engine.test.ts` — TypeScript runtime module for warp engine test.
- `tests/wasm-gpu-vm.test.ts` — TypeScript runtime module for wasm gpu vm test.
- `tests/webgpu-director.test.ts` — TypeScript runtime module for webgpu director test.
- `tests/widget-install-flow.test.ts` — TypeScript runtime module for widget install flow test.
- `tests/youtube-provider.test.ts` — TypeScript runtime module for youtube provider test.
- `vitest.config.ts` — TypeScript runtime module for vitest config.

</details>
## Getting Started
1. **Install prerequisites**: Node 24 + corepack.
2. **Install dependencies**: `pnpm install`.
3. **Environment setup**: copy `.env.example` to `.env.local` and fill values (or start from `.env.local.example`).
4. **Run dev server**: `pnpm dev`.
5. **Quality checks**: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm preflight`.
6. **Build/start production mode locally**: `pnpm build` then `pnpm start`.

### Available scripts (from `package.json`)
```bash
pnpm dev  # next dev
pnpm build  # next build
pnpm vercel-build  # next build
pnpm start  # next start
pnpm lint  # eslint .
pnpm typecheck  # tsc --noEmit
pnpm test  # vitest run
pnpm test:ci  # vitest run
pnpm test:watch  # vitest
pnpm build-memory:sync  # node scripts/sync-build-memory.mjs
pnpm build-memory:check  # node scripts/check-build-memory-drift.mjs
pnpm check:root-hygiene  # node scripts/check-root-hygiene.mjs
pnpm check:engin-filenames  # node scripts/check-engin-filenames.mjs
pnpm full-code:export  # node scripts/export-full-code.mjs
pnpm repo-state  # node scripts/analyze-repo-state.mjs
pnpm preflight  # node scripts/vercel-preflight.cjs . && pnpm run check:root-hygiene && node scripts/spec-check.cjs . && node scripts/check-engin-filenames.mjs && pnpm run typecheck && pnpm run lint && pnpm run test:ci
pnpm build:gamesengin  # tsc --project tsconfig.gamesengin.json --noEmit
pnpm build:games  # tsc --project tsconfig.games.json --noEmit
pnpm test:games  # vitest run tests/game-navigation.test.ts tests/game-remote-regression.test.ts tests/game-quality-plan.test.ts tests/report-driven-game-agent.test.ts
pnpm asbuild:debug  # asc assembly/index.ts --target debug --exportRuntime --enable simd --outFile public/workers/engin-shader.wasm
pnpm asbuild:release  # asc assembly/index.ts --target release --optimize --enable simd --outFile public/workers/engin-shader.wasm
pnpm asbuild:mad-maxi  # asc assembly/mad-maxi-player.ts -o public/cartridges/mad-maxi/logic/main.wasm --optimizeLevel 3 --shrinkLevel 2 --enable simd --enable bulk-memory
pnpm gameengin:maestro  # tsx scripts/gameengin/maestro-analyze.ts
pnpm gameengin:prophet  # tsx scripts/gameengin/prophet-run.ts
pnpm gameengin:mechanic  # tsx scripts/gameengin/mechanic-run.ts
pnpm gameengin:artisan  # tsx scripts/gameengin/artisan-run.ts
pnpm gameengin:writer  # tsx scripts/gameengin/writer-run.ts
pnpm gameengin:upgrader  # tsx scripts/gameengin/upgrader-run.ts
pnpm gameengin:package  # tsx scripts/gameengin/package-cartridge.ts
```
## Environment Variables
Environment variables are documented in `.env.example` and grouped by: Supabase public keys + project-prefixed keys, Postgres connection strings, AI providers, YouTube APIs, admin/session security, owner identity, OAuth connectors, Instagram connector, observability, and local-only auth bypass flags.

Use `.env.example` as the source of truth for the complete list and `.env.local.example` for local development defaults. Never commit secrets.
## Contributing
- Read `AGENTS.md` for repository operating law and architecture rules.
- Read `.cursorrules` for the enforced engine/rule-set discipline.
- Review `CHANGELOG.md` for release-level behavior changes.
- Review `REPO_STATE.md` for generated repository inventory/metrics.
## License
MIT — see [LICENSE](LICENSE).
