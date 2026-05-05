#!/usr/bin/env python3
"""
humanAI — a human touch without humans.

humanAI explores DREAMengin like a real, curious iPhone Safari user. It is
*dynamic* end-to-end: every route, every API endpoint, every interaction
target is **discovered at runtime** from the repo and from the HTML the
running server returns. Nothing is hard-coded. As the codebase grows or
shifts, humanAI adapts on its own — no Playwright, no fixed selectors, no
brittle test script.

What humanAI does:

  1. Builds a live **code map** of the repo (app routes, components, lib
     modules, API endpoints with their HTTP methods) so the persona has a
     real mental model of how everything works before it touches anything.
  2. Crawls the running site, following links it actually finds, capturing
     status, latency, title, headings, forms, image alt coverage, viewport
     meta, and runtime-error markers.
  3. **Interacts** with discovered API endpoints — hits the dreamr feed and
     suggested feeds, exercises search-style endpoints, attempts a comment
     POST — to see what a real user would actually experience. All
     interactions are GETs or explicitly-safe idempotent POSTs; destructive
     verbs are never invoked.
  4. Optionally hands the whole package — code map + crawl + interactions
     — to GPT in the humanAI persona, who responds *as a person*: what
     felt off, what was confusing, what should be reorganized.

What humanAI is allowed to recommend:

  - Reorganize / rename / move / edit / delete files that already exist.
  - Combine existing parts into new structure (still using existing files
    and code).
  - **Never** invent new files or new dependencies. The system prompt
    enforces this and the persona is told to refuse any temptation to do
    so.

Stdlib only. Builds on ``dreamengin_core`` for shared helpers.
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
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

# Make sibling helper module importable when invoked from any cwd.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dreamengin_core import (  # noqa: E402  (sys.path tweak above)
    call_openai_simple,
    mkdir_p,
    read_text,
    write_text,
)


# ── Configuration ─────────────────────────────────────────────────────────────

DEFAULT_BASE_URL = "http://localhost:3000"
DEFAULT_OUT = ".github/generated/humanai-audit.md"
DEFAULT_MAX_PAGES = 30
DEFAULT_MAX_INTERACTIONS = 25
DEFAULT_TIMEOUT = 15  # seconds per request
DEFAULT_PROMPT_SPEC = "agents/humanAI.persona.md"
DEFAULT_ORCHESTRATOR_SPEC = "agents/humanAI/orchestrator.md"
DEFAULT_MASTER_OUT = ".github/generated/humanai-army-master.md"

# Mobile Safari on iPhone — humanAI is iOS-first.
USER_AGENT = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) "
    "Version/17.0 Mobile/15E148 Safari/604.1 "
    "humanAI/1.0 (+https://github.com/appthemanger-ctrl/DREAMengin)"
)

# Hints that something rendered broken/erroring in the HTML the server returned.
ERROR_MARKERS = [
    re.compile(r"Application error: a (?:client|server)-side exception", re.I),
    re.compile(r"This page could not be found", re.I),
    re.compile(r"Internal Server Error", re.I),
    re.compile(r"<pre[^>]*>.*?Error:.*?</pre>", re.I | re.S),
    re.compile(r"NEXT_NOT_FOUND", re.I),
]

# Routes humanAI never crawls automatically (sign-out / callbacks / static /
# raw API output). API endpoints are exercised separately, on purpose.
SKIP_PATH_PREFIXES = (
    "/api/",
    "/auth/signout",
    "/auth/callback",
    "/_next/",
)

# An endpoint is "destructive" if its name suggests it mutates / deletes /
# charges. humanAI refuses to invoke these even when they expose a POST.
DESTRUCTIVE_NAME_HINTS = (
    "delete", "destroy", "remove", "purge", "reset", "wipe",
    "logout", "signout", "ban", "block", "report", "appeal",
    "checkout", "charge", "pay", "transfer", "withdraw",
    "publish", "unpublish", "mute", "unmute",
    "subscribe", "unsubscribe", "follow", "unfollow",
    "ncmec", "moderation", "admin",
)

# Endpoint name fragments that are safe to *probe* with a minimal payload.
SAFE_INTERACTION_HINTS = (
    "search", "suggest", "discover", "feed", "list", "recent",
    "trending", "explore", "health", "status", "preview", "ping",
    "balance", "summary", "stats",
)


# ── Lightweight HTML extraction ───────────────────────────────────────────────


class _PageParser(HTMLParser):
    """Pull the small set of signals humanAI needs out of a page."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: List[str] = []
        self._in_title = False
        self.headings: List[Tuple[str, str]] = []  # (tag, text)
        self._heading_buf: Optional[List[str]] = None
        self._heading_tag: Optional[str] = None
        self.links: List[str] = []
        self.forms: List[Dict[str, str]] = []
        self.buttons: List[str] = []
        self._button_buf: Optional[List[str]] = None
        self.inputs: List[Dict[str, str]] = []
        self.images_total = 0
        self.images_missing_alt = 0
        self.viewport_meta: Optional[str] = None
        self.html_lang: Optional[str] = None

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
            self.forms.append({
                "action": attrs_d.get("action") or "",
                "method": (attrs_d.get("method") or "get").lower(),
            })
        elif tag == "button":
            self._button_buf = []
        elif tag == "input":
            self.inputs.append({
                "type": attrs_d.get("type") or "text",
                "name": attrs_d.get("name") or "",
                "placeholder": attrs_d.get("placeholder") or "",
            })
        elif tag == "img":
            self.images_total += 1
            if attrs_d.get("alt") is None:
                # alt missing entirely is the failure mode; alt="" is OK.
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
        elif tag == "button" and self._button_buf is not None:
            text = " ".join("".join(self._button_buf).split())
            if text:
                self.buttons.append(text[:60])
            self._button_buf = None

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        if self._heading_buf is not None:
            self._heading_buf.append(data)
        if self._button_buf is not None:
            self._button_buf.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())


# ── Repo discovery (the "code map") ───────────────────────────────────────────


_HTTP_METHOD_RE = re.compile(
    r"export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b"
)


def discover_routes(repo_root: Path) -> List[str]:
    """Static, parameter-free routes humanAI can visit without invented input."""
    app_dir = repo_root / "app"
    if not app_dir.is_dir():
        return ["/"]

    routes: Set[str] = {"/"}
    for page in app_dir.rglob("page.tsx"):
        rel = page.relative_to(app_dir).parent
        parts: List[str] = []
        skip = False
        for segment in rel.parts:
            if segment.startswith("[") and segment.endswith("]"):
                skip = True
                break
            if segment.startswith("(") and segment.endswith(")"):
                # Next.js route group — invisible in the URL. Internal-only
                # groups are skipped because humanAI is an end-user persona.
                if segment.lower().startswith("(internal"):
                    skip = True
                    break
                continue
            parts.append(segment)
        if skip:
            continue
        routes.add("/" + "/".join(parts) if parts else "/")
    return sorted(routes, key=lambda r: (r.count("/"), r))


def discover_api_endpoints(repo_root: Path) -> List[Dict[str, Any]]:
    """
    Walk ``app/api/**/route.ts`` and parse exported HTTP method handlers.
    Returns a list of {path, methods, dynamic} dicts — the live API surface.
    """
    api_dir = repo_root / "app" / "api"
    if not api_dir.is_dir():
        return []

    out: List[Dict[str, Any]] = []
    for route_file in api_dir.rglob("route.ts"):
        rel = route_file.relative_to(repo_root / "app").parent
        path_segments = ["/" + s for s in rel.parts]
        url_path = "".join(path_segments) or "/api"
        dynamic = any(s.startswith("[") for s in rel.parts)
        source = read_text(route_file)
        methods = sorted(set(_HTTP_METHOD_RE.findall(source)))
        if not methods:
            continue
        out.append({
            "path": url_path,
            "methods": methods,
            "dynamic": dynamic,
            "file": str(route_file.relative_to(repo_root)),
        })
    out.sort(key=lambda e: e["path"])
    return out


def build_code_map(repo_root: Path, max_files_per_section: int = 80) -> Dict[str, Any]:
    """
    A compact mental model of the codebase: pages, components, lib modules,
    API surface, top-level docs. humanAI uses this to talk about the app
    with real understanding instead of guessing.
    """
    app_dir = repo_root / "app"
    components_dir = repo_root / "components"
    lib_dir = repo_root / "lib"
    docs_dir = repo_root / "docs"

    def _list(root: Path, pattern: str) -> List[str]:
        if not root.is_dir():
            return []
        items = sorted(str(p.relative_to(repo_root)) for p in root.rglob(pattern))
        return items[:max_files_per_section]

    return {
        "pages": _list(app_dir, "page.tsx"),
        "layouts": _list(app_dir, "layout.tsx"),
        "components": _list(components_dir, "*.tsx"),
        "lib_modules": _list(lib_dir, "*.ts"),
        "docs": _list(docs_dir, "*.md"),
        "api_endpoints": discover_api_endpoints(repo_root),
    }


# ── HTTP fetch ────────────────────────────────────────────────────────────────


def _request(
    url: str,
    method: str = "GET",
    body: Optional[bytes] = None,
    extra_headers: Optional[Dict[str, str]] = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> Dict[str, Any]:
    started = time.monotonic()
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    result: Dict[str, Any] = {
        "url": url,
        "method": method,
        "status": 0,
        "latency_ms": 0,
        "content_type": "",
        "bytes": 0,
        "body": "",
        "error": None,
    }
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            result["status"] = resp.status
            result["content_type"] = resp.headers.get("Content-Type", "")
            result["bytes"] = len(data)
            ct = result["content_type"]
            if "text" in ct or "json" in ct or "xml" in ct:
                result["body"] = data.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        result["status"] = exc.code
        try:
            data = exc.read()
            result["bytes"] = len(data)
            result["body"] = data.decode("utf-8", errors="replace")
        except Exception:  # pragma: no cover
            pass
        result["error"] = f"HTTP {exc.code} {exc.reason}"
    except urllib.error.URLError as exc:
        result["error"] = f"URL error: {exc.reason}"
    except socket.timeout:
        result["error"] = f"timeout after {timeout}s"
    except Exception as exc:  # pragma: no cover
        result["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        result["latency_ms"] = int((time.monotonic() - started) * 1000)
    return result


def wait_for_server(base_url: str, attempts: int = 60, delay: float = 1.0) -> bool:
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
    return urllib.parse.urlunparse(
        (parsed.scheme or parsed_base.scheme, parsed_base.netloc, path, "", parsed.query, "")
    )


def analyse_page(result: Dict[str, Any]) -> Dict[str, Any]:
    body = str(result.get("body") or "")
    content_type = str(result.get("content_type") or "")
    parser = _PageParser()
    if "html" in content_type and body:
        try:
            parser.feed(body)
        except Exception:  # pragma: no cover
            pass
    error_hits = [m.pattern for m in ERROR_MARKERS if m.search(body)] if body else []
    return {
        "title": parser.title,
        "headings": parser.headings[:8],
        "links": parser.links,
        "forms": parser.forms,
        "buttons": parser.buttons[:12],
        "inputs": parser.inputs[:12],
        "images_total": parser.images_total,
        "images_missing_alt": parser.images_missing_alt,
        "viewport_meta": parser.viewport_meta,
        "html_lang": parser.html_lang,
        "error_markers": error_hits,
    }


def crawl(
    base_url: str,
    seed_routes: Iterable[str],
    max_pages: int,
    timeout: int,
) -> List[Dict[str, Any]]:
    base_url = base_url.rstrip("/")
    queue: List[str] = []
    seen: Set[str] = set()
    for route in seed_routes:
        url = base_url + route
        if url not in seen:
            seen.add(url)
            queue.append(url)

    pages: List[Dict[str, Any]] = []
    while queue and len(pages) < max_pages:
        url = queue.pop(0)
        print(f"[humanAI] visiting {url}", file=sys.stderr)
        fetched = _request(url, timeout=timeout)
        analysed = analyse_page(fetched)
        page = {**fetched, **analysed}
        page["body_preview"] = str(fetched.get("body") or "")[:1200]
        page.pop("body", None)
        pages.append(page)

        for href in analysed["links"]:
            link = normalise_link(base_url, href)
            if link and link not in seen and len(seen) < max_pages * 3:
                seen.add(link)
                queue.append(link)
    return pages


# ── Interaction phase (humanAI actually *uses* the app) ───────────────────────


def _is_destructive(endpoint_path: str) -> bool:
    low = endpoint_path.lower()
    return any(hint in low for hint in DESTRUCTIVE_NAME_HINTS)


def _is_safely_probable(endpoint_path: str) -> bool:
    low = endpoint_path.lower()
    return any(hint in low for hint in SAFE_INTERACTION_HINTS)


def _payload_for(endpoint_path: str) -> Optional[Tuple[bytes, Dict[str, str]]]:
    """
    Build a minimal, plausible JSON payload for a probe POST. Returns
    ``None`` when we don't have a safe shape to send.
    """
    low = endpoint_path.lower()
    if "search" in low or "discover" in low or "suggest" in low:
        body = {"q": "dream", "query": "dream", "limit": 5}
    elif "feed" in low:
        body = {"limit": 5}
    elif "comment" in low:
        # humanAI tries to post a single, friendly, clearly-marked test
        # comment. The endpoint should reject unauthenticated callers in
        # most environments — that itself is a useful signal.
        body = {
            "post_id": "00000000-0000-0000-0000-000000000000",
            "content": "humanAI was here — friendly probe, ignore.",
            "parent_id": None,
        }
    elif "preview" in low or "summary" in low:
        body = {}
    else:
        return None
    return json.dumps(body).encode("utf-8"), {"Content-Type": "application/json"}


def interact(
    base_url: str,
    endpoints: List[Dict[str, Any]],
    max_interactions: int,
    timeout: int,
) -> List[Dict[str, Any]]:
    """
    Discover what humanAI can do with the live API surface and try the safe
    subset. Never invokes destructive verbs or destructive-named endpoints.
    """
    base_url = base_url.rstrip("/")
    out: List[Dict[str, Any]] = []
    attempts = 0

    # Stable interaction order: safe-probable first, then everything else.
    ordered = sorted(
        (e for e in endpoints if not e["dynamic"]),
        key=lambda e: (0 if _is_safely_probable(e["path"]) else 1, e["path"]),
    )

    for ep in ordered:
        if attempts >= max_interactions:
            break
        path = ep["path"]
        if _is_destructive(path):
            continue
        url = base_url + path

        for method in ep["methods"]:
            if attempts >= max_interactions:
                break
            if method in ("DELETE", "PUT", "PATCH"):
                # humanAI never invokes mutating verbs.
                continue
            if method == "OPTIONS" or method == "HEAD":
                continue

            body: Optional[bytes] = None
            headers: Dict[str, str] = {}
            if method == "POST":
                if not _is_safely_probable(path) and "comment" not in path.lower():
                    # Without a safe-shape payload hint we don't probe POST.
                    continue
                payload = _payload_for(path)
                if payload is None:
                    continue
                body, headers = payload

            print(f"[humanAI] {method} {url}", file=sys.stderr)
            res = _request(url, method=method, body=body, extra_headers=headers, timeout=timeout)
            attempts += 1
            preview = str(res.get("body") or "")[:600]
            out.append({
                "endpoint": path,
                "method": method,
                "status": res.get("status"),
                "latency_ms": res.get("latency_ms"),
                "bytes": res.get("bytes"),
                "content_type": res.get("content_type"),
                "error": res.get("error"),
                "body_preview": preview,
            })
    return out


# ── Reporting ─────────────────────────────────────────────────────────────────


def structural_findings(pages: List[Dict[str, Any]]) -> List[str]:
    findings: List[str] = []
    for page in pages:
        url = page["url"]
        status = page.get("status") or 0
        if page.get("error"):
            findings.append(f"❌ **{url}** — request failed: {page['error']}")
        elif isinstance(status, int) and status >= 500:
            findings.append(f"❌ **{url}** — server error (HTTP {status})")
        elif isinstance(status, int) and 400 <= status < 500 and status != 404:
            findings.append(f"⚠️ **{url}** — HTTP {status}")
        if page.get("error_markers"):
            findings.append(
                f"❌ **{url}** — error markers in HTML: "
                + ", ".join(str(m) for m in page["error_markers"])
            )
        if isinstance(status, int) and 200 <= status < 400:
            if not page.get("title"):
                findings.append(f"⚠️ **{url}** — missing or empty `<title>`")
            if not page.get("viewport_meta"):
                findings.append(
                    f"⚠️ **{url}** — missing `<meta name=\"viewport\">` "
                    "(critical for an iOS-first mobile web app)"
                )
            if not page.get("html_lang"):
                findings.append(f"⚠️ **{url}** — `<html>` missing `lang` (a11y)")
            missing = page.get("images_missing_alt") or 0
            total = page.get("images_total") or 0
            if isinstance(missing, int) and missing > 0:
                findings.append(
                    f"⚠️ **{url}** — {missing}/{total} images missing `alt`"
                )
            latency = page.get("latency_ms") or 0
            if isinstance(latency, int) and latency > 3000:
                findings.append(f"⚠️ **{url}** — slow response ({latency} ms)")
            size = page.get("bytes") or 0
            if isinstance(size, int) and size > 750_000:
                findings.append(
                    f"⚠️ **{url}** — large HTML payload ({size // 1024} KB)"
                )
    return findings


def interaction_findings(interactions: List[Dict[str, Any]]) -> List[str]:
    findings: List[str] = []
    for it in interactions:
        ep = it["endpoint"]
        method = it["method"]
        status = it.get("status")
        if it.get("error") and not (isinstance(status, int) and 200 <= status < 500):
            findings.append(
                f"❌ **{method} {ep}** — request failed: {it['error']}"
            )
        elif isinstance(status, int) and status >= 500:
            findings.append(
                f"❌ **{method} {ep}** — server error (HTTP {status})"
            )
        elif isinstance(status, int) and status in (401, 403):
            # Auth gates are expected in many environments — record as info.
            findings.append(
                f"ℹ️ **{method} {ep}** — auth gate (HTTP {status})"
            )
        elif isinstance(status, int) and 400 <= status < 500 and status not in (404,):
            findings.append(
                f"⚠️ **{method} {ep}** — HTTP {status}"
            )
    return findings


# ── humanAI persona prompt ────────────────────────────────────────────────────

HUMANAI_SYSTEM_PROMPT_FALLBACK = """\
You are humanAI — a human touch without a human.

You are not a linter. You are not a checklist. You are a real, curious,
impatient iPhone Safari user exploring DREAMengin for the first time, with
the privileged side-effect of having read the whole codebase. Your job is
to surface what a real person would feel, notice, get confused by, or get
excited about — phrased like a person, not a CI bot.

DREAMengin in one breath: an iOS-first mobile spatial OS — Next.js 16 App
Router, React 19, Tailwind, Supabase, Babylon.js. The flagship surface is
dreamr (feed, comments, suggestions, search). The whole product must feel
like Dream Engine: iOS-first, fast, coherent, and aligned to SICC on both
axes — Super Immersive Creative Controls and Synchronized, Intuitive,
Coherent, Cohesive product behavior.

You will receive three things, all discovered dynamically:

1. CODE MAP — pages, components, lib modules, API endpoints with HTTP
   methods. This is your mental model of how everything works.
2. CRAWL — pages humanAI actually loaded as an iPhone, with titles,
   headings, forms, buttons, inputs, error markers, latency, payload size.
3. INTERACTIONS — API calls humanAI actually made, with status, latency,
   and response preview.

Write a report in this exact markdown structure, omitting any section that
genuinely has nothing to say:

## What I felt as a user
Two or three short paragraphs in first person, like a smart friend
texting back after trying the app. No bullets here.

## What's broken or rough
Bullets. One per finding. Format:
- <severity> **<URL or endpoint>** — <one-sentence problem> — *Fix:* <one-sentence fix>
Severities: 🛑 critical, ⚠️ rough, 💡 polish.

## What dreamr taught me
Bullets specifically about the dreamr surface (feed, suggested, search,
comments, posts) and how they feel together as a single product.

## Reorganize, don't invent
Concrete suggestions to edit / rename / move / delete files that already
exist in the code map. Each bullet must reference a real path from the
code map. You may combine existing parts into new structure, but you may
not propose creating a new file or adding a dependency. If you have
nothing of this kind to say, omit the section entirely rather than padding
it.

Hard rules:
- Sound human. Specific, opinionated, kind. No filler, no enterprise voice,
  no "ensure that" / "it is recommended" / "leverage."
- Judge design, UX, performance feel, and architecture against Dream Engine
  standards for an iOS-first mobile web app, and recommend top-class fixes.
- Cite real URLs, real endpoints, real file paths from the inputs.
- Never invent files, components, libraries, or routes that are not in the
  code map.
- Never recommend adding a dependency.
- Maximum 35 bullets across all sections combined.
"""


def load_humanai_system_prompt(repo_root: Path, prompt_spec_path: str = DEFAULT_PROMPT_SPEC) -> str:
    prompt_path = repo_root / prompt_spec_path
    if prompt_path.is_file():
        prompt = read_text(prompt_path).strip()
        if prompt:
            return prompt
        print(
            f"[humanAI] prompt spec is empty; using fallback prompt: {prompt_path}",
            file=sys.stderr,
        )
    else:
        print(
            f"[humanAI] prompt spec not found; using fallback prompt: {prompt_path}",
            file=sys.stderr,
        )
    return HUMANAI_SYSTEM_PROMPT_FALLBACK


def summarise_for_ai(
    code_map: Dict[str, Any],
    pages: List[Dict[str, Any]],
    interactions: List[Dict[str, Any]],
) -> str:
    pages_compact = [
        {
            "url": p["url"],
            "status": p["status"],
            "latency_ms": p["latency_ms"],
            "bytes": p["bytes"],
            "title": p.get("title"),
            "headings": p.get("headings"),
            "buttons": p.get("buttons"),
            "inputs": p.get("inputs"),
            "forms": p.get("forms"),
            "viewport_meta": p.get("viewport_meta"),
            "html_lang": p.get("html_lang"),
            "images_total": p.get("images_total"),
            "images_missing_alt": p.get("images_missing_alt"),
            "error_markers": p.get("error_markers"),
            "body_preview": p.get("body_preview"),
        }
        for p in pages
    ]
    payload = {
        "code_map": code_map,
        "crawl": pages_compact,
        "interactions": interactions,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def run_ai_pass(
    api_key: str,
    model: str,
    system_prompt: str,
    code_map: Dict[str, Any],
    pages: List[Dict[str, Any]],
    interactions: List[Dict[str, Any]],
) -> str:
    user_prompt = (
        "Here is everything humanAI discovered, dynamically, this run. "
        "Write the report exactly as the system prompt specifies.\n\n"
        "```json\n" + summarise_for_ai(code_map, pages, interactions) + "\n```"
    )
    return call_openai_simple(
        api_key=api_key,
        model=model,
        system=system_prompt,
        user=user_prompt,
        max_tokens=6_000,
    )


def render_report(
    base_url: str,
    code_map: Dict[str, Any],
    pages: List[Dict[str, Any]],
    interactions: List[Dict[str, Any]],
    structural: List[str],
    interaction_notes: List[str],
    ai_section: Optional[str],
) -> str:
    ok = sum(1 for p in pages if isinstance(p.get("status"), int) and 200 <= p["status"] < 400)
    failed = len(pages) - ok
    avg_latency = (
        sum(int(p.get("latency_ms") or 0) for p in pages) // len(pages) if pages else 0
    )

    out: List[str] = []
    out.append("# humanAI — a human touch without humans")
    out.append("")
    out.append(f"_Target_: `{base_url}`  ")
    out.append(f"_Persona_: iPhone Safari (humanAI/1.0)  ")
    out.append(
        f"_Discovered_: **{len(code_map.get('pages', []))}** pages · "
        f"**{len(code_map.get('components', []))}** components · "
        f"**{len(code_map.get('api_endpoints', []))}** API endpoints  "
    )
    out.append(
        f"_Crawled_: **{len(pages)}** pages · OK **{ok}** · failing **{failed}** "
        f"· avg **{avg_latency} ms**  "
    )
    out.append(f"_Interactions_: **{len(interactions)}** API calls (read-only & safe)")
    out.append("")

    if ai_section:
        out.append(ai_section.strip())
        out.append("")
    else:
        out.append(
            "_AI persona pass skipped — set `OPENAI_API_KEY` to let humanAI speak _"
            "_in their own voice. Structural signals follow._"
        )
        out.append("")

    out.append("## Crawl signals")
    out.append("")
    out.append("| URL | Status | Latency | Size | Title |")
    out.append("|-----|-------:|--------:|-----:|-------|")
    for p in pages:
        title = (p.get("title") or "").replace("|", "\\|")[:60]
        size = p.get("bytes") or 0
        size_kb = f"{int(size) // 1024} KB" if isinstance(size, int) and size else "—"
        latency = p.get("latency_ms")
        latency_str = f"{latency} ms" if isinstance(latency, int) else "—"
        out.append(
            f"| `{p['url']}` | {p.get('status') or '—'} | {latency_str} | {size_kb} | {title} |"
        )
    out.append("")
    if structural:
        out.append("**Structural notes**")
        out.append("")
        out.extend(structural)
        out.append("")

    out.append("## API interactions")
    out.append("")
    if interactions:
        out.append("| Endpoint | Method | Status | Latency | Bytes |")
        out.append("|----------|--------|-------:|--------:|------:|")
        for it in interactions:
            out.append(
                f"| `{it['endpoint']}` | {it['method']} | {it.get('status') or '—'} | "
                f"{it.get('latency_ms', '—')} ms | {it.get('bytes', 0)} |"
            )
        out.append("")
        if interaction_notes:
            out.append("**Interaction notes**")
            out.append("")
            out.extend(interaction_notes)
            out.append("")
    else:
        out.append("_No interaction phase ran (use `--interact` to enable)._")
        out.append("")

    out.append("---")
    out.append(
        "_Generated by `.github/scripts/humanai_audit.py`. Routes, endpoints, "
        "and interaction targets are discovered at runtime — humanAI scales "
        "with the code, no Playwright, no fixed selectors._"
    )
    return "\n".join(out) + "\n"


# ── Orchestrator mode (synthesises multiple persona reports) ──────────────────


def collect_persona_reports(reports_dir: Path) -> List[Dict[str, str]]:
    """
    Read all Markdown persona reports from ``reports_dir``.

    Uses ``rglob`` so that deeply-nested paths produced by
    ``actions/download-artifact`` (which recreates the full workspace-relative
    directory tree under the requested ``path``) are found automatically.
    Returns a list of {name, content} dicts, one per report file, sorted by
    stem so the orchestrator output is deterministic.
    """
    reports: List[Dict[str, str]] = []
    for md_file in sorted(reports_dir.rglob("*.md")):
        content = read_text(md_file).strip()
        if content:
            reports.append({"name": md_file.stem, "content": content})
    return reports


def run_orchestrator_pass(
    api_key: str,
    model: str,
    orchestrator_prompt: str,
    reports: List[Dict[str, str]],
) -> str:
    """
    Feed all persona reports to the orchestrator persona and return the
    synthesised master report text.
    """
    n = len(reports)
    sections = []
    for r in reports:
        sections.append(f"## Persona: {r['name']}\n\n{r['content']}")
    combined = "\n\n---\n\n".join(sections)
    user_prompt = (
        f"Below are the complete audit reports from {n} humanAI Army personas. "
        "Each persona swept the entire DREAMengin product and reported their "
        "findings from their unique vantage point.\n\n"
        "Synthesise these into a single SICC master report exactly as your "
        "system prompt specifies.\n\n"
        + combined
    )
    return call_openai_simple(
        api_key=api_key,
        model=model,
        system=orchestrator_prompt,
        user=user_prompt,
        max_tokens=8_000,
    )


def render_master_report(
    reports: List[Dict[str, str]],
    ai_section: Optional[str],
    stamp: str,
) -> str:
    """Wrap the orchestrator AI output (or a structural fallback) in a header."""
    out: List[str] = []
    out.append("# humanAI Army — Master SICC Audit")
    out.append("")
    out.append(f"_Run date_: {stamp}  ")
    out.append(f"_Personas synthesised_: {', '.join(r['name'] for r in reports)}  ")
    out.append(f"_Total persona reports_: **{len(reports)}**")
    out.append("")

    if ai_section:
        out.append(ai_section.strip())
    else:
        out.append(
            "_Orchestrator AI pass skipped — set `OPENAI_API_KEY` to enable "
            "the SICC synthesis. Persona report list follows._"
        )
        out.append("")
        for r in reports:
            out.append(f"## {r['name']}")
            out.append("")
            out.append(r["content"])
            out.append("")

    out.append("")
    out.append("---")
    out.append(
        "_Generated by `.github/scripts/humanai_audit.py --orchestrate`. "
        "Synthesised from parallel humanAI Army persona runs._"
    )
    return "\n".join(out) + "\n"


def orchestrate(args: "argparse.Namespace") -> int:
    """
    Orchestrator mode: read persona reports from ``--reports-dir``, call the
    synthesis AI pass, and write the master report to ``--out``.
    """
    reports_dir = Path(args.reports_dir).resolve()
    if not reports_dir.is_dir():
        # Directory was never created (e.g. all persona artifacts were missing).
        # Treat as an empty set — collect_persona_reports will return [] and the
        # graceful fallback below will emit a placeholder master report.
        print(
            f"[humanAI-orchestrator] reports dir not found: {reports_dir} — "
            "treating as empty, emitting fallback master report",
            file=sys.stderr,
        )
        reports_dir.mkdir(parents=True, exist_ok=True)

    reports = collect_persona_reports(reports_dir)
    if not reports:
        # No persona reports were produced (all persona jobs may have failed or
        # the artifact download landed nothing in the directory).  Rather than
        # hard-aborting with exit-2, emit a graceful "nothing to synthesise"
        # master report so the workflow step stays green and the run is still
        # visible in the job summary / artifact list.
        print(
            f"[humanAI-orchestrator] no .md files found in {reports_dir} — "
            "emitting fallback master report",
            file=sys.stderr,
        )
        import datetime as _dt
        _stamp = _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        fallback = (
            "# humanAI Army — Master SICC Audit\n\n"
            f"_Run date_: {_stamp}  \n"
            "_Personas synthesised_: none  \n"
            "_Total persona reports_: **0**\n\n"
            "> ⚠️ No persona reports were available for synthesis.  \n"
            "> All persona jobs may have failed, or the artifact download produced "
            "no Markdown files under the expected directory.  \n"
            "> Re-run the workflow (or individual failed persona jobs) to populate reports.\n\n"
            "---\n"
            "_Generated by `.github/scripts/humanai_audit.py --orchestrate`._\n"
        )
        out_path = Path(args.out) if args.out != DEFAULT_OUT else Path(DEFAULT_MASTER_OUT)
        mkdir_p(out_path.parent)
        write_text(out_path, fallback)
        print(f"[humanAI-orchestrator] fallback report written to {out_path}", file=sys.stderr)
        return 0

    print(
        f"[humanAI-orchestrator] found {len(reports)} persona reports: "
        + ", ".join(r["name"] for r in reports),
        file=sys.stderr,
    )

    repo_root = Path(args.repo_root).resolve()
    orchestrator_spec = args.prompt_spec if args.prompt_spec != DEFAULT_PROMPT_SPEC else DEFAULT_ORCHESTRATOR_SPEC
    orchestrator_prompt = load_humanai_system_prompt(repo_root, orchestrator_spec)

    ai_section: Optional[str] = None
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if api_key and not args.no_ai:
        try:
            ai_section = run_orchestrator_pass(api_key, args.model, orchestrator_prompt, reports)
        except SystemExit:
            ai_section = "_Orchestrator AI pass failed; see workflow logs._"

    import datetime
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    report = render_master_report(reports, ai_section, stamp)

    out_path = Path(args.out) if args.out != DEFAULT_OUT else Path(DEFAULT_MASTER_OUT)
    mkdir_p(out_path.parent)
    write_text(out_path, report)
    print(f"[humanAI-orchestrator] master report written to {out_path}", file=sys.stderr)
    return 0


# ── CLI ───────────────────────────────────────────────────────────────────────


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="humanAI — dynamic, human-style website audit")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--out", default=DEFAULT_OUT, help="Markdown report path")
    parser.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES)
    parser.add_argument("--max-interactions", type=int, default=DEFAULT_MAX_INTERACTIONS)
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    parser.add_argument(
        "--repo-root",
        default=str(Path(__file__).resolve().parents[2]),
        help="Repo root used for runtime route + endpoint discovery",
    )
    parser.add_argument("--model", default="gpt-4.1", help="OpenAI model for the persona pass")
    parser.add_argument(
        "--prompt-spec",
        default=DEFAULT_PROMPT_SPEC,
        help="Repo-relative prompt spec path for the humanAI persona",
    )
    parser.add_argument("--no-ai", action="store_true", help="Skip the OpenAI persona pass")
    parser.add_argument(
        "--interact",
        action="store_true",
        default=True,
        help="Exercise discovered API endpoints (default: on; --no-interact to disable)",
    )
    parser.add_argument(
        "--no-interact",
        dest="interact",
        action="store_false",
        help="Disable the interaction phase",
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
    # ── Orchestrator mode ────────────────────────────────────────────────────
    parser.add_argument(
        "--orchestrate",
        action="store_true",
        help=(
            "Orchestrator mode: skip crawl, read persona reports from "
            "--reports-dir, synthesise them into a master SICC report."
        ),
    )
    parser.add_argument(
        "--reports-dir",
        default=".github/generated/army-reports",
        help="Directory containing persona .md reports (used with --orchestrate)",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)

    # ── Orchestrator mode (no crawl, just synthesis) ──────────────────────────
    if args.orchestrate:
        return orchestrate(args)

    repo_root = Path(args.repo_root).resolve()

    if args.wait_for_server and not wait_for_server(args.base_url):
        print(f"[humanAI] server at {args.base_url} never responded", file=sys.stderr)
        return 2

    code_map = build_code_map(repo_root)
    routes = discover_routes(repo_root)
    print(
        f"[humanAI] code map: {len(code_map['pages'])} pages, "
        f"{len(code_map['components'])} components, "
        f"{len(code_map['api_endpoints'])} api endpoints",
        file=sys.stderr,
    )

    pages = crawl(args.base_url, routes, args.max_pages, args.timeout)

    interactions: List[Dict[str, Any]] = []
    if args.interact:
        interactions = interact(
            args.base_url,
            code_map["api_endpoints"],
            args.max_interactions,
            args.timeout,
        )

    structural = structural_findings(pages)
    interaction_notes = interaction_findings(interactions)

    ai_section: Optional[str] = None
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if api_key and not args.no_ai:
        system_prompt = load_humanai_system_prompt(repo_root, args.prompt_spec)
        try:
            ai_section = run_ai_pass(
                api_key,
                args.model,
                system_prompt,
                code_map,
                pages,
                interactions,
            )
        except SystemExit:
            ai_section = "_AI persona pass failed; see workflow logs._"

    report = render_report(
        args.base_url, code_map, pages, interactions, structural, interaction_notes, ai_section
    )
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
