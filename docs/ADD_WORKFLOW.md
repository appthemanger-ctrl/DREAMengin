# GitHub Actions Workflow Note

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Last updated: 2026-04-01

This repo keeps all GitHub Actions workflow files under:
- `.github/workflows/`

The reusable composite Node setup action lives at:
- `.github/actions/setup-node/action.yml`

If the GitHub importer or mobile flow cannot write into `.github/workflows/`, create the file manually in GitHub and paste in the workflow contents.

## Standard action versions (as of 2026-04-01)

All workflows should use these pinned versions:

| Action | Version |
|--------|---------|
| `actions/checkout` | `@v4` |
| `actions/setup-node` | `@v4` |
| `actions/upload-artifact` | `@v4` |
| `actions/download-artifact` | `@v4` |
| `pnpm/action-setup` | `@v4` |

## Reminder

Workflow additions must preserve these repo assumptions:
- Node 25 (set via `.github/actions/setup-node`)
- pnpm 10.30.0 (set via `pnpm/action-setup@v4`)
- Next.js App Router repo layout
- Prefer the shared `.github/actions/setup-node` composite action over inline Node setup
- Tag bot commits with `[skip ci]` to prevent infinite trigger loops
- Use `permissions: contents: write` on any job that pushes a commit back
