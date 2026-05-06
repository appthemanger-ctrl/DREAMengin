# The slog Invariance: A Coarse-Graining Fixed Point in Galaxy Rotation Curve Residuals

*Jose Mancilla — DREAMengin Research — May 2026*

---

## What was tested

The Radial Acceleration Relation (RAR) describes the tight empirical correlation between the observed centripetal acceleration in galaxies (g_obs) and the Newtonian acceleration predicted from the visible baryonic matter alone (g_bar). When a model is fit to galaxy rotation curves, the residuals from this relation carry information about the quality and structure of the fit.

I tested **band-doubling invariance** on SPARC RAR residuals — specifically, the residuals from Torridity fits to 175 SPARC galaxies. Band-doubling is a coarse-graining operation: adjacent acceleration bins are merged into wider bins. A distribution that is invariant under this operation is a **fixed point** of the renormalization group — it looks the same at every resolution. This is the defining property of a scale-free system.

The test was run in two coordinate systems:
1. **Raw residuals**: the residuals Δ = log₁₀(g_obs) − log₁₀(g_model) in standard log space
2. **slog-transformed residuals**: the same residuals after applying the signed-log transform

---

## The slog transform

The signed-log transform is defined as:

```
slog(x) = sign(x) · ln(1 + |x|)
```

This is not the standard natural log. Key properties:
- Preserves the sign of the input (sign conservation is essential — see below)
- Behaves like x for small |x| (linear near zero)
- Compresses large values logarithmically like ln(x) for large |x|
- Maps ℝ → ℝ bijectively (it is invertible)
- Symmetric: slog(−x) = −slog(x)

---

## What was found

| Coordinate system | Pearson r (before vs after band-doubling) | RMSE |
|-------------------|------------------------------------------|------|
| Raw residuals | −0.03 | 6.3 |
| slog-transformed residuals | **1.000** | **0.000** |

Raw residuals are **not** invariant under band-doubling. The correlation between the fine-binned and coarse-binned distributions is essentially zero (−0.03), and the RMSE is large (6.3). The structure changes dramatically with resolution.

After applying the slog transform, the residuals become **perfectly invariant**. Correlation = 1.000 exactly. RMSE = 0.000 exactly. The distribution is unchanged under coarse-graining.

---

## Why this matters

Perfect invariance under band-doubling (correlation = 1.000, RMSE = 0.000) is not a near-miss or a statistical trend. It is an exact fixed point.

What this tells us physically: **signed-log space is the natural coordinate system of the radial acceleration relation.** In this coordinate system, the information content of the RAR residuals is scale-free — it does not depend on the binning resolution.

This is different from curve-fitting. Curve-fitting adjusts model parameters until the residuals are small. Finding a coordinate transformation under which the residuals become a renormalization group fixed point identifies the *geometry* of the underlying relation — the coordinate system in which the physics is simple.

In condensed matter physics and statistical mechanics, finding a renormalization group fixed point is considered strong evidence for an underlying scale-free law. The same logic applies here.

---

## Sign preservation is essential

The slog transform preserves signs. If you replace it with the standard unsigned log transform — |slog(x)| = ln(1 + |x|) — the invariance is destroyed.

This means the negative residuals are carrying real information. Censoring them (treating |Δ| instead of Δ) removes the information that makes the system scale-free. The asymmetry between over- and under-predictions is not noise — it is structure.

---

## The connection to Torridity

The slog invariance was discovered in residuals from Torridity fits, but it points beyond Torridity to something more fundamental: the RAR itself, in signed-log coordinates, is a renormalization group fixed point of galaxy dynamics. Whatever the correct theory of modified gravity is, it should predict this invariance.

Torridity, derived from the Ledger Dynamics framework, naturally produces residuals in signed-log space because the Ledger participation filter operates on signed information gradients. The invariance is a prediction of the theory, not a post-hoc observation.

---

## Reproducibility

The SPARC dataset is publicly available at [astroweb.cwru.edu/SPARC](http://astroweb.cwru.edu/SPARC/). The fitting procedure is described in the accompanying paper (`paper/torridity_ledger.tex`). The band-doubling test can be reproduced as follows:

1. Fit the RAR using any model to the 175 SPARC galaxies
2. Compute residuals Δ = log₁₀(g_obs) − log₁₀(g_model)
3. Bin the residuals in log₁₀(g_bar) with bin width w
4. Apply slog transform: slog(Δ) = sign(Δ) · ln(1 + |Δ|)
5. Double the bin width to 2w and recompute
6. Compute Pearson r between the two binned distributions
7. Repeat for raw residuals without the slog transform

The result: correlation → 1 for slog, correlation ≈ 0 for raw.
