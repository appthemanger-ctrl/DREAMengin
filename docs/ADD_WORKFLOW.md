# GitHub Actions Workflow Note

Last updated: 2026-03-06

This repo keeps workflow source under:
- `workflows/github-actions.yml`

If the GitHub importer or mobile flow cannot write into `.github/workflows/`, create the file manually in GitHub and paste in the workflow contents.

## Reminder

Workflow additions should preserve the current repo assumptions:
- Node 24
- pnpm 10.30.0
- Next.js App Router repo layout
