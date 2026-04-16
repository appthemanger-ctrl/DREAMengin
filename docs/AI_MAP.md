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
