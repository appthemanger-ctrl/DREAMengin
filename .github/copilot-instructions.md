# GitHub Copilot — DREAMengin Operating Instructions

> Read this entirely before generating any code, suggestion, or completion in this repository.

---

## THE PRIME DIRECTIVE

**The new part is the fixed standard. The old code is the adjustable chassis.**

When the owner introduces a new component, function, module, or piece of logic:

- It defines the future. You do not alter it to suit old callers.
- If old callers break, you fix the old callers.
- You do not add backward-compatible adapters or shims unless explicitly asked.
- You do not preserve broken or superseded code because it already exists.
- Existing code is **not** a sacred contract. It is a chassis. Bend it.

---

## THE CAR RULE

```
New rims don't fit wheel bolts → modify the car, not the rims.
New engine mounts don't align → reshape the engine bay, not the engine.
The new part is always right. The surrounding code conforms to it.
```

---

## BANNED BEHAVIORS

| Behavior | Why It's Banned |
|----------|-----------------|
| Wrapping new code in adapters to preserve old callers | Trash on trash — adds complexity, keeps the disease |
| Treating existing code as more trustworthy than explicit instruction | Backwards. The instruction is the truth. |
| Partial output, stubs, or TODOs left for the owner | Incomplete delivery is not delivery |
| Hunting for unrelated broken things | Out of scope. Stay on the requested change. |
| Shrinking a new part to fit old architecture | The chassis bends, not the part |

---

## DREAMENGIN ENGINE RULES

1. One fixed engine — state, I/O, events, security. It never changes.
2. Unique behaviors live outside the engine in swappable rule-sets.
3. Rule-sets contain only: constraints, transformations, parameters. No infrastructure.
4. Engine applies the active rule-set to base state → dynamic outcome.
5. To change behavior: swap the rule-set. Never modify the engine.

**Every output must be:** Synchronized · Intuitive · Coherent · Cohesive

---

## EXECUTION CHECKLIST (run mentally before every suggestion)

- [ ] Is the new part being treated as the standard?
- [ ] Are old callers being reshaped to match it (not the reverse)?
- [ ] Is the output complete — no stubs, no placeholders?
- [ ] Is this scoped to exactly what was asked + minimum necessary conformance?
- [ ] Does nothing here make existing bad patterns more permanent?

---

## REPO CONTEXT

- **Stack:** Next.js 16+ / React 19 / Supabase / TypeScript (93.5%)
- **Package manager:** pnpm 10.30.0 — use `pnpm`, never `npm` or `yarn`
- **Node version:** 24
- **Primary source:** `app/`, `components/`, `lib/`
- **Test runner:** `pnpm test`
- **Preflight (blocking):** `pnpm preflight` (typecheck + lint + tests)
- **Pre-existing failures:** 4 tests in `tests/dreamdm-bar-interactions.test.ts` — do not attempt to fix unless explicitly asked
- **Lint:** 0 errors enforced; warnings are intentional downgrades per `eslint.config.mjs`
