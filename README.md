# DREAMengin UI & UX Specification (LaTeX)

This zip contains:
- `dreamengin-ux-spec.tex` — the LaTeX source you asked me to prepare.

## How to compile to PDF

### Option A — Overleaf (no install)
1. Go to https://www.overleaf.com
2. Create a new project → "Upload Project".
3. Drag `dreamengin-ux-spec.tex` in and click **Recompile**.

### Option B — Local TeX (Mac/Linux/Windows)
1. Install a LaTeX distribution (TeX Live / MacTeX / MiKTeX).
2. Compile:
   ```bash
   pdflatex dreamengin-ux-spec.tex
   pdflatex dreamengin-ux-spec.tex
   ```
   (Run twice for proper references.)

If your TeX installation is minimal, you may need these common packages:
`geometry`, `hyperref`, `enumitem`, `xcolor`, `titlesec`, `array`, `longtable`.

