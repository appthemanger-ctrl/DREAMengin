# Dreams System V2

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Status: active implementation note  
Last updated: 2026-03-06

This file keeps the historic `WIDGET_SYSTEM_V2.md` filename, but the canonical product term is now **Dreams** to match `README.md`.

## 1. Canonical naming

- **Dream** = the canonical modular unit
- **Widget** = legacy implementation term still present in parts of the repo
- **Super Dream Widget** = automatic combined profile output built from compatible Dreams

When docs or code still say “widget,” treat it as implementation history unless a more specific Dream term already exists.

## 2. Universal Dream model

Every Dream is being aligned to a four-layer model.

### Layer 1 — DreamShell
Responsible for:
- frame
- title
- placement
- size
- style
- shell menu
- DreamAds slot placement where allowed

### Layer 2 — Connector / Identity
Responsible for:
- connection state
- provider identity
- capability discovery
- connector metadata

### Layer 3 — Feature
Responsible for:
- posts
- media
- activity
- stats
- links
- messaging hooks
- any other capability-backed module

### Layer 4 — Output / Projection
Responsible for:
- saved shared output
- profile-safe public rendering
- preview and projection boundaries

## 3. Source vs projection rule

The README model is explicit:
- HomeDream holds the source Dream
- EditProfileDream stages what is allowed to be shared
- ViewProfile renders only saved projection output

The public/shared surface must not read unrestricted private Dream internals.

## 4. Connectors and capability gating

DREAMengin should not build one fully separate hardcoded widget system per connector.

Instead:
- connectors declare capabilities
- DreamShell exposes only supported parts
- disconnected Dreams remain editable at the shell level
- appearance may stay frozen even when disconnected

Current implementation material related to this lives in:
- `components/connectors/*`
- `hooks/useConnectorInstallFlow.ts`
- `components/dreams/*`
- `components/widgets/*`

## 5. Super Dream Widgets

Compatible Dreams may combine into one automatic profile-facing composition.

Rules:
- users choose what to expose
- the system chooses the default layout template
- the combined output is a projection layer, not a mutation of the source Dreams
- compatibility should be based on actual capabilities, not purely manual layout freedom

## 6. DreamAds

DreamAds are user-controlled ad placements associated with user surfaces where permitted.

They are distinct from platform-run promotions and should stay distinct in naming, docs, and implementation.

## 7. Current repo mapping

### Canonical Dream-layer files
- `components/dreams/DreamShell.tsx`
- `components/dreams/DreamConnectorLayer.tsx`
- `components/dreams/DreamFeatureLayer.tsx`
- `components/dreams/DreamOutputLayer.tsx`
- `components/dreams/SuperDreamWidget.tsx`

### Legacy implementation material still being absorbed
- `components/widgets/WidgetShell.tsx`
- `components/widgets/WidgetCard.tsx`
- `components/widgets/WidgetSurface.tsx`
- `components/widgets/WidgetLibrary.tsx`
- `types/widget-system-v2.ts`

## 8. Honest status

The Dream model is present in the repo, but not every legacy widget system reference has been renamed yet. This file documents the direction and the canonical language being applied during alignment.
