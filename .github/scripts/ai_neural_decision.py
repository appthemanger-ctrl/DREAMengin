#!/usr/bin/env python3
#
# Reads the DREAMengin context snapshot and asks the OpenAI API to generate a
# ranked decision packet: multiple candidate platform moves plus the single best
# first slice to implement next.
#
# Usage:
#   python .github/scripts/ai_neural_decision.py \
#       --context .github/generated/dreamengin-context.md \
#       --out     .github/generated/neural-decision.json \
#       --model   gpt-4.1
#
# Requires: OPENAI_API_KEY env var
# Stdlib only — no extra dependencies.

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_MAX_TOKENS = 16_384


SYSTEM = """\
You are the DREAMengin Neural Decision Engine.

You do not brainstorm randomly. You evaluate the current state of DREAMengin and
produce a ranked, direction-setting decision packet for the next platform move.

Non-negotiable constraints:
- Tech: Next.js 16 App Router, React 19, TypeScript, Tailwind.
- 3D/visual: Babylon.js 8+ with WebGPU-first where relevant.
- Data: Supabase with RLS; privacy-first, nothing public by default.
- Structure: dual-runtime (SurfaceSpace / DreamSpace), Daydreams, Engins.
- No new npm dependencies.
- Favor coherent moves that can land in a single CI run.

SICC has TWO canon meanings — both must be satisfied:
  SICC (immersion): Super Immersive Creative Controls
    Users feel expressive, playful, and deeply engaged.
  SICC (clarity):   Stylized · Intuitive · Cohesive · Coherent
    Strong visual identity, obvious affordances, no random systems.

Decision policy:
- Propose exactly 3 materially different candidate moves.
- Score each candidate from 1-10 on immersion, clarity, leverage, buildability,
  novelty, and risk_management.
- Select exactly 1 winner.
- The winner must be bold, but practical enough for a first coherent slice.
- Focus on DREAMengin platform evolution, not generic content churn.
"""

TASK_TEMPLATE = """\
You have a large-context summary of DREAMengin docs and code:

<context>
{context}
</context>

Operator directive:
<directive>
{directive}
</directive>

Task:
1. Design exactly 3 candidate platform moves for DREAMengin itself.
2. Each move should feel direction-setting, visible, and SICC on both axes.
3. Rank the options with a decision matrix.
4. Select the single best move to implement next.
5. The selected move must include a buildable first slice.

Output JSON ONLY:
{{
  "decision_mode": "rank-and-select",
  "directive": "...",
  "selected_option_id": "option_a|option_b|option_c",
  "selected_option_reason": "...",
  "decision_matrix": [
    {{
      "id": "option_a",
      "title": "...",
      "summary": "...",
      "why_now": "...",
      "user_outcomes": ["...", "..."],
      "sicc_immersion": {{
        "super_immersive_creative_controls": ["...", "..."]
      }},
      "sicc_clarity": {{
        "stylized": "...",
        "intuitive": "...",
        "cohesive": "...",
        "coherent": "..."
      }},
      "constraints_respected": [
        "dual-runtime preserved",
        "privacy-first respected",
        "no new deps"
      ],
      "scorecard": {{
        "immersion": 1,
        "clarity": 1,
        "leverage": 1,
        "buildability": 1,
        "novelty": 1,
        "risk_management": 1,
        "total": 6
      }},
      "v1_scope": {{
        "description": "...",
        "files_to_create": ["..."],
        "files_to_modify": ["..."],
        "test_plan": [
          "specific validation command or check"
        ]
      }}
    }}
  ]
}}
"""


def call_openai(api_key: str, model: str, system: str, user: str, max_tokens: int = DEFAULT_MAX_TOKENS) -> str:
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
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
        body = exc.read().decode("utf-8", errors="replace")
        print(f"OpenAI API error {exc.code}: {body}", file=sys.stderr)
        sys.exit(1)

    return result["choices"][0]["message"]["content"]


def strip_markdown_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1] if lines and lines[-1].startswith("```") else lines[1:])
    return cleaned


def promote_selected_option(parsed: dict) -> dict:
    if not isinstance(parsed, dict):
        return parsed

    options = parsed.get("decision_matrix")
    if not isinstance(options, list) or not options:
        return parsed

    selected_id = parsed.get("selected_option_id")
    selected = next((item for item in options if item.get("id") == selected_id), options[0])

    parsed.setdefault("title", selected.get("title", "Neural decision winner"))
    parsed.setdefault("big_idea", selected.get("summary", ""))
    parsed.setdefault("motivation", selected.get("why_now", parsed.get("selected_option_reason", "")))
    parsed.setdefault("user_outcomes", selected.get("user_outcomes", []))
    parsed.setdefault("sicc_immersion", selected.get("sicc_immersion", {}))
    parsed.setdefault("sicc_clarity", selected.get("sicc_clarity", {}))
    parsed.setdefault("constraints_respected", selected.get("constraints_respected", []))
    parsed.setdefault("v1_scope", selected.get("v1_scope", {}))
    parsed["selected_option"] = selected
    return parsed


def main() -> None:
    parser = argparse.ArgumentParser(description="AI neural decision packet for DREAMengin")
    parser.add_argument("--context", required=True, help="Path to dreamengin-context.md")
    parser.add_argument("--out", required=True, help="Path to write neural-decision.json")
    parser.add_argument("--model", default="gpt-4.1", help="OpenAI model name")
    parser.add_argument("--directive", default="", help="Optional operator directive")
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

    directive = args.directive.strip() or "Auto-select the highest-leverage platform move."
    user_prompt = TASK_TEMPLATE.format(context=context_text, directive=directive)

    print(f"Calling {args.model} for neural decision packet…", file=sys.stderr)
    raw = call_openai(api_key, args.model, SYSTEM, user_prompt, max_tokens=args.max_tokens)
    cleaned = strip_markdown_fences(raw)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        print(f"Warning: model output is not valid JSON ({exc}). Saving raw text.", file=sys.stderr)
        parsed = {"raw": cleaned, "parse_error": str(exc)}

    parsed = promote_selected_option(parsed)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(parsed, fh, indent=2)
        fh.write("\n")

    print(f"Neural decision packet written to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
