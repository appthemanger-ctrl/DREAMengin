# Repo Visualizer

Supabase-style repository schematic for DREAMengin.

## Regenerate graph data

```bash
pnpm viz:build
```

This runs `repo-visualizer/analyzer.mjs` and refreshes:
- `repo-visualizer/graph.json`
- `repo-visualizer/graph-stats.json`
- auto-generated section inside `VISUAL-SCHEMATIC.md`

## Open the interactive viewer

```bash
pnpm viz
```

(or run `pnpm viz:serve` after a prior `pnpm viz:build`)

Viewer URL: `http://localhost:4317`

## Visual legend

### Node colors
- **Blue**: TS/JS files
- **Cyan**: Next.js route files
- **Green**: function/class symbols
- **Gold**: SQL entities (tables/policies/functions)
- **Purple**: docs
- **Gray**: folders/config
- **Red**: orphan/floating nodes

### Edge styles
- **Solid**: `import`, `route-uses`
- **Dashed**: `call`
- **Dotted**: `sql-reference`
- **Double-headed**: `reexport`

## Reading orphans

Orphan/floating nodes are rendered under `🪐 DISCONNECTED / FLOATING` and highlighted in red.
A node is orphaned when it has zero incoming edges and is not an entry point (`app/**/page|layout|route`, `middleware`, root config files, `.github/workflows/*`, `tests/**`).
