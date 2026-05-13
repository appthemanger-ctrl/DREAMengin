# DREAMengin

**Spatial creative operating environment with one fixed engine + swappable rule-sets.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/) [![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-orange?logo=pnpm)](https://pnpm.io/workspaces) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Live Demo](https://img.shields.io/badge/Live-dreamengin.vercel.app-000?logo=vercel)](https://dreamengin.vercel.app)

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
### Root configuration files
| File | Purpose |
|---|---|
| `package.json` | Workspace manifest for the Next.js 16 app, scripts (`preflight`, `build:games*`, `asbuild:*`), and dependency graph for runtime + tooling. |
| `pnpm-workspace.yaml` | pnpm workspace/build policy file; allows only `esbuild` postinstall builds and marks `sharp`/`unrs-resolver` as ignored built dependencies. |
| `next.config.mjs` | Next.js runtime config: PPR via `cacheComponents`, CSP/COOP/COEP headers, image remote patterns (Supabase/YouTube/Spotify), route redirects, and output file tracing exclusions for agent/session APIs. |
| `tailwind.config.ts` | Tailwind token layer for DREAMengin visual language (Dream sky/gold palettes, neumorphic shadows, motion keyframes, shell gradients). |
| `tsconfig.json` | Primary TypeScript config for App Router code (`@/*` alias, WebGPU types, strict/noEmit, Next plugin, and excludes for tests/assembly). |
| `tsconfig.games.json` | Isolated TS project for games/daydream game routes plus `lib/games` and game-score APIs. |
| `tsconfig.gamesengin.json` | Narrower TS project for the games subsystem core paths used by GameEngin runtime validation. |
| `playwright.config.ts` | E2E runner config (`tests/e2e`) with Chromium + iPhone WebKit projects and local web server boot on port 3000. |
| `vitest.config.ts` | Unit/integration test config (Node environment, `**/*.test.ts` include set, path alias for `@`, Playwright exclusion). |
| `vercel.json` | Vercel deployment config: pnpm install/build commands, cron routes (`/api/health`, `/api/connectors/cron`), and function duration limits for AI/connectors/upload endpoints. |
| `eslint.config.mjs` | Flat ESLint 9 config for Next 16 with repo-specific ignores, warning-level policy, and DreamDM tap-discipline restrictions. |
| `.gitleaks.toml` | Secret-scanning rules extending default detectors with repo-specific allowlists (`docs/`, `public/`, lockfile UUID noise). |
| `postcss.config.js` | PostCSS loader entry used by CSS build chain compatibility paths. |
| `postcss.config.mjs` | ESM variant of PostCSS config used by modern toolchains in the workspace. |
| `.env.example` | Canonical environment contract documenting Supabase/auth/AI/admin/connector/observability variables and production safety notes. |
| `.env.local.example` | Local-first environment starter (dev auth bypass, local Supabase placeholders, YouTube key example). |
| `next-env.d.ts` | Next.js-generated TypeScript environment declarations for the App Router build. |
| `tailwindcss-animate.d.ts` | Type definitions for `tailwindcss-animate` plugin usage in typed UI code. |

### Top-level directories
| Directory | Purpose |
|---|---|
| `.ci/` | Generated CI snapshot artifacts used by internal automation/state diff reporting. |
| `.github/` | Workflow automation, issue triage packs, custom agent definitions, and reusable setup actions. |
| `.husky/` | Git hook entrypoints (`pre-commit` lint-staged, `pre-push` preflight). |
| `agents/` | HumanAI persona packs + orchestrator prompts used by runtime/product audit workflows. |
| `app/` | Next.js App Router entrypoint: pages, layouts, and API routes for core product surfaces. |
| `assembly/` | AssemblyScript/WASM sources for engine bus and cartridge worker builds. |
| `backend/` | Secondary Express service stack (social aggregator routes/controllers/services). |
| `build-memory/` | Machine-readable route/action memory snapshots used by automation and audit tooling. |
| `components/` | UI layer: runtime shells, panels, Dream widgets, bars, and engine-facing React modules. |
| `config/` | Optimizer/UI-UX config assets consumed by scripts and automation pipelines. |
| `core/` | Reserved fixed-engine anchor directory for immutable core substrate boundaries. |
| `coresurfaces/` | Canonical profile/edit surface components shared across runtime contexts. |
| `daydreams/` | Standalone daydream routes that expose per-domain surfaces outside normal App Router nesting. |
| `docs/` | Architecture law, protocol specs, security axioms, and system reference documentation. |
| `dr-eams/` | Dr.Eams capability manifests/prompts that map assistant actions to real app routes. |
| `dreamdmbar/` | Persistent DreamDM seam, HomeDream shell surface, and DreamR feed runtime implementation. |
| `engins/` | Concrete Engin implementations (Game, StarMaker, Lab, Code, Branding, Content, Analytics, Forge, Portfolio). |
| `experiments/` | Isolated prototypes and temporary feature experiments kept outside production paths. |
| `frontend/` | Legacy Vite frontend retained for migration compatibility. |
| `grafana/` | Grafana provisioning dashboards/data-source configuration for ops monitoring. |
| `hooks/` | Shared React hooks (runtime, collaboration, feed, UI behavior). |
| `lib/` | Runtime engine logic, domain modules, adapters, channel systems, and persistence utilities. |
| `misc/` | Non-core support files/scripts not owned by another subsystem. |
| `output/` | Generated output artifacts from automation/reporting pipelines. |
| `prometheus/` | Prometheus scrape/alert configuration. |
| `public/` | Public static assets: icons, manifests, wasm workers, cartridges, media placeholders. |
| `research/` | Formal research corpus (Torridity/Ledger equations, data, papers) supporting product algorithms. |
| `research-and-development/` | Long-form R&D drafts and specs separated from shipping architecture docs. |
| `scripts/` | Repository automation scripts (preflight, hygiene checks, code export, analyzers). |
| `src/` | Lower-level rulesets and foundational runtime primitives used by higher-level surfaces. |
| `styles/` | Global style layers (`globals`, `dream-shell`, `home-dream`, transitions). |
| `supabase/` | Database migrations, schema snapshots, and seed assets for Supabase-backed systems. |
| `system/` | System-level glue/archive runtime workflow assets used as infra substrate references. |
| `terraform/` | Infrastructure-as-code root module for deployable cloud resources. |
| `tests/` | Vitest and E2E test suites covering runtime laws, features, and regression behavior. |
| `types/` | Shared type contracts for runtime modules, widgets, ads, marketplaces, and manifests. |
| `utils/` | Generic helper scripts/utilities not specific to a single subsystem. |
| `workflow/` | Archived workflow environment definitions (Docker/config) used by internal pipeline orchestration. |
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

### Custom Engins capability (current state)
Auto-synced from `engins/**`, `components/daydream/**`, `lib/engins/**` using repository introspection.
- Files tracked: **36**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `AutoOpenGameEngin`, `BrandingEngin`, `CodeDreamIDE`, `CodeEngin`, `Constellationmap`, `ContentEngin`, `DiffViewer`, `DreamsurfaceDaydreamAnalyticsDaydream`, +20 more
#### Custom Engins capability (current state) file structure
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
    └── engins
        ├── game
        │   ├── gameEnginRuleSet.ts
        │   ├── index.ts
        │   └── useGameEnginRuntime.ts
        ├── useEnginWorkflow.ts
        └── workflowEngine.ts
```
<details><summary>Custom Engins capability (current state) file index (36 files)</summary>

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
- `lib/engins/game/gameEnginRuleSet.ts` — TypeScript/JavaScript runtime module.
- `lib/engins/game/index.ts` — TypeScript/JavaScript runtime module.
- `lib/engins/game/useGameEnginRuntime.ts` — TypeScript/JavaScript runtime module.
- `lib/engins/useEnginWorkflow.ts` — TypeScript/JavaScript runtime module.
- `lib/engins/workflowEngine.ts` — TypeScript/JavaScript runtime module.

</details>

### GameEngin
Auto-synced from `engins/engin.GameEngin.tsx`, `engins/autoopen/**` using repository introspection.
- Files tracked: **2**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `AutoOpenGameEngin`, `GameEngin`
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

## Dual Runtimes
Auto-synced from `lib/runtime/**`, `lib/vm/**`, `components/runtime/**`, `hooks/useSharedDream.ts` using repository introspection.
- Files tracked: **45**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `DualRuntimeContainer`, `RuntimeView`, `ShellRuntimeShell`
#### Dual Runtimes file structure
```text
├── components
│   └── runtime
│       ├── dream.DualRuntimeContainer.tsx
│       ├── dream.RuntimeView.tsx
│       └── dream.shell.RuntimeShell.tsx
├── hooks
│   └── useSharedDream.ts
└── lib
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
    │   ├── madMaxiSnapshotBridge.ts
    │   ├── memory.ts
    │   ├── moduleRegistry.ts
    │   ├── offlineQueue.ts
    │   ├── quantumCircuit.ts
    │   ├── runtimeChannel.ts
    │   ├── runtimeContainer.ts
    │   ├── seamClipboard.ts
    │   ├── sharedResourcePool.ts
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
<details><summary>Dual Runtimes file index (45 files)</summary>

- `components/runtime/dream.DualRuntimeContainer.tsx` — React UI module for DualRuntimeContainer.
- `components/runtime/dream.RuntimeView.tsx` — React UI module for RuntimeView.
- `components/runtime/dream.shell.RuntimeShell.tsx` — React UI module for ShellRuntimeShell.
- `hooks/useSharedDream.ts` — TypeScript/JavaScript runtime module.
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
- `lib/vm/README.md` — documentation file.
- `lib/vm/bufferManager.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/bus-events.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/dual-runtime.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/dualVMCoordinator.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/index.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/inter-vm-messaging.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/pipelineCache.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/resource-quota.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/security.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/snapshot.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/types.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/wasm-features.ts` — TypeScript/JavaScript runtime module.
- `lib/vm/wasmGpuVM.ts` — TypeScript/JavaScript runtime module.

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
- Files tracked: **24**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `BarGlobalDreamBar`, `BarPersistentDreamBar`, `DreamRCore`, `DreamRFeed`, `DreamSystemContext`, `DreamsurfaceDreamdmbar`, `DreamsurfaceDreamdmbarGrid`, `DreamsurfaceDreamr`, +3 more
#### The DmBar (`dreamdmbar/`) file structure
```text
├── components
│   └── home
│       ├── dream.bar.GlobalDreamBar.tsx
│       └── dream.bar.PersistentDreamBar.tsx
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
<details><summary>The DmBar (`dreamdmbar/`) file index (24 files)</summary>

- `components/home/dream.bar.GlobalDreamBar.tsx` — React UI module for BarGlobalDreamBar.
- `components/home/dream.bar.PersistentDreamBar.tsx` — React UI module for BarPersistentDreamBar.
- `dreamdmbar/dream.GlowingLight.tsx` — React UI module for GlowingLight.
- `dreamdmbar/dreamsurface.dreamdmbar.tsx` — React UI module for DreamsurfaceDreamdmbar.
- `dreamdmbar/homedream/dream.shell.HomeSystem.tsx` — React UI module for ShellHomeSystem.
- `dreamdmbar/homedream/dreamr/algorithms/botDetector.ts` — TypeScript/JavaScript runtime module.
- `dreamdmbar/homedream/dreamr/algorithms/dreamrAlgorithm.ts` — TypeScript/JavaScript runtime module.
- `dreamdmbar/homedream/dreamr/api/route.ts` — API route handler.
- `dreamdmbar/homedream/dreamr/dream.DreamRCore.tsx` — React UI module for DreamRCore.
- `dreamdmbar/homedream/dreamr/dream.DreamRFeed.tsx` — React UI module for DreamRFeed.
- `dreamdmbar/homedream/dreamr/dreamsurface.dreamr.tsx` — React UI module for DreamsurfaceDreamr.
- `dreamdmbar/homedream/dreamsurface.dreamdmbar-grid.tsx` — React UI module for DreamsurfaceDreamdmbarGrid.
- `dreamdmbar/homedream/dreamsurface.homedream.tsx` — React UI module for DreamsurfaceHomedream.
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
Auto-synced from `components/dream.**`, `components/runtime/**`, `lib/widgets/**`, `lib/windows/**` using repository introspection.
- Files tracked: **52**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `AIAssistant`, `AudioVisualizer3D`, `BoogieWarningBanner`, `BrandLogo`, `CommandPalette`, `CreatePostModal`, `DrEamsModeToggle`, `DrEamsVoiceAssistant`, +35 more
#### Dreams (Widgets / Windows / Surfaces) file structure
```text
├── components
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
│   ├── dream.LandingHero.tsx
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
│   └── runtime
│       ├── dream.DualRuntimeContainer.tsx
│       ├── dream.RuntimeView.tsx
│       └── dream.shell.RuntimeShell.tsx
└── lib
    └── widgets
        ├── CrossWidgetPosting.ts
        ├── WidgetBus.ts
        ├── WidgetEngine.tsx
        ├── WidgetEventBus.ts
        ├── WidgetLinkGraph.ts
        ├── feed-resolver.ts
        ├── parse.ts
        ├── parseConfig.ts
        ├── useWidget.ts
        └── widgetRegistry.ts
```
<details><summary>Dreams (Widgets / Windows / Surfaces) file index (52 files)</summary>

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
- `components/dream.LandingHero.tsx` — React UI module for LandingHero.
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
- `components/runtime/dream.DualRuntimeContainer.tsx` — React UI module for DualRuntimeContainer.
- `components/runtime/dream.RuntimeView.tsx` — React UI module for RuntimeView.
- `components/runtime/dream.shell.RuntimeShell.tsx` — React UI module for ShellRuntimeShell.
- `lib/widgets/CrossWidgetPosting.ts` — TypeScript/JavaScript runtime module.
- `lib/widgets/WidgetBus.ts` — TypeScript/JavaScript runtime module.
- `lib/widgets/WidgetEngine.tsx` — React UI module for WidgetEngine.
- `lib/widgets/WidgetEventBus.ts` — TypeScript/JavaScript runtime module.
- `lib/widgets/WidgetLinkGraph.ts` — TypeScript/JavaScript runtime module.
- `lib/widgets/feed-resolver.ts` — TypeScript/JavaScript runtime module.
- `lib/widgets/parse.ts` — TypeScript/JavaScript runtime module.
- `lib/widgets/parseConfig.ts` — TypeScript/JavaScript runtime module.
- `lib/widgets/useWidget.ts` — TypeScript/JavaScript runtime module.
- `lib/widgets/widgetRegistry.ts` — TypeScript/JavaScript runtime module.

</details>

## User-Facing Modularity
Auto-synced from `components/**`, `styles/**`, `lib/ui/**`, `hooks/**` using repository introspection.
- Files tracked: **318**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: `AIAssistant`, `ActiveModuleSurface`, `ActivityPostForm`, `ActivityProfile`, `AdUnit`, `AddDreamCTA`, `AddSliceSheet`, `AlgorithmEngine`, +255 more
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
│   ├── dream.LandingHero.tsx
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
│   │   ├── dreamsurface.dreamspace-runtime.tsx
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
… (198 more files)
```
<details><summary>User-Facing Modularity file index (318 files)</summary>

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
- `components/dream.LandingHero.tsx` — React UI module for LandingHero.
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
- `components/dreamengin/dreamsurface.dreamspace-runtime.tsx` — React UI module for DreamsurfaceDreamspaceRuntime.
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
Full-site customization is implemented as a pipeline: design tokens → customization UI → persisted appearance/layout state → runtime application.

How it works:
- Theme and visual primitives are defined in token/CSS layers (`tailwind.config.ts`, `styles/*`).
- User controls live in customize bars/panels (`components/customize/*`) and settings surfaces (`/settings/appearance`).
- The appearance widget/panel pipeline (`dream.widget.AppearanceWidget.tsx`, `dream.panel.AppearancePanel.tsx`, `dream.ThemeApplicator`) applies per-user choices to active runtime surfaces.
- Surface-graph edits (layout/effects/font/color) are mediated by editor panels and persisted through API routes under `/api/settings/appearance`.

Result: users can alter palette, layout mood, and module presentation while the fixed engine keeps behavior/safety contracts stable.
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
These four boundaries define what is fixed versus composable in DREAMengin:
- **`core/`** — immutable engine anchor boundary (fixed substrate placeholder for core runtime entry).
- **`system/`** — system-level glue/workflow substrate assets that support runtime and automation boundaries.
- **`backend/`** — secondary Express service utilities (aggregators/controllers/services) that complement, not replace, App Router APIs.
- **`coresurfaces/`** — canonical always-available profile/edit surfaces used across runtime contexts.

Keeping these boundaries explicit prevents domain feature code from leaking into engine substrate layers and preserves the engine/rule-set separation required by project law.
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
Auto-synced from `agents/**`, `.github/workflows/**`, `.github/scripts/**`, `scripts/**` using repository introspection.
- Files tracked: **124**
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
│       ├── readme-autosync.yml
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
    │   └── writer-run.ts
    ├── generate-mobile-nextgen-spec.mjs
    ├── generate-mobile-ps5-spec.mjs
    ├── generate-webapp-final-form.mjs
    ├── law-check.sh
    ├── migrate-imports.sh
    ├── optimize-dreamengin.mjs
    ├── postbuild.js
    ├── postbuild.ts
… (4 more files)
```
<details><summary>Agents & Workflow file index (124 files)</summary>

- `.github/scripts/DREAMENGIN_CORE_COMPLETE.md` — documentation file.
- `.github/scripts/DREAMENGIN_CORE_USAGE.md` — documentation file.
- `.github/scripts/ai_implement.py` — project file (py).
- `.github/scripts/ai_neural_decision.py` — project file (py).
- `.github/scripts/ai_propose.py` — project file (py).
- `.github/scripts/ai_report_propose.py` — project file (py).
- `.github/scripts/assemble_report_context.py` — project file (py).
- `.github/scripts/catalog_games_for_ai.py` — project file (py).
- `.github/scripts/check-root-hygiene.sh` — project file (sh).
- `.github/scripts/dreamengin_core.py` — project file (py).
- `.github/scripts/humanai_audit.py` — project file (py).
- `.github/scripts/issue-bot.js` — TypeScript/JavaScript runtime module.
- `.github/scripts/scan_dreamengin_context.py` — project file (py).
- `.github/scripts/scan_gameengin_context.py` — project file (py).
- `.github/scripts/validate_game_sandbox.py` — project file (py).
- `.github/scripts/validate_report_agent_spec.py` — project file (py).
- `.github/workflows/autofixvercelbuild.yml` — project file (yml).
- `.github/workflows/bot-pr-automerge.yml` — project file (yml).
- `.github/workflows/bouncer.yml` — project file (yml).
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
- `.github/workflows/portfolio-optimization.yml` — project file (yml).
- `.github/workflows/preflight.yml` — project file (yml).
- `.github/workflows/print-codebase.yml` — project file (yml).
- `.github/workflows/readme-autosync.yml` — project file (yml).
- `.github/workflows/refreshlock.yml` — project file (yml).
- `.github/workflows/repo-snapshot.yml` — project file (yml).
- `.github/workflows/report-driven-coding-agent.yml` — project file (yml).
- `.github/workflows/root-hygiene.yml` — project file (yml).
- `.github/workflows/spec-engin-ai-agent.yml` — project file (yml).
- `.github/workflows/sql-migration-guard.yml` — project file (yml).
- `.github/workflows/sync-build-memory.yml` — project file (yml).
- `.github/workflows/update-embed-feed.yml` — project file (yml).
- `.github/workflows/update-repo-state.yml` — project file (yml).
- `.github/workflows/vercel-deploy.yml` — project file (yml).
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

</details>

## Research, Experiments & Daydreams
This repository keeps research, prototypes, and shipping surfaces deliberately separated:
- **`research/`** stores formal work (Torridity / ledger dynamics datasets, equations, papers); start with `research/README.md`.
- **`experiments/`** holds isolated prototypes not yet merged into production runtime flows.
- **`daydreams/`** provides standalone route surfaces for each domain (`music`, `games`, `lab`, `code`, `brand`, `create`) outside the main App Router hierarchy.

This separation supports high-velocity exploration while preventing experimental drift from destabilizing the fixed runtime engine.
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
Auto-synced from `terraform/**`, `prometheus/**`, `grafana/**`, `.github/workflows/**`, `vercel.json`, `docker-compose.yml` using repository introspection.
- Files tracked: **61**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Infra & Ops file structure
```text
├── .github
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
│       ├── readme-autosync.yml
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
<details><summary>Infra & Ops file index (61 files)</summary>

- `.github/workflows/autofixvercelbuild.yml` — project file (yml).
- `.github/workflows/bot-pr-automerge.yml` — project file (yml).
- `.github/workflows/bouncer.yml` — project file (yml).
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
- `.github/workflows/portfolio-optimization.yml` — project file (yml).
- `.github/workflows/preflight.yml` — project file (yml).
- `.github/workflows/print-codebase.yml` — project file (yml).
- `.github/workflows/readme-autosync.yml` — project file (yml).
- `.github/workflows/refreshlock.yml` — project file (yml).
- `.github/workflows/repo-snapshot.yml` — project file (yml).
- `.github/workflows/report-driven-coding-agent.yml` — project file (yml).
- `.github/workflows/root-hygiene.yml` — project file (yml).
- `.github/workflows/spec-engin-ai-agent.yml` — project file (yml).
- `.github/workflows/sql-migration-guard.yml` — project file (yml).
- `.github/workflows/sync-build-memory.yml` — project file (yml).
- `.github/workflows/update-embed-feed.yml` — project file (yml).
- `.github/workflows/update-repo-state.yml` — project file (yml).
- `.github/workflows/vercel-deploy.yml` — project file (yml).
- `grafana/dashboards/default.yml` — project file (yml).
- `grafana/datasources/prometheus.yml` — project file (yml).
- `prometheus/prometheus.yml` — project file (yml).
- `terraform/main.tf` — project file (tf).
- `vercel.json` — project file (json).

</details>

## Testing
Auto-synced from `tests/**`, `vitest.config.ts`, `playwright.config.ts` using repository introspection.
- Files tracked: **206**
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
… (86 more files)
```
<details><summary>Testing file index (206 files)</summary>

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
- `tests/supabase-env.test.ts` — TypeScript/JavaScript runtime module.
- `tests/swap-manager-extended.test.ts` — TypeScript/JavaScript runtime module.
- `tests/swipe-calibration.test.ts` — TypeScript/JavaScript runtime module.
- `tests/tech-foundation.test.ts` — TypeScript/JavaScript runtime module.
- `tests/torridity-ledger.test.ts` — TypeScript/JavaScript runtime module.
- `tests/universal-asset-registry.test.ts` — TypeScript/JavaScript runtime module.
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
The complete env contract is documented in `.env.example`; use `.env.local.example` for local defaults. Key variables by purpose:

- **Supabase client/runtime**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server only)
- **Database connections**
  - `DATABASE_URL`
  - `DIRECT_URL`
- **Auth/session/admin guards**
  - `SESSION_SECRET`
  - `IDARI_PASSWORD`
  - `ADMIN_UNLOCK_KEY`
- **AI providers**
  - `OPENAI_API_KEY`
  - `GROQ_API_KEY`
- **Media/data connectors**
  - `YOUTUBE_API_KEY`
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET`
- **Observability/app URL**
  - `SENTRY_DSN`
  - `LOGTAIL_SOURCE_TOKEN`
  - `NEXT_PUBLIC_APP_URL`
- **Dev-only bypass flags (local only)**
  - `DEV_BYPASS_AUTH`
  - `DEV_ADMIN`

Do not commit secrets. Treat `.env.example` as source-of-truth documentation and keep `.env.local` gitignored.
## Contributing
Auto-synced from `CONTRIBUTING*`, `AGENTS.md`, `docs/**`, `.github/**` using repository introspection.
- Files tracked: **209**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Contributing file structure
```text
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
│       ├── readme-autosync.yml
│       ├── refreshlock.yml
│       ├── repo-snapshot.yml
│       ├── report-driven-coding-agent.yml
│       ├── root-hygiene.yml
│       ├── spec-engin-ai-agent.yml
│       ├── sql-migration-guard.yml
│       ├── sync-build-memory.yml
│       ├── update-embed-feed.yml
│       ├── update-repo-state.yml
… (89 more files)
```
<details><summary>Contributing file index (209 files)</summary>

- `.github/PULL_REQUEST_TEMPLATE.md` — documentation file.
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
- `.github/scripts/DREAMENGIN_CORE_COMPLETE.md` — documentation file.
- `.github/scripts/DREAMENGIN_CORE_USAGE.md` — documentation file.
- `.github/scripts/ai_implement.py` — project file (py).
- `.github/scripts/ai_neural_decision.py` — project file (py).
- `.github/scripts/ai_propose.py` — project file (py).
- `.github/scripts/ai_report_propose.py` — project file (py).
- `.github/scripts/assemble_report_context.py` — project file (py).
- `.github/scripts/catalog_games_for_ai.py` — project file (py).
- `.github/scripts/check-root-hygiene.sh` — project file (sh).
- `.github/scripts/dreamengin_core.py` — project file (py).
- `.github/scripts/humanai_audit.py` — project file (py).
- `.github/scripts/issue-bot.js` — TypeScript/JavaScript runtime module.
- `.github/scripts/scan_dreamengin_context.py` — project file (py).
- `.github/scripts/scan_gameengin_context.py` — project file (py).
- `.github/scripts/validate_game_sandbox.py` — project file (py).
- `.github/scripts/validate_report_agent_spec.py` — project file (py).
- `.github/workflows/autofixvercelbuild.yml` — project file (yml).
- `.github/workflows/bot-pr-automerge.yml` — project file (yml).
- `.github/workflows/bouncer.yml` — project file (yml).
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
- `.github/workflows/portfolio-optimization.yml` — project file (yml).
- `.github/workflows/preflight.yml` — project file (yml).
- `.github/workflows/print-codebase.yml` — project file (yml).
- `.github/workflows/readme-autosync.yml` — project file (yml).
- `.github/workflows/refreshlock.yml` — project file (yml).
- `.github/workflows/repo-snapshot.yml` — project file (yml).
- `.github/workflows/report-driven-coding-agent.yml` — project file (yml).
- `.github/workflows/root-hygiene.yml` — project file (yml).
- `.github/workflows/spec-engin-ai-agent.yml` — project file (yml).
- `.github/workflows/sql-migration-guard.yml` — project file (yml).
- `.github/workflows/sync-build-memory.yml` — project file (yml).
- `.github/workflows/update-embed-feed.yml` — project file (yml).
- `.github/workflows/update-repo-state.yml` — project file (yml).
- `.github/workflows/vercel-deploy.yml` — project file (yml).
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

## Types
Auto-synced from `types/**` using repository introspection.
- Files tracked: **18**
- API routes discovered: none
- App pages discovered: none
- Components/modules discovered: none
#### Types file structure
```text
└── types
    ├── ads.ts
    ├── ai-system.ts
    ├── ai.ts
    ├── ccc.ts
    ├── connector.ts
    ├── dream-window.ts
    ├── dreamArtifact.ts
    ├── experience.ts
    ├── journey.ts
    ├── marketplace.ts
    ├── module-manifest.ts
    ├── rivet-dev-agent-os.d.ts
    ├── spatial.ts
    ├── supabase.ts
    ├── user-sim.ts
    ├── widget-system-v2.ts
    ├── widgetConfigs.ts
    └── widgets.ts
```
<details><summary>Types file index (18 files)</summary>

- `types/ads.ts` — TypeScript/JavaScript runtime module.
- `types/ai-system.ts` — TypeScript/JavaScript runtime module.
- `types/ai.ts` — TypeScript/JavaScript runtime module.
- `types/ccc.ts` — TypeScript/JavaScript runtime module.
- `types/connector.ts` — TypeScript/JavaScript runtime module.
- `types/dream-window.ts` — TypeScript/JavaScript runtime module.
- `types/dreamArtifact.ts` — TypeScript/JavaScript runtime module.
- `types/experience.ts` — TypeScript/JavaScript runtime module.
- `types/journey.ts` — TypeScript/JavaScript runtime module.
- `types/marketplace.ts` — TypeScript/JavaScript runtime module.
- `types/module-manifest.ts` — TypeScript/JavaScript runtime module.
- `types/rivet-dev-agent-os.d.ts` — TypeScript/JavaScript runtime module.
- `types/spatial.ts` — TypeScript/JavaScript runtime module.
- `types/supabase.ts` — TypeScript/JavaScript runtime module.
- `types/user-sim.ts` — TypeScript/JavaScript runtime module.
- `types/widget-system-v2.ts` — TypeScript/JavaScript runtime module.
- `types/widgetConfigs.ts` — TypeScript/JavaScript runtime module.
- `types/widgets.ts` — TypeScript/JavaScript runtime module.

</details>
