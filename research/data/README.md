# Data Files: Torridity SPARC Fits

This directory contains the numerical output of Torridity galaxy rotation curve fits against the SPARC dataset.

---

## `torr_vs_mond_lock_n11.csv`

**Head-to-head χ² comparison: Torridity (n=2.1 locked) vs MOND simple for all 175 SPARC galaxies.**

Parameters used:
- Torridity: n=2.1 (globally locked), a₀=1.2×10⁻¹⁰ m/s² (globally locked)
- MOND simple: standard simple interpolation function, same a₀
- Per-galaxy free parameters (both models): Υ_disk, Υ_bul

### Column descriptions

| Column | Description |
|--------|-------------|
| `name` | SPARC galaxy identifier |
| `quality` | SPARC quality flag (1=best, 3=worst) |
| `npts` | Number of rotation curve data points |
| `torr_chi2` | Total χ² for Torridity fit |
| `torr_chi2_red` | Reduced χ² for Torridity fit (= torr_chi2 / (npts − 2)) |
| `torr_Mdisk` | Best-fit stellar mass-to-light ratio, disk (Torridity) |
| `torr_Mbul` | Best-fit stellar mass-to-light ratio, bulge (Torridity; 0 if no bulge) |
| `mond_chi2` | Total χ² for MOND simple fit |
| `mond_chi2_red` | Reduced χ² for MOND simple fit |
| `mond_Mdisk` | Best-fit stellar mass-to-light ratio, disk (MOND) |
| `mond_Mbul` | Best-fit stellar mass-to-light ratio, bulge (MOND; 0 if no bulge) |
| `dchi2` | Δχ² = torr_chi2_red − mond_chi2_red. **Negative = Torridity wins.** |
| `winner` | `torr` if dchi2 < 0, `mond` if dchi2 > 0, `tie` if dchi2 = 0 |

### Summary statistics

- 175 galaxies total
- Torridity wins: 127/175 (73%)
- MOND wins: 48/175 (27%)
- Median reduced χ² — Torridity: 1.42 | MOND simple: 1.61

---

## Forthcoming data files

Additional data files will be added as they are validated:

- `slog_invariance_test.csv` — band-doubling test results (raw vs slog residuals)
- `beta_stacking.csv` — β-parameter stacking by radial bin
- `sparc_rar_residuals.csv` — full RAR residual table for all 175 galaxies

---

*Data generated: May 2026. SPARC source dataset: Lelli, McGaugh & Schombert (2016), AJ 152 157. Publicly available at astroweb.cwru.edu/SPARC.*
