- `scripts/gameengin/mechanic-run.ts`
- `scripts/gameengin/package-cartridge.ts`
- `scripts/gameengin/prophet-run.ts`
- `scripts/gameengin/upgrader-run.ts`
- `scripts/gameengin/writer-run.ts`
- `scripts/generate-mobile-ps5-spec.mjs`
- `scripts/generate-webapp-final-form.mjs`
- `scripts/law-check.sh`
- `scripts/migrate-imports.sh`
- `scripts/optimize-dreamengin.mjs`
- `scripts/postbuild.js`
- `scripts/postbuild.ts`
- `scripts/repository-state-analysis-section.mjs`
- `scripts/score-pass.cjs`
- `scripts/setup-database.sql`
- `scripts/spec-check.cjs`
- `scripts/sync-build-memory.mjs`
- `scripts/ui-ux-agent.py`
- `scripts/update-bugs.mjs`
- `scripts/update-embed-feed.mjs`
- `scripts/update-handoff.mjs`
- `scripts/update-readme-status-utils.mjs`
- `scripts/update-readme.mjs`
- `scripts/validate-schema-sync.sh`
- `scripts/vercel-ignore.cjs`
- `scripts/vercel-preflight.cjs`

---

## How to regenerate this spec

This document is a deterministic snapshot. To regenerate after code changes:

```bash
cd /path/to/DREAMengin
git ls-tree -r HEAD --name-only > .scratch_filelist.txt
python3 .scratch_build.py     # builds forward + reverse import graph + screen labels
python3 .scratch_render.py    # renders this markdown to GameENGINspec.md
rm .scratch_filelist.txt .scratch_data.json .scratch_labels.json
```

Steps the builder performs:

1. **Enumerate** every tracked file via `git ls-tree -r HEAD --name-only`.
2. **Parse imports** from every `.ts/.tsx/.js/.jsx/.mjs/.cjs` file using a regex over `import … from '…'`, `import('…')`, `require('…')`, and re-exports. `@/` aliases resolve to repo root; relative paths resolve against the importing file. External packages are bucketed under `_ext:_`.
3. **Build a reverse index** so every file knows who imports it.
4. **Extract screen labels** from `.tsx/.jsx/.html` by scanning `<h1>`, `<title>`, `aria-label="…"`, and the first JSX text node.
5. **Render** per-folder tables, the user-facing surface index, the orphan report, and the config/infra appendix.
6. **Constants:** purpose blurbs, Mermaid graph, and canonical surface rows live at the top of `.scratch_render.py` and should be edited there if folder semantics change.
