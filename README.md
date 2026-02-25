# DREAMengin (Authoritative Spec + Implementation)

DREAMengin is a spatial, gesture-driven creative platform built on **Next.js (App Router)** + **Supabase**.

This repo is **spec-governed**. The documents in `/docs` are **not suggestions** — they are binding constraints on implementation.

## Start here (LAW)

- **docs/LAW.md** — front door + enforcement summary (LOCKED)
- **docs/AXIOMS.md** — non-negotiables (LOCKED)
- **docs/WIDGET_SYSTEM_V2.md** — widgets, instances, and window presentation
- **docs/ARCHITECTURE.md** — τ navigation, Home model, controls
- **docs/SECURITY.md** — Supabase/RLS, privacy, least-privilege
- **docs/ADD_WORKFLOW.md** — how additions must be integrated

If code conflicts with these docs, **code must change**.

## Product model (high level)

- The user is always conceptually inside **Home (node 0)**.
- “Pages” may exist, but they must open like **windows/widgets** inside the Home system.
- Navigation is **τ-only** (state transitions), not a traditional site nav model.
- **Day Dreams** are protected: they are full-powered mini-apps.

## Development

### Local
1. Install deps
2. Configure env vars for Supabase
3. Run dev server

(See `docs/SECURITY.md` for required env + RLS expectations.)

### Repo guardrails
- Protected Day Dream paths require `[DAYDREAM_OK]` in PR title.
- See `docs/LAW.md` and `.github/workflows/law.yml`.

