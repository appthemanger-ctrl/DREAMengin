# SICC Principles Update — Stylized → Synchronized

> **Change Date:** 2026-04-14  
> **Author:** Idari (admin AI)

---

## Summary

SICC updated: **"Stylized" replaced with "Synchronized"** to emphasize real-time collaboration
over visual decoration.

---

## Old SICC

| Letter | Principle  | Meaning |
|--------|------------|---------|
| S      | Stylized   | Consistent design language, tokens, and visual identity |
| I      | Intuitive  | Discoverable interactions, clear affordances, accessible |
| C      | Coherent   | Clear logic, consistent naming, predictable behavior |
| C      | Cohesive   | All parts (Engins, Daydreams, Dream Windows) fit as a unified spatial OS |

## New SICC

| Letter | Principle    | Meaning |
|--------|--------------|---------|
| S      | **Synchronized** | Real-time coordination across runtimes, shared state, collaborative actions, and immediate feedback |
| I      | Intuitive    | Natural interaction, no manuals, gestures feel obvious |
| C      | Coherent     | Clear logic, consistent naming, predictable behavior |
| C      | Cohesive     | All parts (Engins, Daydreams, Dream Windows) fit together as a unified spatial OS |

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
| `lib/feature-build/uiQualityCriteria.ts` | `SICCDimension` type: `'stylized'` → `'synchronized'`; section header; `SICC_DIMENSIONS` entry; criterion `dimension` values |
| `tests/feature-build.test.ts` | All test arrays and assertions updated from `'stylized'` to `'synchronized'` |
| `components/connectors/ConnectorWidgetPicker.tsx` | Comment: `S.I.C.C. — Stylized…` → `S.I.C.C. — Synchronized…` |
| `CHANGELOG.md` | Unreleased entry documenting the change |
| `docs/PRINCIPLES_UPDATE.md` | This file (new) |

### Not changed

- CSS class names prefixed `sicc-` (e.g. `sicc-shimmer`, `sicc-glass-in`) — these are design
  system identifiers unrelated to the principle name.
- `docs/AXIOMS.md` — read-only governance document; the axiom "Stylized — the system should feel
  premium, intentional, and designed" is preserved there and is a separate, complementary concern.
