# SICC Principles Update — Stylized → Synchronized

> **Change Date:** 2026-04-14 (confirmed 2026-07 Generation Law MANIFEST pass)  
> **Author:** Idari (admin AI) + Spec-Engin HyperSICC

---

## Current SICC Definition

**S — Synchronized** · **I — Intuitive** · **C — Coherent** · **C — Cohesive**

| Letter | Principle        | Meaning |
|--------|-----------------|---------|
| **S**  | **Synchronized** | Real-time coordination across runtimes, shared state, collaborative actions, and immediate feedback |
| **I**  | Intuitive        | Natural interaction, no manuals, gestures feel obvious |
| **C**  | Coherent         | Clear logic, consistent naming, predictable behavior |
| **C**  | Cohesive         | All parts (Engins, Daydreams, Dream Windows) fit together as a unified spatial OS |

---

## Summary of Change

SICC updated: **"Stylized" replaced with "Synchronized"** to emphasize real-time collaboration
over visual decoration.

---

## Old SICC (archived)

| Letter | Principle  | Meaning |
|--------|------------|---------|
| S      | Stylized   | Consistent design language, tokens, and visual identity |
| I      | Intuitive  | Discoverable interactions, clear affordances, accessible |
| C      | Coherent   | Clear logic, consistent naming, predictable behavior |
| C      | Cohesive   | All parts (Engins, Daydreams, Dream Windows) fit as a unified spatial OS |

---

## Rationale

The original emphasis on "Stylized" led to excessive focus on visual design (UI effects,
animations, gold accents) at the expense of functional connectivity. The new first principle,
**Synchronized**, redirects the platform's energy toward:

- Real-time state coordination between runtimes and peers
- Low-latency feedback on all user actions
- Shared state that stays consistent across Dream Windows and Engins
- Collaborative actions visible to all connected participants immediately

Visual quality remains important through the Cohesive and Coherent principles — design tokens,
consistent border radii, and transition timing are still tracked in `SICC_GLOBAL_CRITERIA`.
The change removes "Stylized" as a *first principle* to prevent over-indexing on decorative work
when synchronization features are incomplete.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/feature-build/uiQualityCriteria.ts` | `SICCDimension` type: `'stylized'` → `'synchronized'`; section header; `SICC_DIMENSIONS` entry |
| `tests/feature-build.test.ts` | All test arrays and assertions updated |
| `components/connectors/ConnectorWidgetPicker.tsx` | Comment: `S.I.C.C. — Stylized…` → `S.I.C.C. — Synchronized…` |
| `components/LandingHero.tsx` | Comment updated |
| `components/home/DaydreamPulseStrip.tsx` | Comment updated |
| `lib/feature-build/buildCycle.ts` | Comment updated |
| `docs/AXIOMS.md` | Axiom 4 updated from "Stylized" to "Synchronized" |
| `CHANGELOG.md` | Entry documenting the change |
| `docs/PRINCIPLES_UPDATE.md` | This file |

### Not changed

- CSS class names prefixed `sicc-` (e.g. `sicc-shimmer`, `sicc-glass-in`) — design
  system identifiers unrelated to the principle name.
