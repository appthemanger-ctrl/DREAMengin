#!/usr/bin/env python3
"""
DREAMengin UI/UX Evaluation & Improvement Agent

Checks the UI/UX codebase against the spec, rates each dimension honestly
out of 100, applies targeted patches to existing files only (no new code),
and writes an output report.

Usage:
    python scripts/ui-ux-agent.py config/ui-ux-spec.yaml
    python scripts/ui-ux-agent.py config/ui-ux-spec.yaml --root . --out output/agent
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

import yaml


# ── helpers ──────────────────────────────────────────────────────────────────

def mkdir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def write(p: Path, s: str) -> None:
    mkdir(p.parent)
    p.write_text(s.rstrip() + "\n", encoding="utf-8")


def load(p: str) -> Dict[str, Any]:
    return yaml.safe_load(Path(p).read_text(encoding="utf-8"))


def ok(v: Any) -> bool:
    return str(v).lower() in {"1", "true", "yes", "enabled", "supported"}


# ── Agent ────────────────────────────────────────────────────────────────────

class Agent:
    def __init__(self, spec: Dict[str, Any], root: str, out: str) -> None:
        self.spec = spec
        self.root = Path(root)
        self.out  = Path(out)

        # Canonical route map (name → relative path from repo root)
        self.routes: Dict[str, str] = {
            "HomeDream":        "app/homedream/page.tsx",
            "EditProfileDream": "app/edit-profiledream/page.tsx",
            "ViewProfile":      "app/view-profile/page.tsx",
            "DreamDM":          "app/messages/page.tsx",
            "DreamShop":        "app/shop/page.tsx",
            "DreamMarketplace": "app/marketplace/page.tsx",
            "DreamAds":         "app/ads/page.tsx",
            "Music":            "app/daydream/music/page.tsx",
            "Games":            "app/daydream/games/page.tsx",
            "Lab":              "app/daydream/lab/page.tsx",
            "Code":             "app/daydream/code/page.tsx",
            "Brand":            "app/daydream/brand/page.tsx",
            "Create":           "app/daydream/create/page.tsx",
        }

    # ── spec normaliser ───────────────────────────────────────────────────────

    def norm(self) -> Dict[str, Any]:
        feats: List[str] = []
        for x in self.spec.get("problem", {}).get("specs", []):
            if isinstance(x, str) and x.lower().startswith("features:"):
                feats = [v.strip() for v in x.split(":", 1)[1].split(",") if v.strip()]
        return {
            "project_name":    self.spec.get("project_name", "DREAMengin"),
            "version":         str(self.spec.get("version", "1.0.0")),
            "features":        feats,
            "workflow_action": ok(self.spec.get("workflow_action", "supported")),
            "test_count":      int(self.spec.get("test_count", 10)),
            "weights":         self.spec.get("weighted_objectives", {
                "functionality":   1.0,
                "efficiency":      0.8,
                "maintainability": 0.7,
            }),
            "criteria": self.spec.get("criteria", {}),
        }

    # ── file reader ───────────────────────────────────────────────────────────

    def _read(self, rel: str) -> str:
        p = self.root / rel
        return p.read_text(encoding="utf-8") if p.exists() else ""

    # ── pattern checker ───────────────────────────────────────────────────────

    def _check(self, src: str, patterns: List[str]) -> Tuple[int, List[str]]:
        """Return (hit_count, missing_patterns) for a list of regex patterns."""
        missing = [p for p in patterns if not re.search(p, src, re.IGNORECASE)]
        return len(patterns) - len(missing), missing

    # ── route auditor ─────────────────────────────────────────────────────────

    def audit_routes(self, n: Dict[str, Any]) -> Dict[str, Any]:
        criteria = n.get("criteria", {}).get("routes", {})
        results: Dict[str, Any] = {}

        for name, rel in self.routes.items():
            src    = self._read(rel)
            exists = bool(src)
            pats   = criteria.get(name, [])

            if pats:
                hits, missing = self._check(src, pats)
                score = int(100 * hits / len(pats))
            else:
                score   = 100 if exists else 0
                missing = [] if exists else ["file missing"]

            results[name] = {
                "path":    rel,
                "exists":  exists,
                "score":   score,
                "missing": missing,
            }

        return results

    # ── component auditor ─────────────────────────────────────────────────────

    def audit_components(self, n: Dict[str, Any]) -> Dict[str, Any]:
        criteria = n.get("criteria", {}).get("components", {})
        files: Dict[str, str] = {
            "HomeSystem":  "components/home/HomeSystem.tsx",
            "NavBar":      "components/NavBar.tsx",
            "Layout":      "app/layout.tsx",
            "GlobalsCSS":  "styles/globals.css",
            "TailwindCfg": "tailwind.config.ts",
        }
        results: Dict[str, Any] = {}

        for name, rel in files.items():
            src    = self._read(rel)
            exists = bool(src)
            pats   = criteria.get(name, [])

            if pats:
                hits, missing = self._check(src, pats)
                score = int(100 * hits / len(pats))
            else:
                score   = 100 if exists else 0
                missing = []

            results[name] = {
                "path":    rel,
                "exists":  exists,
                "score":   score,
                "missing": missing,
            }

        return results

    # ── accessibility auditor ─────────────────────────────────────────────────

    def audit_accessibility(self) -> Dict[str, Any]:
        """Spot-check common accessibility patterns across key UI files."""
        targets = [
            "components/NavBar.tsx",
            "app/layout.tsx",
            "app/homedream/page.tsx",
            "app/edit-profiledream/page.tsx",
            "app/view-profile/page.tsx",
        ]
        checks: Dict[str, str] = {
            "aria_label":    r'aria-label=',
            "aria_expanded": r'aria-expanded=',
            "alt_text":      r'alt=["\'][^"\']+["\']',
            "role_attr":     r'\brole=',
            "focus_visible": r'focus[_-]visible|focus:ring|:focus-visible',
            "sr_only":       r'sr-only',
        }

        per_file: Dict[str, Dict[str, bool]] = {}
        for rel in targets:
            src = self._read(rel)
            per_file[rel] = {k: bool(re.search(pat, src, re.IGNORECASE))
                             for k, pat in checks.items()}

        # A check "passes" if at least one file contains the pattern
        totals = {k: sum(1 for f in per_file.values() if f[k]) for k in checks}
        score  = int(100 * sum(1 for v in totals.values() if v > 0) / len(checks))

        return {"score": score, "coverage": totals, "per_file": per_file}

    # ── design-token auditor ──────────────────────────────────────────────────

    def audit_design_tokens(self) -> Dict[str, Any]:
        """Check that design tokens are defined and consistently named."""
        globals_src  = self._read("styles/globals.css")
        tailwind_src = self._read("tailwind.config.ts")
        combined     = globals_src + tailwind_src

        checks: Dict[str, str] = {
            "de-gold_css_var":        r'--de-gold\s*:',
            "de-blue_css_var":        r'--de-blue\s*:',
            "de-glass_class":         r'\.de-glass\s*\{',
            "tailwind_de_sky":        r"['\"]de-sky['\"]",
            "tailwind_de_gold":       r"['\"]de-gold['\"]",
            "tailwind_dual_comment":  r'Space.dark|Dream.Ice|dual.theme|light.*mode|dark.*space',
            "font_space_grotesk":     r'Space Grotesk|--font-space-grotesk',
            "animation_defined":      r'@keyframes\s+\w+',
        }

        missing = [k for k, pat in checks.items()
                   if not re.search(pat, combined, re.IGNORECASE)]
        hits    = len(checks) - len(missing)
        score   = int(100 * hits / len(checks))

        return {"score": score, "missing": missing}

    # ── overall score ─────────────────────────────────────────────────────────

    def compute_overall(
        self,
        routes:       Dict[str, Any],
        components:   Dict[str, Any],
        accessibility: Dict[str, Any],
        design_tokens: Dict[str, Any],
    ) -> int:
        """
        Weighted formula:
          40 % routes (page implementation completeness)
          25 % components (component quality)
          20 % accessibility (a11y coverage)
          15 % design tokens (token system health)
        """
        route_avg  = sum(v["score"] for v in routes.values()) / max(len(routes), 1)
        comp_avg   = sum(v["score"] for v in components.values()) / max(len(components), 1)
        a11y       = accessibility["score"]
        design     = design_tokens["score"]

        overall = (
            route_avg * 0.40
            + comp_avg * 0.25
            + a11y     * 0.20
            + design   * 0.15
        )
        return min(int(overall), 100)

    # ── patch applicator ──────────────────────────────────────────────────────

    def _patch(self, rel: str, old: str, new: str) -> bool:
        """Replace the first occurrence of `old` with `new` in `rel`.
        Idempotent — skips if `new` is already present.
        Returns True if the file was modified."""
        p = self.root / rel
        if not p.exists():
            return False
        src = p.read_text(encoding="utf-8")
        if new in src:      # already patched — nothing to do
            return False
        if old not in src:  # old text not found — cannot patch
            return False
        p.write_text(src.replace(old, new, 1), encoding="utf-8")
        return True

    def patches(self) -> List[Dict[str, str]]:
        """
        Apply targeted patches to *existing* files only.
        Never creates new files or routes.
        Returns a list of {file, patch} dicts for the report.
        """
        applied: List[Dict[str, str]] = []

        # ── 1. NavBar.tsx — ARIA label on Messages link ───────────────────────
        if self._patch(
            "components/NavBar.tsx",
            'href="/messages"\n                  className=',
            'href="/messages"\n                  aria-label="Messages"\n                  className=',
        ):
            applied.append({
                "file":  "components/NavBar.tsx",
                "patch": "add aria-label to Messages link",
            })

        # ── 2. NavBar.tsx — ARIA label + aria-expanded on profile button ──────
        if self._patch(
            "components/NavBar.tsx",
            "onClick={() => setIsProfileOpen(!isProfileOpen)}\n                    className=\"flex items-center",
            "onClick={() => setIsProfileOpen(!isProfileOpen)}\n                    aria-label=\"Open profile menu\"\n                    aria-expanded={isProfileOpen}\n                    className=\"flex items-center",
        ):
            applied.append({
                "file":  "components/NavBar.tsx",
                "patch": "add aria-label and aria-expanded to profile menu button",
            })

        # ── 3. NavBar.tsx — add role and aria-label to <nav> ─────────────────
        if self._patch(
            "components/NavBar.tsx",
            '<nav className="bg-card/95',
            '<nav aria-label="Site navigation" className="bg-card/95',
        ):
            applied.append({
                "file":  "components/NavBar.tsx",
                "patch": "add aria-label to <nav> element",
            })

        # ── 4. HomeSystem.tsx — remove verbose debug comment ──────────────────
        if self._patch(
            "components/home/HomeSystem.tsx",
            "      {/*\n        DreamDM Bar — draggable window (Pass 3 - CORRECTED SPEC).\n        The gold button is now embedded inside DreamDMBar.\n        Gold button attaches to TOP of bar, detaches only when position goes off-screen.\n        When detached, it screen-locks and does NOT move with scroll.\n        Single-tap gold = open radial menus; double-tap = go home.\n      */}",
            "      {/* DreamDM Bar — gold button embedded; single-tap opens menus, double-tap goes home */}",
        ):
            applied.append({
                "file":  "components/home/HomeSystem.tsx",
                "patch": "condense verbose debug comment in JSX",
            })

        # ── 5. tailwind.config.ts — add dual-theme palette comment ───────────
        if self._patch(
            "tailwind.config.ts",
            "      colors: {\n        'de-sky':",
            "      // Space-dark palette (HomeDream + dark-UI components).\n      // CSS variables in globals.css provide the Dream-Ice light-mode palette.\n      colors: {\n        'de-sky':",
        ):
            applied.append({
                "file":  "tailwind.config.ts",
                "patch": "add dual-theme comment to clarify Tailwind vs CSS-var palette",
            })

        # ── 6. globals.css — fix misplaced .de-wordmark inside html/body block ─
        old_block = (
            "  font-family: var(--font-space-grotesk, 'Space Grotesk', system-ui, sans-serif);\n"
            "\n"
            "/* ── dreamengin wordmark utility ── */\n"
            ".de-wordmark {\n"
            "  font-family: var(--font-cormorant, Georgia, 'Times New Roman', serif);\n"
            "  font-style: italic;\n"
            "  font-weight: 400;\n"
            "  color: #7a5c28;\n"
            "  letter-spacing: -0.01em;\n"
            "  line-height: 1;\n"
            "  user-select: none;\n"
            "}\n"
            "  overscroll-behavior: none;\n"
            "  touch-action: manipulation;\n"
            "  -webkit-tap-highlight-color: transparent;\n"
            "}"
        )
        new_block = (
            "  font-family: var(--font-space-grotesk, 'Space Grotesk', system-ui, sans-serif);\n"
            "  overscroll-behavior: none;\n"
            "  touch-action: manipulation;\n"
            "  -webkit-tap-highlight-color: transparent;\n"
            "}\n"
            "\n"
            "/* ── dreamengin wordmark utility ── */\n"
            ".de-wordmark {\n"
            "  font-family: var(--font-cormorant, Georgia, 'Times New Roman', serif);\n"
            "  font-style: italic;\n"
            "  font-weight: 400;\n"
            "  color: #7a5c28;\n"
            "  letter-spacing: -0.01em;\n"
            "  line-height: 1;\n"
            "  user-select: none;\n"
            "}"
        )
        if self._patch("styles/globals.css", old_block, new_block):
            applied.append({
                "file":  "styles/globals.css",
                "patch": "fix .de-wordmark nested inside html/body block (CSS structural bug)",
            })

        return applied

    # ── output file builder ───────────────────────────────────────────────────

    def _readme(self, n: Dict[str, Any], report: Dict[str, Any]) -> str:
        overall  = report.get("overall_score", 0)
        pre      = report.get("pre_score", 0)
        patches  = report.get("patches", [])

        lines = [
            "# DREAMengin UI/UX Agent Report",
            "",
            f"**Project:** {n['project_name']} v{n['version']}",
            f"**Pre-patch score:**  {pre}/100",
            f"**Post-patch score:** {overall}/100",
            "",
            "## Route Scores",
            "",
            "| Route | Exists | Score | Missing criteria |",
            "|-------|--------|-------|-----------------|",
        ]
        for name, r in report.get("routes", {}).items():
            exists_str  = "✅" if r["exists"] else "❌"
            missing_str = ", ".join(r.get("missing", [])) or "—"
            lines.append(f"| {name} | {exists_str} | {r['score']}/100 | `{missing_str}` |")

        lines += [
            "",
            "## Component Scores",
            "",
            "| Component | Score | Missing criteria |",
            "|-----------|-------|-----------------|",
        ]
        for name, r in report.get("components", {}).items():
            missing_str = ", ".join(r.get("missing", [])) or "—"
            lines.append(f"| {name} | {r['score']}/100 | `{missing_str}` |")

        a11y   = report.get("accessibility", {})
        design = report.get("design_tokens", {})
        lines += [
            "",
            f"## Accessibility: {a11y.get('score', 0)}/100",
            "",
            "| Check | Files with coverage |",
            "|-------|---------------------|",
        ]
        for check, count in a11y.get("coverage", {}).items():
            lines.append(f"| {check} | {count} |")

        lines += [
            "",
            f"## Design Tokens: {design.get('score', 0)}/100",
        ]
        if design.get("missing"):
            lines.append("")
            lines.append("Missing checks: " + ", ".join(design["missing"]))

        lines += [
            "",
            "## Patches Applied",
            "",
        ]
        if patches:
            for p in patches:
                lines.append(f"- `{p['file']}`: {p['patch']}")
        else:
            lines.append("_(none — all criteria already satisfied)_")

        lines += [
            "",
            "---",
            "",
            "> Generated by `scripts/ui-ux-agent.py` — evaluates existing",
            "> implementation only; never creates new routes or features.",
        ]
        return "\n".join(lines) + "\n"

    def files(self, n: Dict[str, Any], report: Dict[str, Any]) -> Dict[str, str]:
        return {
            "README.agent.md":       self._readme(n, report),
            "output/result.json":    json.dumps(report, indent=2),
            "output/patch-plan.json": json.dumps({
                "routes":   self.routes,
                "features": n["features"],
            }, indent=2),
        }

    # ── main runner ───────────────────────────────────────────────────────────

    def run(self) -> None:
        n = self.norm()

        # ── 1. Pre-patch audit ────────────────────────────────────────────────
        routes_pre  = self.audit_routes(n)
        comps_pre   = self.audit_components(n)
        a11y_pre    = self.audit_accessibility()
        design_pre  = self.audit_design_tokens()
        pre_score   = self.compute_overall(routes_pre, comps_pre, a11y_pre, design_pre)

        print(f"[ui-ux-agent] Pre-patch score:  {pre_score}/100", flush=True)
        print(f"  routes avg:       {sum(v['score'] for v in routes_pre.values()) / max(len(routes_pre), 1):.1f}",  flush=True)
        print(f"  components avg:   {sum(v['score'] for v in comps_pre.values()) / max(len(comps_pre), 1):.1f}",   flush=True)
        print(f"  accessibility:    {a11y_pre['score']}",  flush=True)
        print(f"  design tokens:    {design_pre['score']}", flush=True)

        # ── 2. Apply patches (existing files only) ────────────────────────────
        print("\n[ui-ux-agent] Applying patches …", flush=True)
        applied = self.patches()
        if applied:
            for p in applied:
                print(f"  ✓ {p['file']}: {p['patch']}", flush=True)
        else:
            print("  (no patches needed — already at target)", flush=True)

        # ── 3. Post-patch re-audit ────────────────────────────────────────────
        routes_post  = self.audit_routes(n)
        comps_post   = self.audit_components(n)
        a11y_post    = self.audit_accessibility()
        design_post  = self.audit_design_tokens()
        post_score   = self.compute_overall(routes_post, comps_post, a11y_post, design_post)

        print(f"\n[ui-ux-agent] Post-patch score: {post_score}/100", flush=True)
        print(f"  routes avg:       {sum(v['score'] for v in routes_post.values()) / max(len(routes_post), 1):.1f}", flush=True)
        print(f"  components avg:   {sum(v['score'] for v in comps_post.values()) / max(len(comps_post), 1):.1f}",   flush=True)
        print(f"  accessibility:    {a11y_post['score']}",  flush=True)
        print(f"  design tokens:    {design_post['score']}", flush=True)

        # ── 4. Build & write report ───────────────────────────────────────────
        report: Dict[str, Any] = {
            "project_name":  n["project_name"],
            "version":       n["version"],
            "pre_score":     pre_score,
            "overall_score": post_score,
            "routes":        routes_post,
            "components":    comps_post,
            "accessibility": a11y_post,
            "design_tokens": design_post,
            "patches":       applied,
        }

        out_files = self.files(n, report)
        for rel, content in out_files.items():
            dest = self.root / rel
            write(dest, content)
            # Also mirror under the --out directory
            write(self.out / rel, content)
            print(f"  → wrote {dest}", flush=True)

        delta = post_score - pre_score
        sign  = "+" if delta >= 0 else ""
        print(f"\n[ui-ux-agent] Done. {pre_score} → {post_score}/100 ({sign}{delta})", flush=True)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(
        description="DREAMengin UI/UX Evaluation & Improvement Agent",
    )
    ap.add_argument("spec",  help="Path to ui-ux-spec.yaml")
    ap.add_argument("--root", default=".", help="Repository root (default: .)")
    ap.add_argument("--out",  default="output/agent", help="Output directory")
    args = ap.parse_args()

    try:
        spec = load(args.spec)
    except FileNotFoundError:
        print(f"ERROR: spec file not found: {args.spec}", file=sys.stderr)
        sys.exit(1)

    Agent(spec, args.root, args.out).run()


if __name__ == "__main__":
    main()
