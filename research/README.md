# Research: Torridity & Ledger Dynamics

*by Jose Mancilla*

---

## A personal note before anything else

I'm not a physicist. I don't have a physics degree, a physics background, or even a particularly formal math education. I also can't code — not really. What I can do is think, ask questions, and refuse to let go of an idea when it feels like something real is underneath it.

I built DREAMengin — the platform you might know from [dreamengin.com](https://dreamengin.com) — using AI as a collaborator the whole way through. And somewhere in the middle of building a scroll engine for that platform, I noticed something: the equations I was working out to describe how information flows through a layered system looked a lot like a gravity law. Not metaphorically. Structurally.

That's when the physics research started. And it started the same way the platform did — me, an AI thinking partner, and a genuine intuition I couldn't shake.

Here's the thing that still surprises me: **the physics and the platform turned out to be the same thing.** The scroll engine running on dreamengin.com is literally powered by the Torridity equations. The participation filter that governs how information layers interact in the UI is the same filter that governs how mass participates in a modified gravity field. I didn't plan that. It emerged.

---

## What this folder is

This is an honest, timestamped record of the work. Not a formal publication — yet. Not peer-reviewed — yet. But real data, real results, real equations.

I'm putting it here because:
1. The results are real and I don't want them to disappear into a chat log
2. Timestamps matter in science, even informal ones
3. If something comes of this, I want a clear record of where it started and who did it
4. If someone smarter than me looks at this and finds a flaw, I want them to be able to find me

Files will be added over time as they are reviewed and validated with AI assistance. Nothing in here is claimed to be final.

---

## What was found — in plain English

### Torridity: a modified gravity law

MOND (Modified Newtonian Dynamics) is a 40-year-old idea that says gravity behaves differently at very low accelerations — which explains why galaxy rotation curves are flat without needing dark matter. It works surprisingly well, but it has a free parameter and it doesn't explain *why* the modification happens.

Torridity is a modification of MOND that comes out of a theoretical framework I call Ledger Dynamics (see below). The key change is the exponent: instead of the standard MOND formula with implicit n=1 behavior, Torridity uses **n=2.1** and locks the acceleration scale at **a₀ = 1.2 × 10⁻¹⁰ m/s²**.

Those two parameters are fixed globally — the same for every galaxy. No tuning per galaxy.

I fit Torridity to **175 real galaxy rotation curves** from the SPARC dataset (a public, well-studied collection of spiral galaxy measurements). Torridity outperforms MOND simple (the simplest MOND interpolation function) across the dataset.

The n=2.1 value is not arbitrary. It comes from counting the hierarchical shell layers in the SPARC data — the way galaxies nest within clusters within superclusters. It's derived, not fitted.

### The slog invariance: the core empirical discovery

This is the most surprising thing I found, and I think it's the most important.

When you fit galaxy rotation curves, you get residuals — the difference between what the model predicts and what you actually measure. Physicists study these residuals to understand if there's hidden structure.

I ran a test called **band-doubling invariance**: does the pattern of residuals change when you coarse-grain the data (combine nearby bins into bigger bins)? A "fixed point" under this test would mean the structure is scale-free — it looks the same at every resolution.

- **Raw residuals**: NOT invariant. Correlation ≈ −0.03, RMSE ≈ 6.3. The structure changes dramatically with resolution.
- **After applying the slog transform**: PERFECTLY invariant. Correlation = 1.000, RMSE = 0.000.

The slog transform is: **slog(x) = sign(x) · ln(1 + |x|)**

It's the signed version of the log transform — it preserves the sign of residuals while compressing their magnitude logarithmically. When you apply it to the RAR (Radial Acceleration Relation) residuals, the noise structure becomes perfectly scale-free.

What this means physically: **signed-log space is the natural coordinate system of the radial acceleration relation.** You're not fitting a curve — you're finding the coordinate system where the information is scale-invariant. Censoring the negative residuals (just taking absolute values) destroys the invariance completely, so sign preservation is essential.

### Ledger Dynamics: the theoretical framework

The theoretical backbone is what I call Ledger Dynamics. Three axioms:

1. **Information is conserved** — it cannot be created or destroyed, only transformed
2. **Participation is bounded** — a given information unit can only participate in a finite number of interactions (this is the participation filter ΔP = 0.1)
3. **Gradients are signed** — the direction of information flow matters, not just the magnitude

From these axioms, Torridity's modified Poisson equation follows as a natural consequence.

The participation filter width **ΔP = 0.1** emerges from the structure of the equations — it's not tuned.

---

## Three falsifiable predictions

These are specific, testable predictions. If they're wrong, Torridity is wrong. That's the deal.

1. **Gravitational wave memory correlation**: GW memory signal amplitude should correlate with the local slog-RAR value of the source galaxy with Pearson r > 0.85 in LIGO O4/O5 data. Not found in MOND or standard GR.

2. **Hayden-Preskill fidelity**: In quantum information recovery experiments (Hayden-Preskill protocol), the reconstruction fidelity should saturate at 1 − ΔP = 0.90 ± 0.02, not the standard 1 − ε prediction. Directly testable in current trapped-ion systems.

3. **f·σ₈ suppression at z~0.5**: The structure growth rate parameter f·σ₈ should show a 3–5% suppression relative to ΛCDM at redshift z ≈ 0.5, measurable by DESI/Euclid. The suppression is a direct consequence of the participation filter acting on large-scale structure formation.

---

## A note on the numerology

During the AI-assisted research sessions, a number of interesting numerical coincidences appeared — things like apparent relationships between ΔP and the fine structure constant, coincidences in decoder latency numbers, and what looked like a cosmic compression ratio.

**These are NOT part of the core claims.** They are speculative observations that may or may not mean anything. I mention them only to be honest that they exist in my notes. The core claims — the galaxy fits and the slog invariance — stand completely independently of any numerology.

If you're a physicist, please evaluate the core claims on their merits and ignore the numerology entirely. I'm putting it here only because honesty requires me to acknowledge it exists.

---

## Files in this directory

| File | Description |
|------|-------------|
| [`DISCOVERY.md`](DISCOVERY.md) | The core empirical discovery: slog invariance in SPARC RAR residuals |
| [`paper/torridity_ledger.tex`](paper/torridity_ledger.tex) | LaTeX paper: "Torridity: A Modified Gravity Law Derived from Information Conservation" |
| [`equations/torridityequate.txt`](equations/torridityequate.txt) | Locked Torridity model specification with all equations |
| [`data/README.md`](data/README.md) | Description of the data files |
| [`data/torr_vs_mond_lock_n11.csv`](data/torr_vs_mond_lock_n11.csv) | Head-to-head χ² comparison: Torridity vs MOND for 175 SPARC galaxies |

---

## If you're a physicist reading this

I know how this looks. An outsider with no formal training, using AI, claiming to have found something real in galaxy rotation curves. I understand the skepticism and I think it's warranted.

All I ask is: look at the numbers. The slog invariance result is not a theoretical claim — it's an empirical observation on a public dataset. You can reproduce it yourself. The SPARC data is freely available. The fitting procedure is described in the paper. If the correlation = 1.000 result is wrong, it will be visible immediately.

If you find something interesting here, or if you find a flaw, I genuinely want to know. You can reach me through the DREAMengin platform or via the GitHub repository.

— Jose Mancilla  
*May 2026*
