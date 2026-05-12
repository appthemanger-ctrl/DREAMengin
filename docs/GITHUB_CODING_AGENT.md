# GitHub Coding Agent

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


This repo includes a **report-driven GitHub coding agent** at:

- `.github/workflows/report-driven-coding-agent.yml`

It is for **repo automation**, not an in-app help widget.

It also has a **hard requirement**: every run must include **at least one advanced GameEngin or game upgrade**, not just a simple tap-game tweak.

## What it does

The workflow:

1. scans the repo with `.github/scripts/scan_dreamengin_context.py`
2. merges that scan with a **report** (`docs/BUGS.md`, issue body, or workflow input text)
3. injects the project governing docs (**LAW.md**, **AXIOMS.md**, **ARCHITECTURE.md**) into the context as authoritative decision guides
4. adds the advanced game target manifest + current game catalog to the prompt
5. asks the model to **trace each issue to its root cause** and plan a complete, aligned fix — no hedging, no deferral to human review
6. validates that the proposal names a known advanced game target
7. asks the model for a **git patch** that implements all root-cause fixes
8. applies the patch
9. runs `pnpm run lint`, `pnpm run build:gamesengin`, `pnpm run build`, and `pnpm run test:games`
10. optionally commits and pushes the validated changes on `workflow_dispatch`

## Trigger modes

### Manual

Run **Report-Driven GitHub Coding Agent** from the Actions tab with:

- `report_path` — path to a repo report file, default `docs/BUGS.md`
- `report_text` — optional free-form report text
- `commit_changes` — when true, validated changes are committed back to the current branch

### Issue-driven

Open or edit an issue and add the label:

- `ai-report-agent`

The issue body becomes the report text. The workflow comments back with the result summary.

## Support scripts

- `.github/scripts/assemble_report_context.py`
- `.github/scripts/ai_report_propose.py`
- `.github/scripts/catalog_games_for_ai.py`
- `.github/scripts/validate_report_agent_spec.py`
- `.github/scripts/ai_implement.py`
- `config/advanced-game-targets.json`

## Other automated workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `update-bugs.yml` | push (all branches) | Regenerates `docs/BUGS.md` from source TODOs + FEATURE_STATUS |
| `update-handoff.yml` | push (all branches) | Prepends a changelog row to `docs/HANDOFF.md` |
| `update-repo-state.yml` | push to main/develop/completedream + schedule | Analyses and updates `REPO_STATE.md` |
| `sync-build-memory.yml` | push to main/develop/completedream | Syncs `build-memory/` artefacts |
| `check-build-memory-drift.yml` | PR + push to main/develop/completedream | Detects drift in build memory |
| `bouncer.yml` | push + PR to main/develop/completedream | Enforces naming and privacy hard rules |
| `garbageman.yml` | push to main/completedream | Removes `.DS_Store`, `*.log`, `*.tmp` |
| `idari-daily.yml` | daily midnight UTC | Idari improvement cycle |
| `elite-gameengin-evolution.yml` | push to `components/games/**` + daily | WebGPU validation + AI game proposals |
| `gameengin-ai-agent.yml` | push to game files on main/develop/completedream | Proposes + generates new SICC games |
| `games-library-ai-agent.yml` | nightly 04:00 UTC | Genre-fusion evolution of existing games |
| `dreamengin-preflight.yml` | push to main/develop/completedream + PR | Full build + test gate |
| `github-actions.yml` | push + PR to main/develop | CI/CD quality, build, security, deploy |
| `db-extension-audit.yml` | push to `supabase/migrations/**` + weekly Mon | DB extension audit |
| `db-extension-check.yml` | push to `supabase/migrations/**` + weekly Mon | Required-extension check |

## Notes

- Requires `GROQ_API_KEY` (preferred) or `OPENAI_API_KEY` compatibility fallback
- Uses Node 25 + pnpm 10.30.0 (see `.github/actions/setup-node`)
- Reuses existing DREAMengin scan/patch infrastructure instead of inventing a parallel automation system
- Advanced targets currently prioritize `BabylonSideScroller`, `ENGINBattle`, and `DREAMquest`
- All action versions pinned to `@v4` — see `docs/ADD_WORKFLOW.md`
