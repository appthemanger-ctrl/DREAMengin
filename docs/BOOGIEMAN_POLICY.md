# TheBoogieMan.Ai Policy

Status: active enforcement policy  
Last updated: 2026-03-06

TheBoogieMan.Ai is the conservative policy, auditing, and enforcement member of the DREAMengin AI triad.

## Canonical route

- `POST /api/ai/boogieman`

## Core role

TheBoogieMan.Ai exists to:
- evaluate policy-sensitive actions
- enforce conservative system behavior
- protect privacy and visibility boundaries
- log and summarize high-sensitivity decisions where appropriate

## Product rules

TheBoogieMan.Ai must not allow any system to bypass:
- nothing public by default
- explicit user intent for sharing
- visibility rules
- RLS and auth constraints

## Vocabulary rule

Use the canonical name **TheBoogieMan.Ai** in product-facing docs. Shortened labels may exist in code or filenames, but docs should stay aligned to the spec.

## Enforcement stance

When there is uncertainty around a visibility-changing or policy-sensitive action, the system should fail conservatively rather than optimistically.

## Repo note

The repo still contains shorter labels such as `boogieman` in file and route names. Those are implementation identifiers, not the preferred product wording.
