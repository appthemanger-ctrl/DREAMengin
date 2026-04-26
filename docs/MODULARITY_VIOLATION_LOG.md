# MODULARITY VIOLATION LOG

> **Authority:** Universal Modularity Law — every visual element in DREAMengin must be
> draggable, re-positionable, and functionally re-mountable in any valid runtime region.
>
> **Agent:** Spec-Engin HyperSICC  
> **Log date:** 2026-04-21

---

## LAW SUMMARY

Every on-screen element (Dream Window, panel, rail, DreamR unit, DreamMenu, overlay, strip,
widget, etc.) must:
1. Carry a `ModuleManifest` describing its id, type, sourceRuntime, and compatibleRuntimes.
2. Be wrapped in `DraggableModule`, `DreamWindowShell`, or `UniversalEditorWrapper` so that
   tap-hold (≥ 300 ms) activates drag mode with real pointer tracking.
3. Respond to cross-runtime edge drag by firing a transfer event through the `moduleRegistry`
   and/or `dualRuntimeBridge`.
4. Function correctly with its full feature set after mounting in any compatible runtime.

---

## VIOLATION TABLE

| # | File | Violation | Status | Action taken / recommended |
|---|------|-----------|--------|---------------------------|
| 1 | `components/menus/dream.menu.DreamRadialMenu.tsx` | Overlay menu has no `ModuleManifest` and is not wrapped in any drag primitive. Position is determined entirely by the caller; the menu itself cannot be grabbed or repositioned by the user. | **OPEN** | Wrap rendering site with `UniversalEditorWrapper` (type `'menu'`, compatibleRuntimes `['HomeDream','DreamSpace']`). Menu internals need no changes — the wrapper handles pointer events externally. |
| 2 | `components/menus/dream.menu.DualBottomMenu.tsx` | Composite bottom menu with no drag wrapper. Hard-wired to bottom of screen via fixed CSS. | **OPEN** | Apply `UniversalEditorWrapper` at mount site; replace `position: fixed; bottom: 0` with a relative container whose position is controlled by the wrapper transform. |
| 3 | `components/menus/dream.panel.MenuPanel.tsx` | Panel with no manifest and no drag primitive. | **OPEN** | Wrap with `DreamWindowShell`; add manifest (type `'panel'`). |
| 4 | `components/dreams/dream.widget.SuperDreamWidget.tsx` | Orchestrator renders Dream Windows but does not individually make them draggable — it delegates entirely to children. No manifest on the composite itself. | **PARTIAL** | Document: composite orchestrator itself does not need to be draggable. Its individual child Dream Windows (rendered via `DreamWindowShell`) are the draggable units. No fix required at orchestrator level; verify children are wrapped correctly. |
| 5 | `components/home/dream.widget.DreamWidget.tsx` | Widget renders content but has no own drag wrapper. | **FIXED** | `dreamsurface.homedream-grid.tsx` already wraps every `DreamWidget` instance with `DraggableModule` and derives a `ModuleManifest` via `manifestFromWidget`. No change needed to `DreamWidget` itself — the grid is the correct wrap site. |
| 6 | `components/dreams/dream.NeuralSeamCanvas.tsx` | Decorative canvas element rendered at a fixed position with no manifest. | **OPEN** | Classify as a visual module (type `'canvas-overlay'`). Wrap with `UniversalEditorWrapper`; add manifest with `compatibleRuntimes: ['HomeDream','DreamSpace']`. |
| 7 | `components/dreams/dream.bar.GlobalDreamBar.tsx` | Bar-level element with no drag wrapper. | **OPEN** | Wrap with `UniversalEditorWrapper`; allow user to reposition it within HomeDream or DreamSpace. |
| 8 | `components/dreams/dream.bar.PersistentDreamBar.tsx` | Second bar variant; same violation as above. | **OPEN** | Same remediation as #7. |
| 9 | `components/dreams/dream.ActiveModuleSurface.tsx` | Active module surface with no drag infrastructure. | **OPEN** | Wrap with `DraggableModule`; manifest type `'surface'`. |
| 10 | `components/dreams/dream.DaydreamPulseStrip.tsx` | Strip element with no drag wrapper. | **OPEN** | Wrap with `UniversalEditorWrapper`; manifest type `'strip'`, compatibleRuntimes all six Daydreams plus HomeDream. |
| 11 | `components/dreams/dream.FlagshipEnginesStrip.tsx` | Strip element with no drag wrapper. | **OPEN** | Same remediation as #10; manifest type `'strip'`. |
| 12 | `dreamdmbar/dreamsurface.dreamdmbar.tsx` (children only) | The DreamDM Bar itself is architecturally exempt (it is the root owner that drives both runtimes). However, every child element rendered **inside** the bar (compose area, search bar, notification rail, messaging panel) must carry its own manifest and be individually draggable out of the bar if compatible. | **OPEN** | Audit each child element in `dreamsurface.dreamdmbar.tsx` and wrap with `DraggableModule` or `DreamWindowShell` per element type. |

---

## EXEMPT ELEMENTS

The following elements are architecturally exempt from Universal Modularity Law:

| Element | Reason |
|---------|--------|
| `dreamdmbar/dreamsurface.dreamdmbar.tsx` (bar shell itself) | Root container. Owns HomeDream and DreamSpace. Moving the bar IS the resize operation. Out of scope by explicit law. |
| `app/layout.tsx` providers | Non-visual infrastructure (OSProvider, ThemeProvider, etc.). |
| Pure backend / API routes | Non-visual code. |

---

## PASSING ELEMENTS

The following canonical elements are **fully modular** and pass the Universal Modularity Law:

| Element | Drag wrapper | Transfer path |
|---------|-------------|---------------|
| `components/engines/shared/dream.EnginRuleSet.ts` | — (type only) | `EnginRuleSet` config interface — data-only, no visual element |
| `components/engines/shared/dream.makeEnginApp.tsx` | Inherits from `EnginAppShell` (child) | Config-driven factory; wraps `EnginAppShell` which owns the shell structure. All 7 engine app files are now data-only rulesets — zero boilerplate duplication. |
| `components/draggable/dream.DraggableModule.tsx` | Self (the wrapper) | `dualRuntimeBridge.emit('module','transfer',…)` |
| `components/dreams/dreamsurface.window.tsx` (DreamWindowShell) | `useTapHoldMove` | `canTransfer` + `onTransfer` callback |
| `components/universal-editor/dream.UniversalEditorWrapper.tsx` | `useTapHoldMove` | `onTransfer` callback → `moduleRegistry.transferModule` |
| `components/home/dreamsurface.homedream-grid.tsx` | `DraggableModule` per widget | `manifestFromWidget` → bridge |
| `lib/runtime/moduleRegistry.ts` | — (logic layer) | `transferModule(id, targetRuntime)` enforces `compatibleRuntimes` |
| `lib/runtime/dropTargetRegistry.ts` | — (logic layer) | `route(drop, region)` routes to highest-priority matching target |
| `lib/runtime/useDragSurface.ts` | — (hook) | Registers surface as a `dropTargetRegistry` target |
| `types/module-manifest.ts` | — (type) | Full `ModuleManifest` shape with `ui.movable`, `ui.resizable` |

---

## README HARD WARNING

> ⚠️ **UNIVERSAL MODULARITY LAW** — Any visual element added to DREAMengin that is NOT
> wrapped in `DraggableModule`, `DreamWindowShell`, or `UniversalEditorWrapper` with a
> valid `ModuleManifest` is in direct violation of the platform law. Every violation must
> be logged in `docs/MODULARITY_VIOLATION_LOG.md` with the violation status and action taken.
> No fixed/immovable UI. No stub modularity. No wrappers with no effect.

---

*This log must be updated whenever a new visual element is added, moved, or deleted.*
*Last updated: 2026-04-21 by Spec-Engin HyperSICC*
