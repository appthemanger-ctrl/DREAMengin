# AI MAP

## ENTRY ORDER (STRICT)
1. `/README.md`
2. `/docs/AI_MAP.md`
3. `/docs/REPO_STRUCTURE_CONTRACT.md`
4. `/app`
5. `/components`
6. `/lib`

---

## SYSTEM OVERVIEW
- `app/` → product routes + API endpoints
- `components/` → UI and surface components
- `lib/` → shared logic, adapters, utilities
- `.github/workflows/` → active CI/CD automation
- `system/` → archived/operational infrastructure artifacts
- `docs/` → architecture, policy, guides, logs
- `assets/` → non-runtime static asset archives
- `experiments/` → unstable and non-authoritative work

---

## CANONICAL ROOT LAYOUT
Canonical root entries are enforced to:
- `app/`, `components/`, `lib/` (temporary), `engins/`, `games/`
- `core/`, `system/`, `agents/`
- `docs/`, `assets/`, `.github/`, `public/`, `styles/`, `tests/`, `scripts/`
- root config/runtime files only (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `next.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.js`, `tailwind.config.ts`, `README.md`, `LICENSE`, `vercel.json`, optional `instrumentation.ts`, optional `middleware.ts`, env/gitignore files)

Enforcement:
- `/.github/scripts/check-root-hygiene.sh`
- `/.github/workflows/root-hygiene.yml`

---

## WHERE TO LOOK
### Product logic
`/app`, `/components`, `/lib`

### Important configs
Root config files (`next.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.*`, `tailwind.config.ts`, `package.json`)

### Active automations
`/.github/workflows`

### Cleanup and governance
`/docs/REPO_STRUCTURE_CONTRACT.md`

---

## IGNORE BY DEFAULT
- `/assets/images`
- `/system/ci/archive`
- `/agents/archive`
- `/docs/logs`
- `/experiments`

---

## GOAL
Understand system behavior quickly with deterministic navigation.
