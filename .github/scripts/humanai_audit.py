#!/usr/bin/env python3
"""
humanAI — Dynamic Website Audit Agent (no Playwright)

The humanAI persona is a Dream Engine UX, design, performance and accessibility
auditor that browses DREAMengin like a real iOS-first mobile web user. This
script implements that persona as a **dynamic** crawler:

  • Routes are discovered from `app/**/page.tsx` plus by following links found
    in the HTML the server actually returns. There is no fixed test script,
    no Playwright, no headless browser — the crawler reacts to what it finds.

  • Each page is fetched over HTTP. We capture status, latency, headers, title,
    headings, link targets, form actions, image alt coverage, mobile viewport
    meta, and error/oops markers in the HTML.

  • An optional GPT-4 pass takes the crawl signals and reasons about them as
    a real human user, listing concrete problems and recommended fixes.

  • If `OPENAI_API_KEY` is missing the script still emits a structural audit,
    so it is useful in any environment.

  • A markdown report is written to ``--out`` and the script exits 0 on
    success. Use ``--fail-on-broken`` to make the script fail when broken
    links or 5xx responses are encountered (useful in CI gating).

The script depends only on the Python standard library and the helpers in
``dreamengin_core.py``.

Usage:
    python .github/scripts/humanai_audit.py \
        --base-url http://localhost:3000 \
        --out      .github/generated/humanai-audit.md
"""

from __future__ import annotations

import argparse
import json
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

# Make sibling helper module importable when invoked from any cwd.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dreamengin_core import (  # noqa: E402  (sys.path tweak above)
    call_openai_simple,
    mkdir_p,
    write_text,
)


# ── Configuration ─────────────────────────────────────────────────────────────

DEFAULT_BASE_URL = "http://localhost:3000"
DEFAULT_OUT = ".github/generated/humanai-audit.md"
DEFAULT_MAX_PAGES = 25
DEFAULT_TIMEOUT = 15  # seconds per request
USER_AGENT = (
    # Mobile Safari on iPhone — humanAI audits an iOS-first mobile web app.
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) "
    "Version/17.0 Mobile/15E148 Safari/604.1 "
    "humanAI/1.0 (+https://github.com/appthemanger-ctrl/DREAMengin)"
)

# Regex markers that hint at broken renders / runtime errors.
ERROR_MARKERS = [
    re.compile(r"Application error: a (?:client|server)-side exception", re.I),
    re.compile(r"This page could not be found", re.I),
    re.compile(r"Internal Server Error", re.I),
    re.compile(r"<pre[^>]*>.*?Error:.*?</pre>", re.I | re.S),
    re.compile(r"NEXT_NOT_FOUND", re.I),
]

# Routes we never crawl automatically — destructive or out-of-scope for an
# anonymous human-style audit.
SKIP_PATH_PREFIXES = (
    "/api/",
    "/auth/signout",
    "/auth/callback",
    "/_next/",
)


# ── Lightweight HTML extraction ───────────────────────────────────────────────


class _PageParser(HTMLParser):
    """Extract the small set of signals humanAI needs from a page."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: List[str] = []
        self._in_title = False
        self.headings: List[Tuple[str, str]] = []  # (tag, text)
        self._heading_buf: Optional[List[str]] = None
        self._heading_tag: Optional[str] = None
        self.links: List[str] = []
        self.forms: List[str] = []
        self.images_total = 0
        self.images_missing_alt = 0
        self.viewport_meta: Optional[str] = None
        self.html_lang: Optional[str] = None

    # ── tag entry ────────────────────────────────────────────────────────────
    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        attrs_d = {k.lower(): (v or "") for k, v in attrs}
        if tag == "title":
            self._in_title = True
        elif tag == "html":
            self.html_lang = attrs_d.get("lang") or None
        elif tag == "meta" and attrs_d.get("name", "").lower() == "viewport":
            self.viewport_meta = attrs_d.get("content") or ""
        elif tag in ("h1", "h2", "h3"):
            self._heading_tag = tag
            self._heading_buf = []
        elif tag == "a":
            href = attrs_d.get("href")
            if href:
                self.links.append(href)
        elif tag == "form":
            action = attrs_d.get("action") or ""
            method = attrs_d.get("method") or "get"
            self.forms.append(f"{method.upper()} {action}".strip())
        elif tag == "img":
            self.images_total += 1
            alt = attrs_d.get("alt")
            # alt missing entirely (None) is the failure mode; alt="" is OK
            # because it explicitly marks decorative images.
            if alt is None:
                self.images_missing_alt += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag in ("h1", "h2", "h3") and self._heading_buf is not None:
            text = " ".join("".join(self._heading_buf).split())
            if text:
                self.headings.append((self._heading_tag or tag, text[:120]))
            self._heading_buf = None
            self._heading_tag = None

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        if self._heading_buf is not None:
            self._heading_buf.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())


# ── Route discovery ───────────────────────────────────────────────────────────


def discover_static_routes(repo_root: Path) -> List[str]:
    """
    Walk ``app/`` and return public, statically-knowable routes that humanAI
    can visit without parameters. Skips dynamic segments (``[id]``) and
    Next.js groups whose first character is ``(`` (e.g. ``(internal)``) when
    the group is intentionally non-public, but keeps cosmetic groups otherwise.
    """
    app_dir = repo_root / "app"
    if not app_dir.is_dir():
        return ["/"]

    routes: Set[str] = {"/"}
    for page in app_dir.rglob("page.tsx"):
        rel = page.relative_to(app_dir).parent
        parts = []
        skip = False
        for segment in rel.parts:
            if segment.startswith("[") and segment.endswith("]"):
                # Dynamic segment — humanAI cannot guess a real id, skip.
                skip = True
                break
            if segment.startswith("(") and segment.endswith(")"):
                # Next.js route group — does not appear in the URL.
                if segment.lower().startswith("(internal"):
                    skip = True
                    break
                continue
            parts.append(segment)
        if skip:
            continue
        route = "/" + "/".join(parts) if parts else "/"
        routes.add(route)

    # Stable, predictable ordering: shorter (more important) routes first.
    return sorted(routes, key=lambda r: (r.count("/"), r))


# ── HTTP fetch ────────────────────────────────────────────────────────────────


def fetch(url: str, timeout: int = DEFAULT_TIMEOUT) -> Dict[str, object]:
    """
    Fetch a URL, returning a structured result dict. Never raises — all
    errors are folded into the result so the crawler keeps going.
    """
    started = time.monotonic()
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    result: Dict[str, object] = {
        "url": url,
        "status": 0,
        "latency_ms": 0,
        "content_type": "",
        "bytes": 0,
        "body": "",
        "error": None,
    }
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body_bytes = resp.read()
            result["status"] = resp.status
            result["content_type"] = resp.headers.get("Content-Type", "")
            result["bytes"] = len(body_bytes)
            # Only decode when it looks like text — humanAI does not analyse
            # binary payloads.
            if "text" in result["content_type"] or "json" in result["content_type"]:
                result["body"] = body_bytes.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        result["status"] = exc.code
        try:
            body_bytes = exc.read()
            result["bytes"] = len(body_bytes)
            result["body"] = body_bytes.decode("utf-8", errors="replace")
        except Exception:  # pragma: no cover - defensive
            pass
        result["error"] = f"HTTP {exc.code} {exc.reason}"
    except urllib.error.URLError as exc:
        result["error"] = f"URL error: {exc.reason}"
    except socket.timeout:
        result["error"] = f"timeout after {timeout}s"
    except Exception as exc:  # pragma: no cover - defensive
        result["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        result["latency_ms"] = int((time.monotonic() - started) * 1000)
    return result


def wait_for_server(base_url: str, attempts: int = 60, delay: float = 1.0) -> bool:
    """Poll ``base_url`` until it responds or ``attempts`` is exhausted."""
    for _ in range(attempts):
        try:
            req = urllib.request.Request(base_url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=5) as resp:
                if 200 <= resp.status < 600:
                    return True
        except Exception:
            time.sleep(delay)
    return False


# ── Crawler ───────────────────────────────────────────────────────────────────


def normalise_link(base_url: str, href: str) -> Optional[str]:
    """Resolve ``href`` against ``base_url`` and return it if it is a same-origin
    HTTP(S) URL we should crawl, otherwise ``None``."""
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    abs_url = urllib.parse.urljoin(base_url + "/", href)
    parsed_base = urllib.parse.urlparse(base_url)
    parsed = urllib.parse.urlparse(abs_url)
    if parsed.scheme not in ("http", "https"):
        return None
    if (parsed.netloc or parsed_base.netloc) != parsed_base.netloc:
        return None
    path = parsed.path or "/"
    if any(path.startswith(p) for p in SKIP_PATH_PREFIXES):
        return None
    # Strip fragment, keep query.
    return urllib.parse.urlunparse(
        (parsed.scheme or parsed_base.scheme, parsed_base.netloc, path, "", parsed.query, "")
    )


def analyse_page(result: Dict[str, object]) -> Dict[str, object]:
    """Parse a fetched page into the structured signals humanAI cares about."""
    body = str(result.get("body") or "")
    content_type = str(result.get("content_type") or "")
    parser = _PageParser()
    if "html" in content_type and body:
        try:
            parser.feed(body)
        except Exception:  # pragma: no cover - HTMLParser is forgiving
            pass

    error_hits = [m.pattern for m in ERROR_MARKERS if m.search(body)] if body else []

    return {
        "title": parser.title,
        "headings": parser.headings[:8],
        "links": parser.links,
        "forms": parser.forms,
        "images_total": parser.images_total,
        "images_missing_alt": parser.images_missing_alt,
        "viewport_meta": parser.viewport_meta,
        "html_lang": parser.html_lang,
        "error_markers": error_hits,
    }


def crawl(
    base_url: str,
    seed_routes: List[str],
    max_pages: int,
    timeout: int,
) -> List[Dict[str, object]]:
    """Crawl up to ``max_pages`` pages starting from ``seed_routes``."""
    base_url = base_url.rstrip("/")
    queue: List[str] = []
    seen: Set[str] = set()

    for route in seed_routes:
        url = base_url + route
        if url not in seen:
            seen.add(url)
            queue.append(url)

    pages: List[Dict[str, object]] = []
    while queue and len(pages) < max_pages:
        url = queue.pop(0)
        print(f"[humanAI] visiting {url}", file=sys.stderr)
        fetched = fetch(url, timeout=timeout)
        analysed = analyse_page(fetched)
        page = {**fetched, **analysed}
        # Drop the (possibly large) body from the public record once parsed —
        # we only keep a truncated preview for the AI step.
        body_preview = str(fetched.get("body") or "")[:1500]
        page["body_preview"] = body_preview
        page.pop("body", None)
        pages.append(page)

        # Dynamic discovery: enqueue same-origin links we found.
        for href in analysed["links"]:  # type: ignore[index]
            link = normalise_link(base_url, href)
            if link and link not in seen and len(seen) < max_pages * 3:
                seen.add(link)
                queue.append(link)
    return pages


# ── Reporting ─────────────────────────────────────────────────────────────────


def structural_findings(pages: List[Dict[str, object]]) -> List[str]:
    """Deterministic findings extracted directly from the crawl signals."""
    findings: List[str] = []
    for page in pages:
        url = page["url"]
        status = page.get("status") or 0
        if page.get("error"):
            findings.append(f"❌ **{url}** — request failed: {page['error']}")
        elif isinstance(status, int) and status >= 500:
            findings.append(f"❌ **{url}** — server error (HTTP {status})")
        elif isinstance(status, int) and status >= 400 and status != 404:
            findings.append(f"⚠️ **{url}** — HTTP {status}")
        if page.get("error_markers"):
            findings.append(
                f"❌ **{url}** — error markers in HTML: "
                + ", ".join(str(m) for m in page["error_markers"])  # type: ignore[arg-type]
            )
        if isinstance(status, int) and 200 <= status < 400:
            if not page.get("title"):
                findings.append(f"⚠️ **{url}** — missing or empty <title> tag")
            if not page.get("viewport_meta"):
                findings.append(
                    f"⚠️ **{url}** — missing `<meta name=\"viewport\">` "
                    "(critical for an iOS-first mobile web app)"
                )
            if not page.get("html_lang"):
                findings.append(f"⚠️ **{url}** — `<html>` missing `lang` attribute (a11y)")
            missing = page.get("images_missing_alt") or 0
            total = page.get("images_total") or 0
            if isinstance(missing, int) and missing > 0:
                findings.append(
                    f"⚠️ **{url}** — {missing}/{total} images missing `alt` attribute (a11y)"
                )
            latency = page.get("latency_ms") or 0
            if isinstance(latency, int) and latency > 3000:
                findings.append(f"⚠️ **{url}** — slow response ({latency} ms)")
            size = page.get("bytes") or 0
            if isinstance(size, int) and size > 750_000:
                findings.append(
                    f"⚠️ **{url}** — large HTML payload ({size // 1024} KB); consider streaming/SSG"
                )
    return findings


def summarise_for_ai(pages: List[Dict[str, object]]) -> str:
    """Build a compact JSON-ish summary of the crawl for the AI prompt."""
    summary = []
    for page in pages:
        summary.append(
            {
                "url": page["url"],
                "status": page["status"],
                "latency_ms": page["latency_ms"],
                "bytes": page["bytes"],
                "title": page.get("title"),
                "headings": page.get("headings"),
                "viewport_meta": page.get("viewport_meta"),
                "html_lang": page.get("html_lang"),
                "images_total": page.get("images_total"),
                "images_missing_alt": page.get("images_missing_alt"),
                "forms": page.get("forms"),
                "error_markers": page.get("error_markers"),
                "body_preview": page.get("body_preview"),
            }
        )
    return json.dumps(summary, ensure_ascii=False, indent=2)


HUMANAI_SYSTEM_PROMPT = """\
You are humanAI — a Dream Engine UX, accessibility and performance auditor who
browses DREAMengin like a real human user on an iPhone (iOS Safari, 390x844).
Your job is to find problems a real user would hit — *not* to invent issues.

DREAMengin is an iOS-first mobile web app built with Next.js 16 App Router,
React 19, Tailwind, Supabase, and Babylon.js. It must feel SICC: Stylized,
Intuitive, Cohesive, Coherent, with Super Immersive Creative Controls.

You will receive a JSON crawl of the live site. For each problem you find,
output ONE bullet in the form:

  - <severity emoji> **<URL>** — <one-sentence problem> — *Fix:* <one-sentence fix>

Severity emojis: 🛑 critical (blocks usage), ⚠️ major (degrades UX), 💡 polish.
Group your output under these markdown headers, in this order, omitting any
section that has no findings:

  ### 🛑 Critical issues
  ### ⚠️ Major UX / a11y / mobile issues
  ### 💡 Polish & SICC alignment

Be specific. Cite the URL. Do not repeat structural findings the report
already lists; focus on what only a human user would notice (mobile tap
targets, copy clarity, broken flows, ambiguous CTAs, jank cues, navigation
dead-ends, inconsistent typography, etc.). If the crawl shows no issues at
all in a category, omit the section entirely. Maximum 25 bullets total.
"""


def run_ai_pass(api_key: str, model: str, pages: List[Dict[str, object]]) -> str:
    """Ask GPT to play the humanAI persona over the crawl."""
    user_prompt = (
        "Crawl results follow as JSON. Audit the site as a real iPhone user.\n\n"
        "```json\n" + summarise_for_ai(pages) + "\n```"
    )
    return call_openai_simple(
        api_key=api_key,
        model=model,
        system=HUMANAI_SYSTEM_PROMPT,
        user=user_prompt,
        max_tokens=4_000,
    )


def render_report(
    base_url: str,
    pages: List[Dict[str, object]],
    structural: List[str],
    ai_section: Optional[str],
) -> str:
    ok = sum(1 for p in pages if isinstance(p.get("status"), int) and 200 <= p["status"] < 400)
    failed = len(pages) - ok
    total_latency = sum(int(p.get("latency_ms") or 0) for p in pages)
    avg_latency = (total_latency // len(pages)) if pages else 0

    lines: List[str] = []
    lines.append("# humanAI Audit Report")
    lines.append("")
    lines.append(f"_Target_: `{base_url}`  ")
    lines.append(f"_User agent_: iPhone Safari (humanAI/1.0)  ")
    lines.append(f"_Pages crawled_: **{len(pages)}** · OK **{ok}** · failing **{failed}**  ")
    lines.append(f"_Average response_: **{avg_latency} ms**")
    lines.append("")
    lines.append("## Crawl summary")
    lines.append("")
    lines.append("| URL | Status | Latency | Size | Title |")
    lines.append("|-----|-------:|--------:|-----:|-------|")
    for p in pages:
        title = (p.get("title") or "").replace("|", "\\|")[:60]
        size = p.get("bytes") or 0
        size_kb = f"{int(size) // 1024} KB" if isinstance(size, int) and size else "—"
        status = p.get("status") or "—"
        latency = p.get("latency_ms")
        latency_str = f"{latency} ms" if isinstance(latency, int) else "—"
        lines.append(
            f"| `{p['url']}` | {status} | {latency_str} | {size_kb} | {title} |"
        )
    lines.append("")

    lines.append("## Structural findings")
    lines.append("")
    if structural:
        lines.extend(structural)
    else:
        lines.append("_No structural problems detected by the deterministic checks._")
    lines.append("")

    lines.append("## humanAI persona findings")
    lines.append("")
    if ai_section:
        lines.append(ai_section.strip())
    else:
        lines.append(
            "_AI persona pass skipped — set `OPENAI_API_KEY` to enable GPT-driven_"
            "_human-style review._"
        )
    lines.append("")

    lines.append("---")
    lines.append(
        "_Generated by `.github/scripts/humanai_audit.py`. "
        "humanAI is dynamic — it discovers routes from the live HTML it gets back, "
        "not from a fixed Playwright script._"
    )
    return "\n".join(lines) + "\n"


# ── CLI ───────────────────────────────────────────────────────────────────────


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="humanAI dynamic website audit")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--out", default=DEFAULT_OUT, help="Markdown report path")
    parser.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES)
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    parser.add_argument(
        "--repo-root",
        default=str(Path(__file__).resolve().parents[2]),
        help="Repository root used to discover routes from app/**/page.tsx",
    )
    parser.add_argument("--model", default="gpt-4.1", help="OpenAI model for the persona pass")
    parser.add_argument(
        "--no-ai",
        action="store_true",
        help="Skip the OpenAI persona pass even if OPENAI_API_KEY is set",
    )
    parser.add_argument(
        "--wait-for-server",
        action="store_true",
        help="Poll --base-url until it responds before crawling",
    )
    parser.add_argument(
        "--fail-on-broken",
        action="store_true",
        help="Exit non-zero if any 5xx, request error, or in-HTML error marker is seen",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    repo_root = Path(args.repo_root).resolve()

    if args.wait_for_server and not wait_for_server(args.base_url):
        print(f"[humanAI] server at {args.base_url} never responded", file=sys.stderr)
        return 2

    routes = discover_static_routes(repo_root)
    print(f"[humanAI] {len(routes)} static seed routes from {repo_root}/app", file=sys.stderr)

    pages = crawl(
        base_url=args.base_url,
        seed_routes=routes,
        max_pages=args.max_pages,
        timeout=args.timeout,
    )

    structural = structural_findings(pages)

    ai_section: Optional[str] = None
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if api_key and not args.no_ai:
        try:
            ai_section = run_ai_pass(api_key, args.model, pages)
        except SystemExit:
            # call_openai already logged the failure — keep the structural
            # report so the run is still useful.
            ai_section = "_AI persona pass failed; see workflow logs._"

    report = render_report(args.base_url, pages, structural, ai_section)
    out_path = Path(args.out)
    mkdir_p(out_path.parent)
    write_text(out_path, report)
    print(f"[humanAI] report written to {out_path}", file=sys.stderr)

    if args.fail_on_broken:
        for p in pages:
            status = p.get("status")
            if (
                p.get("error")
                or (isinstance(status, int) and status >= 500)
                or p.get("error_markers")
            ):
                print("[humanAI] broken page detected; failing as requested", file=sys.stderr)
                return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
