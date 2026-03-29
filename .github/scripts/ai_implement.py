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

def call_openai(api_key: str, model: str, system: str, user: str,
                max_tokens: int = DEFAULT_MAX_TOKENS) -> str:
    payload = {
        "model":      model,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
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

    return result["choices"][0]["message"]["content"]


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

    print(f"Calling {args.model} for implementation patch…", file=sys.stderr)
    raw = call_openai(api_key, args.model, SYSTEM, user_prompt, max_tokens=args.max_tokens)

    # Strip markdown fences if the model wrapped the diff in them.
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        # Drop opening fence (and optional language tag) + closing fence.
        start = 1
        end   = len(lines) - 1 if lines[-1].startswith("```") else len(lines)
        cleaned = "\n".join(lines[start:end])

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(cleaned)
        if not cleaned.endswith("\n"):
            fh.write("\n")

    print(f"Patch written to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
