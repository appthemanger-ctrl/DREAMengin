# Dream Engine Guardrails (2026)

This repo treats **Supabase migrations** as the schema source of truth and enforces the following in CI:

- **Secrets scanning** via Gitleaks.
- **License compliance**: blocks GPL/AGPL in production dependency graph.
- **Schema drift**: local reset from migrations must match shadow schema diff (`supabase db diff --local` must be empty).
- **TypeScript strict**: `tsc --noEmit`.
- **Build correctness**: `next build` must pass.

Local commands:

- `pnpm licenses:check`
- `pnpm schema:validate` (requires `supabase` CLI)
