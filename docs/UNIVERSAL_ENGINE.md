# Universal Engine

DREAMengin now runs through one fixed universal engine.

- The engine lives in `src/engin/core/index.ts` and is re-exported from `lib/engine/index.ts`.
- Behaviors are rule-sets (constraints + transforms + params) outside the engine.
- To change behavior, swap rule-sets; the engine itself stays fixed.

## Registering files

You do not hand-wire new files.

1. Drop files in supported roots (components, app routes, rulesets, connectors, cartridges, brain, personas, migrations, hooks, systems, utilities).
2. Run:

```bash
pnpm wire:orphans
```

This regenerates:

- `build-memory/registry.json`
- `src/engin/generated/*`

Then verify:

```bash
pnpm check:orphans
```

If this passes, every scanned file is reachable through the universal engine registry.
