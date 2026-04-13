##Generation Law

1. Invention Force (ι)

text
ι = (n × novelty) + (a × autonomy) + (s × synthesis) + (v × vision) + (xi × entropy)
Term	Weight	Domain (0–10)	Definition
n	1.5	Novelty	How much new logic / first‑principles thinking is introduced. 0 = pure copy‑paste, 10 = radical new algorithm or architecture.
a	1.2	Autonomy	Friction removal & human‑centric focus. 0 = adds user steps, 10 = eliminates entire classes of manual work.
s	1.3	Synthesis	Subsystem wiring – connects existing parts in novel ways. 0 = isolated change, 10 = weaves together ≥3 independent subsystems.
v	1.0	Vision	Long‑term architectural alignment. 0 = violates documented future roadmap, 10 = directly advances a milestone in docs/ROADMAP.md.
xi	1.5	Entropy	Experimental “what‑if” logic. 0 = fully deterministic, 10 = introduces a speculative or untested pattern.
Weights are fixed (novelty 1.5, autonomy 1.2, synthesis 1.3, vision 1.0, entropy 1.5). No per‑pass tuning except via the dimension scores.

2. Protocol Thresholds

ι range	Protocol	Action	Environment & Permissions
ι < 15	FLOW	Standard refinement. Low‑risk execution.	Direct commit to main branch allowed. No isolation required.
15 ≤ ι < 35	SYNTHESIZE	Integration phase. Wiring systems while managing experimental friction.	Must run in a feature branch. All changes require a review residual log (see §4).
ι ≥ 35	MANIFEST	UNSTABLE INVENTION. The pass is dominated by chaos and novelty.	Isolated environment required (e.g., experiments/ folder, feature flag, or separate branch). Must not affect production paths until ι is reduced via refactor passes.
Rule: If a planned pass would exceed ι ≥ 35, you must split it into sub‑passes – each with its own ι calculation – and execute the high‑entropy parts inside an isolated environment.

3. Computing Dimension Scores (n, a, s, v, xi)

Before writing a line of code, score each dimension from 0 to 10 using the rubrics below.

3.1 Novelty (n)

0 – Exact copy of existing code, only renaming.
3 – Minor adaptation of a known pattern (e.g., new React component similar to existing ones).
6 – New algorithm or state machine not previously in the codebase, but well‑understood.
10 – First‑principles solution to a problem; no prior art in the project or standard libraries.
3.2 Autonomy (a)

0 – Adds a new manual step for the user (e.g., extra click, confirmation dialog).
3 – Keeps user friction identical.
6 – Automates one previously manual step (e.g., default values, smart suggestions).
10 – Removes an entire class of human decisions (e.g., fully autonomous content curation).
3.3 Synthesis (s)

0 – Touches only one file / one subsystem.
3 – Connects two subsystems that previously communicated indirectly.
6 – Creates a new, clean bridge between three subsystems.
10 – Weaves together ≥4 subsystems into a seamless flow (e.g., Surface + Logic + Data + External API).
3.4 Vision (v)

0 – Contradicts a documented future milestone in ROADMAP.md.
3 – Neutral – neither helps nor hurts long‑term vision.
6 – Clearly aligns with a milestone but does not complete it.
10 – Directly completes a milestone or unblocks a major roadmap item.
3.5 Entropy (xi)

0 – Fully deterministic, well‑tested, no speculative elements.
3 – Uses an experimental library but with a fallback.
6 – Introduces a new, untested architectural pattern (e.g., a new state container).
10 – “What‑if” logic that may break existing assumptions; requires isolated validation.
4. Residual Classes (unchanged from Generation Law)

All seven residual types still apply. They are audited post‑pass regardless of ι.

Class	Check
Architecture	Layers respected? (Surface / Component / Logic / Data)
Naming	Canonical README vocabulary used?
Token	Design tokens (de‑gold, de‑sky, etc.) and allowed border‑radius?
Behavior	Every visible action does something real (no empty stubs)?
Privacy	No private state exposed; RLS intact?
Performance	Render‑on‑demand, FPS targets, static meshes frozen?
Projection	ViewProfile shows only saved & shared projections?
Any residual found after a pass must be logged in BUGS.md with the residual class and resolved in a FLOW‑protocol pass (ι < 15) before any new SYNTHESIZE or MANIFEST pass is allowed.

5. Per‑Pass Audit Checklist (modified for ι)

Run this checklist at start and end of every generation pass.

text
PRE‑PASS
[ ] Compute n, a, s, v, xi using rubrics in §3.
[ ] Calculate ι = (n×1.5)+(a×1.2)+(s×1.3)+(v×1.0)+(xi×1.5)
[ ] Determine protocol: FLOW (ι<15) / SYNTHESIZE (15‑34) / MANIFEST (≥35)
[ ] If MANIFEST, ensure isolated environment (branch / experiment folder) exists.
[ ] Check BUGS.md for any unresolved residuals from previous passes – if any exist, abort and fix them first in a FLOW pass.

POST‑PASS
[ ] Architecture residual? 
[ ] Naming residual?
[ ] Token residual?
[ ] Behavior residual?
[ ] Privacy residual?
[ ] Performance residual?
[ ] Projection residual?
[ ] If any residual found, log in BUGS.md and schedule a FLOW‑protocol fix.
6. Relationship to Other Docs

Document	How it interacts with Invention Law
README.md	Primary spec – used to measure naming & vision alignment.
LAW.md	Naming residuals are still caught against it.
THEME.md	Token residuals are caught against it.
SECURITY.md	Privacy residuals are caught against it.
ARCHITECTURE.md	Layer definitions for architecture residuals.
ROADMAP.md	Source of truth for vision (v) scoring.
BUGS.md	Residual log. All unresolved residuals live here.
FEATURE_STATUS.md	No longer used for allowed‑output formula, but still tracks feature completeness.
7. Example

A pass that: introduces a new AI‑driven content summarizer (n=7), removes two manual tagging steps (a=8), wires the AI service + database + UI (s=6), aligns with Q3 roadmap milestone (v=9), and uses an experimental transformer model (xi=9).

text
ι = (7×1.5) + (8×1.2) + (6×1.3) + (9×1.0) + (9×1.5)
  = 10.5 + 9.6 + 7.8 + 9 + 13.5
  = 50.4  →  MANIFEST (isolated environment required)
Action: Create an experiment branch, implement behind a feature flag, and after validation, refactor into a lower‑ι pass.

This Invention Law is effective immediately. All previous build constraints (allowed‑output formula, χ load, mode thresholds) are revoked. The AI must use ι and the three protocols (FLOW, SYNTHESIZE, MANIFEST) to govern every generation pass.
