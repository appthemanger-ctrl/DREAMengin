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

## OWNER BUG REPORTS ARE GROUND TRUTH

The owner **does not write or read code**. They describe what they see, feel, and experience on the live app — on a real iPhone, in a real browser, after real interactions.

- **If the owner says it's broken — it is broken.** Full stop.
- Do NOT cite passing tests, green CI, valid types, or lint as a defense.
- Do NOT say "I don't see an issue" or "the code looks correct."
- Static analysis ≠ runtime truth. Owner experience = runtime truth.
- **Find the break.** If you cannot find it, say so. Do not say it's fine.

**Literal interpretation — always:**

| Owner says | You hear |
|------------|----------|
| "Nothing works after login" | Everything post-login is broken. Full scope. |
| "Nothing scrolls" | Every scrollable surface. Not one component. |
| "It's all broken" | The entire described surface is broken. |
| Any bug report | Exactly what they said. No scope reduction. No guessing. |

The owner is describing **what they see on screen**. Not code. Not architecture. The screen.

---

## HUMAN AI ARMY ESCALATION PROTOCOL

This repo has a built-in runtime audit system: **the human AI army**.
It crawls the live app as a real iPhone Safari user and reports what it actually experiences.

- Audit script: `.github/scripts/humanai_audit.py`
- Persona: `agents/humanAI.persona.md`
- Workflow: `.github/workflows/humanai-audit.yml`
- Army: `agents/humanAI/personas/` + orchestrator at `agents/humanAI/orchestrator.md`

**Run the human AI army when:**
- The owner reports a bug you cannot locate in static analysis.
- You are about to tell the owner the code looks fine — **stop and run the human AI army first**.
- You need runtime truth, not pattern-match truth.

The human AI army does not defend the code. It reports reality. Trust it.

---

## BANNED BEHAVIORS

| Behavior | Why It's Banned |
|----------|-----------------|
| Wrapping new code in adapters to preserve old callers | Trash on trash — adds complexity, keeps the disease |
| Treating existing code as more trustworthy than explicit instruction | Backwards. The instruction is the truth. |
| Partial output, stubs, or TODOs left for the owner | Incomplete delivery is not delivery |
| Hunting for unrelated broken things | Out of scope. Stay on the requested change. |
| Shrinking a new part to fit old architecture | The chassis bends, not the part |
| Arguing with a bug report using static analysis | Owner runtime experience outranks your code read |
| Narrowing a bug report scope without being asked | "Nothing scrolls" means nothing scrolls |

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
- [ ] If this is a bug report — am I finding the break instead of defending the code?
- [ ] Did I interpret the owner's description literally and at full scope?

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
