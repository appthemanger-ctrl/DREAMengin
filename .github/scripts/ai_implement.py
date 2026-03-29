# .github/scripts/ai_implement.py
#
# Reads the DREAMengin context snapshot + spec proposal and asks the
# OpenAI API to implement the first coherent slice as a unified diff.
#
# Usage (called by spec-engin-ai-agent.yml):
#   python .github/scripts/ai_implement.py \
#       --context .github/generated/dreamengin-context.md \
#       --spec    .github/generated/dreamengin-spec.json \
#       --out     .github/generated/dreamengin-patch.diff \
#       --model   gpt-4.1
#
# Requires:  OPENAI_API_KEY env var
# Stdlib only — no extra dependencies.

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_MAX_TOKENS = 16_384
DEFAULT_MAX_ROUND_TRIPS = 8


# ── Prompt ────────────────────────────────────────────────────────────────────

SYSTEM = """\
You are the DREAMengin implementation AI.

Tech constraints (non-negotiable):
- Next.js 16 App Router, React 19, TypeScript, Tailwind.
- Babylon.js 8+ WebGPU-first where relevant.
- Supabase with RLS, privacy-first (nothing public by default).
- Vitest for tests.
- NO new npm dependencies.

SICC requirements — BOTH layers must be satisfied:
  SICC (immersion): Super Immersive Creative Controls
    Users feel expressive, playful, deeply engaged.
  SICC (clarity):   Stylized · Intuitive · Cohesive · Coherent
    Strong visual identity, obvious affordances, no random systems.

Allowed paths for changes:
  Docs:   README.md, docs/**/*.md, spec/**/*.md
  Code:   app/**/*.{ts,tsx,js,mjs}, components/**/*.{ts,tsx},
          lib/**/*.{ts,tsx,js,mjs}
  Styles: styles/**/*.css, **/*.css
  Config: *.json (excluding lock files)

Rules:
- Align changes with v1_scope.files_to_create / files_to_modify in the spec.
- The spec may include an advanced_game_upgrade object. When present, the patch
  must actually implement that game-facing slice and touch the named game file
  or another GameEngin/game file listed in v1_scope.
- Keep TypeScript strict, components clean and composable.
- Add or modify Vitest tests when behaviour changes.
- Preserve the dual-runtime (SurfaceSpace / DreamSpace) and privacy model.
- Make UX and naming feel SICC on both axes.
- Output a unified diff (git patch format) ONLY.
  No prose, no markdown fences. Pure diff output starting with "diff --git".
"""

TASK_TEMPLATE = """\
Big-move proposal (v1 scope and SICC notes):
<spec>
{spec}
</spec>

DREAMengin docs + code context:
<context>
{context}
</context>

Implement the FIRST COHERENT SLICE described in the spec above.
The slice must be:
  - creative and noticeable — not purely cosmetic,
  - aligned with SICC (both layers),
  - inclusive of the advanced game upgrade promised by the spec,
  - within existing architecture and constraints,
  - buildable: still passes `pnpm run build` and `pnpm run test`.

Output a unified diff (git patch) ONLY. Start with the first "diff --git" line.
"""


# ── OpenAI call ───────────────────────────────────────────────────────────────

def call_openai(api_key: str, model: str, messages, max_tokens: int = DEFAULT_MAX_TOKENS):
    payload = {
        "model":      model,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data    = data,
        headers = {
            "Content-Type":  "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"OpenAI API error {exc.code}: {body}", file=sys.stderr)
        sys.exit(1)

    choice = result["choices"][0]
    return choice["message"]["content"], choice.get("finish_reason")


def strip_markdown_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        start = 1
        end   = len(lines) - 1 if lines[-1].startswith("```") else len(lines)
        return "\n".join(lines[start:end])
    return text


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="AI implementation for DREAMengin big move v1")
    parser.add_argument("--context", required=True,  help="Path to dreamengin-context.md")
    parser.add_argument("--spec",    required=True,  help="Path to dreamengin-spec.json")
    parser.add_argument("--out",     required=True,  help="Path to write dreamengin-patch.diff")
    parser.add_argument("--model",   default="gpt-4.1", help="OpenAI model name")
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=DEFAULT_MAX_TOKENS,
        help=f"Maximum completion tokens to request (default: {DEFAULT_MAX_TOKENS})",
    )
    parser.add_argument(
        "--max-round-trips",
        type=int,
        default=DEFAULT_MAX_ROUND_TRIPS,
        help=f"Maximum continuation calls when the model hits its output cap (default: {DEFAULT_MAX_ROUND_TRIPS})",
    )
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("Error: OPENAI_API_KEY env var is not set.", file=sys.stderr)
        sys.exit(1)

    with open(args.context, "r", encoding="utf-8") as fh:
        context_text = fh.read()

    with open(args.spec, "r", encoding="utf-8") as fh:
        spec_text = fh.read()

    user_prompt = TASK_TEMPLATE.format(spec=spec_text, context=context_text)
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": user_prompt},
    ]

    print(f"Calling {args.model} for implementation patch…", file=sys.stderr)
    chunks = []
    finish_reason = None

    for attempt in range(args.max_round_trips):
        raw, finish_reason = call_openai(api_key, args.model, messages, max_tokens=args.max_tokens)
        cleaned = strip_markdown_fences(raw)
        chunks.append(cleaned)

        if finish_reason != "length":
            break

        print(
            f"Model hit max_tokens; requesting continuation {attempt + 2}/{args.max_round_trips}…",
            file=sys.stderr,
        )
        messages.extend([
            {"role": "assistant", "content": raw},
            {
                "role": "user",
                "content": (
                    "Continue the SAME unified diff exactly where you left off. "
                    "Output ONLY the remaining diff lines. Do not repeat earlier lines, "
                    "do not restart from the beginning, and do not add prose or fences."
                ),
            },
        ])
    else:
        finish_reason = "length"

    if finish_reason == "length":
        print(
            f"Error: implementation patch exceeded {args.max_round_trips} completion rounds. "
            "Increase --max-round-trips or --max-tokens.",
            file=sys.stderr,
        )
        sys.exit(1)

    cleaned = "".join(chunks)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(cleaned)
        if not cleaned.endswith("\n"):
            fh.write("\n")

    print(f"Patch written to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
