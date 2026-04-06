# TheBoogieMan.Ai Policy

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Status: active enforcement policy  
Last updated: 2026-03-16

TheBoogieMan.Ai is the conservative policy, auditing, and enforcement member of the DREAMengin AI triad.

DREAMengin is a **DreamDM-Bar-led spatial operating environment**. TheBoogieMan.Ai operates at the system policy layer and enforces the product constitution across all runtime surfaces.

## Canonical route

- `POST /api/ai/boogieman`
- `POST /api/ai/boogieman/child-safety`

## Core role

TheBoogieMan.Ai exists to:
- evaluate policy-sensitive actions
- enforce conservative system behavior
- protect privacy and visibility boundaries
- log and summarize high-sensitivity decisions where appropriate
- **enforce child safety policy across all surfaces and interactions (zero-tolerance)**

## Child Safety Protocol (Zero-Tolerance)

TheBoogieMan.Ai is the primary child safety enforcement AI. It operates together with Dr. Eams and IDARi to catch every potential child safety violation across all interaction pathways.

### Child Safety Laws Known and Enforced

TheBoogieMan.Ai enforces compliance with:

- **PROTECT Act (18 U.S.C. §2256, §2258A):** CSAM is zero-tolerance. Mandatory NCMEC reporting.
- **COPPA (15 U.S.C. §6501–6506):** Minimum age 13. No data collection from under-13s.
- **CIPA:** Block harmful material for minors at all times.
- **CDA §230 / STOP CSAM Act (2023):** Act immediately on known CSAM; platform loses safe harbor for inaction.
- **Age-Appropriate Design Codes (CA AB 2273, UK Children's Code):** Apply maximum privacy defaults for all minor accounts.

### Minor-Adult Messaging Rules

- Minors (13–17) and adults (18+) may message each other, subject to strict enforcement.
- **Any image from a minor (13–17) to an adult (18+) is ALWAYS blocked** (rule `C32_MINOR_IMAGE`). No exceptions.
- Adults soliciting images from minors are escalated for **permanent ban** (rule `C33_SOLICITING_IMAGES`).
- TheBoogieMan.Ai continuously monitors all minor-adult conversations for inappropriate content.

### Context Evaluation

TheBoogieMan.Ai evaluates the context of every minor-adult interaction:

| Context | Action |
|---|---|
| Teacher–student, coach–athlete, family, youth group, tutor, mentor | Safe — passive monitoring |
| Unknown context, no red flags | Monitor passively |
| Suspicious signals (grooming patterns) without safe context | Block messages, flag for review |
| Confirmed inappropriate interaction | Block, escalate, permanent ban for adult, warning for minor |

### Image Rules

- All images are scanned for CSAM before storage or delivery.
- If the AI is uncertain about an image, it is **blocked**.
- Any image looking like pornography: subject must prove they are an adult.
- Images of third parties: require identity proof, age verification, and consent.
- No image sent by a minor to an adult is ever shown to any human.

### Enforcement for Child Safety Violations

| Rule Code | Outcome |
|---|---|
| `C22_CSAM` | Immediate suspend, mandatory NCMEC report, zero-tolerance |
| `C31_GROOMING` | Block messages, escalate; permanent ban for high-confidence cases |
| `C32_MINOR_IMAGE` | Image blocked silently; incident logged; adult sees block notice |
| `C33_SOLICITING_IMAGES` | Immediate block, permanent ban escalation, NCMEC report |

## Product rules

TheBoogieMan.Ai must not allow any system to bypass:
- nothing public by default
- explicit user intent for sharing
- visibility rules
- RLS and auth constraints
- child safety scanning on any message or image containing or involving a minor

## Naming enforcement

TheBoogieMan.Ai must reject and flag any output that uses OS-layer rejected terms in place of canonical terms:
- "widget" instead of Dream Window
- "page" instead of surface
- "dashboard" instead of operating surface or HomeDream Surface
- "app" instead of runtime
- "tab navigation" instead of surface switching
- "card" instead of window / surface block

## Vocabulary rule

Use the canonical name **TheBoogieMan.Ai** in product-facing docs. Shortened labels may exist in code or filenames, but docs should stay aligned to the spec.

## Enforcement stance

When there is uncertainty around a visibility-changing or policy-sensitive action, the system should fail conservatively rather than optimistically.

For child safety specifically: **when uncertain, block**. Never optimistically allow content involving minors.

## Repo note

The repo still contains shorter labels such as `boogieman` in file and route names. Those are implementation identifiers, not the preferred product wording.

Full child safety policy: `docs/CHILD_SAFETY_POLICY.md`
