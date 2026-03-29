# GitHub Coding Agent

This repo includes a **report-driven GitHub coding agent** at:

- `.github/workflows/report-driven-coding-agent.yml`

It is for **repo automation**, not an in-app help widget.

## What it does

The workflow:

1. scans the repo with `.github/scripts/scan_dreamengin_context.py`
2. merges that scan with a **report** (`docs/BUGS.md`, issue body, or workflow input text)
3. asks the model for a **smallest coherent implementation plan**
4. asks the model for a **git patch**
5. applies the patch
6. runs `pnpm run lint`, `pnpm run build`, and `pnpm run test:games`
7. optionally commits and pushes the validated changes on `workflow_dispatch`

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
- `.github/scripts/ai_implement.py`

## Notes

- Requires `OPENAI_API_KEY`
- Uses Node 24 + pnpm 10.30.0
- Reuses existing DREAMengin scan/patch infrastructure instead of inventing a parallel automation system
