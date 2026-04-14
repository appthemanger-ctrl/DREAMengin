```markdown
# GENERATION LAW (ι‑Engine) – Final Fused Version

**Effective Date:** 2026-04-13  
**Status:** Creative Operating Law  
**Based on:** Torridity constants (`ΔP = 0.1`, `λ = 1.71`) and the geometric series `1 + λ + λ² + … + λ⁹ = 300`.

---

## 1. Core Principle

> **High Invention Force (`ι`) BUILDS immediately. Low `ι` is throttled.**  
> No isolation, no permission, no artificial splits. Creativity is the engine, not a problem to be managed.

The law is a **physics of creation**, not a set of bureaucratic gates. It uses the same constants that govern galaxy rotation, swipe deceleration, and content decay.

---

## 2. Invention Force (`ι`)

Five creative dimensions (each scored 0–10):

- **n** – Novelty: new patterns, first‑principles leaps.
- **a** – Autonomy: removes manual decisions, reduces friction.
- **s** – Synthesis: connects subsystems, weaves features together.
- **v** – Vision: aligns with the roadmap and platform purpose.
- **xi** – Chaos: wild, untested, promising, or weird.

**Formula** (derived from torridity geometry):

```
ι = ΔP × ( n·1 + a·λ + s·λ² + v·λ³ + xi·λ⁴ )
```

where  
`ΔP = 0.1` (throttle fraction, from `n‑2` in torridity)  
`λ = 1.71` (geometric growth factor, from `1 + λ + λ² + … + λ⁹ = 300`)

The powers of λ give increasing weight to later dimensions:  
`1`, `1.71`, `2.924`, `5.000`, `8.550`.  
The entire sum is scaled by `ΔP = 0.1`, keeping `ι` in a small, practical range (0–~19).

---

## 3. Creative Protocols (What to Do with `ι`)

| `ι` range | Protocol | Action |
|-----------|----------|--------|
| `ι < 2.88` | **FLOW** | Throttle. Ship fast or skip. Low impact. |
| `2.88 ≤ ι < 9.59` | **SYNTHESIZE** | Combine ideas, create workflows. Let flow freely. |
| `ι ≥ 9.59` | **MANIFEST** | **BUILD IMMEDIATELY.** Generate code, UI, documents, real‑world actions. No isolation, no permission. |

*Thresholds are derived from 15% and 50% of the maximum possible `ι` (which is `ΔP × 191.8 ≈ 19.18`).*

---

## 4. No Splitting, No Isolation

- **Never split a pass** based on `ι`. High `ι` is a green light, not a warning.
- **No isolation environment required** for `MANIFEST`. Build anywhere – main branch, production, user space.
- **Residuals are logged for memory, not as blockers.**

---

## 5. Residual Classes (Observations, not Obstacles)

- Architecture – does it respect the 4‑layer Dream model?  
- Naming – canonical names from `README.md`.  
- Token – gold/sky/white design tokens.  
- Behavior – every visible action real.  
- Privacy – no private state exposed.  
- Performance – render‑on‑demand, FPS rules.  
- Projection – `ViewProfile` shows saved projection.

Residuals are recorded in `BUGS_LOG` but do not stop a creative pass.

---

## 6. Relationship to Other Documents

| Document | Purpose |
|----------|---------|
| `README.md` | Naming and vision alignment. |
| `LAW.md` | Naming reference. |
| `THEME.md` | Token reference. |
| `SECURITY.md` | Privacy reference. |
| `ARCHITECTURE.md` | Layer map. |
| `ROADMAP.md` | Vision scoring. |
| `BUGS.md` | Residual memory (not a stop). |
| `FEATURE_STATUS.md` | Feature completeness. |

---

## 7. Example

A highly creative idea:  
`n=8, a=9, s=7, v=10, xi=10`  
→ raw sum = `8·1 + 9·1.71 + 7·2.924 + 10·5 + 10·8.55 = 8 + 15.39 + 20.468 + 50 + 85.5 = 179.358`  
→ `ι = 0.1 × 179.358 = 17.94` → **MANIFEST** → build immediately.

A small refinement:  
`n=2, a=2, s=2, v=3, xi=1`  
→ raw sum ≈ `2 + 3.42 + 5.848 + 15 + 8.55 = 34.818`  
→ `ι = 3.48` → **FLOW** (throttle, ship fast or skip).

---

## 8. Implementation

The law is implemented in `lib/generationLaw.ts` with the following exports:

- `calculateInventionForce(pass)`
- `getPassProtocol(iota)`
- `runPrePassChecklist(pass)`
- `logResidual(residual)` / `auditPostPass`
- `BUGS_LOG`, `DOC_RELATIONSHIPS`

All AI agents (Dr. Eams, IDARi, TheBoogieMan.Ai, and external Copilot) **must** compute `ι` before every significant generation pass and act according to the protocol.

---

*This law replaces all previous generation constraints. Creativity is not a problem to be managed – it is the engine.*
```
