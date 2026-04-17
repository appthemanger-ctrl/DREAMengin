# Repository Structure Contract

## Purpose
Enforce a stable, AI-readable repository hierarchy and prevent root-level drift.

## Root Contract
Only keep runtime/build-critical files at repository root.

### Allowed root markdown files
- `README.md`
- `CHANGELOG.md`
- `AGENTS.md`
- `REPO_STATE.md`

All other markdown files must live under `docs/`.

### Disallowed root asset files
- `*.png`
- `*.jpg`
- `*.jpeg`

All non-runtime image archives must live under `assets/images/`.

## Ownership Boundaries
| Top-level path | Scope owner |
|---|---|
| `app/` | Product routes + API runtime |
| `components/` | Product UI surfaces |
| `lib/` | Shared domain logic and adapters |
| `.github/workflows/` | CI/CD automation |
| `docs/` | Governance, architecture, guides, logs |
| `assets/` | Archived static assets (non-runtime) |
| `system/` | Infrastructure archive + operational support |
| `tests/` | Verification and regression coverage |

## Archive Rules
- Archive first; do not delete in first cleanup pass.
- Use `system/ci/archive/` for non-active workflow artifacts.
- Use `docs/logs/` for historical notes/status files.
- Use `agents/archive/` for inactive agent artifacts.

## Enforcement
- `scripts/check-root-hygiene.mjs` enforces root file hygiene.
- `.github/workflows/root-hygiene.yml` runs hygiene checks on push/PR.
