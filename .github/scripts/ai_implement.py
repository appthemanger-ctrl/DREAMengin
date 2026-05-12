# .github/scripts/ai_implement.py
#
# Reads the DREAMengin context snapshot + spec proposal and asks the
# configured AI provider to implement the first coherent slice as a unified diff.
#
# Usage:
#   python .github/scripts/ai_implement.py \
#       --context .github/generated/dreamengin-context.md \
#       --spec    .github/generated/dreamengin-spec.json \
#       --out     .github/generated/dreamengin-patch.diff \
#       --model   openai/gpt-oss-120b
#
# Requires:  GROQ_API_KEY (preferred) or OPENAI_API_KEY env var
# Stdlib only — no extra dependencies.

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_MAX_TOKENS = 16_384
DEFAULT_MAX_ROUND_TRIPS = 8
DEFAULT_MODEL = os.environ.get("GROQ_MODEL_IDARI_HEAVY", "").strip() or "openai/gpt-oss-120b"

# ── Prompt ────────────────────────────────────────────────────────────────────

SYSTEM = """\
You are the DREAMengin implementation AI — a fully autonomous root-cause engineer.

You receive a root-cause analysis spec and a repository context that includes
governing documents (LAW.md, AXIOMS.md, ARCHITECTURE.md). Your job is to produce
a COMPLETE unified diff that fixes every root cause identified in the spec.

You do NOT defer fixes to human review.
You do NOT hedge or scope down to only "safe" changes.
You DO implement the full fix for each root cause, aligned with the governing docs.

Tech constraints (non-negotiable):
- Next.js 16 App Router, React 19, TypeScript, Tailwind.
- Babylon.js 9.0 WebGPU-first where relevant.
- UI Aesthetic: "Neumorphic Dark" or "Midnight Glass" (light blue, white, gold accents).
- Supabase with RLS, privacy-first (nothing public by default).
- Vitest for tests.
- NO new npm dependencies.
- LAW.md and AXIOMS.md are the authoritative reference for every decision.
- Follow ARCHITECTURE.md for all structural and navigation decisions.

SICC requirements — BOTH layers must be satisfied:
  SICC (immersion): Super Immersive Creative Controls
    Users feel expressive, playful, deeply engaged.
  SICC (clarity):   Stylized · Intuitive · Cohesive · Coherent
    Strong visual identity, obvious affordances, no random systems.

Rules:
- Align changes with v1_scope.files_to_create / files_to_modify in the spec.
- Implement ALL root_cause_analysis fixes from the spec, not just one slice.
- Maintain atomic development: all-in-one code passes bridging logic, evaluation, and execution.
- Keep TypeScript strict, components clean and composable.
- Preserve the dual-runtime (SurfaceSpace / DreamSpace) and privacy model.
- Make UX and naming feel SICC on both axes.
- Output a unified diff (git patch format) ONLY.
  No prose, no markdown fences. Pure diff output starting with "diff --git".
"""

TASK_TEMPLATE = """\
Root-cause analysis spec (all issues and their fixes):
<spec>
{spec}
</spec>

DREAMengin docs + code context (includes LAW.md, AXIOMS.md, ARCHITECTURE.md):
<context>
{context}
</context>

Implement ALL root-cause fixes described in the spec above.
Every fix must be:
  - aligned with LAW.md, AXIOMS.md, and ARCHITECTURE.md,
  - complete — eliminating the root cause, not just masking symptoms,
  - within existing architecture and constraints,
  - buildable: still passes `pnpm run build` and `pnpm run test`.

Output a unified diff (git patch) ONLY. Start with the first "diff --git" line.
"""

# ── Chat completion call ──────────────────────────────────────────────────────

def resolve_api_config() -> tuple[str, str, str]:
    groq_api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if groq_api_key:
        return groq_api_key, "https://api.groq.com/openai/v1/chat/completions", "Groq"

    openai_api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if openai_api_key:
        return openai_api_key, "https://api.openai.com/v1/chat/completions", "OpenAI"

    print("Error: set GROQ_API_KEY (preferred) or OPENAI_API_KEY.", file=sys.stderr)
    sys.exit(1)


def call_chat_completion(api_key: str, api_url: str, api_name: str, model: str, messages: list, max_tokens: int = DEFAULT_MAX_TOKENS):
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
        with urllib.request.urlopen(req, timeout=180) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        _ = exc
        print("AI provider request failed with HTTP error.", file=sys.stderr)
        sys.exit(1)

    content = result["choices"][0]["message"]["content"]
    finish_reason = result["choices"][0].get("finish_reason", "stop")
    return content, finish_reason

def strip_markdown_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        start = 1
        end = len(lines) - 1 if lines[-1].startswith("```") else len(lines)
        return "\n".join(lines[start:end])
    return text

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="AI implementation for DREAMengin big move v1")
    parser.add_argument("--context", required=True,  help="Path to dreamengin-context.md")
    parser.add_argument("--spec",    required=True,  help="Path to dreamengin-spec.json")
    parser.add_argument("--out",     required=True,  help="Path to write dreamengin-patch.diff")
    parser.add_argument("--model",   default=DEFAULT_MODEL, help="Model name")
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

    api_key, api_url, api_name = resolve_api_config()

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
        raw, finish_reason = call_chat_completion(api_key, api_url, api_name, args.model, messages, max_tokens=args.max_tokens)
        cleaned = strip_markdown_fences(raw)
        chunks.append(cleaned)

        if finish_reason != "length":
            break

        print(
            f"Model hit max_tokens; requesting continuation {attempt + 2}/{args.max_round_trips}…",
            file=sys.stderr,
        )

        messages.append({"role": "assistant", "content": raw})
        messages.append({
            "role": "user",
            "content": (
                "Continue the SAME unified diff exactly where you left off. "
                "Output ONLY the remaining diff lines. Do not repeat earlier lines, "
                "do not restart from the beginning, and do not add prose or fences."
            ),
        })
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

    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(cleaned)
        if not cleaned.endswith("\n"):
            fh.write("\n")

    print(f"Patch written to {args.out}", file=sys.stderr)

if __name__ == "__main__":
    main()
