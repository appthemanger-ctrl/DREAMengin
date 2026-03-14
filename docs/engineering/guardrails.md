# DREAMengin Engineering Guardrails

Last updated: 2026-03-14

## Guardrails

- `README.md` is the product authority.
- Favor spec names over legacy repo wording.
- Repurpose existing systems before adding new ones.
- Keep privacy-first behavior intact.
- Keep HomeDream private-source logic separate from ViewProfile output logic.
- Keep DreamAds separate from platform promotion systems.
- Keep AI roles separated: Dr. Eams user-facing, IDARi admin-only, TheBoogieMan.Ai enforcement.
- Keep Node 24, pnpm, Next.js 16+, and Supabase assumptions stable unless a real repo need requires change.

---

## Hard Blocks vs Advisory Checks

**The app is action-first.** Guard rails must not intercept normal user actions.
Only wrap truly dangerous cases with hard blocks.

### Hard blocks (always enforce — gate the action)
- Any mutation (POST/PUT/DELETE) without `supabase.auth.getUser()` check → **block**
- Admin or owner-only routes accessed by non-admin users → **block**
- Destructive deletes without confirmed ownership verification → **block**
- Writing data to a profile or workspace that belongs to another user → **block**

### Advisory only (log, warn, or annotate — never gate normal flow)
- TypeScript type errors (pre-existing errors exist; Next.js SWC build skips type validation)
- ESLint lint warnings (style, best-practices — do not fail the pipeline)
- `TODO` / `FIXME` comments in non-critical paths
- Optional feature checks (connector availability, optional platform capabilities)

### CI / Build gates
- **Build failing** → always a hard gate. The `pnpm run build` step must pass.
- **Tests failing** → hard gate. `pnpm run test:ci` must pass.
- **Lint warnings** → advisory. `continue-on-error: true` in workflow.
- **Typecheck warnings** → advisory. `continue-on-error: true` in workflow.

See `docs/ACTION_AUDIT.md` for a full label of every user-facing action.

