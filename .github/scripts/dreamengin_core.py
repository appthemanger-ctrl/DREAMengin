#!/usr/bin/env python3
"""
DREAMengin Core Utilities (ι-Engine Foundation)

Shared utilities for all DREAMengin Python automation scripts.
Provides file I/O, OpenAI API calls, context processing, and common helpers.

Philosophy:
- Execute boldly with immediate, high-fidelity changes
- Eliminate friction and conversational overhead
- Maintain strict canonical naming (engin, dream, dreamsurface)
- Adhere to SICC principles (Immersion + Clarity)
- Use stdlib only — no external dependencies

Usage:
    from dreamengin_core import (
        read_text, write_text, mkdir_p,
        call_openai, load_json, load_yaml,
        DREAMENGIN_CONSTRAINTS, SICC_PRINCIPLES
    )
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# ── Constants ─────────────────────────────────────────────────────────────────

DEFAULT_MAX_TOKENS = 16_384
DEFAULT_TIMEOUT = 180
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Canonical DREAMengin constraints for all AI agents
DREAMENGIN_CONSTRAINTS = {
    "tech_stack": {
        "framework": "Next.js 16 App Router",
        "ui_library": "React 19",
        "language": "TypeScript",
        "styling": "Tailwind CSS",
        "3d_engine": "Babylon.js 9.0+ (WebGPU-first)",
        "database": "Supabase with RLS",
        "testing": "Vitest",
    },
    "architecture": {
        "dual_runtime": "SurfaceSpace / DreamSpace",
        "components": ["Daydreams", "Engins", "Dream Windows"],
        "privacy_model": "privacy-first, nothing public by default",
    },
    "policies": {
        "no_new_dependencies": True,
        "strict_naming": True,
        "full_stack_commits": True,
        "no_placeholders": True,
    },
}

# SICC dual-canon principles
SICC_PRINCIPLES = {
    "immersion": {
        "name": "Super Immersive Creative Controls",
        "description": "Users feel expressive, playful, and deeply engaged",
        "goals": [
            "Expressive interactions",
            "Playful engagement",
            "Deep creative flow",
        ],
    },
    "clarity": {
        "name": "Stylized · Intuitive · Cohesive · Coherent",
        "description": "Strong visual identity, obvious affordances, no random systems",
        "dimensions": {
            "stylized": "Distinctive visual identity",
            "intuitive": "Obvious, natural affordances",
            "cohesive": "Unified design language",
            "coherent": "Logical, predictable systems",
        },
    },
}


# ── File I/O Helpers ──────────────────────────────────────────────────────────


def mkdir_p(path: Union[str, Path]) -> None:
    """Create directory and all parent directories if they don't exist."""
    Path(path).mkdir(parents=True, exist_ok=True)


def read_text(path: Union[str, Path], errors: str = "ignore") -> str:
    """
    Read text file, returning empty string if file doesn't exist.

    Args:
        path: Path to file
        errors: How to handle encoding errors (default: 'ignore')

    Returns:
        File contents as string, or empty string if file not found
    """
    try:
        with open(path, "r", encoding="utf-8", errors=errors) as fh:
            return fh.read()
    except FileNotFoundError:
        return ""
    except Exception as exc:
        print(f"Warning: failed to read {path}: {exc}", file=sys.stderr)
        return ""


def write_text(path: Union[str, Path], content: str, ensure_newline: bool = True) -> None:
    """
    Write text to file, creating parent directories if needed.

    Args:
        path: Path to file
        content: Text content to write
        ensure_newline: If True, ensure content ends with newline
    """
    p = Path(path)
    mkdir_p(p.parent)

    if ensure_newline and content and not content.endswith("\n"):
        content += "\n"

    p.write_text(content, encoding="utf-8")


def read_text_limited(path: Union[str, Path], max_chars: int, errors: str = "ignore") -> str:
    """
    Read up to max_chars from a text file.

    Args:
        path: Path to file
        max_chars: Maximum characters to read
        errors: How to handle encoding errors

    Returns:
        File contents (up to max_chars) or empty string if not found
    """
    try:
        with open(path, "r", encoding="utf-8", errors=errors) as fh:
            return fh.read(max_chars)
    except FileNotFoundError:
        return ""
    except Exception as exc:
        print(f"Warning: failed to read {path}: {exc}", file=sys.stderr)
        return ""


# ── JSON/YAML Helpers ─────────────────────────────────────────────────────────


def load_json(path: Union[str, Path]) -> Dict[str, Any]:
    """
    Load JSON file, returning empty dict if file doesn't exist or is invalid.

    Args:
        path: Path to JSON file

    Returns:
        Parsed JSON as dict, or empty dict on error
    """
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as exc:
        print(f"Warning: invalid JSON in {path}: {exc}", file=sys.stderr)
        return {}
    except Exception as exc:
        print(f"Warning: failed to load {path}: {exc}", file=sys.stderr)
        return {}


def write_json(path: Union[str, Path], data: Any, indent: int = 2) -> None:
    """
    Write data as JSON file, creating parent directories if needed.

    Args:
        path: Path to JSON file
        data: Data to serialize
        indent: JSON indentation level (default: 2)
    """
    p = Path(path)
    mkdir_p(p.parent)

    with open(p, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=indent, ensure_ascii=False)
        fh.write("\n")


def load_yaml(path: Union[str, Path]) -> Dict[str, Any]:
    """
    Load YAML file using safe_load.

    Note: Requires PyYAML. Falls back to empty dict if PyYAML not available.

    Args:
        path: Path to YAML file

    Returns:
        Parsed YAML as dict, or empty dict on error
    """
    try:
        import yaml
        with open(path, "r", encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}
    except ImportError:
        print("Warning: PyYAML not available, cannot load YAML", file=sys.stderr)
        return {}
    except FileNotFoundError:
        return {}
    except Exception as exc:
        print(f"Warning: failed to load YAML {path}: {exc}", file=sys.stderr)
        return {}


# ── OpenAI API Helpers ────────────────────────────────────────────────────────


def call_openai(
    api_key: str,
    model: str,
    messages: List[Dict[str, str]],
    max_tokens: int = DEFAULT_MAX_TOKENS,
    timeout: int = DEFAULT_TIMEOUT,
) -> str:
    """
    Call OpenAI or Groq Chat Completions API with error handling.

    Automatically detects the API provider based on the key prefix:
    - Keys starting with "gsk_" use Groq API
    - All other keys use OpenAI API

    Args:
        api_key: OpenAI or Groq API key
        model: Model name (e.g., 'gpt-4', 'gpt-4-turbo', 'llama-3.3-70b-versatile')
        messages: List of message dicts with 'role' and 'content'
        max_tokens: Maximum tokens in response
        timeout: Request timeout in seconds

    Returns:
        Response content from first choice

    Raises:
        SystemExit: On API error (after printing error to stderr)
    """
    # Detect API provider based on key prefix
    if api_key.startswith("gsk_"):
        api_url = GROQ_API_URL
        api_name = "Groq"
    else:
        api_url = OPENAI_API_URL
        api_name = "OpenAI"

    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": messages,
    }

    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        api_url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"{api_name} API error {exc.code}: {body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as exc:
        print(f"{api_name} API connection error: {exc.reason}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"{api_name} API unexpected error: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        return result["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        print(f"{api_name} API response missing expected fields: {exc}", file=sys.stderr)
        print(f"Response: {result}", file=sys.stderr)
        sys.exit(1)


def call_openai_simple(
    api_key: str,
    model: str,
    system: str,
    user: str,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    timeout: int = DEFAULT_TIMEOUT,
) -> str:
    """
    Simplified OpenAI/Groq call with system and user messages.

    Automatically detects the API provider based on the key prefix.

    Args:
        api_key: OpenAI or Groq API key
        model: Model name
        system: System message content
        user: User message content
        max_tokens: Maximum tokens in response
        timeout: Request timeout in seconds

    Returns:
        Response content
    """
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
    return call_openai(api_key, model, messages, max_tokens, timeout)


# ── Context Processing ────────────────────────────────────────────────────────


def collect_files(
    roots: List[str],
    extensions: List[str],
    skip_dirs: Optional[set] = None,
    skip_files: Optional[set] = None,
) -> List[str]:
    """
    Recursively collect files matching extensions from root paths.

    Args:
        roots: List of root files or directories to scan
        extensions: File extensions to include (e.g., ['.py', '.md'])
        skip_dirs: Set of directory names to skip
        skip_files: Set of filenames to skip

    Returns:
        List of file paths sorted by priority
    """
    if skip_dirs is None:
        skip_dirs = {".next", "node_modules", ".git", ".github/generated"}

    if skip_files is None:
        skip_files = {"pnpm-lock.yaml", "package-lock.json", "yarn.lock"}

    out = []

    for root in roots:
        if os.path.isfile(root):
            if any(root.endswith(ext) for ext in extensions):
                out.append(root)
            continue

        if not os.path.isdir(root):
            continue

        for base, dirs, files in os.walk(root):
            # Prune skip directories in-place
            dirs[:] = [
                d for d in dirs
                if d not in skip_dirs
                and not any(os.path.join(base, d).startswith(s) for s in skip_dirs)
            ]

            for f in files:
                if f in skip_files:
                    continue
                if any(f.endswith(ext) for ext in extensions):
                    out.append(os.path.join(base, f))

    # Sort by priority: README → docs/spec → app → components → lib → styles → rest
    def sort_key(p: str) -> int:
        if p == "README.md":
            return 0
        if p.startswith("docs") or p.startswith("spec"):
            return 1
        if p.startswith("app"):
            return 2
        if p.startswith("components"):
            return 3
        if p.startswith("lib"):
            return 4
        if p.startswith("styles"):
            return 5
        return 6

    return sorted(out, key=sort_key)


def build_context_snapshot(
    roots: List[str],
    extensions: List[str],
    max_total_chars: int = 100_000,
    max_chars_per_file: int = 4_000,
) -> Dict[str, Any]:
    """
    Build a context snapshot of repository files.

    Args:
        roots: Root paths to scan
        extensions: File extensions to include
        max_total_chars: Maximum total characters across all files
        max_chars_per_file: Maximum characters per individual file

    Returns:
        Dict with metadata and file entries
    """
    files = collect_files(roots, extensions)
    entries = []
    remaining = max_total_chars

    for path in files:
        if remaining <= 0:
            break

        take = min(max_chars_per_file, remaining)
        snippet = read_text_limited(path, take)

        if not snippet:
            continue

        remaining -= len(snippet)
        entries.append({
            "path": path,
            "snippet": snippet,
        })

    return {
        "max_total_chars": max_total_chars,
        "max_chars_per_file": max_chars_per_file,
        "files_scanned": len(files),
        "entries_included": len(entries),
        "entries": entries,
    }


# ── Environment Helpers ───────────────────────────────────────────────────────


def get_env_or_fail(var_name: str, error_message: Optional[str] = None) -> str:
    """
    Get environment variable or exit with error message.

    Args:
        var_name: Environment variable name
        error_message: Optional custom error message

    Returns:
        Environment variable value

    Raises:
        SystemExit: If environment variable not set
    """
    value = os.environ.get(var_name)
    if not value:
        msg = error_message or f"Error: {var_name} environment variable not set"
        print(msg, file=sys.stderr)
        sys.exit(1)
    return value


def get_openai_key() -> str:
    """Get OpenAI or Groq API key from environment or exit."""
    return get_env_or_fail("OPENAI_API_KEY", "Error: OPENAI_API_KEY environment variable not set")


# ── Boolean Helpers ───────────────────────────────────────────────────────────


def is_truthy(value: Any) -> bool:
    """
    Check if a value is truthy (for config values).

    Args:
        value: Value to check

    Returns:
        True if value is truthy string like '1', 'true', 'yes', 'enabled'
    """
    return str(value).lower() in {"1", "true", "yes", "enabled", "supported"}


# ── Template Helpers ──────────────────────────────────────────────────────────


def format_template(template: str, **kwargs: Any) -> str:
    """
    Format a template string with kwargs.

    Args:
        template: Template string with {key} placeholders
        **kwargs: Values to substitute

    Returns:
        Formatted string
    """
    return template.format(**kwargs)


def build_constraints_text() -> str:
    """
    Build formatted constraints text for AI prompts.

    Returns:
        Multi-line string describing DREAMengin constraints
    """
    lines = [
        "Non-negotiable constraints:",
        f"- Tech: {DREAMENGIN_CONSTRAINTS['tech_stack']['framework']}, "
        f"{DREAMENGIN_CONSTRAINTS['tech_stack']['ui_library']}, "
        f"{DREAMENGIN_CONSTRAINTS['tech_stack']['language']}, "
        f"{DREAMENGIN_CONSTRAINTS['tech_stack']['styling']}",
        f"- 3D/visual: {DREAMENGIN_CONSTRAINTS['tech_stack']['3d_engine']}",
        f"- Data: {DREAMENGIN_CONSTRAINTS['tech_stack']['database']}; "
        f"{DREAMENGIN_CONSTRAINTS['architecture']['privacy_model']}",
        f"- Structure: {DREAMENGIN_CONSTRAINTS['architecture']['dual_runtime']}, "
        f"{', '.join(DREAMENGIN_CONSTRAINTS['architecture']['components'])}",
        f"- Testing: {DREAMENGIN_CONSTRAINTS['tech_stack']['testing']}",
        "- NO new npm dependencies",
    ]
    return "\n".join(lines)


def build_sicc_text() -> str:
    """
    Build formatted SICC principles text for AI prompts.

    Returns:
        Multi-line string describing SICC dual-canon
    """
    immersion = SICC_PRINCIPLES["immersion"]
    clarity = SICC_PRINCIPLES["clarity"]

    return f"""SICC has TWO canon meanings — both must be satisfied:
  SICC (immersion): {immersion["name"]}
    {immersion["description"]}
  SICC (clarity): {clarity["name"]}
    {clarity["description"]}"""


# ── Script Entry Point Helper ─────────────────────────────────────────────────


class ScriptRunner:
    """
    Base class for DREAMengin automation scripts.
    Provides common argument parsing and execution patterns.
    """

    def __init__(self, description: str):
        """
        Initialize script runner.

        Args:
            description: Script description for argparse
        """
        self.description = description
        self.args = None

    def add_arguments(self, parser) -> None:
        """
        Add script-specific arguments to parser.
        Override in subclasses.

        Args:
            parser: ArgumentParser instance
        """
        pass

    def run(self) -> None:
        """
        Execute script logic.
        Override in subclasses.
        """
        raise NotImplementedError("Subclasses must implement run()")

    def main(self) -> None:
        """
        Main entry point with argument parsing.
        Call this from __main__ block.
        """
        import argparse

        parser = argparse.ArgumentParser(description=self.description)
        self.add_arguments(parser)
        self.args = parser.parse_args()

        try:
            self.run()
        except KeyboardInterrupt:
            print("\nInterrupted by user", file=sys.stderr)
            sys.exit(130)
        except Exception as exc:
            print(f"Error: {exc}", file=sys.stderr)
            sys.exit(1)


# ── Module Metadata ───────────────────────────────────────────────────────────


__version__ = "1.0.0"
__author__ = "José Mancilla (appthemanger-ctrl)"
__doc_owner__ = "José Mancilla (appthemanger-ctrl)"
__doc_date__ = "2026-04-26"

# Export public API
__all__ = [
    # Constants
    "DEFAULT_MAX_TOKENS",
    "DEFAULT_TIMEOUT",
    "DREAMENGIN_CONSTRAINTS",
    "SICC_PRINCIPLES",

    # File I/O
    "mkdir_p",
    "read_text",
    "write_text",
    "read_text_limited",

    # JSON/YAML
    "load_json",
    "write_json",
    "load_yaml",

    # OpenAI API
    "call_openai",
    "call_openai_simple",

    # Context Processing
    "collect_files",
    "build_context_snapshot",

    # Environment
    "get_env_or_fail",
    "get_openai_key",

    # Helpers
    "is_truthy",
    "format_template",
    "build_constraints_text",
    "build_sicc_text",

    # Script Runner
    "ScriptRunner",
]
